"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Login failed");
        return;
      }

      router.push("/");
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:flex min-h-screen w-full">
        <section className="flex flex-col justify-center items-start w-1/2 bg-primary-container px-3xl relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(#7c839b 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative z-10 space-y-xl max-w-lg">
            <div className="space-y-sm">
              <h1 className="text-display font-display text-white">
                YardFlow ERP
              </h1>
              <p className="text-body-lg font-body-lg text-on-primary-container">
                Manage your workshop. Track every kilogram.
              </p>
            </div>
            <ul className="space-y-md">
              {[
                { icon: "inventory_2", text: "Inventory & Stock Tracking" },
                { icon: "payments", text: "Sales, Purchases & Dues" },
                { icon: "analytics", text: "Payroll & Reports" },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-md">
                  <span className="material-symbols-outlined text-tertiary-container">
                    {item.icon}
                  </span>
                  <span className="text-body-sm font-body-sm text-white">
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-tertiary-container/10 blur-[120px] rounded-full" />
        </section>

        <section className="w-1/2 flex items-center justify-center p-lg bg-background">
          <div className="w-full max-w-[520px] bg-white rounded-lg shadow-card p-2xl">
            <div className="mb-xl text-center lg:text-left">
              <h2 className="text-h2 font-h2 text-primary-container mb-xs">
                Welcome back
              </h2>
              <p className="text-body font-body text-on-surface-variant">
                Sign in to your organization
              </p>
            </div>

            {error && (
              <div className="mb-md rounded border border-red-200 bg-red-50 px-md py-sm text-body-sm font-body-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-lg">
              <div className="space-y-xs">
                <label
                    className="block text-body-sm font-body-sm font-bold text-primary-container"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[42px] px-md border border-border-base rounded bg-white focus:border-primary-container focus:ring-3 focus:ring-primary-container/20 outline-none transition-all placeholder:text-on-surface-variant/50"
                  placeholder="name@company.com"
                />
              </div>

              <div className="space-y-xs">
                <div className="flex justify-between items-center">
                  <label
                  className="block text-body-sm font-body-sm font-bold text-primary-container"
                    htmlFor="password"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[42px] px-md pr-xl border border-border-base rounded bg-white focus:border-primary-container focus:ring-3 focus:ring-primary-container/20 outline-none transition-all placeholder:text-on-surface-variant/50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary-container text-white font-body font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-sm"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <div className="relative flex items-center py-sm">
                <div className="flex-grow border-t border-border-base" />
                <span className="flex-shrink mx-md text-caption font-caption text-on-primary-container uppercase tracking-widest">
                  or
                </span>
                <div className="flex-grow border-t border-border-base" />
              </div>

              <Link
                href="/register"
                className="w-full h-12 border border-primary-container text-primary-container font-body font-bold rounded-lg hover:bg-surface-container-low transition-all flex items-center justify-center"
              >
                Register your business
              </Link>
            </form>

            <footer className="mt-2xl text-center">
              <p className="text-caption font-caption text-on-primary-container">
                Multi-tenant &mdash; your data is completely private
              </p>
            </footer>
          </div>
        </section>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="lg:hidden flex flex-col min-h-screen bg-primary-container">
        <header className="min-h-[220px] w-full flex flex-col items-center justify-center text-center p-lg relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative z-10">
            <span className="material-symbols-outlined text-white text-[48px] mb-md">
              precision_manufacturing
            </span>
            <h1 className="text-h1-mobile font-h1 text-white tracking-tight mb-xs">
              YardFlow ERP
            </h1>
            <p className="text-body-sm font-body-sm text-surface-container-highest opacity-90 max-w-[280px]">
              Manage your workshop. Track every kilogram.
            </p>
          </div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-tertiary-container/10 rounded-full blur-3xl" />
        </header>

        <main className="flex-grow animate-slide-up bg-white rounded-t-[16px] z-20 flex flex-col p-lg shadow-2xl">
          <div className="w-12 h-1 bg-surface-container-high rounded-full mx-auto mb-xl opacity-50" />

          <div className="mb-xl">
            <h2 className="text-h2 font-h2 text-primary-container mb-xs">
              Welcome back
            </h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Sign in to your organization
            </p>
          </div>

          {error && (
            <div className="mb-md rounded border border-red-200 bg-red-50 px-md py-sm text-body-sm font-body-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-lg flex flex-col flex-grow"
          >
            <div className="space-y-xs">
              <label
                className="text-body-sm font-body-sm font-bold text-primary-container"
                htmlFor="email-mobile"
              >
                Email address
              </label>
              <input
                id="email-mobile"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[42px] px-md border border-border-base rounded bg-white text-body-sm font-body-sm focus:outline-none focus:border-primary-container focus:ring-3 focus:ring-primary-container/20 transition-all"
                placeholder="name@company.com"
              />
            </div>

            <div className="space-y-xs">
              <label
                className="text-body-sm font-body-sm font-bold text-primary-container"
                htmlFor="password-mobile"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password-mobile"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[42px] px-md pr-[44px] border border-border-base rounded bg-white text-body-sm font-body-sm focus:outline-none focus:border-primary-container focus:ring-3 focus:ring-primary-container/20 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface-variant hover:text-primary-container"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-primary-container text-white font-body font-bold rounded flex items-center justify-center gap-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined text-[20px]">
                    login
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center gap-md py-sm">
              <div className="h-[1px] flex-grow bg-surface-container-high" />
              <span className="text-caption font-caption text-on-surface-variant uppercase tracking-widest">
                or
              </span>
              <div className="h-[1px] flex-grow bg-surface-container-high" />
            </div>

              <Link
                href="/register"
                className="w-full h-[48px] bg-transparent border-2 border-primary-container text-primary-container font-bold rounded hover:bg-surface-container-low transition-colors flex items-center justify-center"
              >
                Register your business
              </Link>

            <footer className="mt-auto pt-2xl pb-lg text-center">
              <p className="text-caption font-caption text-on-surface-variant/70 flex items-center justify-center gap-xs">
                <span className="material-symbols-outlined text-[14px]">
                  verified_user
                </span>
                Multi-tenant &mdash; your data is completely private
              </p>
            </footer>
          </form>
        </main>
      </div>
    </>
  );
}
