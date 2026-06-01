"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading, register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setSubmitting(true);
    try {
      await register(email.trim(), password, fullName.trim() || undefined);
      toast.success("Account created!");
      router.replace("/dashboard");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Tidak bisa terhubung ke server";
      toast.error("Register gagal", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6"
      style={{
        background:
          "linear-gradient(112.27deg, #C5FBF9 0%, #FFFFFF 77.41%, #FDF5BF 100%)",
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <Link
          href="/"
          className="font-heading text-3xl font-bold text-[#0F5A5A]"
        >
          Signify
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Start learning sign language for free.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal-600 py-6 text-white hover:bg-teal-700"
          >
            {submitting ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-teal-600">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
