"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-10">
        <div className="text-center mb-8">
          <Image src="/nsba-logo.png" alt="NSBA Logo" width={72} height={72} className="mx-auto mb-4 rounded-full" />
          <h1 className="text-2xl font-bold text-blue-900">Forgot Password</h1>
          <p className="text-gray-500 mt-1 text-sm">We'll send a reset link to your email</p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <p className="text-green-800 font-medium">Check your inbox</p>
              <p className="text-green-700 text-sm mt-1">
                If an account exists for <strong>{email}</strong>, a password reset link has been sent. It expires in 1 hour.
              </p>
            </div>
            <Link href="/login" className="block text-sm text-blue-600 hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@company.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="text-blue-600 hover:underline">Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
