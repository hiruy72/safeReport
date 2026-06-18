export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function getToken(): Promise<string | null> {
  const SecureStore = await import("expo-secure-store");
  return SecureStore.getItemAsync("accessToken");
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const token = await getToken();
  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  return res.json() as Promise<ApiResult<T>>;
}

export async function login(email: string, password: string) {
  const SecureStore = await import("expo-secure-store");
  const res = await api<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; role: string; status: string };
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (res.success && res.data) {
    await SecureStore.setItemAsync("accessToken", res.data.accessToken);
    await SecureStore.setItemAsync("refreshToken", res.data.refreshToken);
    await SecureStore.setItemAsync("user", JSON.stringify(res.data.user));
  }
  return res;
}

export async function logout() {
  const SecureStore = await import("expo-secure-store");
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
  await SecureStore.deleteItemAsync("user");
}

export async function getStoredUser() {
  const SecureStore = await import("expo-secure-store");
  const raw = await SecureStore.getItemAsync("user");
  return raw ? JSON.parse(raw) : null;
}

export async function triggerSOS(latitude?: number, longitude?: number) {
  return api<{ caseId?: string; message: string }>("/api/victims/sos", {
    method: "POST",
    body: JSON.stringify({ latitude, longitude }),
  });
}

export async function submitReport(body: Record<string, unknown>) {
  return api<{ id: string; case?: { id: string; caseNumber: string } }>(
    "/api/victims/reports",
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function getVictimCases() {
  return api<
    {
      id: string;
      category: string;
      case?: { id: string; caseNumber: string; status: string };
    }[]
  >("/api/victims/cases");
}

export async function getCaseDetails(caseId: string) {
  return api<any>(`/api/cases/${caseId}`);
}

export async function getChatMessages(caseId: string) {
  return api<any[]>(`/api/cases/${caseId}/chat`);
}

export async function sendChatMessage(caseId: string, content: string) {
  return api<{ id: string; content: string }>(`/api/cases/${caseId}/chat`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function getEmergencyContacts() {
  return api<any[]>("/api/victims/emergency-contacts");
}

export async function addEmergencyContact(contact: any) {
  return api<any>("/api/victims/emergency-contacts", {
    method: "POST",
    body: JSON.stringify(contact),
  });
}

export async function deleteEmergencyContact(id: string) {
  return api<any>(`/api/victims/emergency-contacts/${id}`, {
    method: "DELETE",
  });
}

