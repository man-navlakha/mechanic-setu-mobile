import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWebSocket } from '../../context/WebSocketContext';

export default function ActiveJobTab() {
    const router = useRouter();
    const { job } = useWebSocket();

    useFocusEffect(
        useCallback(() => {
            if (job && job.id) {
                // Use replace to prevent the "Back Button Loop"
                // This swaps the tab screen with the job detail screen
                router.replace(`/job/${job.id}`);
            } else {
                // If no active job, go to dashboard
                router.replace('/(tabs)');
            }
        }, [job])
    );

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="mt-4 text-slate-500">Redirecting...</Text>
            </View>
        </SafeAreaView>
    );
}