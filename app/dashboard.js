import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Bell, Globe, HelpCircle, History, MapPin, Navigation, User, Wrench } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Platform, Pressable, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableBottomSheet from '../components/DraggableBottomSheet';
import JobNotificationPopup from '../components/JobNotificationPopup';
import LanguageModal from '../components/LanguageModal';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import api from '../utils/api';
const TOGGLE_WIDTH = 100;
// Modern Light Map Style
const lightMapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] },
];

// Modern Dark Map Style
const darkMapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1e293b" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#334155" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#475569" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
    { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
    { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#334155" }] },
];

// 1. Remove 'export default' so it's just a local component
function OnlineToggle({ isOnline, setIsOnline }) {
    const progress = useSharedValue(isOnline ? 1 : 0);

    const animatedStyle = useAnimatedStyle(() => ({
        backgroundColor: progress.value
            ? '#16a34a' // Swiggy/Ola Green
            : '#64748b', // Neutral Grey
        transform: [{ scale: withTiming(1, { duration: 150 }) }],
    }));

    const handleToggle = () => {
        const next = !isOnline;
        setIsOnline(next);

        progress.value = withTiming(next ? 1 : 0, { duration: 300 });

        // 🇮🇳 HAPTICS (very important)
        Haptics.impactAsync(
            next
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Light
        );
    };

    return (
        <Pressable onPress={handleToggle}>
            <Animated.View
                style={[
                    {
                        width: TOGGLE_WIDTH,
                        paddingVertical: 6,
                        paddingHorizontal: 6,
                        borderRadius: 999,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOpacity: 0.2,
                        shadowRadius: 6,
                        elevation: 5,
                    },
                    animatedStyle,
                ]}
            >
                <MaterialIcons
                    name={isOnline ? 'check-circle' : 'power-settings-new'}
                    size={22}
                    color="#fff"
                />

                <Text style={{
                    color: 'white',
                    fontWeight: '800',
                    fontSize: 16,
                    marginLeft: 8
                }}>
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                </Text>
            </Animated.View>
        </Pressable>
    );
}
export default function Dashboard() {
    const router = useRouter();
    const mapRef = useRef(null);
    const { user, profile, loading: authLoading } = useAuth();
    const { t } = useTranslation();
    const { isOnline, setIsOnline, connectionStatus, job, acceptJob, rejectJob, mechanicCoords, reconnect } = useWebSocket();
    const [showLanguageModal, setShowLanguageModal] = useState(false);

    // Dark mode detection
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    // State
    const [location, setLocation] = useState(null);
    const [nearbyJobs, setNearbyJobs] = useState([]);
    const [pastJobs, setPastJobs] = useState([]);
    const [earnings, setEarnings] = useState({ total: 0, count: 0 });
    const [mapLoading, setMapLoading] = useState(true);

    // 1. INITIALIZE MAP
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setMapLoading(false);
                return;
            }
            let loc = await Location.getCurrentPositionAsync({});
            setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
            });
            setMapLoading(false);
        })();
    }, []);

    // 2. LIVE UPDATES
    useEffect(() => {
        if (mechanicCoords && mapRef.current && isOnline) {
            // Optional: Smoothly animate map to follow user
            // mapRef.current.animateCamera({ center: mechanicCoords, pitch: 0, heading: 0 }, { duration: 1000 });
        }
    }, [mechanicCoords, isOnline]);

    // 3. FETCH DATA
    useEffect(() => {
        fetchJobHistory();
        if (isOnline && location) fetchNearbyJobs();
    }, [isOnline, location]);

    const fetchNearbyJobs = async () => {
        if (!location) return;
        // Mock Data for UI (Replace with API)
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
            const validPast = history.filter(j => j.latitude && j.longitude && j.status === 'ACCEPTED');
            setPastJobs(validPast);
        } catch (e) { console.log(e); }
    };

    const recenterMap = async () => {
        let loc = await Location.getCurrentPositionAsync({});
        mapRef.current?.animateToRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
        }, 1000);
    };

    if (mapLoading || authLoading || !profile) {
        return (
            <View className="flex-1 justify-center items-center bg-white dark:bg-slate-900">
                <ActivityIndicator size="large" color={isDark ? "#60a5fa" : "#2563eb"} />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white dark:bg-slate-900">
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            {/* --- MAP --- */}
            <MapView
                ref={mapRef}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={StyleSheet.absoluteFillObject}
                initialRegion={location}
                showsUserLocation={true}
                showsMyLocationButton={false}
                customMapStyle={isDark ? darkMapStyle : lightMapStyle}
            >
                {isOnline && nearbyJobs.map(j => (
                    <Marker key={j.id} coordinate={{ latitude: j.lat, longitude: j.lng }} title={j.type}>
                        <View className="bg-blue-600 p-2 rounded-full border-2 border-white shadow-md">
                            <Wrench size={16} color="white" />
                        </View>
                    </Marker>
                ))}
                {pastJobs.map(j => (
                    <Marker key={`past-${j.id}`} coordinate={{ latitude: parseFloat(j.latitude), longitude: parseFloat(j.longitude) }} opacity={0.6}>
                        <View className="bg-slate-200 p-1.5 rounded-full border border-slate-400">
                            <History size={14} color="#64748b" />
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* --- TOP BAR (Floating Design) --- */}
            <View
                className="absolute top-0 w-full z-50 bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-800 rounded-b-2xl shadow-sm"
                style={{ paddingTop: insets.top + 10, paddingBottom: 15 }}
                pointerEvents="box-none"
            >
                <View className="mx-4 flex-row justify-between items-center">

                    {/* Left: On/Off Switch Pill */}
                    <Pressable
                        onPress={() => setIsOnline(!isOnline)}
                        className={`flex-row items-center justify-center
    w-full max-w-[140px] py-3 rounded-full shadow-lg
    ${isOnline ? 'bg-green-600' : 'bg-slate-500'}
  `}
                    >
                        <MaterialIcons
                            name={isOnline ? 'check-circle' : 'cancel'}
                            size={20}
                            color="white"
                        />
                        <Text className="text-white font-bold text-base ml-2">
                            {isOnline
                                ? t('dashboard.on') ?? 'ONLINE'
                                : t('dashboard.off') ?? 'OFFLINE'}
                        </Text>
                    </Pressable>

                    {/* Right: Icon Buttons */}
                    <View className="flex-row items-center">
                        {/* Help Button */}
                        <TouchableOpacity
                            onPress={() => {/* TODO: Open help */ }}
                            className="bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-lg border border-slate-100 dark:border-slate-700"
                        >
                            <HelpCircle size={20} color={isDark ? "#94a3b8" : "#64748b"} />
                        </TouchableOpacity>

                        {/* Notification Button */}
                        <TouchableOpacity
                            onPress={() => {/* TODO: Open notifications */ }}
                            className="bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-lg ml-2 border border-slate-100 dark:border-slate-700"
                        >
                            <Bell size={20} color={isDark ? "#94a3b8" : "#64748b"} />
                        </TouchableOpacity>

                        {/* Language Button */}
                        <TouchableOpacity
                            onPress={() => setShowLanguageModal(true)}
                            className="bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-lg ml-2 border border-slate-100 dark:border-slate-700"
                        >
                            <Globe size={20} color={isDark ? "#94a3b8" : "#64748b"} />
                        </TouchableOpacity>

                        {/* Profile Button */}
                        <TouchableOpacity
                            onPress={() => router.push('/profile')}
                            className="bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-lg ml-2 border border-slate-100 dark:border-slate-700"
                        >
                            {profile.profile_pic ? <Image source={{ uri: profile.profile_pic }} className="w-5 h-5 rounded-full" /> : <User size={20} color={isDark ? "#94a3b8" : "#64748b"} />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Active Job Floating Banner */}
                {
                    job && job.status === "WORKING" && (
                        <View className="mx-4 mt-3 bg-slate-900 dark:bg-slate-800 rounded-2xl p-4 shadow-xl flex-row justify-between items-center border border-slate-700">
                            <View>
                                <Text className="text-white font-bold text-base">{t('dashboard.activeJob')} #{job.id}</Text>
                                <Text className="text-slate-300 text-xs mt-0.5">{job.vehical_type} • {job.problem}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push(`/job/${job.id}`)}
                                className="bg-blue-600 px-4 py-2 rounded-xl"
                            >
                                <Text className="text-white font-bold text-xs">{t('dashboard.view')}</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }
            </View>


            {/* --- BOTTOM SHEET (Draggable) --- */}
            <DraggableBottomSheet
                initialIndex={0}
                snapPoints={['25%', '45%', '85%']} className="mt-20 bottom-0"
            >
                {/* Status Display Row */}
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {isOnline ? t('dashboard.online') : t('dashboard.offline')}
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            {isOnline ? t('dashboard.looking') : t('dashboard.goOnline')}
                        </Text>
                    </View>

                    {/* Connection Status Badge */}
                    <TouchableOpacity
                        onPress={connectionStatus === 'disconnected' && isOnline ? reconnect : undefined}
                        activeOpacity={connectionStatus === 'disconnected' && isOnline ? 0.7 : 1}
                        className={`flex-row items-center px-3 py-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-green-100 dark:bg-green-900/30' :
                            connectionStatus === 'connecting' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                connectionStatus === 'disconnected' && isOnline ? 'bg-red-100 dark:bg-red-900/30' :
                                    'bg-slate-100 dark:bg-slate-700'
                            }`}
                    >
                        {connectionStatus === 'connecting' ? (
                            <ActivityIndicator size={8} color={isDark ? "#fbbf24" : "#ca8a04"} style={{ marginRight: 6 }} />
                        ) : (
                            <View className={`w-2 h-2 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-500' :
                                connectionStatus === 'disconnected' && isOnline ? 'bg-red-500' :
                                    'bg-slate-400'
                                }`} />
                        )}
                        <Text className={`text-xs font-semibold ${connectionStatus === 'connected' ? 'text-green-700 dark:text-green-400' :
                            connectionStatus === 'connecting' ? 'text-yellow-700 dark:text-yellow-400' :
                                connectionStatus === 'disconnected' && isOnline ? 'text-red-700 dark:text-red-400' :
                                    'text-slate-500 dark:text-slate-400'
                            }`}>
                            {connectionStatus === 'connected' ? t('dashboard.wsConnected') || 'Connected' :
                                connectionStatus === 'connecting' ? t('dashboard.wsConnecting') || 'Connecting...' :
                                    connectionStatus === 'disconnected' && isOnline ? `${t('dashboard.wsReconnect') || 'Tap to Reconnect'}` :
                                        t('dashboard.wsOffline') || 'Offline'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* --- PENDING JOB CARD (Fallback) --- */}
                {job && job.status === "PENDING" && (
                    <View className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-900 mb-6 relative overflow-hidden">
                        {/* Pulse Dot Animation would go here if we had more setup, simple dot for now */}
                        <View className="flex-row items-center mb-3">
                            <View className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 animate-pulse" />
                            <Text className="text-red-700 dark:text-red-400 font-bold text-sm uppercase">New Request Incoming</Text>
                        </View>

                        <Text className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">{job.vehicle_type || 'Vehicle'} • {job.problem}</Text>
                        <View className="flex-row items-center mb-4">
                            <MapPin size={14} color="#ef4444" className="mr-1" />
                            <Text className="text-slate-500 dark:text-slate-400 text-xs">{job.address || "Location Shared"}</Text>
                        </View>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => rejectJob()}
                                className="flex-1 bg-white dark:bg-slate-800 py-3 rounded-xl border border-slate-200 dark:border-slate-700 items-center justify-center"
                            >
                                <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm">REJECT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => acceptJob(job.id)}
                                className="flex-1 bg-red-600 py-3 rounded-xl items-center justify-center shadow-md shadow-red-200 dark:shadow-none"
                            >
                                <Text className="text-white font-bold text-sm">ACCEPT NOW</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Earnings Card */}
                <View className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-5 border border-slate-100 dark:border-slate-600 flex-row divide-x divide-slate-200 dark:divide-slate-600 mb-6">
                    <View className="flex-1 items-center pr-4">
                        <View className="flex-row items-center mb-1">
                            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase ml-1">  ₹ {t('dashboard.earnings')}</Text>
                        </View>
                        <Text className="text-2xl font-black text-slate-900 dark:text-slate-100">₹ {earnings.total}</Text>
                    </View>

                    <View className="flex-1 items-center pl-4">
                        <View className="flex-row items-center mb-1">
                            <History size={14} color={isDark ? "#94a3b8" : "#64748b"} />
                            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase ml-1">{t('dashboard.jobsDone')}</Text>
                        </View>
                        <Text className="text-2xl font-black text-slate-900 dark:text-slate-100">{earnings.count}</Text>
                    </View>
                </View>

                {/* Recenter Button Moved Inline or Inside Sheet? Maybe keep outside or integrate. 
                    Actually user asked for drawer. Floating buttons usually sit above drawer or inside. 
                    I'll keep the Recent Jobs list inside.
                */}

                {/* Recent Jobs List */}
                <Text className="text-slate-900 dark:text-slate-100 font-bold text-lg mb-3">
                    {t('dashboard.recentJobs') || "Recent Activity"}
                </Text>

                {pastJobs.length === 0 ? (
                    <View className="items-center py-4">
                        <Text className="text-slate-400 dark:text-slate-500 font-medium text-sm">No recent jobs found.</Text>
                    </View>
                ) : (
                    pastJobs.slice(0, 10).map((job, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => router.push(`/job/${job.id}`)}
                            className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-3 flex-row justify-between items-center"
                        >
                            <View className="flex-1 mr-3">
                                <View className="flex-row items-center mb-1">
                                    <Text className="font-bold text-slate-800 dark:text-slate-100 text-base flex-1" numberOfLines={1}>
                                        {job.problem}
                                    </Text>
                                    <View className={`px-2 py-0.5 rounded ml-2 ${job.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <Text className={`text-[10px] font-bold ${job.status === 'COMPLETED' ? 'text-green-700 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {job.status}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center">
                                    <MapPin size={10} color={isDark ? "#64748b" : "#94a3b8"} className="mr-1" />
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs flex-1" numberOfLines={1}>
                                        {job.location || "Unknown Location"}
                                    </Text>
                                </View>
                                <Text className="text-slate-400 dark:text-slate-500 text-[10px] mt-1">
                                    {new Date(job.created_at).toDateString()}
                                </Text>
                            </View>

                            <View className="items-end">
                                <Text className="font-black text-slate-900 dark:text-slate-100 text-lg">₹{job.price || 0}</Text>
                                <Text className="text-blue-500 dark:text-blue-400 text-[10px] font-bold">VIEW</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </DraggableBottomSheet>

            {/* Floating Recenter Button - Positioned above the Bottom Sheet's initial snap point */}
            <TouchableOpacity
                onPress={recenterMap}
                className="absolute bottom-40 right-4 bg-white dark:bg-slate-800 p-3.5 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 z-40"
            >
                <Navigation size={22} color={isDark ? "#60a5fa" : "#2563eb"} fill={isDark ? "#60a5fa" : "#2563eb"} />
            </TouchableOpacity>

            {/* --- POPUP (Overlay) --- */}
            {
                job && job.status === "PENDING" && (
                    <JobNotificationPopup
                        job={job}
                        onAccept={() => acceptJob(job.id)}
                        onReject={rejectJob}
                    />
                )
            }

            <LanguageModal
                visible={showLanguageModal}
                onClose={() => setShowLanguageModal(false)}
            />
        </View >


    );
}