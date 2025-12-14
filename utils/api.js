import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// REPLACE with your actual computer's IP address if testing locally
const BASE_URL = 'https://mechanic-setu.onrender.com/api/';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for cookies
});

// 1. REQUEST INTERCEPTOR: Automatically attach the cookie
api.interceptors.request.use(
    async (config) => {
        // Read cookie from secure storage
        const token = await SecureStore.getItemAsync('session_cookie');
        if (token) {
            config.headers.Cookie = token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. RESPONSE INTERCEPTOR: Handle Expired Session (401)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If we get a 401 (Unauthorized) and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                console.log("Session expired. Attempting refresh...");

                // Call the backend to refresh the session
                // We use plain 'axios' to avoid triggering this interceptor again
                const cookie = await SecureStore.getItemAsync('session_cookie');

                // Assuming the endpoint is /users/refresh/ based on previous comments
                // If this path is wrong, please check your backend API documentation
                const res = await axios.post(`${BASE_URL}users/refresh/`, {}, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': cookie
                    },
                    withCredentials: true
                });

                console.log("Refresh successful:", res.status);

                // If the backend sends a NEW cookie, save it
                const newCookie = res.headers['set-cookie'];
                if (newCookie) {
                    // Handle array or string
                    const cookieValue = Array.isArray(newCookie) ? newCookie.join('; ') : newCookie;
                    await SecureStore.setItemAsync('session_cookie', cookieValue);

                    // Update the header for the retry
                    originalRequest.headers['Cookie'] = cookieValue;
                    api.defaults.headers.common['Cookie'] = cookieValue;
                }

                // Retry the original failed request
                return api(originalRequest);

            } catch (refreshError) {
                console.error("Refresh failed:", refreshError.response?.status, refreshError.response?.data);
                // If refresh fails, delete cookie so AuthContext kicks user to Login
                await SecureStore.deleteItemAsync('session_cookie');
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;