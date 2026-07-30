import { verifySession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { HelpDrawer } from "@/components/help-drawer";
import { TenantBadge } from "@/components/tenant-badge";
import { UserMenu } from "@/components/user-menu";
import type { SessionProfile } from "@/lib/api-types";
import { ConsentBanner } from "./lgpd/consent-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifySession();
  const profile = await apiFetch<SessionProfile>("/v1/auth/me");

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
          <TenantBadge name={profile.tenant.name} logoUrl={profile.tenant.logoUrl} />
          <div className="ml-auto flex items-center gap-3">
            <HelpDrawer />
            <Separator orientation="vertical" className="h-6" />
            <UserMenu
              name={profile.name}
              socialName={profile.socialName}
              email={profile.email}
              photoUrl={profile.photoUrl}
              roleNames={profile.roles.map((r) => r.name)}
            />
          </div>
        </header>
        <ConsentBanner />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
