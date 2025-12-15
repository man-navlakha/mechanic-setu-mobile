import { X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

interface LanguageModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function LanguageModal({ visible, onClose }: LanguageModalProps) {
    const { i18n, t } = useTranslation();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
        onClose();
    };

    // Helper to get button styles based on language selection
    const getButtonStyle = (lang: string) => {
        const isSelected = i18n.language === lang;
        if (isSelected) {
            return 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400';
        }
        return 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600';
    };

    const getTextStyle = (lang: string) => {
        const isSelected = i18n.language === lang;
        if (isSelected) {
            return 'text-blue-700 dark:text-blue-400';
        }
        return 'text-slate-700 dark:text-slate-200';
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <Pressable
                className="flex-1 bg-black/50 justify-center gap-3 overflow-hidden items-center p-4"
                onPress={onClose}
            >
                <Pressable
                    className="bg-white dark:bg-slate-800 w-full max-w-sm flex flex-col gap-2 overflow-hidden rounded-3xl p-6 shadow-2xl"
                    onPress={e => e.stopPropagation()}
                >
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-slate-800 dark:text-white">{t('language.select') || 'Select Language'}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={isDark ? "#94a3b8" : "#64748b"} />
                        </TouchableOpacity>
                    </View>

                    <View className="space-y-3 max-h-[360px] overflow-y-auto gap-3 m-2 ">
                        <TouchableOpacity
                            onPress={() => changeLanguage('en')}
                            className={`p-4 rounded-xl border flex-row items-center justify-between ${getButtonStyle('en')}`}>
                            <View className="flex-row items-center">
                                <Text className="text-2xl mr-3">🇺🇸</Text>
                                <View>
                                    <Text className={`font-bold ${getTextStyle('en')}`}>English</Text>
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs text-left">Default</Text>
                                </View>
                            </View>
                            {i18n.language === 'en' && <View className="w-3 h-3 bg-blue-500 rounded-full" />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => changeLanguage('hi')}
                            className={`p-4 rounded-xl border flex-row items-center justify-between ${getButtonStyle('hi')}`}>
                            <View className="flex-row items-center">
                                <Text className="text-2xl mr-3">🇮🇳</Text>
                                <View>
                                    <Text className={`font-bold ${getTextStyle('hi')}`}>हिंदी</Text>
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs text-left">Hindi</Text>
                                </View>
                            </View>
                            {i18n.language === 'hi' && <View className="w-3 h-3 bg-blue-500 rounded-full" />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => changeLanguage('eh')}
                            className={`p-4 rounded-xl border flex-row items-center justify-between ${getButtonStyle('eh')}`}
                        >
                            <View className="flex-row items-center">
                                <Text className="text-2xl mr-3">🇮🇳</Text>
                                <View>
                                    <Text className={`font-bold ${getTextStyle('eh')}`}>Whatsapp Language </Text>
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs text-left">(English to Hindi) </Text>
                                </View>
                            </View>
                            {i18n.language === 'eh' && <View className="w-3 h-3 bg-blue-500 rounded-full" />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => changeLanguage('he')}
                            className={`p-4 rounded-xl border flex-row items-center justify-between ${getButtonStyle('he')}`}
                        >
                            <View className="flex-row items-center">
                                <Text className="text-2xl mr-3">🇮🇳</Text>
                                <View>
                                    <Text className={`font-bold ${getTextStyle('he')}`}>Whatsapp Language </Text>
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs text-left">(Hindi to English) </Text>
                                </View>
                            </View>
                            {i18n.language === 'he' && <View className="w-3 h-3 bg-blue-500 rounded-full" />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => changeLanguage('gu')}
                            className={`p-4 rounded-xl border flex-row items-center justify-between ${getButtonStyle('gu')}`}
                        >
                            <View className="flex-row items-center">
                                <Text className="text-2xl mr-3">🇮🇳</Text>
                                <View>
                                    <Text className={`font-bold ${getTextStyle('gu')}`}>Gujarati</Text>
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs text-left">Gujarati </Text>
                                </View>
                            </View>
                            {i18n.language === 'gu' && <View className="w-3 h-3 bg-blue-500 rounded-full" />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => changeLanguage('gue')}
                            className={`p-4 rounded-xl border flex-row items-center justify-between ${getButtonStyle('gue')}`}
                        >
                            <View className="flex-row items-center">
                                <Text className="text-2xl mr-3">🇮🇳</Text>
                                <View>
                                    <Text className={`font-bold ${getTextStyle('gue')}`}>Whatsapp Language</Text>
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs text-left">(Gujarati to English) </Text>
                                </View>
                            </View>
                            {i18n.language === 'gue' && <View className="w-3 h-3 bg-blue-500 rounded-full" />}
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
