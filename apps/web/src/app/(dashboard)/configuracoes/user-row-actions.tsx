"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { UserListItem } from "@/lib/api-types";
import { blockUser } from "./user-actions";
import { EditUserButton } from "./edit-user-button";

export function UserRowActions({ user }: { user: UserListItem }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleBlock() {
    setPending(true);
    const result = await blockUser(user.id);
    setPending(false);
    if (!result.ok) {
      toast.error(result.message ?? "Erro ao bloquear usuário.");
      return;
    }
    toast.success("Usuário bloqueado.");
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-1">
      <EditUserButton user={user} />
      {user.status !== "BLOCKED" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={pending} title="Bloquear">
              <Ban />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bloquear {user.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                {user.email} deixa de conseguir logar imediatamente. Você pode reverter depois
                editando o status do usuário.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction onClick={handleBlock}>Bloquear</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
