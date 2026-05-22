"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    company_name: "",
    phone: "",
    address: "",
    owner_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function getPasswordStrength(): {
    width: string;
    color: string;
    label: string;
    textColor: string;
  } {
    const val = form.password;
    if (!val) return { width: "0%", color: "", label: "Empty", textColor: "#475569" };

    let strength = 0;
    if (val.length > 0) strength += 20;
    if (val.length > 7) strength += 20;
    if (/[A-Z]/.test(val)) strength += 20;
    if (/[0-9]/.test(val)) strength += 20;
    if (/[^A-Za-z0-9]/.test(val)) strength += 20;

    if (strength <= 20)
      return { width: "20%", color: "#EF4444", label: "Weak", textColor: "#EF4444" };
    if (strength <= 60)
      return { width: `${strength}%`, color: "#EAB308", label: "Moderate", textColor: "#EAB308" };
    return { width: "100%", color: "#22C55E", label: "Strong", textColor: "#22C55E" };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.company_name,
          phone: form.phone,
          address: form.address,
          owner_name: form.owner_name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (typeof data.error === "string") {
          setError(data.error);
        } else if (data.error?.email) {
          setError(data.error.email[0]);
        } else {
          setError("Registration failed");
        }
        return;
      }

      router.push("/");
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  const strength = getPasswordStrength();

  return (
    <>
      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:flex min-h-screen items-center justify-center bg-background py-2xl px-md">
        <main className="w-full max-w-[560px] bg-surface rounded-lg shadow-card p-10 flex flex-col gap-xl">
          <header className="text-center flex flex-col items-center">
            <div className="flex items-center gap-sm mb-md">
              <div className="bg-primary-container p-1.5 rounded-sm">
                <span className="material-symbols-outlined text-white text-[20px]">
                  factory
                </span>
              </div>
              <h2 className="text-h3 font-h3 text-primary-container">YardFlow ERP</h2>
            </div>
            <h1 className="text-h1-mobile font-h1 text-primary-container mb-xs">
              Register your business
            </h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Set up your organization in 2 minutes
            </p>
          </header>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-md py-sm text-body-sm font-body-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-xl">
            <fieldset className="flex flex-col gap-md p-0 m-0 border-none">
              <legend className="text-h4 font-h4 text-primary-container mb-sm">
                Organization Details
              </legend>

              <div className="flex flex-col gap-xs">
                <label
                  className="text-body-sm font-body-sm font-bold text-primary-container"
                  htmlFor="business_name"
                >
                  Business Name <span className="text-error">*</span>
                </label>
                <input
                  id="business_name"
                  required
                  value={form.company_name}
                  onChange={(e) => update("company_name", e.target.value)}
                  className="h-[42px] px-md border border-border-base rounded bg-surface text-body-sm font-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 outline-none transition-all"
                  placeholder="e.g. Atlantic Scrap & Recovery"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label
                  className="text-body-sm font-body-sm font-bold text-primary-container"
                  htmlFor="phone_number"
                >
                  Phone Number
                </label>
                <input
                  id="phone_number"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="h-[42px] px-md border border-border-base rounded bg-surface text-body-sm font-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 outline-none transition-all"
                  placeholder="+880 1XXX XXXXXXX"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label
                  className="text-body-sm font-body-sm font-bold text-primary-container"
                  htmlFor="business_address"
                >
                  Business Address
                </label>
                <textarea
                  id="business_address"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  rows={3}
                  className="p-md border border-border-base rounded bg-surface text-body-sm font-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 outline-none transition-all resize-none"
                  placeholder="Enter full registered address..."
                />
              </div>
            </fieldset>

            <hr className="border-t border-border-base" />

            <fieldset className="flex flex-col gap-md p-0 m-0 border-none">
              <legend className="text-h4 font-h4 text-primary-container mb-sm">
                Owner Account
              </legend>

              <div className="flex flex-col gap-xs">
                <label
                  className="text-body-sm font-body-sm font-bold text-primary-container"
                  htmlFor="full_name"
                >
                  Your Full Name
                </label>
                <input
                  id="full_name"
                  required
                  value={form.owner_name}
                  onChange={(e) => update("owner_name", e.target.value)}
                  className="h-[42px] px-md border border-border-base rounded bg-surface text-body-sm font-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label
                  className="text-body-sm font-body-sm font-bold text-primary-container"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="h-[42px] px-md border border-border-base rounded bg-surface text-body-sm font-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 outline-none transition-all"
                  placeholder="john@company.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label
                    className="text-body-sm font-body-sm font-bold text-primary-container"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    className="h-[42px] px-md border border-border-base rounded bg-surface text-body-sm font-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  {form.password && (
                    <div className="mt-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: strength.textColor }}
                        >
                          Strength: {strength.label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: strength.width,
                            backgroundColor: strength.color,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-xs">
                  <label
                    className="text-body-sm font-body-sm font-bold text-primary-container"
                    htmlFor="confirm_password"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirm_password"
                    type="password"
                    required
                    minLength={6}
                    value={form.confirm_password}
                    onChange={(e) => update("confirm_password", e.target.value)}
                    className="h-[42px] px-md border border-border-base rounded bg-surface text-body-sm font-body-sm focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </fieldset>

            <div className="flex flex-col gap-md pt-sm">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary-container text-white font-body font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-sm disabled:opacity-40"
              >
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    Create Organization & Sign In
                    <span className="material-symbols-outlined text-[20px]">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-body-sm font-body-sm font-medium text-tertiary hover:underline inline-flex items-center gap-xs"
                >
                  Already registered? Sign in &rarr;
                </Link>
              </div>
            </div>
          </form>

          <footer className="mt-sm flex justify-center opacity-40 grayscale pointer-events-none">
            <div className="flex items-center gap-xl overflow-hidden whitespace-nowrap">
              <span className="material-symbols-outlined text-[32px]">
                precision_manufacturing
              </span>
              <span className="material-symbols-outlined text-[32px]">
                anchor
              </span>
              <span className="material-symbols-outlined text-[32px]">
                forklift
              </span>
              <span className="material-symbols-outlined text-[32px]">
                package
              </span>
              <span className="material-symbols-outlined text-[32px]">
                recycling
              </span>
            </div>
          </footer>
        </main>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="lg:hidden bg-background min-h-screen">
        <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md px-[20px] py-md border-b border-border-base">
          <div className="flex flex-col gap-xs">
            <span className="text-h3 font-h3 text-primary-container tracking-tight">
              YardFlow ERP
            </span>
            <h1 className="text-h1-mobile font-h1 text-primary-container">
              Register your business
            </h1>
          </div>
        </header>

        <main className="px-[20px] pt-lg pb-[120px]">
          {error && (
            <div className="mb-md rounded border border-red-200 bg-red-50 px-md py-sm text-body-sm font-body-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-xl"
            id="registerForm"
          >
            <section className="flex flex-col gap-lg">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary-container">
                  corporate_fare
                </span>
                <h2 className="text-h3 font-h3">Organization Details</h2>
              </div>

              <div className="grid gap-md">
                <div className="flex flex-col gap-xs">
                  <label
                    className="text-body-sm font-body-sm font-bold text-on-surface-variant"
                    htmlFor="biz-mobile"
                  >
                    Business Name
                  </label>
                  <input
                    id="biz-mobile"
                    required
                    value={form.company_name}
                    onChange={(e) => update("company_name", e.target.value)}
                    className="h-[42px] px-md rounded border border-border-base focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all placeholder:text-outline-variant bg-surface"
                    placeholder="e.g. Atlantic Scrap Metal Ltd."
                  />
                </div>

                <div className="flex flex-col gap-xs">
                  <label
                    className="text-body-sm font-body-sm font-bold text-on-surface-variant"
                    htmlFor="phone-mobile"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone-mobile"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="h-[42px] px-md rounded border border-border-base focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all placeholder:text-outline-variant bg-surface"
                    placeholder="+880 1XXX XXXXXXX"
                  />
                </div>

                <div className="flex flex-col gap-xs">
                  <label
                    className="text-body-sm font-body-sm font-bold text-on-surface-variant"
                    htmlFor="address-mobile"
                  >
                    Business Address
                  </label>
                  <textarea
                    id="address-mobile"
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    rows={3}
                    className="p-md rounded border border-border-base focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all placeholder:text-outline-variant bg-surface resize-none"
                    placeholder="Enter full address..."
                  />
                </div>
              </div>
            </section>

            <div className="h-[1px] bg-outline-variant/30" />

            <section className="flex flex-col gap-lg">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary-container">
                  account_circle
                </span>
                <h2 className="text-h3 font-h3">Owner Account</h2>
              </div>

              <div className="grid gap-md">
                <div className="flex flex-col gap-xs">
                  <label
                    className="text-body-sm font-body-sm font-bold text-on-surface-variant"
                    htmlFor="name-mobile"
                  >
                    Full Name
                  </label>
                  <input
                    id="name-mobile"
                    required
                    value={form.owner_name}
                    onChange={(e) => update("owner_name", e.target.value)}
                    className="h-[42px] px-md rounded border border-border-base focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all placeholder:text-outline-variant bg-surface"
                    placeholder="John Doe"
                  />
                </div>

                <div className="flex flex-col gap-xs">
                  <label
                    className="text-body-sm font-body-sm font-bold text-on-surface-variant"
                    htmlFor="email-mobile"
                  >
                    Email Address
                  </label>
                  <input
                    id="email-mobile"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="h-[42px] px-md rounded border border-border-base focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all placeholder:text-outline-variant bg-surface"
                    placeholder="admin@company.com"
                  />
                </div>

                <div className="flex flex-col gap-xs">
                  <label
                    className="text-body-sm font-body-sm font-bold text-on-surface-variant"
                    htmlFor="pass-mobile"
                  >
                    Password
                  </label>
                  <input
                    id="pass-mobile"
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    className="h-[42px] px-md rounded border border-border-base focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all placeholder:text-outline-variant bg-surface"
                    placeholder="••••••••"
                  />
                  {form.password && (
                    <div className="mt-xs">
                      <div className="w-full bg-surface-container h-[4px] rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300 rounded-full"
                          style={{
                            width: strength.width,
                            backgroundColor: strength.color,
                          }}
                        />
                      </div>
                      <span
                        className="text-caption font-caption mt-[2px] block"
                        style={{ color: strength.textColor }}
                      >
                        Strength: {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-xs">
                  <label
                    className="text-body-sm font-body-sm font-bold text-on-surface-variant"
                    htmlFor="confirm-mobile"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirm-mobile"
                    type="password"
                    required
                    minLength={6}
                    value={form.confirm_password}
                    onChange={(e) => update("confirm_password", e.target.value)}
                    className="h-[42px] px-md rounded border border-border-base focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all placeholder:text-outline-variant bg-surface"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </section>

            <p className="text-caption font-caption text-on-surface-variant text-center px-md">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-tertiary font-bold hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-tertiary font-bold hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border-base px-[20px] py-lg shadow-[0_-4px_12px_rgba(15,23,42,0.05)]">
          <button
            type="submit"
            form="registerForm"
            disabled={loading}
            className="w-full h-[48px] bg-primary-container text-white font-body font-bold rounded-lg flex items-center justify-center gap-sm active:scale-[0.98] transition-transform disabled:opacity-40"
          >
            {loading ? (
              "Creating..."
            ) : (
              <>
                Create Organization & Sign In
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </>
  );
}
