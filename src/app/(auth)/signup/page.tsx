"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModalPunchHoles, getModalPunchHoleMask } from "@/components/ui/modal-punch-holes";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Check your email to confirm your account.");
    router.push("/login");
  }

  async function handleGoogleSignup() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error(error.message);
    }
  }

  return (
    <div className="relative w-full max-w-[420px] rounded-card shadow-card">
      <Card className="p-[32px] pt-0" style={getModalPunchHoleMask()}>
        <div className="h-[64px]" />
        <div className="flex flex-col items-center text-center">
          <img src="/logo.svg" alt="Walloflove" className="h-[48px] w-[61px] object-contain" />
          <h1 className="mt-[24px] text-heading font-bold text-text-primary">
            Create your account
          </h1>
          <p className="mt-[8px] text-body-sm text-text-secondary">
            Start building hand-drawn guestbooks for your website.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          className="mt-[24px] flex w-full items-center justify-center gap-[10px] rounded-input border border-border bg-bg-card px-[16px] py-[10px] text-body-sm font-semibold text-text-primary shadow-card-sm transition-colors hover:bg-bg-page active:bg-bg-subtle cursor-pointer"
        >
          <svg className="h-[20px] w-[20px]" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative my-[24px]">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-body-sm">
            <span className="bg-bg-card px-[12px] text-text-placeholder">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="email" className="text-body-sm font-medium text-text-primary">
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="password" className="text-body-sm font-medium text-text-primary">
              Password
            </label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          <Button type="submit" disabled={loading} className="mt-[8px]">
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-[20px] text-center text-body-sm text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent hover:text-accent-hover">
            Log in
          </Link>
        </p>
      </Card>
      <ModalPunchHoles />
    </div>
  );
}
