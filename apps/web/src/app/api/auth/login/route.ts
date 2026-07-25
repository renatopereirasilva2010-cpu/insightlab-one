import { NextResponse } from "next/server";
import { createSession } from "@/lib/session";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { code: "INVALID_PAYLOAD", message: "E-mail e senha são obrigatórios." },
      { status: 400 },
    );
  }

  const apiRes = await fetch(`${API_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
    cache: "no-store",
  });

  const data = await apiRes.json().catch(() => ({}));

  if (!apiRes.ok) {
    return NextResponse.json(
      {
        code: data.code ?? "AUTH_ERROR",
        message: data.message ?? "Não foi possível entrar.",
      },
      { status: apiRes.status },
    );
  }

  await createSession(data);

  return NextResponse.json({ user: data.user });
}
