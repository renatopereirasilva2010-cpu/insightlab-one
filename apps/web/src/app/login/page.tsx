import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InsightLabWatermark } from "@/components/decorative/insightlab-watermark";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex"
        style={{ background: "var(--insightlab-gradient-brand)" }}
      >
        <InsightLabWatermark />
        <div className="relative z-10 flex items-center gap-3">
          <div className="shrink-0 rounded-md bg-white p-1.5">
            <Image
              src="/brand/insightlab-logo-original.png"
              alt="InsightLab"
              width={96}
              height={64}
              className="h-8 w-auto"
              priority
              unoptimized
            />
          </div>
          <span className="text-lg font-semibold">InsightLab One</span>
        </div>
        <div className="relative z-10 space-y-3">
          <h2 className="text-3xl leading-tight font-semibold text-balance">
            Revenue Recovery Intelligence pro seu salão ou clínica.
          </h2>
          <p className="max-w-md text-sm text-white/80">
            Agenda, atendimento, venda e comissão num só lugar — com inteligência de dados
            mostrando o que está acontecendo, por que importa e qual ação recomendada.
          </p>
        </div>
        <p className="relative z-10 text-xs text-white/60">
          © {new Date().getFullYear()} InsightLab. Todos os direitos reservados.
        </p>
      </div>

      <div className="flex items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-xl">InsightLab One</CardTitle>
            <CardDescription>
              Entre com sua conta para acessar o painel administrativo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
