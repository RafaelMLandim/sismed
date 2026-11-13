import { TODAY_ISO, addDays, daysBetween } from "../../_data/days"
import { PROFESSIONALS } from "../../_data/evolutions"
import { MOCK_NOW } from "../../_data/fixtures"
import type { IPatient, ISurgery, IVitalSign } from "../../_data/types"

/** Conteúdo do D10 · Avaliação pré-anestésica. */
export interface IPreAnesthesia {
  date: string
  time: string
  place: string
  anesthetist: string
  comorbidities: string[]
  meds: string
  prevComplications?: boolean
  prevComplicationsText: string
  malignantHyperthermia?: boolean
  glp1?: boolean
  glp1LastDose: string
  anticoag: string
  anticoagSuspendedOn: string
  weight: string
  height: string
  pa: string
  hr: string
  spo2: string
  mallampati?: Roman4
  mouth: string
  thyromental: string
  cervical: string
  teeth: string
  auscultation: string
  hb: string
  platelets: string
  inr: string
  creatinine: string
  glucose: string
  ecg: string
  asa?: Roman5
  plan: string
  position: string
  care: string[]
  fasting: string
  suspend: string
  verdict?: Verdict
  reservations: string
  consent?: boolean
  signer: string
}

export const ROMAN4 = ["I", "II", "III", "IV"] as const
export const ROMAN5 = ["I", "II", "III", "IV", "V"] as const
export type Roman4 = (typeof ROMAN4)[number]
export type Roman5 = (typeof ROMAN5)[number]
export const VERDICTS = ["Apto", "Apto com ressalvas", "Inapto"] as const
export type Verdict = (typeof VERDICTS)[number]

export const ANESTHETISTS = PROFESSIONALS.Anestesia
export const anesthetistLabel = (name: string) =>
  `${name} · ${ANESTHETISTS.find((a) => a.name === name)?.council ?? ""}`

// Opções do frame "Dropdowns · Centro cirúrgico e anestesia".
export const PLACES = [
  "Consultório de anestesia",
  "Leito de internação",
  "Sala de indução",
  "Teleconsulta",
]
export const COMORBIDITIES = [
  "Hipertensão",
  "Diabetes",
  "Cardiopatia",
  "Asma ou DPOC",
  "Apneia do sono",
  "Doença renal",
  "Obesidade",
  "Nega",
]
export const NEGA = "Nega"
export const ANTICOAG = ["Não", "Sim, suspenso", "Sim, em uso"]
export const ANTICOAG_SUSPENDED = ANTICOAG[1]
export const MOUTH = ["Maior que 3 cm", "Menor que 3 cm"]
export const THYROMENTAL = ["Maior que 6 cm", "Menor que 6 cm"]
export const CERVICAL = ["Preservada", "Reduzida", "Ausente"]
export const TEETH = [
  "Completa",
  "Prótese parcial superior",
  "Prótese parcial inferior",
  "Prótese total",
  "Dentes amolecidos",
  "Edêntulo",
]
export const PLANS = [
  "Geral balanceada com intubação orotraqueal",
  "Geral venosa total",
  "Raquianestesia",
  "Raqui + sedação",
  "Peridural",
  "Bloqueio periférico + sedação",
  /** Não está no desenho: os exames endoscópicos do mock são sob sedação. */
  "Sedação",
]
export const POSITIONS = [
  "Decúbito dorsal",
  "Litotomia",
  "Prona",
  "Lateral",
  "Cadeira de praia",
  "Trendelenburg",
]
export const CARE = [
  "Sequência rápida (GLP-1)",
  "Ambiente livre de látex",
  "Videolaringoscópio disponível",
  "Reserva de vaga em UTI",
  "Profilaxia de náuseas e vômitos",
  "Meias de compressão",
]
export const CARE_GLP1 = CARE[0]
export const CARE_LATEX = CARE[1]

/** Modelos de "Meus modelos" (PEP-07) para a avaliação. */
export const PRE_ANESTHESIA_MODELS: {
  name: string
  patch: Partial<IPreAnesthesia>
}[] = [
  {
    name: "Paciente hígido (ASA I)",
    patch: {
      comorbidities: [NEGA],
      meds: "Nega uso de medicamentos",
      prevComplications: false,
      malignantHyperthermia: false,
      glp1: false,
      anticoag: "Não",
      mallampati: "I",
      asa: "I",
      care: [CARE[4]],
      fasting: "Sólidos 8 h · líquidos claros 2 h",
      verdict: "Apto",
    },
  },
  {
    name: "Hipertenso controlado (ASA II)",
    patch: {
      comorbidities: ["Hipertensão"],
      prevComplications: false,
      malignantHyperthermia: false,
      anticoag: "Não",
      asa: "II",
      care: [CARE[4]],
      fasting: "Sólidos 8 h · líquidos claros 2 h",
      suspend: "Manter anti-hipertensivo com gole de água na manhã da cirurgia",
      verdict: "Apto",
    },
  },
  {
    name: "Obeso · via aérea a avaliar",
    patch: {
      comorbidities: ["Obesidade", "Apneia do sono"],
      prevComplications: false,
      malignantHyperthermia: false,
      mallampati: "III",
      asa: "III",
      care: [CARE[2], CARE[4], CARE[5]],
      fasting: "Sólidos 8 h · líquidos claros 2 h",
      verdict: "Apto com ressalvas",
      reservations:
        "Via aérea potencialmente difícil. Videolaringoscópio na sala e pré-oxigenação em proclive.",
    },
  },
]

const planOf = (s: ISurgery) => {
  const a = s.anesthesia?.split(" · ")[0].toLowerCase() ?? ""
  if (a.startsWith("raqui")) return "Raquianestesia"
  if (a.startsWith("sedação")) return "Sedação"
  if (a.startsWith("bloqueio")) return "Bloqueio periférico + sedação"
  if (a.startsWith("peridural")) return "Peridural"
  return PLANS[0]
}

/** Avaliação em branco, com o que o sistema já sabe do paciente. */
export const blankPreAnesthesia = (
  s: ISurgery,
  p: IPatient,
  lastVital?: IVitalSign,
): IPreAnesthesia => ({
  date: TODAY_ISO,
  time: MOCK_NOW,
  place: PLACES[0],
  anesthetist: s.anesthetist ?? ANESTHETISTS[0].name,
  comorbidities: [],
  meds: "",
  prevComplicationsText: "",
  glp1LastDose: "",
  anticoag: "Não",
  anticoagSuspendedOn: "",
  weight: "",
  height: "",
  pa: lastVital ? `${lastVital.sys} × ${lastVital.dia}` : "",
  hr: lastVital ? String(lastVital.hr) : "",
  spo2: lastVital ? String(lastVital.spo2) : "",
  mouth: MOUTH[0],
  thyromental: THYROMENTAL[0],
  cervical: CERVICAL[0],
  teeth: TEETH[0],
  auscultation: "",
  hb: "",
  platelets: "",
  inr: "",
  creatinine: "",
  glucose: "",
  ecg: "",
  plan: planOf(s),
  position: POSITIONS[0],
  care: p.allergies.some((a) => /l[áa]tex/i.test(a)) ? [CARE_LATEX] : [],
  fasting: "",
  suspend: "",
  reservations: "",
  signer: s.anesthetist ?? ANESTHETISTS[0].name,
})

/**
 * Avaliação já preenchida, para os documentos que o mock começa em rascunho
 * ou assinados (sem conteúdo salvo). Segue o exemplo do desenho.
 */
export const samplePreAnesthesia = (
  s: ISurgery,
  p: IPatient,
  lastVital?: IVitalSign,
): IPreAnesthesia => ({
  ...blankPreAnesthesia(s, p, lastVital),
  date: s.date && s.date < TODAY_ISO ? s.date : TODAY_ISO,
  time: "07:00",
  comorbidities: ["Hipertensão"],
  meds: "Losartana 50 mg/dia",
  prevComplications: false,
  malignantHyperthermia: false,
  glp1: false,
  weight: "78",
  height: "168",
  pa: lastVital ? `${lastVital.sys} × ${lastVital.dia}` : "132 × 84",
  hr: lastVital ? String(lastVital.hr) : "76",
  spo2: lastVital ? String(lastVital.spo2) : "97",
  mallampati: "II",
  auscultation:
    "Bulhas rítmicas normofonéticas, murmúrio vesicular presente sem ruídos adventícios.",
  hb: "13,4",
  platelets: "231 mil",
  inr: "1,0",
  creatinine: "0,9",
  glucose: "98",
  ecg: `Ritmo sinusal, sem alterações agudas (${addDays(TODAY_ISO, -7).split("-").reverse().join("/")})`,
  asa: (s.anesthesia?.match(/ASA (I{1,3}V?|IV|V)/)?.[1] as Roman5) ?? "II",
  care: [...blankPreAnesthesia(s, p).care, "Profilaxia de náuseas e vômitos"],
  fasting: "Sólidos 8 h · líquidos claros 2 h",
  suspend: "Manter anti-hipertensivo com gole de água na manhã da cirurgia",
  verdict: "Apto",
  consent: true,
})

/** IMC com 1 casa decimal, ou "" sem peso/altura válidos. */
export const bmiOf = (weight: string, height: string) => {
  const w = Number(weight.replace(",", "."))
  const h = Number(height.replace(",", ".")) / 100
  if (!w || !h) return ""
  return (w / (h * h)).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

/** Última dose de GLP-1 há menos de 7 dias da cirurgia → estômago cheio. */
export const glp1Recent = (lastDose: string, surgeryDate = TODAY_ISO) =>
  !!lastDose && daysBetween(lastDose, surgeryDate) < 7

/** Pendências para assinar (campos obrigatórios e condicionais). */
export const preAnesthesiaMissing = (d: IPreAnesthesia) =>
  [
    !d.comorbidities.length && "Marque as comorbidades (ou “Nega”)",
    !d.meds.trim() && "Informe os medicamentos em uso",
    d.prevComplications === undefined &&
      "Responda se houve complicação em anestesias anteriores",
    d.prevComplications &&
      !d.prevComplicationsText.trim() &&
      "Descreva a complicação anestésica anterior",
    d.malignantHyperthermia === undefined &&
      "Responda sobre história familiar de hipertermia maligna",
    d.glp1 === undefined && "Responda sobre o uso de agonista de GLP-1",
    d.glp1 && !d.glp1LastDose && "Informe a última dose do GLP-1",
    d.anticoag === ANTICOAG_SUSPENDED &&
      !d.anticoagSuspendedOn &&
      "Informe a data da suspensão do anticoagulante",
    !d.weight.trim() && "Informe o peso",
    !d.height.trim() && "Informe a altura",
    !d.mallampati && "Marque a classificação de Mallampati",
    !d.asa && "Marque a classificação ASA",
    !d.plan && "Escolha o plano anestésico",
    !d.fasting.trim() && "Informe o jejum orientado",
    !d.verdict && "Marque o parecer",
    d.verdict &&
      d.verdict !== "Apto" &&
      !d.reservations.trim() &&
      (d.verdict === "Inapto" ? "Descreva o motivo" : "Descreva as ressalvas"),
    d.consent === undefined &&
      "Responda se o termo de consentimento foi assinado",
    d.consent === false &&
      "O termo de consentimento anestésico precisa estar assinado",
  ].filter(Boolean) as string[]
