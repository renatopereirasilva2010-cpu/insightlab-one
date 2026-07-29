"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DISMISS_KEY = "insightlab.quickStartGuide.dismissed";

let listeners: Array<() => void> = [];

function setDismissedInStorage(value: boolean) {
  localStorage.setItem(DISMISS_KEY, value ? "1" : "0");
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return localStorage.getItem(DISMISS_KEY) === "1";
}

function getServerSnapshot() {
  return false;
}

export interface QuickStartStep {
  key: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
}

export function QuickStartGuide({ steps }: { steps: QuickStartStep[] }) {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const allDone = steps.every((s) => s.done);
  if (allDone || dismissed) return null;

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Guia de início rápido</CardTitle>
          <CardDescription>
            Configure o essencial pra operar o quanto antes. A ordem é só uma sugestão — pode
            seguir na sequência que preferir. {doneCount}/{steps.length} concluídos.
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissedInStorage(true)}
          title="Ocultar guia"
        >
          <X />
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {steps.map((step) => (
            <li key={step.key}>
              <Link
                href={step.href}
                className="hover:bg-muted/60 flex items-start gap-3 rounded-md p-2 -mx-2"
              >
                {step.done ? (
                  <CheckCircle2 className="text-primary mt-0.5 size-5 shrink-0" />
                ) : (
                  <Circle className="text-muted-foreground mt-0.5 size-5 shrink-0" />
                )}
                <div>
                  <p className={step.done ? "text-muted-foreground line-through" : "font-medium"}>
                    {step.label}
                  </p>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
