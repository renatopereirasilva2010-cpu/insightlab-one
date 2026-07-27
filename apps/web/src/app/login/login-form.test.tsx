import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function mockJson(status: number, body: unknown) {
  vi.mocked(fetch).mockResolvedValue({
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response);
}

describe("LoginForm", () => {
  it("blocks submit and shows validation errors when fields are empty", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText("Informe o e-mail.")).toBeInTheDocument();
    expect(screen.getByText("Informe a senha.")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("surfaces the API error message on invalid credentials", async () => {
    const user = userEvent.setup();
    mockJson(401, {
      code: "AUTH_INVALID_CREDENTIALS",
      message: "E-mail ou senha inválidos.",
    });
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/e-mail/i), "admin@mix-demo.local");
    await user.type(screen.getByLabelText(/senha/i), "wrong");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-mail ou senha inválidos.",
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("redirects to the dashboard on success", async () => {
    const user = userEvent.setup();
    mockJson(200, { user: { id: "user-1" } });
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/e-mail/i), "admin@mix-demo.local");
    await user.type(screen.getByLabelText(/senha/i), "Admin@12345");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(refresh).toHaveBeenCalled();
  });

  it("shows a connection error when the request throws", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/e-mail/i), "admin@mix-demo.local");
    await user.type(screen.getByLabelText(/senha/i), "Admin@12345");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Erro de conexão. Tente novamente.",
    );
  });
});
