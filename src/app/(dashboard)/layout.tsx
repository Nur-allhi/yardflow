import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import QueryProvider from "@/components/QueryProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <QueryProvider>
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar />

      {/* Main Wrapper */}
      <div className="md:ml-[240px] flex flex-col min-h-screen">
        {/* TopNavBar */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b border-outline-variant flex items-center justify-between pl-14 md:pl-6 pr-4 md:pr-6">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-bold text-primary-container">
              YardFlow ERP
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative text-secondary hover:text-primary-container transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full border-2 border-white" />
            </button>
            <button className="text-secondary hover:text-primary-container transition-colors">
              <span className="material-symbols-outlined">help</span>
            </button>
            <button className="text-secondary hover:text-primary-container transition-colors">
              <span className="material-symbols-outlined">apps</span>
            </button>
            <div className="h-8 w-[1px] border-outline-variant/50" />
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-xs font-bold text-primary-container">
                {session.user_id.slice(0, 2).toUpperCase()}
              </div>
              <span className="hidden sm:block">{session.role}</span>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 w-full md:hidden z-50 bg-white border-t border-outline-variant shadow-lg flex justify-around items-center h-16 px-2">
          <Link href="/" className="flex flex-col items-center justify-center text-tertiary px-3 py-1 rounded-xl">
            <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>home</span>
            <span className="font-label text-[10px] font-bold">Home</span>
          </Link>
          <Link href="/inventory" className="flex flex-col items-center justify-center text-secondary hover:bg-surface-container-low px-3 py-1 rounded-xl transition-all">
            <span className="material-symbols-outlined text-2xl">inventory_2</span>
            <span className="font-label text-[10px] font-medium">Stock</span>
          </Link>
          <Link href="/sales" className="flex flex-col items-center justify-center text-secondary hover:bg-surface-container-low px-3 py-1 rounded-xl transition-all">
            <span className="material-symbols-outlined text-2xl">payments</span>
            <span className="font-label text-[10px] font-medium">Sales</span>
          </Link>
          <Link href="/hr" className="flex flex-col items-center justify-center text-secondary hover:bg-surface-container-low px-3 py-1 rounded-xl transition-all">
            <span className="material-symbols-outlined text-2xl">groups</span>
            <span className="font-label text-[10px] font-medium">HR</span>
          </Link>
          <Link href="/purchases" className="flex flex-col items-center justify-center text-secondary hover:bg-surface-container-low px-3 py-1 rounded-xl transition-all">
            <span className="material-symbols-outlined text-2xl">shopping_cart</span>
            <span className="font-label text-[10px] font-medium">Buy</span>
          </Link>
        </nav>
      </div>
    </div>
    </QueryProvider>
  );
}
