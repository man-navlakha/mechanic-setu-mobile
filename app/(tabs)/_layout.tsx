import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import {
    History,
    LayoutDashboard,
    Settings,
    User,
    Wrench,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWebSocket } from '../../context/WebSocketContext';

export default function TabLayout() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();
    const { job } = useWebSocket() as any;
    const insets = useSafeAreaInsets();

    const isActiveJob =
        job && (job.status === 'WORKING' || job.status === 'ARRIVED');

    const colors = {
        bg: isDark ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 1)',
        active: isDark ? '#60a5fa' : '#2563eb',
        inactive: isDark ? '#94a3b8' : '#64748b',
        danger: isDark ? '#ef4444' : '#dc2626',
    };

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarStyle: [
                    styles.tabBar,
                    {
                        bottom: insets.bottom + 15,
                        height: 80,
                        paddingBottom: 10,
                    }
                ],
                tabBarLabelStyle: styles.label,
                tabBarActiveTintColor: colors.active,
                tabBarInactiveTintColor: colors.inactive,
                tabBarBackground: () => (
                    <BlurView
                        intensity={90}
                        tint={isDark ? 'dark' : 'light'}
                        style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, borderRadius: 0 }]}
                    />
                ),
            }}
        >
            {/* Dashboard */}
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color }) => (
                        <LayoutDashboard size={22} color={color} />
                    ),
                }}
            />

            {/* History */}
            <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                    tabBarIcon: ({ color }) => <History size={22} color={color} />,
                }}
            />

            {/* Floating Active Job */}
            <Tabs.Screen
                name="active-job"
                redirect={!isActiveJob}
                options={{
                    href: isActiveJob && job?.id ? `/job/${job.id}` : null,
                    tabBarLabel: 'Active',
                    tabBarIcon: () => (
                        <View
                            style={[
                                styles.fab,
                                {
                                    backgroundColor: isActiveJob
                                        ? colors.danger
                                        : colors.inactive,
                                },
                            ]}
                        >
                            <Wrench size={26} color="white" />
                        </View>
                    ),
                }}
            />

            {/* Profile */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <User size={22} color={color} />,
                }}
            />

            {/* Settings */}
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 0,
        height: 98,
        paddingTop: 12,
        paddingBottom: 6,
        borderRadius: 20,
        borderTopWidth: 0,
        elevation: 0,
        overflow: 'hidden',
    },
    label: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 6,
    },
    fab: {
        width: 58,
        height: 58,
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28, // lifts above bar
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
});
