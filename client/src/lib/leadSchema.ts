import { z } from "zod";
import { normalizeBrazilianWhatsapp } from "./normalizeWhatsapp";

export const leadFormSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(160, "O nome excede o limite de 160 caracteres."),
  company: z.string().trim().min(2, "Informe o nome da empresa.").max(180, "O nome da empresa excede o limite permitido."),
  whatsapp: z.string().trim().transform(normalizeBrazilianWhatsapp).pipe(z.string().min(10, "Informe um WhatsApp brasileiro válido.").max(11, "Informe um WhatsApp brasileiro válido.")),
  email: z.string().trim().email("Informe um e-mail válido.").max(320, "O e-mail excede o limite permitido.").transform(value => value.toLowerCase()),
  revenueBand: z.enum(["Até R$ 50 mil", "R$ 50 a 200 mil", "R$ 200 a 500 mil", "Acima de R$ 500 mil"], { error: "Selecione uma faixa de faturamento." }),
  message: z.string().trim().max(5000, "A mensagem excede o limite de 5.000 caracteres.").optional().default(""),
  consent: z.union([z.literal("true"), z.literal("on")], { error: "É necessário concordar com a Política de Privacidade." }),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
