import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buildMediaUrl } from "@/lib/media";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase() || "?";
}

/**
 * Avatar generico pra profissional/cliente/produto - foto real (upload,
 * ver onda8) ou iniciais/inicial como fallback. Reaproveitado em
 * listas e em qualquer seletor onde reconhecer visualmente o registro certo
 * evita erro de selecao (ex.: cliente/produto errado no checkout).
 */
export function EntityAvatar({
  name,
  photoUrl,
  size = "sm",
}: {
  name: string;
  photoUrl: string | null | undefined;
  size?: "sm" | "md";
}) {
  const dimension = size === "md" ? "h-9 w-9" : "h-7 w-7";
  return (
    <Avatar className={dimension}>
      <AvatarImage src={buildMediaUrl(photoUrl) ?? undefined} alt={name} />
      <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
