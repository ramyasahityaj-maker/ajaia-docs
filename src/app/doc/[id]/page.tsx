"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ShareWithUser } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";
import ShareDialog from "@/components/ShareDialog";
import Link from "next/link";

// Dynamically import Editor to avoid SSR issues with TipTap
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

type Permission = "owner" | "edit" | "view";

interface DocData {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  ownerName?: string;
  permission: Permission;
  shares: ShareWithUser[] | null;
  updatedAt: string;
}

const AUTOSAVE_DELAY = 1500;

function SaveStatus({ status }: { status: "saved" | "saving" | "unsaved" | "error" }) {
  if (status === "saving") return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
      Saving...
    </span>
  );
  if (status === "saved") return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
      Saved
    </span>
  );
  if (status === "error") return (
    <span className="flex items-center gap-1.5 text-xs text-red-400">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      Save failed
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
      Unsaved
    </span>
  );
}

export default function DocPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const router = useRouter();

  const [doc, setDoc] = useState<DocData | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [editingTitle, setEditingTitle] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shares, setShares] = useState<ShareWithUser[]>([]);

  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const isOwner = doc?.permission === "owner";
  const canEdit = doc?.permission === "owner" || doc?.permission === "edit";

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    api.getDocument(id).then((data) => {
      setDoc(data as DocData);
      setTitle(data.title);
      setContent(data.content);
      setShares(data.shares ?? []);
      setLoading(false);
    }).catch(() => {
      router.push("/dashboard");
    });
  }, [id, token, router]);

  const save = useCallback(async (newTitle?: string, newContent?: string) => {
    if (!canEdit) return;
    setSaveStatus("saving");
    try {
      const updates: { title?: string; content?: string } = {};
      if (newContent !== undefined) updates.content = newContent;
      if (newTitle !== undefined && isOwner) updates.title = newTitle;
      await api.updateDocument(id, updates);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, [id, canEdit, isOwner]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setSaveStatus("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      save(undefined, newContent);
    }, AUTOSAVE_DELAY);
  };

  const handleTitleSave = async () => {
    setEditingTitle(false);
    if (title.trim() && title !== doc?.title) {
      await save(title.trim(), undefined);
      setDoc((prev) => prev ? { ...prev, title: title.trim() } : prev);
    } else {
      setTitle(doc?.title ?? "");
    }
  };

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.select();
  }, [editingTitle]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="h-14 px-4 flex items-center gap-3">
          {/* Back to dashboard */}
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Back to dashboard"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>

          {/* Doc icon */}
          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded bg-indigo-50 text-indigo-500">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2C2 1.44772 2.44772 1 3 1H7.5L10 3.5V10C10 10.5523 9.55228 11 9 11H3C2.44772 11 2 10.5523 2 10V2Z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M7.5 1V3.5H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            {editingTitle && isOwner ? (
              <input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") { setEditingTitle(false); setTitle(doc?.title ?? ""); }
                }}
                className="text-sm font-semibold text-gray-900 bg-gray-100 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full max-w-sm"
              />
            ) : (
              <button
                onClick={() => isOwner && setEditingTitle(true)}
                className={`text-sm font-semibold text-gray-900 truncate block max-w-sm ${isOwner ? "hover:bg-gray-100 rounded px-2 py-0.5 -mx-2 -my-0.5 transition-colors" : "cursor-default px-2 py-0.5"}`}
                title={isOwner ? "Click to rename" : undefined}
              >
                {title}
              </button>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <SaveStatus status={saveStatus} />

            {/* Permission badge */}
            {!isOwner && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                doc?.permission === "edit" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>
                {doc?.permission === "edit" ? "Can edit" : "View only"}
              </span>
            )}

            {/* Share button (owner only) */}
            {isOwner && (
              <button
                onClick={() => setShowShare(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="10.5" cy="3.5" r="1.5" stroke="white" strokeWidth="1.2"/>
                  <circle cx="10.5" cy="10.5" r="1.5" stroke="white" strokeWidth="1.2"/>
                  <circle cx="3.5" cy="7" r="1.5" stroke="white" strokeWidth="1.2"/>
                  <path d="M5 6.25L9 4.25M5 7.75L9 9.75" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Share
                {shares.length > 0 && (
                  <span className="bg-white/20 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                    {shares.length}
                  </span>
                )}
              </button>
            )}

            {/* Owner info for shared docs */}
            {!isOwner && doc?.ownerName && (
              <span className="text-xs text-gray-400 hidden sm:block">
                by {doc.ownerName}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Editor area */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto py-6 px-4 sm:px-0">
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Editor
            content={content}
            onChange={handleContentChange}
            editable={canEdit}
          />
        </div>

        {!canEdit && (
          <p className="text-center text-xs text-gray-400 mt-3">
            You have view-only access to this document.
          </p>
        )}
      </main>

      {/* Share dialog */}
      {showShare && doc && (
        <ShareDialog
          docId={doc.id}
          docTitle={doc.title}
          shares={shares}
          onClose={() => setShowShare(false)}
          onSharesChanged={setShares}
        />
      )}
    </div>
  );
}
