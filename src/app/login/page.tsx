"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await api.login(email, password);
      login(token, user);
      router.push("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const loginAs = async (testEmail: string) => {
    setEmail(testEmail);
    setPassword("password123");
    setError("");
    setLoading(true);
    try {
      const { token, user } = await api.login(testEmail, "password123");
      login(token, user);
      router.push("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 6H20M4 10H16M4 14H12M4 18H9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Ajaia Docs</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M7 4V7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <circle cx="7" cy="9.5" r="0.7" fill="currentColor"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Test accounts */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-3 text-center">Quick login — test accounts</p>
            <div className="grid grid-cols-3 gap-2">
              {["alice@ajaia.com", "bob@ajaia.com", "carol@ajaia.com"].map((e) => (
                <button
                  key={e}
                  onClick={() => loginAs(e)}
                  disabled={loading}
                  className="text-xs py-2 px-2 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-lg text-gray-600 hover:text-indigo-700 transition-all font-medium disabled:opacity-50"
                >
                  {e.split("@")[0]}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            No account?{" "}
            <Link href="/register" className="text-indigo-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
