"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadTenantLogo } from "./tenant-logo-actions";

export function TenantLogoForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    setPending(true);
    const result = await uploadTenantLogo(tenantId, formData);
    setPending(false);
    if (inputRef.current) inputRef.current.value = "";

    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Logo do tenant atualizado.");
    router.refresh();
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        <ImageUp />
        {pending ? "Enviando..." : "Enviar logo do tenant"}
      </Button>
    </div>
  );
}
