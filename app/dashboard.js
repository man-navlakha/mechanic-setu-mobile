import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { History, Menu, Navigation, Wrench } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Switch, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import JobNotificationPopup from '../components/JobNotificationPopup'; // Ensure this path is correct
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import api from '../utils/api';

// Minimal Map Style
const mapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] },
];

export default function Dashboard() {
    const router = useRouter();
    const mapRef = useRef(null);
    const { user, profile } = useAuth();

    // Use WebSocket Context
    const { isOnline, setIsOnline, job, acceptJob, rejectJob, mechanicCoords } = useWebSocket();

    // Local State
    const [location, setLocation] = useState(null);
    const [nearbyJobs, setNearbyJobs] = useState([]);
    const [pastJobs, setPastJobs] = useState([]);
    const [earnings, setEarnings] = useState({ total: 0, count: 0 });
    const [loading, setLoading] = useState(true);

    // 1. INITIALIZE MAP (Independent of WebSocket)
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location is required to work.');
                setLoading(false);
                return;
            }

            // Get initial position immediately
            let loc = await Location.getCurrentPositionAsync({});

            const region = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
            };

            setLocation(region);
            setLoading(false); // Stop loading immediately
        })();
    }, []);

    // 2. LISTEN TO LIVE UPDATES (From WebSocket)
    useEffect(() => {
        if (mechanicCoords && mapRef.current) {
            // Optional: Animate map to follow mechanic?
            // mapRef.current.animateToRegion({
            //   ...mechanicCoords,
            //   latitudeDelta: 0.015,
            //   longitudeDelta: 0.015
            // }, 1000);
        }
    }, [mechanicCoords]);

    // 3. FETCH DATA (Earnings/History)
    useEffect(() => {
        fetchJobHistory();
        if (isOnline && location) {
            fetchNearbyJobs();
        }
    }, [isOnline, location]);

    const fetchNearbyJobs = async () => {
        // Mock Jobs for UI demo (Replace with API)
        if (!location) return;
        setNearbyJobs([
            { id: 1, lat: location.latitude + 0.002, lng: location.longitude + 0.002, type: "Flat Tire", price: 500 },
            { id: 2, lat: location.latitude - 0.003, lng: location.longitude - 0.001, type: "Battery Dead", price: 700 },
        ]);
    };

    const fetchJobHistory = async () => {
        try {
            const res = await api.get('/Profile/MechanicHistory/');
            const history = res.data.job_history || [];

            const totalEarned = history.reduce((sum, j) => sum + (parseFloat(j.price) || 0), 0);
            setEarnings({ total: totalEarned, count: history.length });

            const validPastJobs = history.filter(j => j.latitude && j.longitude && j.status === 'COMPLETED');
            setPastJobs(validPastJobs);
        } catch (err) {
            console.log("History error:", err.message);
        }
    };

    const recenterMap = async () => {
        let loc = await Location.getCurrentPositionAsync({});
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
            }, 1000);
        }
    };

    // --- RENDER ---
    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="mt-4 text-slate-500 font-medium">Starting Engine...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1">

            {/* 1. MAP LAYER */}
            <MapView
                ref={mapRef}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                className="flex-1 w-full h-full"
                initialRegion={location}
                showsUserLocation={true}
                showsMyLocationButton={false}
                customMapStyle={mapStyle}
            >
                {isOnline && nearbyJobs.map(j => (
                    <Marker
                        key={j.id}
                        coordinate={{ latitude: j.lat, longitude: j.lng }}
                        title={j.type}
                    >
                        <View className="bg-blue-600 p-2 rounded-full border-2 border-white shadow-lg">
                            <Wrench size={16} color="white" />
                        </View>
                    </Marker>
                ))}

                {pastJobs.map(j => (
                    <Marker
                        key={`past-${j.id}`}
                        coordinate={{ latitude: parseFloat(j.latitude), longitude: parseFloat(j.longitude) }}
                        opacity={0.6}
                    >
                        <View className="bg-slate-200 p-1.5 rounded-full border border-slate-400">
                            <History size={14} color="#64748b" />
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* 2. TOP NAVBAR */}
            <SafeAreaView className="absolute top-0 w-full pointer-events-none">
                <View className="mx-4 mt-2 flex-row justify-between items-center bg-white/95 p-4 rounded-2xl shadow-md border border-slate-100 pointer-events-auto">
                    <View>
                        <Text className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                            {isOnline ? "● ONLINE" : "○ OFFLINE"}
                        </Text>
                        <Text className="text-lg font-bold text-slate-800">
                            {profile?.shop_name || "Mechanic"}
                        </Text>
                    </View>

                    <TouchableOpacity
                        className="bg-slate-50 p-3 rounded-full border border-slate-100"
                        onPress={() => router.push('/profile')}
                    >
                        <Menu size={24} color="#334155" />
                    </TouchableOpacity>
                </View>

                {/* ACTIVE JOB BANNER (If working) */}
                {job && job.status === "WORKING" && (
                    <View className="mx-4 mt-3 bg-blue-600 p-4 rounded-xl shadow-lg flex-row justify-between items-center pointer-events-auto">
                        <View>
                            <Text className="text-white font-bold text-base">Active Job #{job.id}</Text>
                            <Text className="text-blue-100 text-sm">{job.problem}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => router.push(`/job/${job.id}`)}
                            className="bg-white px-4 py-2 rounded-lg"
                        >
                            <Text className="text-blue-600 font-bold text-sm">View</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>

            {/* 3. BOTTOM PANEL */}
            <View className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 pb-8">

                {/* Recenter Button */}
                <TouchableOpacity
                    onPress={recenterMap}
                    className="absolute -top-6 right-6 bg-white p-4 rounded-full shadow-lg border border-slate-100"
                >
                    <Navigation size={24} color="#2563eb" fill="#2563eb" />
                </TouchableOpacity>

                {/* Status Switch */}
                <View className="flex-row items-center justify-between mb-6">
                    <View>
                        <Text className="text-lg font-bold text-slate-800">
                            {isOnline ? "You are Online" : "You are Offline"}
                        </Text>
                        <Text className="text-slate-500 text-xs">
                            {isOnline ? "Receiving job requests..." : "Go online to start earning"}
                        </Text>
                    </View>

                    <Switch
                        trackColor={{ false: "#e2e8f0", true: "#dbeafe" }}
                        thumbColor={isOnline ? "#2563eb" : "#94a3b8"}
                        ios_backgroundColor="#e2e8f0"
                        onValueChange={setIsOnline}
                        value={isOnline}
                        style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                    />
                </View>

                {/* Earnings */}
                <View className="flex-row bg-slate-50 p-4 rounded-2xl border border-slate-100 divide-x divide-slate-200">
                    <View className="flex-1 items-center">
                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total Earnings</Text>
                        <Text className="text-xl font-black text-slate-800">₹{earnings.total}</Text>
                    </View>
                    <View className="flex-1 items-center">
                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Jobs Completed</Text>
                        <Text className="text-xl font-black text-slate-800">{earnings.count}</Text>
                    </View>
                </View>
            </View>

            {/* 4. NEW JOB POPUP (Overlay) */}
            {/* Shows only if job exists and status is PENDING (Not accepted yet) */}
            {job && job.status === "PENDING" && (
                <JobNotificationPopup
                    job={job}
                    onAccept={() => acceptJob(job.id)}
                    onReject={rejectJob}
                />
            )}

        </View>
    );
}