"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField, AuthLayout, PasswordField } from "@/components/auth/AuthLayout";
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
    <AuthLayout
      title="Create your account"
      subtitle="Start learning sign language for free."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#0B7077] hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          id="fullName"
          label="Full name"
          icon={User}
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
        />
        <AuthField
          id="email"
          label="Email"
          icon={Mail}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <PasswordField
          id="password"
          label="Password"
          icon={Lock}
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />

        <Button
          type="submit"
          disabled={submitting}
          className="h-12 w-full rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] text-base font-semibold text-white shadow-lg shadow-teal-900/15 transition-all hover:opacity-95 hover:shadow-xl disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Creating account...
            </>
          ) : (
            "Sign up"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
