"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { findHelpTopicForPath, GENERAL_HELP_TIP } from "@/lib/help-content";

export function HelpDrawer() {
  const pathname = usePathname();
  const topic = findHelpTopicForPath(pathname);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" title="Ajuda">
          <CircleHelp />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{topic ? topic.title : "Ajuda"}</SheetTitle>
          <SheetDescription>
            {topic ? `Dicas para ${topic.audience.toLowerCase()}.` : GENERAL_HELP_TIP}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4">
          {topic ? (
            <ul className="list-disc space-y-2 pl-4 text-sm">
              {topic.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">{GENERAL_HELP_TIP}</p>
          )}

          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/ajuda">Ver central de ajuda completa</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
