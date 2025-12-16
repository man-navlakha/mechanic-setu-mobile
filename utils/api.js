import axios from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// Update with your production URL or local IP
const BASE_URL = 'https://mechanic-setu.onrender.com/api/';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Crucial for cookies
});

// Flags to avoid loops
let isRefreshing = false;
let refreshSubscribers = [];

// Retry queued requests after refresh
function onRefreshed() {
    refreshSubscribers.forEach((cb) => cb());
    refreshSubscribers = [];
}

function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb);
}

// --- 1. REQUEST INTERCEPTOR ---
// Automatically attaches the Cookie & CSRF Token to every API call
api.interceptors.request.use(
    async (config) => {
        try {
            // Read the saved cookie from phone storage
            const cookieString = await SecureStore.getItemAsync('session_cookie');
            // console.log("[API] Interceptor Cookie:", cookieString ? "Found (" + cookieString.substring(0, 10) + "...)" : "Missing");

            if (cookieString) {
                config.headers.Cookie = cookieString;

                // Extract CSRF Token if present in the cookie string
                const csrfMatch = cookieString.match(/csrftoken=([^;]+)/);
                if (csrfMatch && csrfMatch[1]) {
                    config.headers['X-CSRFToken'] = csrfMatch[1];
                }
            }
        } catch (error) {
            console.log("Error loading cookie:", error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// --- 2. RESPONSE INTERCEPTOR ---
// Handles expired sessions (401 Unauthorized)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response) {
            // console.log(`[API] ERROR ${error.response.status} ${originalRequest?.url}`);
        } else {
            console.log(`[API] ERROR (Network/Other) ${originalRequest?.url}:`, error.message);
        }

        // Prevent infinite loop if refresh request itself fails
        const isRefreshRequest = originalRequest?.url?.includes("token/refresh/");

        // If we get a 401 error (Unauthorized) and haven't retried yet and it's not the refresh request itself
        if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {

            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh(() => resolve(api(originalRequest)));
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log("Session expired. Attempting refresh...");

                // Get current cookie to send with refresh request
                const oldCookie = await SecureStore.getItemAsync('session_cookie');
                const headers = {
                    'Content-Type': 'application/json'
                };
                if (oldCookie) {
                    headers['Cookie'] = oldCookie;
                    const csrfMatch = oldCookie.match(/csrftoken=([^;]+)/);
                    if (csrfMatch && csrfMatch[1]) {
                        headers['X-CSRFToken'] = csrfMatch[1];
                    }
                }

                // Call refresh endpoint using fresh axios instance
                const refreshResponse = await axios.post(
                    `${BASE_URL}core/token/refresh/`,
                    {},
                    {
                        headers,
                        withCredentials: true
                    }
                );

                console.log("[API] Token refreshed successfully");

                // Store new cookie if provided in response
                const setCookie = refreshResponse.headers['set-cookie'];
                let newCookie = null;

                if (setCookie) {
                    newCookie = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
                    await SecureStore.setItemAsync('session_cookie', newCookie);
                    console.log("[API] New cookie saved");
                } else {
                    // Sometimes refresh doesn't send a new cookie, but validates the session? 
                    // Or maybe it does and we missed it. Assuming it does or the old one is valid now?
                    // Usually refresh endpoint issues a new access token/cookie.
                    // If no new cookie, maybe keep using old one?
                    newCookie = oldCookie;
                }

                isRefreshing = false;
                onRefreshed();

                // Update original request headers with new cookie
                if (newCookie) {
                    originalRequest.headers['Cookie'] = newCookie;
                    const csrfMatch = newCookie.match(/csrftoken=([^;]+)/);
                    if (csrfMatch && csrfMatch[1]) {
                        originalRequest.headers['X-CSRFToken'] = csrfMatch[1];
                    }
                }

                return api(originalRequest);

            } catch (refreshError) {
                console.error("Token refresh failed:", refreshError);
                isRefreshing = false;

                // Clear the invalid cookie so the user is sent to Login screen
                await SecureStore.deleteItemAsync('session_cookie');
                await SecureStore.deleteItemAsync('user_data');

                // Redirect to login
                if (router) {
                    router.replace('/login');
                }

                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;