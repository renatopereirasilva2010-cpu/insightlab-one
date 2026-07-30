"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildMediaUrl } from "@/lib/media";
import { displayName as resolveDisplayName } from "@/lib/format";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase() || "?";
}

export function UserMenu({
  name,
  socialName,
  email,
  photoUrl,
  roleNames,
}: {
  name: string;
  socialName: string | null;
  email: string;
  photoUrl: string | null;
  roleNames: string[];
}) {
  const router = useRouter();
  const shownName = resolveDisplayName({ name, socialName });

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-accent">
          <Avatar className="h-8 w-8">
            <AvatarImage src={buildMediaUrl(photoUrl) ?? undefined} alt={shownName} />
            <AvatarFallback className="text-xs">{initials(shownName)}</AvatarFallback>
          </Avatar>
          <div className="hidden text-xs leading-tight sm:block">
            <p className="font-medium">Seja bem-vindo, {shownName.split(" ")[0]}</p>
            <p className="text-muted-foreground">{roleNames.join(", ") || "—"}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="font-medium">{shownName}</p>
          <p className="text-muted-foreground text-xs font-normal">{email}</p>
          <p className="text-muted-foreground text-xs font-normal">{roleNames.join(", ") || "—"}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
