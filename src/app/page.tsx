"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(token ? "/dashboard" : "/login");
    }
  }, [token, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-7 h-7 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
