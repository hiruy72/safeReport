import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, StyleSheet, Platform, KeyboardAvoidingView } from "react-native";
import { getEmergencyContacts, addEmergencyContact, deleteEmergencyContact } from "@/lib/api";
import { colors, styles } from "@/lib/theme";

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", relationship: "", notifyOnSos: false });

  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    setLoading(true);
    const res = await getEmergencyContacts();
    if (res.data) setContacts(res.data);
    setLoading(false);
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.phone.trim()) {
      Alert.alert("Missing fields", "Name and phone are required");
      return;
    }
    const res = await addEmergencyContact(form);
    if (res.success) {
      setShowAdd(false);
      setForm({ name: "", phone: "", relationship: "", notifyOnSos: false });
      fetchContacts();
    } else {
      Alert.alert("Error", res.error ?? "Failed to add contact");
    }
  }

  async function handleDelete(id: string) {
    Alert.alert("Delete Contact", "Are you sure you want to remove this contact?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await deleteEmergencyContact(id);
        fetchContacts();
      }}
    ]);
  }

  return (
    <View style={styles.screen}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Text style={styles.title}>Contacts</Text>
        <TouchableOpacity 
          style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
          onPress={() => setShowAdd(true)}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>People to notify in case of an emergency.</Text>

      {loading ? (
        <Text style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}>Loading...</Text>
      ) : contacts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>📇</Text>
          <Text style={{ color: colors.muted }}>No contacts added yet.</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {contacts.map((contact) => (
            <View key={contact.id} style={styles.card}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>{contact.name}</Text>
                  {contact.relationship ? (
                    <Text style={{ color: colors.primary, fontSize: 12, marginTop: 2 }}>{contact.relationship}</Text>
                  ) : null}
                  <Text style={{ color: colors.muted, marginTop: 8 }}>📞 {contact.phone}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(contact.id)}>
                  <Text style={{ color: colors.danger, fontSize: 12 }}>Delete</Text>
                </TouchableOpacity>
              </View>
              {contact.notifyOnSos && (
                <View style={{ marginTop: 12, backgroundColor: "rgba(248,113,113,0.2)", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ color: colors.danger, fontSize: 10, fontWeight: "bold" }}>🚨 SOS ALERT ENABLED</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>Add Emergency Contact</Text>
            
            <Text style={styles.label}>Name *</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(t) => setForm({...form, name: t})} placeholder="Jane Doe" placeholderTextColor={colors.muted} />
            
            <Text style={styles.label}>Phone *</Text>
            <TextInput style={styles.input} value={form.phone} onChangeText={(t) => setForm({...form, phone: t})} placeholder="+1 (555) 000-0000" placeholderTextColor={colors.muted} keyboardType="phone-pad" />
            
            <Text style={styles.label}>Relationship</Text>
            <TextInput style={styles.input} value={form.relationship} onChangeText={(t) => setForm({...form, relationship: t})} placeholder="e.g. Sister, Friend" placeholderTextColor={colors.muted} />
            
            <TouchableOpacity 
              style={{ flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 24 }}
              onPress={() => setForm({...form, notifyOnSos: !form.notifyOnSos})}
            >
              <View style={{ width: 24, height: 24, borderWidth: 2, borderColor: form.notifyOnSos ? colors.primary : colors.muted, backgroundColor: form.notifyOnSos ? colors.primary : "transparent", borderRadius: 6, justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                {form.notifyOnSos && <Text style={{ color: "#fff", fontWeight: "bold" }}>✓</Text>}
              </View>
              <Text style={{ color: colors.text, flex: 1 }}>Notify automatically when SOS is used</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity style={[styles.btnPrimary, { flex: 1, backgroundColor: colors.surface }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPrimary, { flex: 1 }]} onPress={handleAdd}>
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
