import { SiteNav } from "@/components/site-nav";
import { DashboardClient } from "./dashboard-client";

// Home is the institution dashboard. Server component shell wraps the client
// dashboard so the nav and metadata stay server-rendered.
export default function Page() {
  return (
    <main>
      <SiteNav />
      <DashboardClient />
    </main>
  );
}
