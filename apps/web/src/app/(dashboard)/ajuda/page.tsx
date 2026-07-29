import { verifySession } from "@/lib/auth";
import { helpTopics } from "@/lib/help-content";

export default async function AjudaPage() {
  await verifySession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Central de Ajuda</h1>
        <p className="text-muted-foreground">
          Dicas rápidas por módulo — pra todos os perfis: recepção, profissionais, gerência e
          dono. Clique num tópico pra abrir.
        </p>
      </div>

      <div className="divide-y rounded-md border">
        {helpTopics.map((topic) => (
          <details key={topic.id} className="group p-4 open:bg-muted/30">
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
              <span>{topic.title}</span>
              <span className="text-muted-foreground text-xs font-normal group-open:hidden">
                {topic.audience}
              </span>
            </summary>
            <div className="mt-3 space-y-2">
              <p className="text-muted-foreground text-xs">Quem costuma usar: {topic.audience}</p>
              <ul className="list-disc space-y-1.5 pl-4 text-sm">
                {topic.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
