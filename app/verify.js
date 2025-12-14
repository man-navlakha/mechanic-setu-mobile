import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function VerifyScreen() {
  const params = useLocalSearchParams();

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-xl font-bold">Verify OTP Screen</Text>
      <Text className="text-slate-500 mt-2">Email: {params.email}</Text>
      <Text className="text-slate-500">ID: {params.id}</Text>
    </View>
  );
}