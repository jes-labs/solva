import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/lib/layout.shared";

// The blog reuses the home chrome rather than the docs sidebar.
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout {...baseOptions()}>
      <div className="mx-auto w-full max-w-3xl px-6 py-12">{children}</div>
    </HomeLayout>
  );
}
