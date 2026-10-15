import { describe, expect, it } from "vitest";
import { clientLeadFormSchema } from "../client/src/lib/clientLeadSchema";
import { leadFormSchema } from "../client/src/lib/leadSchema";
import { normalizeBrazilianWhatsapp } from "../client/src/lib/normalizeWhatsapp";

const validLead = {
  name: "Ana Souza",
  company: "Empresa Exemplo",
  whatsapp: "(11) 99999-9999",
  email: "ana@example.com",
  revenueBand: "R$ 50 a 200 mil",
  message: "",
  consent: "true",
};

describe("WhatsApp brasileiro", () => {
  it("mantém o número nacional com DDD", () => {
    expect(normalizeBrazilianWhatsapp("(11) 99999-9999")).toBe("11999999999");
  });

  it("remove o prefixo internacional explícito +55", () => {
    expect(normalizeBrazilianWhatsapp("+55 (11) 99999-9999")).toBe("11999999999");
  });

  it("não remove um DDD 55 nacional sem sinal de país", () => {
    expect(normalizeBrazilianWhatsapp("(55) 99999-9999")).toBe("55999999999");
  });

  it("aceita o mesmo celular com +55 no cliente e no servidor", () => {
    const input = { ...validLead, whatsapp: "+55 (11) 99999-9999" };
    expect(clientLeadFormSchema.safeParse(input).success).toBe(true);
    const serverResult = leadFormSchema.safeParse(input);
    expect(serverResult.success).toBe(true);
    if (serverResult.success) expect(serverResult.data.whatsapp).toBe("11999999999");
  });

  it("rejeita um número curto no servidor", () => {
    expect(leadFormSchema.safeParse({ ...validLead, whatsapp: "12345" }).success).toBe(false);
  });
});
