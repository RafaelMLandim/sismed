import { TODAY_ISO, addDays } from "./days"
import type { EvolutionKind, IEvolution } from "./types"

/** Profissionais que evoluem, por tipo (com registro no conselho). */
export const PROFESSIONALS: Record<
  EvolutionKind,
  { name: string; council: string }[]
> = {
  Médica: [
    { name: "Dr. Paulo Mendes", council: "CRM-DF 12345" },
    { name: "Dra. Renata Alves", council: "CRM-DF 18220" },
    { name: "Dr. Igor Lima", council: "CRM-DF 20417" },
    { name: "Dr. Fábio Mendes", council: "CRM-DF 15532" },
    { name: "Dra. Camila Nogueira", council: "CRM-DF 21904" },
    { name: "Dr. Rafael Duarte", council: "CRM-DF 11873" },
  ],
  Enfermagem: [
    { name: "Ana Lima", council: "COREN-DF 284512" },
    { name: "Ana Ribeiro", council: "COREN-DF 301877" },
    { name: "Carla Souza", council: "COREN-DF 296340" },
    { name: "Júlia Reis", council: "COREN-DF 310228" },
    { name: "Paula Mendes", council: "COREN-DF 277915" },
  ],
  Anestesia: [
    { name: "Dra. Lúcia Ferraz", council: "CRM-DF 16781" },
    { name: "Dr. Marcos Teixeira", council: "CRM-DF 14096" },
  ],
  Nutrição: [{ name: "Carla Nogueira", council: "CRN-1 7741" }],
  Fisioterapia: [{ name: "Bruno Tavares", council: "CREFITO-11 88213" }],
  Psicologia: [{ name: "Marina Costa", council: "CRP-01 22190" }],
  "Serviço social": [{ name: "Sônia Prado", council: "CRESS-8 6620" }],
}

export const EVOLUTION_KINDS = Object.keys(PROFESSIONALS) as EvolutionKind[]

export const councilOf = (kind: EvolutionKind, name: string) =>
  PROFESSIONALS[kind].find((p) => p.name === name)?.council

const YESTERDAY = addDays(TODAY_ISO, -1)
const TWO_DAYS_AGO = addDays(TODAY_ISO, -2)

let n = 0
const ev = (
  patientId: string,
  date: string,
  time: string,
  kind: EvolutionKind,
  author: string,
  soap: Pick<IEvolution, "s" | "o" | "a" | "p">,
  status: IEvolution["status"] = "assinada",
): IEvolution => ({
  id: `e-${patientId}-${n++}`,
  patientId,
  date,
  time,
  kind,
  author,
  council: councilOf(kind, author),
  ...soap,
  status,
  signedAt: status === "assinada" ? time : undefined,
})

/**
 * Evoluções do mock. As da Maria seguem o desenho PEP-15, com horários
 * trazidos para antes das 08:40 (relógio do mock).
 */
export const EVOLUTIONS: IEvolution[] = [
  // ── Maria (pré-operatório de colecistectomia) ──
  ev("maria", TODAY_ISO, "06:05", "Enfermagem", "Ana Ribeiro", {
    o: "Admitida na unidade, leito 204-A, deambulando e acompanhada pela filha. Pulseira de identificação e de alergia conferidas. Orientada sobre jejum e rotina pré-operatória.",
  }),
  ev("maria", TODAY_ISO, "07:30", "Anestesia", "Dra. Lúcia Ferraz", {
    a: "Avaliação pré-anestésica concluída. ASA II, via aérea sem previsão de dificuldade.",
    p: "Anestesia geral balanceada. Termo de consentimento assinado.",
  }),
  ev("maria", TODAY_ISO, "07:55", "Médica", "Dr. Paulo Mendes", {
    s: "Sem queixas álgicas abdominais.",
    o: "Reavaliada no leito. PA elevada e febrícula na última aferição.",
    a: "Colelitíase sintomática, pré-operatório de colecistectomia. Mantida indicação cirúrgica.",
    p: "Paracetamol 750 mg se febre — alergia a dipirona registrada. Reavaliar sinais vitais antes de enviar ao centro cirúrgico.",
  }),
  ev(
    "maria",
    TODAY_ISO,
    "08:10",
    "Nutrição",
    "Carla Nogueira",
    {
      p: "Dieta suspensa para procedimento cirúrgico. Jejum de sólidos desde 06:00; líquidos claros liberados até 08:00. Reiniciar dieta líquida após alta da SRPA, conforme tolerância.",
    },
    "rascunho",
  ),
  ev("maria", TODAY_ISO, "08:36", "Enfermagem", "Ana Ribeiro", {
    o: "Paciente em jejum desde 06:00, acordada e orientada. PA 164/96 mmHg e Tax 37,9 °C às 08:30 — comunicado ao Dr. Paulo Mendes. Acesso venoso periférico em MSE pérvio, sem sinais flogísticos.",
    p: "Aguardando transporte para o centro cirúrgico às 13:30.",
  }),

  // ── José (fratura de colo de fêmur) ──
  ev("jose", YESTERDAY, "19:10", "Médica", "Dra. Renata Alves", {
    s: "Queda da própria altura em casa, dor intensa em quadril esquerdo, sem conseguir apoiar.",
    o: "Encurtamento e rotação externa do MIE. RX: fratura de colo de fêmur E (Garden IV).",
    a: "Fratura de colo de fêmur esquerdo. Diabético, alérgico a penicilina.",
    p: "Internação, analgesia, jejum a partir de 00:00. Artroplastia parcial amanhã às 07:30.",
  }),
  ev("jose", YESTERDAY, "22:30", "Enfermagem", "Paula Mendes", {
    o: "Admitido no leito 310. Dor 4/10 após analgesia. Glicemia 168 mg/dL. Orientado sobre o jejum.",
  }),
  ev("jose", TODAY_ISO, "06:15", "Enfermagem", "Ana Lima", {
    o: "Em jejum, dor 3/10. Glicemia capilar 142 mg/dL. Tricotomia e pulseiras conferidas.",
    p: "Encaminhar ao centro cirúrgico às 07:15.",
  }),

  // ── Antônio (pneumonia) ──
  ev("antonio", TWO_DAYS_AGO, "14:30", "Médica", "Dr. Igor Lima", {
    s: "Tosse produtiva e febre há 4 dias, dispneia aos esforços.",
    o: "Tax 38,9 °C, FR 26, SpO₂ 91% em ar ambiente. Estertores em base direita.",
    a: "Pneumonia comunitária, CURB-65 = 2.",
    p: "Internação, ceftriaxona + azitromicina, O₂ por cateter 2 L/min.",
  }),
  ev("antonio", YESTERDAY, "09:00", "Fisioterapia", "Bruno Tavares", {
    o: "Ausculta com roncos difusos. Expectoração amarelada em moderada quantidade.",
    p: "Fisioterapia respiratória 2x ao dia. Estimular deambulação.",
  }),
  ev("antonio", TODAY_ISO, "07:40", "Médica", "Dr. Igor Lima", {
    s: "Melhora da dispneia, sem febre desde ontem à tarde.",
    o: "Afebril, SpO₂ 95% em ar ambiente.",
    a: "Pneumonia em melhora clínica, 3º dia de antibiótico.",
    p: "Manter antibiótico. Suspender O₂. Avaliar alta em 48 h.",
  }),
]

/**
 * Nome do tipo nos filtros e no campo "Tipo". "Médica" é o tipo de registro
 * (evolução médica), então aparece por extenso para não parecer a pessoa.
 */
export const kindLabel = (kind: EvolutionKind) =>
  kind === "Médica" ? "Evolução médica" : kind

/**
 * Etiqueta do cartão, ao lado do nome: a profissão da pessoa. Médico ou médica
 * pelo título (Dr./Dra.); anestesista; os demais tipos ficam como estão.
 */
export const roleLabel = (kind: EvolutionKind, author: string) => {
  if (kind === "Médica") return author.startsWith("Dra.") ? "Médica" : "Médico"
  if (kind === "Anestesia") return "Anestesista"
  return kind
}
