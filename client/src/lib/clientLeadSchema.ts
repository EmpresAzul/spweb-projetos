import * as z from "zod/mini";

export const clientLeadFormSchema = z.object({
  name: z.string().check(z.trim(), z.minLength(2, "Informe seu nome."), z.maxLength(160, "O nome excede o limite de 160 caracteres.")),
  company: z.string().check(z.trim(), z.minLength(2, "Informe o nome da empresa."), z.maxLength(180, "O nome da empresa excede o limite permitido.")),
  whatsapp: z.string().check(z.regex(/^(?:\+55\s*)?\(?\d{2}\)?\s*\d{4,5}-?\d{4}$/, "Informe um WhatsApp brasileiro válido.")),
  email: z.email("Informe um e-mail válido.").check(z.maxLength(320, "O e-mail excede o limite permitido.")),
  city: z.string().check(z.trim(), z.minLength(2, "Informe sua cidade e UF."), z.maxLength(100, "Cidade e UF excedem o limite permitido.")),
  revenueBand: z.enum(["Até R$ 50 mil", "R$ 50 a 200 mil", "R$ 200 a 500 mil", "Acima de R$ 500 mil"], { error: "Selecione uma faixa de faturamento." }),
  businessModel: z.string().check(z.trim(), z.minLength(2, "Descreva seu modelo de negócios."), z.maxLength(300, "Descrição excede o limite permitido.")),
  investmentCapability: z.enum(["Sim", "Não"], { error: "Selecione se sua empresa tem condições de investimento." }),
  message: z.string().check(z.maxLength(5000, "A mensagem excede o limite de 5.000 caracteres.")),
  consent: z.literal("true", { error: "É necessário concordar com a Política de Privacidade." }),
});
