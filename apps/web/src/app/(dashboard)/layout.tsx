import { verifySession } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { HelpDrawer } from "@/components/help-drawer";
import { TenantBadge } from "@/components/tenant-badge";
import { ConsentBanner } from "./lgpd/consent-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifySession();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header
          className="flex h-16 shrink-0 items-center gap-3 border-b px-4"
          style={{ borderColor: "var(--mix-gold)" }}
        >
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <TenantBadge name="Mix Concept Hair" />
          <div className="ml-auto">
            <HelpDrawer />
          </div>
        </header>
        <ConsentBanner />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
