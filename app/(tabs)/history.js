import { History } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    Text,
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
        const fetchHistory = async () => {
            try {
                const res = await api.get('/Profile/MechanicHistory/');
                setHistoryData(res.data);
            } catch (error) {
                console.error('Failed to fetch history:', error);
                Alert.alert('Error', 'Could not load history.');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // Safely get jobs array
    const jobs = historyData?.job_history ?? [];

    // Helper to check if date is today
    const isToday = (date) => {
        const inputDate = new Date(date);
        const today = new Date();
        return inputDate.toISOString().slice(0, 10) === today.toISOString().slice(0, 10);
    };

    // Memoized filtered jobs (Moved before conditional return)
    const filteredJobs = useMemo(() => {
        let data = jobs;

        if (activeTab === 'TODAY') {
            data = data.filter((job) => isToday(job.created_at));
        }

        if (activeFilter !== 'ALL') {
            data = data.filter((job) => job.status === activeFilter);
        }

        return data;
    }, [jobs, activeTab, activeFilter]);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
                <ActivityIndicator size="large" color={isDark ? '#60a5fa' : '#2563eb'} />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-900" edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                {/* Page Title */}
                <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 mb-4">
                    {t('profile.earnings') || 'Earnings'}
                </Text>

                {/* Wallet Card */}
                {/* Earnings Card (From Dashboard Style) */}
                <View className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-5 border border-slate-100 dark:border-slate-600 flex-row divide-x divide-slate-200 dark:divide-slate-600 mb-6">
                    <View className="flex-1 items-center pr-4">
                        <View className="flex-row items-center mb-1">
                            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase ml-1">  ₹ {t('dashboard.earnings') || "Earnings"}</Text>
                        </View>
                        <Text className="text-2xl font-black text-slate-900 dark:text-slate-100">₹ {historyData?.total_earning || 0}</Text>
                    </View>

                    <View className="flex-1 items-center pl-4">
                        <View className="flex-row items-center mb-1">
                            <History size={14} color={isDark ? "#94a3b8" : "#64748b"} />
                            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase ml-1">{t('dashboard.jobsDone') || "Jobs Done"}</Text>
                        </View>
                        <Text className="text-2xl font-black text-slate-900 dark:text-slate-100">{historyData?.completed_jobs || 0}</Text>
                    </View>
                </View>

                {/* Tabs: Today / History */}
                <View className="flex-row bg-slate-200 dark:bg-slate-800 rounded-xl p-1 mt-6">
                    {['TODAY', 'HISTORY'].map((tab) => (
                        <Text
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`flex-1 text-center py-2 rounded-lg font-semibold ${activeTab === tab
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white'
                                : 'text-slate-500'
                                }`}
                        >
                            {tab === 'TODAY' ? 'Today' : 'History'}
                        </Text>
                    ))}
                </View>

                {/* Filters: All / Completed / Pending */}
                <View className="flex-row mt-4 mb-2">
                    {['ALL', 'COMPLETED', 'PENDING'].map((filter) => (
                        <Text
                            key={filter}
                            onPress={() => setActiveFilter(filter)}
                            className={`px-4 py-1.5 mr-2 rounded-full text-xs font-semibold ${activeFilter === filter
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                        >
                            {filter === 'ALL'
                                ? t('profile.all') || 'All'
                                : filter === 'COMPLETED'
                                    ? t('profile.completed') || 'Completed'
                                    : t('profile.pending') || 'Pending'}
                        </Text>
                    ))}
                </View>

                {/* Transaction History Title */}
                <View className="mt-2 mb-2 flex-row justify-between items-center">
                    <Text className="text-base font-bold text-slate-800 dark:text-slate-100">
                        {t('profile.transactionHistory') || 'Transaction History'}
                    </Text>
                </View>

                {/* Job List */}
                {filteredJobs.length === 0 ? (
                    <View className="items-center py-20">
                        <History size={48} color={isDark ? '#475569' : '#cbd5e1'} />
                        <Text className="text-slate-400 mt-4">
                            {t('profile.noRecords') || 'No records found'}
                        </Text>
                    </View>
                ) : (
                    filteredJobs.map((job) => (
                        <View
                            key={job.id || job.created_at} // use job.id if available, fallback to created_at
                            className="bg-white dark:bg-slate-800 rounded-xl px-4 py-3 mb-3 flex-row items-center"
                        >
                            {/* Left Icon */}
                            <View className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mr-3">
                                <History size={18} color={isDark ? '#34d399' : '#059669'} />
                            </View>

                            {/* Middle Info */}
                            <View className="flex-1">
                                <Text
                                    className="font-semibold text-slate-800 dark:text-slate-100"
                                    numberOfLines={1}
                                >
                                    {job.problem}
                                </Text>

                                <Text className="text-xs text-slate-400 mt-0.5">
                                    {new Date(job.created_at).toLocaleDateString()}
                                </Text>
                            </View>

                            {/* Amount */}
                            <View className="items-end">
                                <Text
                                    className={`font-bold ${job.status === 'COMPLETED'
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-slate-400'
                                        }`}
                                >
                                    ₹{job.price || 0}
                                </Text>

                                <Text className="text-[10px] text-slate-400 mt-0.5">{job.status}</Text>
                            </View>
                        </View>
                    ))
                )}

                <View style={{ height: 40 + insets.bottom }} />
            </ScrollView>
        </SafeAreaView>
    );
}
