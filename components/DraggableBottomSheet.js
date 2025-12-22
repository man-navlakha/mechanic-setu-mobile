import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import { forwardRef, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DraggableBottomSheet = forwardRef(({
    children,
    snapPoints = ['15%', '45%', '90%'],
    initialIndex = 0,
}, ref) => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    // Styles dynamically based on theme
    const backgroundStyle = useMemo(() => ({
        backgroundColor: isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.98)', // Slightly more opaque
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#e2e8f0',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
    }), [isDark]);

    const handleIndicatorStyle = useMemo(() => ({
        backgroundColor: isDark ? '#475569' : '#cbd5e1',
        width: 40,
        height: 5,
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
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    // 60 (TabBar) + Insets + 20 (Buffer)
                    paddingBottom: 80 + insets.bottom
                }}
                showsVerticalScrollIndicator={false}
            >
                {children}
            </BottomSheetScrollView>
        </BottomSheet>
    );
});

export default DraggableBottomSheet;