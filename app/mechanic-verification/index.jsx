import { Image } from "expo-image";
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Search, TriangleAlert, Users, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../utils/api";

// Helper for KYC display (opens browser)
const openKYCDocument = async (url) => {
    if (!url) {
        Alert.alert("No Document", "No KYC document URL provided.");
        return;
    }
    await WebBrowser.openBrowserAsync(url);
};

export default function MechanicVerification() {
    const [mechanics, setMechanics] = useState([]);
    const [selectedMechanic, setSelectedMechanic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [search, setSearch] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchMechanicDetails = async () => {
        setErrorMsg(null);
        setLoading(true);
        try {
            const res = await api.get("users/GetMechanicDetailForVerify");
            setMechanics(res.data);
        } catch (error) {
            const msg = error.response?.data?.detail || "Something went wrong.";
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMechanicDetails();
    }, []);

    const verifyMechanic = async (mechanic_id) => {
        setIsVerifying(true);
        try {
            await api.post("users/VerifyMechanic/", { mechanic_id });
            Alert.alert("Success", "Mechanic Approved ✅");
            setModalVisible(false);
            setSelectedMechanic(null);
            fetchMechanicDetails();
        } catch (error) {
            const msg = error.response?.data?.detail || "Failed to verify mechanic.";
            Alert.alert("Error", msg);
        } finally {
            setIsVerifying(false);
        }
    };

    const rejectMechanic = async (mechanic_id) => {
        setIsRejecting(true);
        try {
            await api.post("users/RejectMechanic/", { mechanic_id });
            Alert.alert("Success", "Mechanic Rejected ❌");
            setModalVisible(false);
            setSelectedMechanic(null);
            fetchMechanicDetails();
        } catch (error) {
            const msg = error.response?.data?.detail || "Failed to reject mechanic.";
            Alert.alert("Error", msg);
        } finally {
            setIsRejecting(false);
        }
    };

    const filteredMechanics = mechanics.filter(
        (m) =>
            m.user?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
            m.user?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
            m.user?.mobile_number?.includes(search) ||
            m.shop_name?.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <View className="bg-white p-4 mb-3 rounded-lg shadow border border-gray-100 dark:bg-zinc-900 border-zinc-800">
            <View className="flex-row items-center space-x-3 mb-3">
                <Image
                    source={item.user?.profile_pic}
                    style={{ width: 50, height: 50, borderRadius: 25 }}
                    contentFit="cover"
                    placeholder={item.user?.first_name?.[0]}
                    className="bg-gray-200"
                />
                <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {item.user?.first_name} {item.user?.last_name}
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                        {item.shop_name}
                    </Text>
                </View>
                <View className="bg-yellow-100 px-2 py-1 rounded">
                    <Text className="text-xs text-yellow-800 font-medium">Pending</Text>
                </View>
            </View>

            <View className="flex-row justify-between items-center mt-2 border-t border-gray-100 dark:border-zinc-800 pt-3">
                <Text className="text-gray-600 dark:text-gray-300 text-sm">
                    Mobile: {item.user?.mobile_number}
                </Text>
                <TouchableOpacity
                    className="bg-black dark:bg-white px-4 py-2 rounded-md"
                    onPress={() => {
                        setSelectedMechanic(item);
                        setModalVisible(true);
                    }}
                >
                    <Text className="text-white dark:text-black font-medium text-sm">
                        View Details
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <>
            <Stack.Screen options={{ title: "Mechanic Verification", headerShown: false }} />
            <SafeAreaView className="flex-1 bg-gray-50 dark:bg-black" edges={['top', 'left', 'right']}>
                <View className="flex-1 p-4">
                    {errorMsg && (
                        <View className="bg-red-50 p-3 rounded-md mb-4 flex-row items-center border border-red-200">
                            <TriangleAlert size={20} color="#EF4444" />
                            <Text className="text-red-700 ml-2 flex-1">{errorMsg}</Text>
                        </View>
                    )}

                    <View className="mb-4 space-y-2">
                        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                            Verification
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400">
                            Review mechanics pending approval.
                        </Text>
                    </View>

                    {/* Search */}
                    <View className="flex-row items-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-md px-3 py-2 mb-4">
                        <Search size={20} className="text-gray-400" color="gray" />
                        <TextInput
                            placeholder="Search by name, shop, or mobile..."
                            value={search}
                            onChangeText={setSearch}
                            className="flex-1 ml-2 text-gray-900 dark:text-white h-10"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    {loading ? (
                        <View className="flex-1 justify-center items-center">
                            <ActivityIndicator size="large" color="#000" />
                            <Text className="text-gray-500 mt-2">Loading...</Text>
                        </View>
                    ) : filteredMechanics.length === 0 ? (
                        <View className="flex-1 justify-center items-center opacity-50">
                            <Users size={64} color="gray" />
                            <Text className="text-gray-500 mt-4 text-lg">
                                No mechanics found
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredMechanics}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderItem}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                        />
                    )}

                    {/* Detail Modal */}
                    <Modal
                        visible={modalVisible}
                        animationType="slide"
                        presentationStyle="pageSheet"
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View className="flex-1 bg-white dark:bg-black">
                            <View className="flex-row items-center p-4 border-b border-gray-100 dark:border-zinc-800">
                                <View className="flex-1">
                                    <Text className="text-xl font-bold text-gray-900 dark:text-white">
                                        Mechanic Details
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setModalVisible(false)}
                                    className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full"
                                >
                                    <X size={20} color="gray" />
                                </TouchableOpacity>
                            </View>

                            {selectedMechanic && (
                                <ScrollView className="p-4 space-y-4">
                                    <View className="items-center mb-6">
                                        <Image
                                            source={selectedMechanic.user?.profile_pic}
                                            style={{ width: 100, height: 100, borderRadius: 50 }}
                                            contentFit="cover"
                                            className="bg-gray-200"
                                        />
                                        <Text className="text-xl font-bold mt-3 text-gray-900 dark:text-white">
                                            {selectedMechanic.user?.first_name}{" "}
                                            {selectedMechanic.user?.last_name}
                                        </Text>
                                        <Text className="text-gray-500">
                                            {selectedMechanic.user?.mobile_number}
                                        </Text>
                                    </View>

                                    {/* Info Grid */}
                                    <View className="space-y-4">
                                        <InfoItem
                                            label="Shop Name"
                                            value={selectedMechanic.shop_name}
                                        />
                                        <InfoItem label="Email" value={selectedMechanic.user?.email} />
                                        <InfoItem
                                            label="Aadhar Card"
                                            value={selectedMechanic.adhar_card || "N/A"}
                                        />
                                        <InfoItem
                                            label="Shop Address"
                                            value={selectedMechanic.shop_address}
                                        />
                                        <InfoItem
                                            label="Location"
                                            value={`${selectedMechanic.shop_latitude ?? ""}, ${selectedMechanic.shop_longitude ?? ""
                                                }`}
                                        />
                                    </View>

                                    {/* KYC Section */}
                                    <View className="mt-6">
                                        <Text className="font-semibold mb-2 text-gray-900 dark:text-white">
                                            KYC Document
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() =>
                                                openKYCDocument(selectedMechanic.KYC_document)
                                            }
                                            className="border border-blue-500 bg-blue-50 p-4 rounded-lg items-center"
                                        >
                                            <Text className="text-blue-600 font-medium">
                                                View Document (Browser)
                                            </Text>
                                        </TouchableOpacity>
                                        {selectedMechanic.KYC_document && (
                                            <Text className="text-xs text-gray-400 mt-1 text-center">
                                                {selectedMechanic.KYC_document}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Actions */}
                                    <View className="flex-row gap-4 mt-8 mb-10">
                                        <TouchableOpacity
                                            className={`flex-1 p-4 rounded-lg border border-red-200 bg-red-50 ${isRejecting ? 'opacity-50' : ''}`}
                                            onPress={() => rejectMechanic(selectedMechanic.id)}
                                            disabled={isRejecting || isVerifying}
                                        >
                                            <Text className="text-center font-bold text-red-600">
                                                {isRejecting ? "Rejecting..." : "Reject"}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            className={`flex-1 bg-black dark:bg-white p-4 rounded-lg ${isVerifying ? 'opacity-50' : ''}`}
                                            onPress={() => verifyMechanic(selectedMechanic.id)}
                                            disabled={isVerifying || isRejecting}
                                        >
                                            <Text className="text-center font-bold text-white dark:text-black">
                                                {isVerifying ? "Approving..." : "Approve"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            )}
                        </View>
                    </Modal>
                </View>
            </SafeAreaView>
        </>
    );
}

const InfoItem = ({ label, value }) => (
    <View>
        <Text className="text-sm text-gray-500 mb-1">{label}</Text>
        <TextInput
            value={value || ""}
            editable={false}
            className="bg-gray-100 dark:bg-zinc-800 px-3 py-2 rounded text-gray-900 dark:text-gray-100"
        />
    </View>
);
