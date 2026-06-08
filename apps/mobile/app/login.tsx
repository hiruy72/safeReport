import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { login } from "@/lib/api";
import { colors, styles } from "@/lib/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (!res.success || !res.data) {
      Alert.alert("Login failed", res.error ?? "Invalid credentials");
      return;
    }

    if (res.data.user.role !== "VICTIM") {
      Alert.alert("Mobile app", "Victim accounts only. Use the web app for police/admin.");
      return;
    }

    router.replace("/(tabs)");
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>SafeHer</Text>
      <Text style={styles.subtitle}>Secure reporting for victims</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={colors.muted}
        placeholder="you@example.com"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={colors.muted}
        placeholder="••••••••"
      />

      <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
        <Text style={styles.btnText}>{loading ? "Signing in..." : "Sign In"}</Text>
      </TouchableOpacity>
    </View>
  );
}
