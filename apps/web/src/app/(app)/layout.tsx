"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/session/provider";
import { DashboardProvider } from "@/lib/dashboard/provider";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Footer } from "@/components/footer";
import { Spinner } from "@/components/spinner";

const TITLES: Record<string, string> = {
  "/": "Overview",
  "/sources": "Sources",
  "/activity": "Activity",
  "/settings": "Settings",
};

// The authenticated console shell. It gates on session status (unauthenticated to
// /auth, un-onboarded to /onboarding) and only renders the dashboard for an
// active session, so the dashboard is never just reachable.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, session, signOut } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth");
    else if (status === "onboarding") router.replace("/onboarding");
  }, [status, router]);

  if (status !== "active" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-6 text-sec" />
      </div>
    );
  }

  const title = TITLES[pathname] ?? "Overview";

  return (
    <DashboardProvider>
      <Sidebar role={session.role} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-col lg:ml-[260px]">
        <Topbar
          title={title}
          session={session}
          onOpenMobile={() => setMobileOpen(true)}
          onSignOut={async () => {
            await signOut();
            router.replace("/auth");
          }}
        />
        <main className="flex-1 px-5 py-7 sm:px-6 sm:py-8">{children}</main>
        <Footer />
      </div>
    </DashboardProvider>
  );
}
