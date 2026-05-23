import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import QueryProvider from "@/components/QueryProvider";
import CommandPalette from "@/components/CommandPalette";
import PageTransitionWrapper from "@/components/PageTransitionWrapper";
import LiveClock from "@/components/LiveClock";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, session.org_id))
    .then((rows) => rows[0]);

  return (
    <QueryProvider>
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar role={session.role} />

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar />

      {/* Main Wrapper */}
      <div className="md:ml-[240px] flex flex-col min-h-screen">
        {/* TopNavBar */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b border-outline-variant flex items-center justify-between pl-14 md:pl-6 pr-4 md:pr-6">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-bold text-primary-container">
              {org?.name || "YardFlow ERP"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <LiveClock />
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 pb-20 md:pb-0">
          <PageTransitionWrapper>{children}</PageTransitionWrapper>
        </main>

        {/* Mobile Bottom Nav */}
        <MobileBottomNav />
      </div>
      <CommandPalette />
    </div>
    </QueryProvider>
  );
}
