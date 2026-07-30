import Image from "next/image";
import { buildMediaUrl } from "@/lib/media";

/**
 * Identidade do tenant no header da area operacional - regra geral pra
 * qualquer tenant (onda8, resolve a pendencia que estava registrada no
 * CLAUDE.md): se o tenant tiver logoUrl (upload feito pelo Admin em
 * Configuracoes), mostra o logo real; caso contrario, selo tipografico nas
 * cores da marca do tenant. Nunca redesenha/reinventa um logo que nao existe.
 */
export function TenantBadge({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const resolvedLogoUrl = buildMediaUrl(logoUrl);

  if (resolvedLogoUrl) {
    return (
      <div className="flex items-center gap-2">
        <Image
          src={resolvedLogoUrl}
          alt={name}
          width={32}
          height={32}
          className="h-8 w-8 rounded-sm object-cover"
          unoptimized
        />
        <span className="text-base font-semibold" style={{ color: "var(--mix-black)" }}>
          {name}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-sm text-xs font-bold text-white"
        style={{ background: "linear-gradient(135deg, var(--mix-gold-bright), var(--mix-gold))" }}
      >
        {name.charAt(0)}
      </div>
      <span className="text-base font-semibold tracking-wide" style={{ color: "var(--mix-black)" }}>
        {name}
      </span>
    </div>
  );
}
