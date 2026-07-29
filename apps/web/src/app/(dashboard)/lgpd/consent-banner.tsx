"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { OwnConsentStatus, LegalDocumentType } from "@/lib/api-types";
import { fetchOwnConsentStatus, acceptOwnConsent } from "./actions";

const LABELS: Record<LegalDocumentType, string> = {
  TERMS_OF_USE: "Termos de Uso",
  PRIVACY_POLICY: "Política de Privacidade",
};

export function ConsentBanner() {
  const [status, setStatus] = useState<OwnConsentStatus | null>(null);
  const [accepting, setAccepting] = useState<LegalDocumentType | null>(null);

  useEffect(() => {
    fetchOwnConsentStatus().then((result) => {
      if (result.ok) setStatus(result.data);
    });
  }, []);

  const pending: LegalDocumentType[] = [];
  if (status?.termsOfUse && !status.termsOfUse.accepted) pending.push("TERMS_OF_USE");
  if (status?.privacyPolicy && !status.privacyPolicy.accepted) pending.push("PRIVACY_POLICY");

  if (pending.length === 0) return null;

  async function handleAccept(type: LegalDocumentType) {
    setAccepting(type);
    const result = await acceptOwnConsent(type);
    setAccepting(null);
    if (result.ok) {
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              termsOfUse:
                type === "TERMS_OF_USE" && prev.termsOfUse
                  ? { ...prev.termsOfUse, accepted: true }
                  : prev.termsOfUse,
              privacyPolicy:
                type === "PRIVACY_POLICY" && prev.privacyPolicy
                  ? { ...prev.privacyPolicy, accepted: true }
                  : prev.privacyPolicy,
            }
          : prev,
      );
    }
  }

  return (
    <div className="bg-muted/60 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2 text-sm">
      <p>
        Antes de continuar, aceite{" "}
        {pending
          .map((type, i) => (
            <span key={type}>
              {i > 0 ? " e " : ""}
              <Link
                href={type === "PRIVACY_POLICY" ? "/privacidade" : "/termos-de-uso"}
                target="_blank"
                className="underline"
              >
                {LABELS[type]}
              </Link>
            </span>
          ))}
        {" "}do InsightLab One.
      </p>
      <div className="flex gap-2">
        {pending.map((type) => (
          <Button
            key={type}
            size="sm"
            disabled={accepting !== null}
            onClick={() => handleAccept(type)}
          >
            {accepting === type ? "Aceitando..." : `Aceitar ${LABELS[type]}`}
          </Button>
        ))}
      </div>
    </div>
  );
}
