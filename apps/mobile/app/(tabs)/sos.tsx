import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, Animated, Easing } from "react-native";
import * as Location from "expo-location";
import { triggerSOS } from "@/lib/api";
import { colors, styles } from "@/lib/theme";

export default function SOSScreen() {
  const [loading, setLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [pulseAnim]);

  async function handleSOS() {
    Alert.alert(
      "Emergency SOS",
      "This will alert your assigned police station immediately. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send SOS",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            let latitude: number | undefined;
            let longitude: number | undefined;

            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === "granted") {
                const loc = await Location.getCurrentPositionAsync({});
                latitude = loc.coords.latitude;
                longitude = loc.coords.longitude;
              }
            } catch {
              /* location optional */
            }

            const res = await triggerSOS(latitude, longitude);
            setLoading(false);

            if (res.success) {
              Alert.alert("SOS Sent", res.data?.message ?? "Police have been notified.");
            } else {
              Alert.alert("Error", res.error ?? "Could not send SOS");
            }
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
      <Text style={[styles.title, { textAlign: "center", fontSize: 32 }]}>Emergency SOS</Text>
      <Text style={[styles.subtitle, { textAlign: "center", maxWidth: 280, marginTop: 8 }]}>
        Tap to send an urgent alert to the nearest police station with your location.
      </Text>

      <TouchableOpacity
        onPress={handleSOS}
        disabled={loading}
        activeOpacity={0.8}
        style={{ marginTop: 60, marginBottom: 40 }}
      >
        <Animated.View
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: colors.danger,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: colors.danger,
            shadowOpacity: 0.6,
            shadowRadius: 30,
            elevation: 10,
            transform: [{ scale: pulseAnim }]
          }}
        >
          <View style={{
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: "rgba(255,255,255,0.15)",
            justifyContent: "center",
            alignItems: "center",
          }}>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 40, letterSpacing: 2 }}>SOS</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      <View style={{ backgroundColor: "rgba(248,113,113,0.1)", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginTop: 20 }}>
        <Text style={{ color: colors.danger, fontSize: 13, fontWeight: "600", textAlign: "center" }}>
          {loading ? "Sending alert..." : "Requires an active case"}
        </Text>
      </View>
    </View>
  );
}

