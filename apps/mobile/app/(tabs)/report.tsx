import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { submitReport } from "@/lib/api";
import { colors, styles } from "@/lib/theme";

const CATEGORIES = [
  { id: "SEXUAL_HARASSMENT", label: "Sexual Harassment" },
  { id: "DOMESTIC_VIOLENCE", label: "Domestic Violence" },
  { id: "PHYSICAL_ASSAULT", label: "Physical Assault" },
  { id: "STALKING", label: "Stalking" },
  { id: "ONLINE_HARASSMENT", label: "Online Harassment" },
  { id: "WORKPLACE_HARASSMENT", label: "Workplace Harassment" },
  { id: "SCHOOL_HARASSMENT", label: "School Harassment" },
  { id: "HUMAN_TRAFFICKING", label: "Human Trafficking" },
  { id: "OTHER", label: "Other" },
];

export default function ReportScreen() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    category: "SEXUAL_HARASSMENT",
    incidentDate: new Date().toISOString().slice(0, 10),
    incidentTime: "",
    location: "",
    description: "",
    abuserKnown: false,
    abuserName: "",
    abuserPhone: "",
    abuserRelation: "",
  });

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.location.trim() || !form.description.trim()) {
      Alert.alert("Missing fields", "Location and description are required.");
      return;
    }
    if (!form.incidentDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Invalid date format", "Please use YYYY-MM-DD format.");
      return;
    }

    setLoading(true);
    const payload = { ...form };
    if (!payload.abuserKnown) {
      delete payload.abuserName;
      delete payload.abuserPhone;
      delete payload.abuserRelation;
    }

    const res = await submitReport(payload);
    setLoading(false);

    if (!res.success) {
      Alert.alert("Error", res.error ?? "Failed to submit report");
      return;
    }

    Alert.alert("Submitted", `Case ${res.data?.case?.caseNumber ?? ""} created.`);
    setForm({
      category: "SEXUAL_HARASSMENT",
      incidentDate: new Date().toISOString().slice(0, 10),
      incidentTime: "",
      location: "",
      description: "",
      abuserKnown: false,
      abuserName: "",
      abuserPhone: "",
      abuserRelation: "",
    });
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>New Report</Text>
        <Text style={styles.subtitle}>Your identity stays encrypted</Text>

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.card,
                  { 
                    paddingVertical: 10, 
                    paddingHorizontal: 16, 
                    marginBottom: 0,
                    backgroundColor: form.category === c.id ? "rgba(167, 139, 250, 0.2)" : colors.surface,
                    borderColor: form.category === c.id ? colors.primary : colors.border
                  }
                ]}
                onPress={() => update("category", c.id)}
              >
                <Text style={{ 
                  color: form.category === c.id ? colors.primary : colors.text,
                  fontWeight: form.category === c.id ? "bold" : "normal"
                }}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={form.incidentDate}
              onChangeText={(v) => update("incidentDate", v)}
              placeholder="2023-01-01"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Time (optional)</Text>
            <TextInput
              style={styles.input}
              value={form.incidentTime}
              onChangeText={(v) => update("incidentTime", v)}
              placeholder="e.g., 21:00"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={form.location}
          onChangeText={(v) => update("location", v)}
          placeholder="Where did this happen?"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { minHeight: 120, textAlignVertical: "top" }]}
          value={form.description}
          onChangeText={(v) => update("description", v)}
          multiline
          placeholder="Describe what happened..."
          placeholderTextColor={colors.muted}
        />

        <TouchableOpacity
          style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 }]}
          onPress={() => update("abuserKnown", !form.abuserKnown)}
        >
          <View style={{ 
            width: 24, 
            height: 24, 
            borderRadius: 6, 
            borderWidth: 2, 
            borderColor: form.abuserKnown ? colors.primary : colors.muted,
            backgroundColor: form.abuserKnown ? colors.primary : "transparent",
            justifyContent: "center",
            alignItems: "center"
          }}>
            {form.abuserKnown && <Text style={{ color: "#fff", fontWeight: "bold" }}>✓</Text>}
          </View>
          <Text style={{ color: colors.text, fontSize: 16 }}>I know the abuser</Text>
        </TouchableOpacity>

        {form.abuserKnown && (
          <View style={[styles.card, { marginTop: 8 }]}>
            <Text style={styles.label}>Abuser Name</Text>
            <TextInput
              style={styles.input}
              value={form.abuserName}
              onChangeText={(v) => update("abuserName", v)}
              placeholder="Full name if known"
              placeholderTextColor={colors.muted}
            />
            
            <Text style={styles.label}>Relationship</Text>
            <TextInput
              style={styles.input}
              value={form.abuserRelation}
              onChangeText={(v) => update("abuserRelation", v)}
              placeholder="e.g. Partner, Colleague, Stranger"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Abuser Phone (Optional)</Text>
            <TextInput
              style={styles.input}
              value={form.abuserPhone}
              onChangeText={(v) => update("abuserPhone", v)}
              placeholder="Phone number if known"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
            />
          </View>
        )}

        <View style={{ marginTop: 24 }}>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.btnText}>{loading ? "Submitting..." : "Submit Report"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

