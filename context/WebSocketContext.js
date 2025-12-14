import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import api from '../utils/api';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
    const ctx = useContext(WebSocketContext);
    if (!ctx) throw new Error("useWebSocket must be used inside a <WebSocketProvider>");
    return ctx;
};

export const WebSocketProvider = ({ children }) => {
    const router = useRouter();

    // --- STATE ---
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);
    const [isOnline, setIsOnlineState] = useState(false);
    const [job, setJob] = useState(null);
    const jobRef = useRef(null);
    const [mechanicCoords, setMechanicCoords] = useState(null);
    const intendedOnlineState = useRef(false);

    // Refs for tracking
    const locationWatchId = useRef(null);
    const latestCoordsRef = useRef(null);
    const locationIntervalRef = useRef(null);
    const appState = useRef(AppState.currentState);

    // --- 1. INITIALIZATION ---
    useEffect(() => {
        fetchInitialStatus();

        // App State Listener (Reconnect when app opens)
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                if (intendedOnlineState.current) connectWebSocket();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
            disconnectWebSocket();
        };
    }, []);

    useEffect(() => { jobRef.current = job; }, [job]);

    // --- 2. API & STATUS ---
    const fetchInitialStatus = async () => {
        try {
            const res = await api.get("/jobs/GetBasicNeeds/");
            const data = res.data.basic_needs || {};

            const serverIsOnline = data.status === "ONLINE" && !!data.is_verified;
            setIsOnlineState(serverIsOnline);
            intendedOnlineState.current = serverIsOnline;

            // Sync Active Job
            const syncRes = await api.get("/jobs/SyncActiveJob/");
            if (syncRes.data && syncRes.data.id) {
                setJob(syncRes.data);
                setIsOnlineState(true);
            }

            if (serverIsOnline) connectWebSocket();
        } catch (err) {
            console.log("[WS] Init Error:", err.message);
        }
    };

    const updateStatus = async (status) => {
        try {
            await api.put("/jobs/UpdateMechanicStatus/", { status });
        } catch (error) {
            console.error("[STATUS] Update failed:", error);
        }
    };

    // --- 3. WEBSOCKET ---
    const connectWebSocket = async () => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        try {
            const res = await api.get("core/ws-token/");
            const wsToken = res?.data?.ws_token;
            if (!wsToken) return;

            // CHANGE THIS TO YOUR PRODUCTION URL OR LOCAL IP
            const HOST = 'mechanic-setu.onrender.com';
            const wsUrl = `wss://${HOST}/ws/job_notifications/?token=${wsToken}`;

            console.log("[WS] Connecting:", wsUrl);
            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;

            ws.onopen = () => {
                console.log("[WS] Connected");
                setSocket(ws);
                startLocationTracking();
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleMessage(data);
                } catch (e) {
                    console.error("[WS] Message Error:", e);
                }
            };

            ws.onclose = () => {
                console.log("[WS] Disconnected");
                setSocket(null);
                stopLocationTracking();
                // Simple reconnect logic
                if (intendedOnlineState.current) setTimeout(connectWebSocket, 3000);
            };

        } catch (err) {
            console.error("[WS] Connect error:", err);
        }
    };

    const disconnectWebSocket = () => {
        intendedOnlineState.current = false;
        socketRef.current?.close();
        setSocket(null);
        stopLocationTracking();
    };

    const handleMessage = async (data) => {
        switch (data.type) {
            case "new_job":
                if (data.service_request) {
                    console.log("[WS] New Job:", data.service_request.id);
                    setJob(data.service_request);
                    playAlertSound();
                } else {
                    console.warn("[WS] Received new_job but no service_request data");
                }
                break;

            case "job_status_update":
                if (jobRef.current?.id == data.job_id) {
                    if (data.status === "COMPLETED" || data.status === "CANCELLED" || data.status === "EXPIRED") {
                        setJob(null);
                        updateStatus("ONLINE");
                        router.replace('/dashboard');
                    } else {
                        setJob(prev => ({ ...prev, status: data.status }));
                    }
                }
                break;
        }
    };

    // --- 4. LOCATION ---
    const startLocationTracking = async () => {
        if (locationWatchId.current) return;

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        // 1. Live Watch (Updates UI)
        locationWatchId.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, distanceInterval: 10 },
            (loc) => {
                const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
                latestCoordsRef.current = coords;
                setMechanicCoords(coords);
            }
        );

        // 2. Publish to Server (Every 4s)
        locationIntervalRef.current = setInterval(() => {
            if (latestCoordsRef.current && socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    type: 'location_update',
                    ...latestCoordsRef.current,
                    job_id: jobRef.current?.id || null
                }));
            }
        }, 4000);
    };

    const stopLocationTracking = () => {
        if (locationWatchId.current) locationWatchId.current.remove();
        if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
        locationWatchId.current = null;
        locationIntervalRef.current = null;
    };

    // --- 5. ACTIONS ---
    const setIsOnline = async (val) => {
        setIsOnlineState(val);
        intendedOnlineState.current = val;
        if (val) {
            await updateStatus("ONLINE");
            connectWebSocket();
        } else {
            await updateStatus("OFFLINE");
            disconnectWebSocket();
        }
    };

    const acceptJob = async (jobId) => {
        await stopAlertSound(); // Stop sound
        try {
            const res = await api.post(`/jobs/AcceptServiceRequest/${jobId}/`);
            const acceptedJob = res.data.job;
            setJob(acceptedJob);
            await updateStatus("WORKING");
            router.push(`/job/${acceptedJob.id}`);
        } catch (err) {
            Alert.alert("Error", "Could not accept job.");
            console.error(err);
            setJob(null);
        }
    };

    const rejectJob = async () => {
        await stopAlertSound(); // Stop sound
        setJob(null);
        // Optionally inform server
    };

    // --- SOUND MANAGEMENT ---
    const soundObjectRef = useRef(null);

    const playAlertSound = async () => {
        try {
            // Stop any existing sound first
            await stopAlertSound();

            const { sound } = await Audio.Sound.createAsync(
                require('../assets/sounds/alert.mp3')
            );
            soundObjectRef.current = sound;
            await sound.playAsync();

            // Auto-unload when finished
            sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.didJustFinish) {
                    await stopAlertSound();
                }
            });
        } catch (error) {
            console.log("[Sound] Error playing sound:", error);
        }
    };

    const stopAlertSound = async () => {
        try {
            if (soundObjectRef.current) {
                await soundObjectRef.current.stopAsync();
                await soundObjectRef.current.unloadAsync();
                soundObjectRef.current = null;
            }
        } catch (error) {
            console.log("[Sound] Error stopping sound:", error);
        }
    };

    return (
        <WebSocketContext.Provider value={{
            isOnline, setIsOnline, job, mechanicCoords, acceptJob, rejectJob
        }}>
            {children}
        </WebSocketContext.Provider>
    );
};