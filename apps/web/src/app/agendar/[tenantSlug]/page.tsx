import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TenantBadge } from "@/components/tenant-badge";
import { BookingForm } from "./booking-form";
import type { PublicBusiness, PublicService, PublicProfessional } from "./types";

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;

  let business: PublicBusiness;
  try {
    business = await apiFetch<PublicBusiness>(`/v1/public/${tenantSlug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const [services, professionals] = await Promise.all([
    apiFetch<PublicService[]>(`/v1/public/${tenantSlug}/services`),
    apiFetch<PublicProfessional[]>(`/v1/public/${tenantSlug}/professionals`),
  ]);

  return (
    <div className="flex min-h-svh justify-center bg-muted/40 p-4 py-10">
      <div className="w-full max-w-lg space-y-4">
        <TenantBadge name={business.name} logoUrl={business.logoUrl} />
        <Card style={{ borderTop: "3px solid var(--mix-gold)" }}>
          <CardHeader>
            <CardTitle className="text-xl">{business.name}</CardTitle>
            <CardDescription>Agende seu horário online.</CardDescription>
          </CardHeader>
          <CardContent>
            <BookingForm
              tenantSlug={tenantSlug}
              services={services}
              professionals={professionals}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
