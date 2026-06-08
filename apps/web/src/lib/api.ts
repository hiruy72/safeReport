const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const json = await res.json();
  if (json.success && json.data?.accessToken) {
    localStorage.setItem("accessToken", json.data.accessToken);
    return true;
  }
  return false;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<ApiResult<T>> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const json = await res.json();

  if (res.status === 401 && !retried && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return api<T>(path, options, true);
  }

  return json as ApiResult<T>;
}

export async function uploadFile(
  reportId: string,
  file: File,
): Promise<ApiResult<{ id: string; fileName: string; type: string; fileSize: number }>> {
  const form = new FormData();
  form.append("reportId", reportId);
  form.append("file", file);
  return api("/api/evidence/upload", { method: "POST", body: form });
}

export async function uploadIdentityDocuments(
  idImage: File,
  selfieImage: File,
): Promise<ApiResult<unknown>> {
  const form = new FormData();
  form.append("idImage", idImage);
  form.append("selfieImage", selfieImage);
  return api("/api/victims/identity-documents", { method: "POST", body: form });
}

export async function uploadAbuserPhoto(
  reportId: string,
  photo: File,
): Promise<ApiResult<{ id: string; abuserPhotoKey: string }>> {
  const form = new FormData();
  form.append("photo", photo);
  return api(`/api/victims/reports/${reportId}/abuser-photo`, { method: "POST", body: form });
}

export async function getSuspectMatches(): Promise<ApiResult<SuspectMatch[]>> {
  return api("/api/police/suspect-matches");
}

export interface SuspectMatch {
  canonicalName: string;
  confidence: number;
  reportCount: number;
  locations: string[];
  reports: { name: string; reportId: string; caseNumber: string; location: string }[];
}

export async function registerPolice(form: FormData): Promise<ApiResult<{ id: string; email: string }>> {
  return api("/api/auth/register/police", { method: "POST", body: form });
}

export async function fetchAuthBlob(path: string): Promise<string | null> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return null;
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function downloadCaseSummary(caseId: string) {
  const res = await api<Record<string, unknown>>(`/api/cases/${caseId}/summary`);
  if (!res.data) return;
  const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `case-summary-${caseId.slice(0, 8)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPoliceReport(text: string, caseNumber: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `investigation-${caseNumber}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadEvidence(evidenceId: string, fileName: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/evidence/${evidenceId}/file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadWitnessAudio(caseId: string, submissionId: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/cases/${caseId}/witness/${submissionId}/audio`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `witness-audio-${submissionId}.mp3`;
  a.click();
  URL.revokeObjectURL(url);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export async function logout() {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    await api("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }
  clearTokens();
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export function getStoredUser(): {
  id: string;
  email: string;
  role: string;
  status: string;
} | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user: unknown) {
  localStorage.setItem("user", JSON.stringify(user));
}

export { API_URL };
