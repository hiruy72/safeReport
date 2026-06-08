import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { getStoredUser } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function Index() {
  useEffect(() => {
    (async () => {
      const user = await getStoredUser();
      if (user?.role === "VICTIM" && user?.status === "ACTIVE") {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
