const BASE = "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ajaia_token");
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...headers(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; email: string; name: string } }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),

  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: { id: string; email: string; name: string } }>(
      "/api/auth/register",
      { method: "POST", body: JSON.stringify({ name, email, password }) }
    ),

  // Documents
  listDocuments: () =>
    request<{
      owned: Document[];
      shared: (Document & { ownerName: string })[];
    }>("/api/documents"),

  createDocument: (title: string) =>
    request<Document>("/api/documents", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  getDocument: (id: string) =>
    request<Document & { permission: string; shares: ShareWithUser[] | null; ownerName?: string }>(
      `/api/documents/${id}`
    ),

  updateDocument: (id: string, data: { title?: string; content?: string }) =>
    request<Document>(`/api/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteDocument: (id: string) =>
    request<{ success: boolean }>(`/api/documents/${id}`, { method: "DELETE" }),

  // Sharing
  shareDocument: (id: string, email: string, permission: "view" | "edit") =>
    request<ShareWithUser>(`/api/documents/${id}/share`, {
      method: "POST",
      body: JSON.stringify({ email, permission }),
    }),

  revokeShare: (id: string, userId: string) =>
    request<{ success: boolean }>(`/api/documents/${id}/share`, {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    }),

  // Upload
  uploadFile: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Upload failed");
    return data as { doc: Document };
  },

  // User search
  searchUsers: (q: string) =>
    request<{ users: { id: string; email: string; name: string }[] }>(
      `/api/users/search?q=${encodeURIComponent(q)}`
    ),
};

export interface Document {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareWithUser {
  id: string;
  documentId: string;
  userId: string;
  permission: "view" | "edit";
  userName?: string;
  userEmail?: string;
}
