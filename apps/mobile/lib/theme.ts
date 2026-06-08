import { StyleSheet } from "react-native";

export const colors = {
  background: "#0f0a1a",
  surface: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  primary: "#a78bfa",
  accent: "#f472b6",
  text: "#f8f5ff",
  muted: "#a1a1aa",
  danger: "#f87171",
  success: "#34d399",
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    marginBottom: 12,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  btnDanger: {
    backgroundColor: colors.danger,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 6,
  },
});
