// Use legacy API to avoid deprecation errors
// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { Component, ReactNode } from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const documentDirectory = FileSystem.documentDirectory;
const writeAsStringAsync = FileSystem.writeAsStringAsync;

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
    savedLogPath: string | null;
}

export default class CrashHandler extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null, savedLogPath: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({ errorInfo });
        console.error("CrashHandler caught an error:", error);
        // Fire and forget
        this.saveErrorLog(error, errorInfo);
    }

    saveErrorLog = async (error: Error, errorInfo: React.ErrorInfo) => {
        try {
            // Simple timestamp to avoid char issues
            const timestamp = new Date().getTime();
            const fileName = `crash_log_${timestamp}.txt`;

            // Generate content
            const logContent = `
CRASH REPORT
Timestamp: ${new Date().toISOString()}
Error: ${error.toString()}

Stack Trace:
${error.stack}

Component Stack:
${errorInfo.componentStack}
`;

            // METHOD 1: try FileSystem
            const logDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
            if (logDir) {
                const fileUri = logDir + fileName;
                await writeAsStringAsync(fileUri, logContent);
                console.log("Crash log saved to FileSystem:", fileUri);
                this.setState({ savedLogPath: fileName });
                return;
            }

            // METHOD 2: Fallback to AsyncStorage
            console.warn("FileSystem unavailable, saving to AsyncStorage");
            const key = `CRASH_LOG_${timestamp}`;
            await AsyncStorage.setItem(key, logContent);
            this.setState({ savedLogPath: "Saved via AsyncStorage" });

        } catch (fsError) {
            console.error("Failed to save error log:", fsError);
            // Last resort: try AsyncStorage even if FS failed
            try {
                const timestamp = new Date().getTime();
                const key = `CRASH_LOG_${timestamp}`;
                await AsyncStorage.setItem(key, `CRASH REPORT (Fallback)\nError: ${error.toString()}`);
                this.setState({ savedLogPath: "Saved via Fallback" });
            } catch (e) { }
        }
    };

    handleShare = async () => {
        const { error, errorInfo } = this.state;
        if (!error) return;

        try {
            const timestamp = new Date().getTime();
            const fileName = `Setu_Crash_Log_${timestamp}.txt`;

            // Try to get a valid directory
            const logDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;

            const logContent = `
CRASH REPORT - SETU PARTNER APP
Timestamp: ${new Date().toISOString()}
Error: ${error.toString()}

Stack Trace:
${error.stack}

Component Stack:
${errorInfo?.componentStack}
`;

            if (logDir) {
                const fileUri = logDir + fileName;
                await writeAsStringAsync(fileUri, logContent);

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri, {
                        mimeType: 'text/plain',
                        dialogTitle: 'Save Crash Report'
                    });
                } else {
                    Alert.alert("Sharing not available", "Cannot share logs on this device.");
                }
            } else {
                Alert.alert("Storage Error", "Cannot save log file for sharing. Please take a screenshot.");
            }

        } catch (e) {
            Alert.alert("Error", "Failed to share crash log.");
        }
    };

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null, savedLogPath: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <SafeAreaView style={styles.container}>
                    <ScrollView contentContainerStyle={styles.content}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.icon}>⚠️</Text>
                        </View>

                        <Text style={styles.title}>Oops! Something went wrong.</Text>
                        <Text style={styles.subtitle}>
                            The application encountered an unexpected error.
                        </Text>

                        {this.state.savedLogPath && (
                            <View style={{ backgroundColor: '#dcfce7', padding: 10, borderRadius: 8, marginBottom: 20, width: '100%' }}>
                                <Text style={{ color: '#166534', fontSize: 12, textAlign: 'center' }}>
                                    ✅ Log Saved: {this.state.savedLogPath.split('/').pop()}
                                </Text>
                            </View>
                        )}

                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>
                                {this.state.error?.toString()}
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.primaryButton} onPress={this.handleShare}>
                            <Text style={styles.primaryButtonText}>📂 Share Crash Log</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={this.handleReset}>
                            <Text style={styles.secondaryButtonText}>🔄 Try Again</Text>
                        </TouchableOpacity>

                        <Text style={styles.hint}>
                            Please save the crash log and send it to support.
                        </Text>
                    </ScrollView>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flexGrow: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#fef2f2',
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    icon: {
        fontSize: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    errorBox: {
        backgroundColor: '#f3f4f6',
        padding: 16,
        borderRadius: 12,
        width: '100%',
        marginBottom: 32,
        maxHeight: 200,
    },
    errorText: {
        color: '#ef4444',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
    },
    primaryButton: {
        backgroundColor: '#2563eb',
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryButton: {
        backgroundColor: '#fff',
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    secondaryButtonText: {
        color: '#4b5563',
        fontWeight: '600',
        fontSize: 16,
    },
    hint: {
        marginTop: 24,
        color: '#9ca3af',
        fontSize: 12,
        textAlign: 'center',
    },
});
