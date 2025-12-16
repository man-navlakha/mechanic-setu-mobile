import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import { forwardRef, useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';

// IMPORTANT: This component must be wrapped in <GestureHandlerRootView> at the root (done in _layout.tsx)

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DraggableBottomSheet = forwardRef(({
    children,
    snapPoints = ['15%', '45%', '90%'], // Default snap points
    initialIndex = 0,
}, ref) => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    // Styles dynamically based on theme
    const backgroundStyle = useMemo(() => ({
        backgroundColor: isDark ? '#0f172a' : 'rgba(255, 255, 255, 0.95)',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(51, 65, 85, 0.6)' : 'white',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    }), [isDark]);

    const handleIndicatorStyle = useMemo(() => ({
        backgroundColor: isDark ? '#475569' : '#cbd5e1',
        width: 50,
        height: 6,
    }), [isDark]);

    return (
        <BottomSheet
            ref={ref}
            index={initialIndex}
            snapPoints={snapPoints}
            backgroundStyle={backgroundStyle}
            handleIndicatorStyle={handleIndicatorStyle}
            enablePanDownToClose={false}
            android_keyboardInputMode="adjustResize"
        >
            <BottomSheetScrollView
                contentContainerStyle={[styles.contentContainer, { paddingBottom: 120 + insets.bottom }]}
                showsVerticalScrollIndicator={false}
            >
                {children}
            </BottomSheetScrollView>
        </BottomSheet>
    );
});

const styles = StyleSheet.create({
    contentContainer: {
        paddingHorizontal: 20,
        // paddingBottom is handled dynamically
    },
});

export default DraggableBottomSheet;
