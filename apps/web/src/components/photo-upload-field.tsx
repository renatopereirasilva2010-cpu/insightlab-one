"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { buildMediaUrl } from "@/lib/media";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase() || "?";
}

/**
 * Campo de foto reutilizavel pra formularios de edicao (profissional,
 * cliente, produto) - so aparece editando um registro que ja existe (precisa
 * de :id pro endpoint de upload). Envio e imediato ao escolher o arquivo,
 * separado do submit JSON do formulario principal.
 */
export function PhotoUploadField({
  name,
  currentPhotoUrl,
  uploadAction,
}: {
  name: string;
  currentPhotoUrl: string | null;
  uploadAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(buildMediaUrl(currentPhotoUrl));
  const [pending, setPending] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("photo", file);

    setPending(true);
    const result = await uploadAction(formData);
    setPending(false);

    if (!result.ok) {
      toast.error(result.message ?? "Erro ao enviar foto.");
      return;
    }
    toast.success("Foto atualizada.");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-14 w-14">
        <AvatarImage src={preview ?? undefined} alt={name} />
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        <Camera />
        {pending ? "Enviando..." : "Trocar foto"}
      </Button>
    </div>
  );
}
