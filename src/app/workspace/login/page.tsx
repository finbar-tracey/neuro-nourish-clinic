"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Lock } from "lucide-react";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/workspace") || next.startsWith("/workspace/login")) {
    return "/workspace";
  }
  return next;
}

export default function WorkspaceLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
      window.location.href = next;
    } else {
      setError("Invalid access key");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <div className="mb-8 text-center">
          <BrandLogo variant="default" theme="dark" href="/" className="mx-auto justify-center" />
          <h1 className="mt-6 text-2xl font-bold text-white">Workspace CRM</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage leads and automations
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password" className="text-slate-300">
              Access Key
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-base"
                placeholder="Enter workspace access key"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full min-h-11" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
