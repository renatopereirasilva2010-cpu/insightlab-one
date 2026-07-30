import Image from "next/image";
import fs from "node:fs";
import path from "node:path";

/**
 * Identidade do tenant no header da area operacional. Hoje "Mix Concept
 * Hair" e fixo (schema nao tem campo de marca por tenant ainda - ver
 * DECISAO pendente em governance/insightlab-one-onda6-...md e a memoria
 * whitelabel_brand_status do Claude Code). Se
 * public/brand/mix-concept-hair-logo.png existir, mostra o logo real;
 * caso contrario, mostra um selo tipografico nas cores extraidas do logo
 * (dourado/preto/creme) em vez de deixar o nome sem nenhum tratamento
 * visual - nunca redesenha ou reinventa o logo em si.
 */
export function TenantBadge({ name }: { name: string }) {
  const logoPath = path.join(process.cwd(), "public", "brand", "mix-concept-hair-logo.png");
  const hasRealLogo = fs.existsSync(logoPath);

  if (hasRealLogo) {
    return (
      <div className="flex items-center gap-2">
        <Image
          src="/brand/mix-concept-hair-logo.png"
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
