"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Professional, UserListItem } from "@/lib/api-types";
import { linkProfessionalAccount } from "./actions";

export function LinkAccountForm({
  professional,
  users,
  onSuccess,
}: {
  professional: Professional;
  users: UserListItem[];
  onSuccess: () => void;
}) {
  const router = useRouter();
  const currentlyLinked = users.find((u) => u.professionalId === professional.id);
  const [userId, setUserId] = useState(currentlyLinked?.id ?? "");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableUsers = users.filter(
    (u) => !u.professionalId || u.id === currentlyLinked?.id,
  );

  async function handleSubmit() {
    if (!userId) return;
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await linkProfessionalAccount(userId, professional.id);
      if (!result.ok) {
        setServerError(result.message);
        return;
      }
      toast.success("Conta vinculada.");
      router.refresh();
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Vincule uma conta de acesso a este profissional para que ele veja o próprio
        extrato de comissão em &ldquo;Minhas Comissões&rdquo;.
      </p>

      <div className="space-y-2">
        <Label>Conta de acesso</Label>
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione uma conta" />
          </SelectTrigger>
          <SelectContent>
            {availableUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name} ({u.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {availableUsers.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Nenhuma conta de acesso disponível para vincular.
          </p>
        )}
      </div>

      {serverError && (
        <p className="text-destructive text-sm" role="alert">
          {serverError}
        </p>
      )}

      <Button
        type="button"
        className="w-full"
        disabled={isSubmitting || !userId}
        onClick={handleSubmit}
      >
        {isSubmitting ? "Salvando..." : "Vincular conta"}
      </Button>
    </div>
  );
}
