import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { getVictimCases, logout } from "@/lib/api";
import { colors, styles } from "@/lib/theme";

export default function HomeScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["cases"],
    queryFn: async () => {
      const res = await getVictimCases();
      return res.data ?? [];
    },
  });

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Text style={styles.title}>Your Cases</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={{ color: colors.muted }}>Logout</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <Text style={{ color: colors.muted }}>Loading...</Text>
      ) : data?.length === 0 ? (
        <View style={styles.card}>
          <Text style={{ color: colors.muted }}>No reports yet. Tap Report to submit one.</Text>
        </View>
      ) : (
        data?.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {item.case?.caseNumber ?? "Pending"}
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              {item.category.replace(/_/g, " ")} · {item.case?.status?.replace(/_/g, " ") ?? "—"}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

