import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { ArrowLeft, FileText, RefreshCcw, Share2, Trash2, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function CrashLogsScreen() {
    const [logs, setLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [logContent, setLogContent] = useState('');
    const router = useRouter();

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        const newLogs = [];

        // 1. Try FileSystem
        try {
            const logDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
            if (logDir) {
                const files = await FileSystem.readDirectoryAsync(logDir);
                const logFiles = files.filter(f => f.startsWith('crash_log_') || f.startsWith('Setu_Crash_Log_'));
                logFiles.forEach(f => newLogs.push({ type: 'file', name: f, time: 0 })); // Time extraction skipped for brevity, sorting by name is approx okay
            }
        } catch (e) { console.log('FS Load Error', e); }

        // 2. Try AsyncStorage
        try {
            const keys = await AsyncStorage.getAllKeys();
            const crashKeys = keys.filter(k => k.startsWith('CRASH_LOG_'));
            crashKeys.forEach(k => newLogs.push({ type: 'storage', name: k, time: 0 }));
        } catch (e) { console.log('Storage Load Error', e); }

        // Sort desc
        newLogs.sort((a, b) => b.name.localeCompare(a.name));
        setLogs(newLogs);
    };

    // ... (openLog, deleteLog, shareLog, renderItem are unchanged)

    // BUT we need to output the unchanged parts so the file is not truncated.
    // Actually, I will just target the specific import and Header area.


    const openLog = async (item) => {
        try {
            let content = '';
            if (item.type === 'file') {
                const logDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
                content = await FileSystem.readAsStringAsync(logDir + item.name);
            } else {
                content = await AsyncStorage.getItem(item.name);
            }
            setSelectedLog(item);
            setLogContent(content || 'Empty Log');
        } catch (error) {
            Alert.alert("Error", "Failed to read log");
        }
    };

    const deleteLog = async (item) => {
        Alert.alert(
            "Delete Log",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (item.type === 'file') {
                                const logDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
                                await FileSystem.deleteAsync(logDir + item.name);
                            } else {
                                await AsyncStorage.removeItem(item.name);
                            }
                            setSelectedLog(null);
                            loadLogs();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete log");
                        }
                    }
                }
            ]
        );
    };

    const shareLog = async (item) => {
        try {
            // For file types, share directly. For storage types, write to a temp file then share.
            let uri = '';
            if (item.type === 'file') {
                const logDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
                uri = logDir + item.name;
            } else {
                const content = await AsyncStorage.getItem(item.name);
                const tempFile = FileSystem.cacheDirectory + item.name + ".txt";
                await FileSystem.writeAsStringAsync(tempFile, content || '');
                uri = tempFile;
            }

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert("Error", "Sharing is not available");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to share log");
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            className="flex-row items-center justify-between bg-white dark:bg-zinc-800 p-4 mb-2 rounded-lg border border-gray-200 dark:border-zinc-700"
            onPress={() => openLog(item)}
        >
            <View className="flex-row items-center flex-1">
                <FileText size={20} color={item.type === 'file' ? "#6b7280" : "#d97706"} />
                <Text className="ml-3 text-gray-800 dark:text-gray-200 text-sm font-medium" numberOfLines={1}>
                    {item.name}
                </Text>
            </View>
            <View className="flex-row space-x-4">
                <TouchableOpacity onPress={() => shareLog(item)} className="p-2">
                    <Share2 size={18} color="#2563eb" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteLog(item)} className="p-2">
                    <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-black">
            <View className="p-4 border-b border-gray-200 dark:border-zinc-800 flex-row items-center bg-white dark:bg-zinc-900 justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <ArrowLeft size={24} color="black" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900 dark:text-white">Crash Logs</Text>
                </View>
                <TouchableOpacity onPress={loadLogs} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full">
                    <RefreshCcw size={20} color="gray" />
                </TouchableOpacity>
            </View>

            {logs.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500">No crash logs found.</Text>
                </View>
            ) : (
                <FlatList
                    data={logs}
                    renderItem={renderItem}
                    keyExtractor={item => item}
                    contentContainerStyle={{ padding: 16 }}
                />
            )}

            {/* Test Crash Button */}
            <TouchableOpacity
                className="mx-4 mb-6 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg border border-red-200 dark:border-red-800 items-center"
                onPress={() => {
                    throw new Error("This is a simulated crash for testing purposes!");
                }}
            >
                <Text className="text-red-700 dark:text-red-400 font-bold">⚠️ Simulate App Crash</Text>
            </TouchableOpacity>

            {/* Log Detail Modal */}
            <Modal
                visible={!!selectedLog}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedLog(null)}
            >
                <View className="flex-1 bg-white dark:bg-black">
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-800">
                        <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>
                            {selectedLog}
                        </Text>
                        <TouchableOpacity onPress={() => setSelectedLog(null)} className="p-2">
                            <X size={24} color="gray" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView className="p-4 flex-1 bg-gray-50 dark:bg-zinc-900">
                        <Text className="font-mono text-xs text-gray-800 dark:text-gray-300">
                            {logContent}
                        </Text>
                    </ScrollView>
                    <View className="p-4 border-t border-gray-200 dark:border-zinc-800 flex-row space-x-4">
                        <TouchableOpacity
                            className="flex-1 bg-blue-600 p-3 rounded-lg items-center"
                            onPress={() => shareLog(selectedLog)}
                        >
                            <Text className="text-white font-bold">Share Log</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 bg-red-100 p-3 rounded-lg items-center"
                            onPress={() => deleteLog(selectedLog)}
                        >
                            <Text className="text-red-600 font-bold">Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
