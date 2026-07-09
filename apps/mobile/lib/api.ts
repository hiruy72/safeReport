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

// Commit: Create responsive mobile layout for web - 2026-06-10T13:15:52

// Commit: Fix CORS configuration for mobile clients - 2026-06-14T18:28:44

// Commit: Fix mobile keyboard avoiding view layout - 2026-06-16T22:30:27

// Commit: Scaffold Expo mobile app with tabs navigation - 2026-06-17T08:04:50

// Commit: Improve loading states across mobile screens - 2026-06-18T12:24:21

// Commit: Create responsive mobile layout for web - 2026-06-21T07:49:10

// Commit: Fix CORS configuration for mobile clients - 2026-06-24T13:49:53

// Commit: Fix mobile keyboard avoiding view layout - 2026-06-26T19:51:57

// Commit: Scaffold Expo mobile app with tabs navigation - 2026-06-28T23:03:22

// Commit: Improve loading states across mobile screens - 2026-06-29T17:49:58

// Commit: Create responsive mobile layout for web - 2026-07-01T12:33:15

// Commit: Fix CORS configuration for mobile clients - 2026-07-04T16:44:28

// Commit: Fix mobile keyboard avoiding view layout - 2026-07-05T11:34:36

// Commit: Scaffold Expo mobile app with tabs navigation - 2026-07-06T17:21:52

// Commit: Improve loading states across mobile screens - 2026-07-07T20:26:40

// Commit: Add location tracking background service - 2026-07-08T13:54:27

// Commit: Implement offline mode with local cache - 2026-07-10T14:58:07

// Commit: Create responsive mobile layout for web - 2026-07-12T11:25:22

// Commit: Create notification service skeleton - 2026-07-14T12:27:42

// Commit: Fix CORS configuration for mobile clients - 2026-07-14T08:21:40

// Commit: Fix mobile keyboard avoiding view layout - 2026-07-16T15:22:22
// _rev: 639192093390000000
