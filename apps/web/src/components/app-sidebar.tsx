"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  ClipboardList,
  Users,
  UserRound,
  Scissors,
  Package,
  Boxes,
  UserCog,
  ShoppingCart,
  Wallet,
  Banknote,
  Percent,
  FileText,
  Settings,
  Receipt,
  LayoutDashboard,
  MessageCircle,
  ShieldCheck,
  CircleHelp,
  BarChart3,
  History,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { InsightLabWatermark } from "@/components/decorative/insightlab-watermark";
import type { SessionUser } from "@/lib/session";

const navItems = [
  { href: "/painel", label: "Inteligência de Receita", icon: LayoutDashboard },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, permission: "reports.read" },
  { href: "/", label: "Agenda", icon: Calendar },
  { href: "/atendimentos", label: "Atendimentos", icon: ClipboardList },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart },
  { href: "/pagamentos", label: "Pagamentos", icon: Wallet },
  { href: "/caixa", label: "Caixa", icon: Banknote },
  { href: "/comissoes", label: "Comissões", icon: Percent },
  { href: "/fiscal", label: "Documentos Fiscais", icon: FileText },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
];

const cadastrosItems = [
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/profissionais", label: "Profissionais", icon: UserRound },
  { href: "/servicos", label: "Serviços", icon: Scissors },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/estoque", label: "Estoque", icon: Boxes },
  { href: "/configuracoes?tab=users", label: "Usuários", icon: UserCog, permission: "users.read" },
];

const configItems = [
  { href: "/configuracoes", label: "Configurações", icon: Settings },
  { href: "/auditoria", label: "Auditoria", icon: History, permission: "audit.read" },
  { href: "/lgpd", label: "LGPD", icon: ShieldCheck },
  { href: "/ajuda", label: "Ajuda", icon: CircleHelp },
];

export function AppSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  const operacaoItems = [
    ...navItems,
    ...(user.permissions.includes("commissions.read-own")
      ? [{ href: "/minhas-comissoes", label: "Minhas Comissões", icon: Receipt }]
      : []),
  ].filter((item) => !item.permission || user.permissions.includes(item.permission));

  const visibleCadastrosItems = cadastrosItems.filter(
    (item) => !item.permission || user.permissions.includes(item.permission),
  );

  const visibleConfigItems = configItems.filter(
    (item) => !item.permission || user.permissions.includes(item.permission),
  );

  return (
    <Sidebar collapsible="icon">
      <div className="relative flex h-full flex-col">
      <InsightLabWatermark />
      <SidebarHeader>
        <div className="flex items-center gap-2 overflow-hidden px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
          <div className="bg-white rounded-md p-1 shrink-0 group-data-[collapsible=icon]:hidden">
            <Image
              src="/brand/insightlab-logo-original.png"
              alt="InsightLab"
              width={96}
              height={64}
              className="h-6 w-auto"
              priority
              unoptimized
            />
          </div>
          <span className="truncate text-sm font-semibold whitespace-nowrap group-data-[collapsible=icon]:hidden">
            InsightLab One
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operacaoItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Cadastros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleCadastrosItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleConfigItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div
          className="mt-1 h-[3px] w-full shrink-0 group-data-[collapsible=icon]:hidden"
          style={{ background: "var(--insightlab-gradient-brand)" }}
          aria-hidden
        />
        <p className="px-2 py-1 text-[10px] tracking-wide text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
          Powered by InsightLab
        </p>
      </SidebarFooter>
      </div>
    </Sidebar>
  );
}
