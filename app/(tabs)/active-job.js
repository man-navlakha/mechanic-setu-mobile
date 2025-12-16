import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWebSocket } from '../../context/WebSocketContext';

export default function ActiveJobTab() {
    const router = useRouter();
    const { job } = useWebSocket();

    useFocusEffect(() => {
        // When this tab is focused, navigate to the job details
        if (job && job.id) {
            router.push(`/job/${job.id}`);
        } else {
            // Should not really happen if button is hidden, but safe fallback
            router.replace('/(tabs)');
        }
    });

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" />
                <Text className="mt-4 text-slate-500">Redirecting to active job...</Text>
            </View>
        </SafeAreaView>
    );
}
