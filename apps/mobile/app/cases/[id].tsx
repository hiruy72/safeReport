import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { getCaseDetails, getChatMessages, sendChatMessage } from "@/lib/api";
import { colors, styles } from "@/lib/theme";

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams();
  const [caseRecord, setCaseRecord] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCaseData();
    }
  }, [id]);

  async function fetchCaseData() {
    setLoading(true);
    const [caseRes, chatRes] = await Promise.all([
      getCaseDetails(id as string),
      getChatMessages(id as string)
    ]);
    if (caseRes.data) setCaseRecord(caseRes.data);
    if (chatRes.data) setMessages(chatRes.data);
    setLoading(false);
  }

  async function handleSend() {
    if (!messageInput.trim()) return;
    const res = await sendChatMessage(id as string, messageInput);
    if (res.success) {
      setMessageInput("");
      const chatRes = await getChatMessages(id as string);
      if (chatRes.data) setMessages(chatRes.data);
    }
  }

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.muted }}>Loading case details...</Text>
      </View>
    );
  }

  if (!caseRecord) {
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.danger }}>Case not found.</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <Stack.Screen options={{ title: `Case ${caseRecord.caseNumber}`, headerBackTitle: "Back" }} />
      
      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          <View style={styles.card}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Status</Text>
            <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 16, marginBottom: 10 }}>
              {caseRecord.status.replace(/_/g, " ")}
            </Text>
            
            <Text style={{ color: colors.muted, fontSize: 12 }}>Category</Text>
            <Text style={{ color: colors.text, fontSize: 16, marginBottom: 10 }}>
              {caseRecord.report?.category.replace(/_/g, " ")}
            </Text>

            <Text style={{ color: colors.muted, fontSize: 12 }}>Date Filed</Text>
            <Text style={{ color: colors.text, fontSize: 16, marginBottom: 10 }}>
              {new Date(caseRecord.createdAt).toLocaleDateString()}
            </Text>

            {caseRecord.policeStation && (
              <>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Assigned Station</Text>
                <Text style={{ color: colors.text, fontSize: 16 }}>{caseRecord.policeStation.name}</Text>
              </>
            )}
          </View>

          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10 }}>
            Chat with Officer
          </Text>

          {messages.length === 0 ? (
            <Text style={{ color: colors.muted, textAlign: "center", marginTop: 20 }}>No messages yet.</Text>
          ) : (
            messages.map((m) => {
              const isMe = m.senderRole === "VICTIM";
              return (
                <View 
                  key={m.id} 
                  style={{ 
                    alignSelf: isMe ? "flex-end" : "flex-start",
                    backgroundColor: isMe ? colors.primary : colors.surface,
                    padding: 12,
                    borderRadius: 16,
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: isMe ? 16 : 4,
                    maxWidth: "80%",
                    marginBottom: 10
                  }}
                >
                  <Text style={{ color: isMe ? "#fff" : colors.text }}>{m.content}</Text>
                  <Text style={{ color: isMe ? "rgba(255,255,255,0.7)" : colors.muted, fontSize: 10, marginTop: 4, textAlign: "right" }}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={{ padding: 16, backgroundColor: colors.background, borderTopWidth: 1, borderColor: colors.border, flexDirection: "row", gap: 10 }}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0, paddingVertical: 10 }]}
            value={messageInput}
            onChangeText={setMessageInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted}
          />
          <TouchableOpacity 
            style={[styles.btnPrimary, { paddingHorizontal: 20, justifyContent: "center" }]}
            onPress={handleSend}
          >
            <Text style={styles.btnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
