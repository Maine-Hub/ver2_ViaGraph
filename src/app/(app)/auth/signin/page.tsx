"use client";

import React, { useState } from "react";
import { useAuth } from "@/firebase/provider";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function Page() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth) {
      toast({ title: "Auth not ready", description: "Please try again in a moment." });
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: "Sign up successful!" });
      router.push("/");
    } catch (error: any) {
      toast({ title: "Sign up failed", description: error?.message ?? "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded bg-white p-8 shadow-md"
      >
        <h2 className="mb-4 text-center text-2xl font-bold">Sign Up</h2>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="mt-1 w-full rounded border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="mt-1 w-full rounded border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-green-600 py-2 text-white hover:bg-green-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <p className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-green-600 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}