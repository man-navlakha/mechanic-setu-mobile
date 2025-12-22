import { useColorScheme } from 'nativewind';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../utils/api';

export default function HistoryScreen() {
    const { t } = useTranslation();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    const [historyData, setHistoryData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Tab: "TODAY" or "HISTORY"
    const [activeTab, setActiveTab] = useState('TODAY');

    // Filter: "ALL", "COMPLETED", "PENDING"
    const [activeFilter, setActiveFilter] = useState('ALL');

    useEffect(() => {
        let isMounted = true;
        const fetchHistory = async () => {
            try {
                const res = await api.get('/Profile/MechanicHistory/');
                if (isMounted) {
                    setHistoryData(res.data);
                }
            } catch (error) {
                console.error('Failed to fetch history:', error);
                if (isMounted) Alert.alert(t('history.error'), t('history.loadError'));
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchHistory();
        return () => { isMounted = false; };
    }, []);

    const jobs = historyData?.job_history ?? [];

    // Helper: Check if date is today (Local Time)
    const isToday = (dateString) => {
        if (!dateString) return false;
        const inputDate = new Date(dateString);
        const today = new Date();
        return (
            inputDate.getDate() === today.getDate() &&
            inputDate.getMonth() === today.getMonth() &&
            inputDate.getFullYear() === today.getFullYear()
        );
    };

    // Helper: Check Status for Filtering
    const checkStatus = (job, filter) => {
        if (filter === 'ALL') return true;
        if (filter === 'COMPLETED') {
            return job.status === 'COMPLETED' || job.status === 'CANCELLED' || job.status === 'EXPIRED';
        }
        if (filter === 'PENDING') {
            return ['PENDING', 'ACCEPTED', 'ARRIVED', 'WORKING'].includes(job.status);
        }
        return job.status === filter;
    };

    // --- FIX 2: ROBUST EARNINGS CALCULATION ---
    const stats = useMemo(() => {
        // 1. Determine which pool of jobs to calculate from (Today vs All)
        let relevantJobs = jobs;
        if (activeTab === 'TODAY') {
            relevantJobs = jobs.filter((job) => isToday(job.created_at));
        }

        // 2. Only sum up "COMPLETED" jobs for earnings
        const completedJobs = relevantJobs.filter(j => j.status === 'COMPLETED');

        const total = completedJobs.reduce((sum, job) => {
            // Safety check: handle string "500.00", number 500, or null
            const val = parseFloat(String(job.price || 0));
            return sum + (isNaN(val) ? 0 : val);
        }, 0);

        return { total, count: completedJobs.length };
    }, [jobs, activeTab]);

    // Filtered List for Display
    const filteredJobs = useMemo(() => {
        let data = jobs;

        // 1. Filter by Tab (Time)
        if (activeTab === 'TODAY') {
            data = data.filter((job) => isToday(job.created_at));
        }

        // 2. Filter by Status Pill
        if (activeFilter !== 'ALL') {
            data = data.filter((job) => checkStatus(job, activeFilter));
        }

        return [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [jobs, activeTab, activeFilter]);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
                <ActivityIndicator size="large" color={isDark ? '#60a5fa' : '#2563eb'} />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }} edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <View style={{ flex: 1, padding: 16 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: isDark ? 'white' : 'black', marginBottom: 16 }}>
                    {t('history.title')}
                </Text>

                <View style={{ backgroundColor: isDark ? '#334155' : 'white', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                    <Text style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                        {activeTab === 'TODAY' ? t('history.todayEarnings') : t('history.totalEarnings')}
                    </Text>
                    <Text style={{ fontSize: 32, fontWeight: '900', color: isDark ? 'white' : 'black' }}>
                        ₹ {stats.total}
                    </Text>
                </View>

                {/* Simplified Tabs */}
                <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: 8, padding: 4 }}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('TODAY')}
                        style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: activeTab === 'TODAY' ? (isDark ? '#475569' : 'white') : 'transparent', borderRadius: 6 }}
                    >
                        <Text style={{ fontWeight: '600', color: isDark ? 'white' : (activeTab === 'TODAY' ? 'black' : '#64748b') }}>{t('history.today')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('HISTORY')}
                        style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: activeTab === 'HISTORY' ? (isDark ? '#475569' : 'white') : 'transparent', borderRadius: 6 }}
                    >
                        <Text style={{ fontWeight: '600', color: isDark ? 'white' : (activeTab === 'HISTORY' ? 'black' : '#64748b') }}>{t('history.history')}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={{ marginTop: 20 }}>
                    {filteredJobs.length === 0 ? (
                        <Text style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40 }}>{t('history.noRecords')}</Text>
                    ) : (
                        filteredJobs.map((job, index) => (
                            <View key={job.id || index} style={{ backgroundColor: isDark ? '#1e293b' : 'white', padding: 12, borderRadius: 10, marginBottom: 10 }}>
                                <Text style={{ color: isDark ? 'white' : 'black', fontWeight: 'bold' }}>{job.problem}</Text>
                                <Text style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(job.created_at).toLocaleDateString()}</Text>
                                <Text style={{ color: job.status === 'COMPLETED' ? '#10b981' : '#f59e0b', fontWeight: 'bold', marginTop: 4 }}>
                                    {job.price ? `₹${job.price}` : '-'} ({job.status})
                                </Text>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
