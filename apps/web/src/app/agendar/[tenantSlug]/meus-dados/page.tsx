import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataSubjectRequestForm } from "./data-subject-request-form";
import type { PublicBusiness } from "../types";

export default async function DataSubjectRequestPage({
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

  return (
    <div className="flex min-h-svh justify-center bg-muted/40 p-4 py-10">
      <div className="w-full max-w-lg space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Meus dados — {business.name}</CardTitle>
            <CardDescription>
              Solicite acesso, correção, portabilidade, exclusão dos seus dados ou revogue seu
              consentimento, conforme a Lei Geral de Proteção de Dados (LGPD).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataSubjectRequestForm tenantSlug={tenantSlug} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
