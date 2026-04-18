"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, Document } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import UploadButton from "@/components/UploadButton";

interface SharedDoc extends Document {
  ownerName: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function DocCard({
  doc,
  badge,
  badgeColor,
  subtitle,
  onDelete,
}: {
  doc: Document;
  badge: string;
  badgeColor: string;
  subtitle?: string;
  onDelete?: () => void;
}) {
  const router = useRouter();

  // Extract preview text from TipTap JSON
  const preview = (() => {
    try {
      const parsed = JSON.parse(doc.content);
      const texts: string[] = [];
      const walk = (node: { type?: string; text?: string; content?: unknown[] }) => {
        if (node.text) texts.push(node.text);
        if (node.content) node.content.forEach((c: unknown) => walk(c as { type?: string; text?: string; content?: unknown[] }));
      };
      walk(parsed);
      return texts.join(" ").slice(0, 100) || "No content yet";
    } catch {
      return "No content yet";
    }
  })();

  return (
    <div
      className="group bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer relative"
      onClick={() => router.push(`/doc/${doc.id}`)}
    >
      {/* Badge */}
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mb-3 ${badgeColor}`}>
        {badge}
      </span>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate pr-8">{doc.title}</h3>

      {/* Preview */}
      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">{preview}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{formatDate(doc.updatedAt)}</span>
        {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
      </div>

      {/* Delete button (owner only) */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1 rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all"
          title="Delete document"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3.5H12M5.5 3.5V2.5C5.5 2.22386 5.72386 2 6 2H8C8.27614 2 8.5 2.22386 8.5 2.5V3.5M11.5 3.5L11 11.5C11 11.7761 10.7761 12 10.5 12H3.5C3.22386 12 3 11.7761 3 11.5L2.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [owned, setOwned] = useState<Document[]>([]);
  const [shared, setShared] = useState<SharedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.listDocuments();
      setOwned(data.owned);
      setShared(data.shared as SharedDoc[]);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [token, router, load]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const doc = await api.createDocument("Untitled document");
      router.push(`/doc/${doc.id}`);
    } catch {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    try {
      await api.deleteDocument(id);
      setOwned((prev) => prev.filter((d) => d.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const filteredOwned = owned.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );
  const filteredShared = shared.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 3.5H12M2 6H9M2 8.5H7M2 11H5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-semibold text-gray-900">Ajaia Docs</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold">
                {user?.name[0].toUpperCase()}
              </div>
              <span>{user?.name}</span>
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Actions row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900">My Documents</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {owned.length} owned · {shared.length} shared with me
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="flex-1 sm:w-56 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
            />
            <UploadButton onUploaded={load} />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2V12M2 7H12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {creating ? "Creating..." : "New doc"}
            </button>
          </div>
        </div>

        {/* Owned documents */}
        <section className="mb-10">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Owned by me
          </h3>
          {filteredOwned.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M4 5C4 3.89543 4.89543 3 6 3H13L18 8V19C18 20.1046 17.1046 21 16 21H6C4.89543 21 4 20.1046 4 19V5Z" stroke="#9ca3af" strokeWidth="1.5"/>
                  <path d="M13 3V8H18" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 13H14M8 10H14M8 16H11" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                {search ? "No documents match your search." : "No documents yet. Create one or import a file."}
              </p>
              {!search && (
                <button
                  onClick={handleCreate}
                  className="mt-3 text-sm text-indigo-600 font-medium hover:underline"
                >
                  Create your first document →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOwned.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  badge="Owner"
                  badgeColor="bg-indigo-50 text-indigo-700"
                  onDelete={() => handleDelete(doc.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Shared documents */}
        {(filteredShared.length > 0 || search) && (
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Shared with me
            </h3>
            {filteredShared.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No shared documents match your search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredShared.map((doc) => (
                  <DocCard
                    key={doc.id}
                    doc={doc}
                    badge="Shared"
                    badgeColor="bg-emerald-50 text-emerald-700"
                    subtitle={`from ${doc.ownerName}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
