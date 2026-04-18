"use client";

import { useState, useEffect, useRef } from "react";
import { api, ShareWithUser } from "@/lib/apiClient";

interface ShareDialogProps {
  docId: string;
  docTitle: string;
  shares: ShareWithUser[];
  onClose: () => void;
  onSharesChanged: (shares: ShareWithUser[]) => void;
}

export default function ShareDialog({
  docId,
  docTitle,
  shares,
  onClose,
  onSharesChanged,
}: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"edit" | "view">("edit");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ id: string; email: string; name: string }[]>([]);
  const searchRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (email.length < 2) {
        setSuggestions([]);
        return;
      }
      if (searchRef.current) clearTimeout(searchRef.current);
      searchRef.current = setTimeout(async () => {
        try {
          const { users } = await api.searchUsers(email);
          setSuggestions(users);
        } catch {
          setSuggestions([]);
        }
      }, 300);
    };
    fetchSuggestions();
  }, [email]);

  const handleShare = async () => {
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    try {
      const share = await api.shareDocument(docId, email.trim(), permission);
      onSharesChanged([...shares.filter((s) => s.userId !== share.userId), share]);
      setEmail("");
      setSuggestions([]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to share");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (userId: string) => {
    try {
      await api.revokeShare(docId, userId);
      onSharesChanged(shares.filter((s) => s.userId !== userId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to revoke");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Share document</h2>
              <p className="text-sm text-gray-500 truncate max-w-xs">{docTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Add people */}
        <div className="px-6 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Add people</label>
          <div className="flex gap-2 relative">
            <div className="flex-1 relative">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="Enter email address"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                onKeyDown={(e) => e.key === "Enter" && handleShare()}
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                  {suggestions.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                      onClick={() => { setEmail(u.email); setSuggestions([]); }}
                    >
                      <div className="text-sm font-medium text-gray-800">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as "edit" | "view")}
              className="text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="edit">Can edit</option>
              <option value="view">Can view</option>
            </select>
            <button
              onClick={handleShare}
              disabled={loading || !email.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "..." : "Share"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <p className="mt-2 text-xs text-gray-400">
            Only registered users can be added. Test accounts: alice@ajaia.com, bob@ajaia.com, carol@ajaia.com
          </p>
        </div>

        {/* Current shares */}
        <div className="px-6 pb-5">
          <h3 className="text-sm font-medium text-gray-700 mb-3">People with access</h3>
          {shares.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No one else has access yet.</p>
          ) : (
            <ul className="space-y-2">
              {shares.map((share) => (
                <li key={share.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-semibold">
                      {(share.userName ?? share.userEmail ?? "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{share.userName}</div>
                      <div className="text-xs text-gray-500">{share.userEmail}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      share.permission === "edit"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {share.permission === "edit" ? "Can edit" : "Can view"}
                    </span>
                    <button
                      onClick={() => handleRevoke(share.userId)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Revoke access"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M11 3L3 11M3 3L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
