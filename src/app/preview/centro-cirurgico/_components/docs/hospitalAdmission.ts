import { TODAY_ISO } from "../../_data/days"
import { PROFESSIONALS } from "../../_data/evolutions"
import { MOCK_NOW } from "../../_data/fixtures"
import type {
  DocStatus,
  IDocPart,
  IHospitalization,
  IPatient,
  ISurgery,
} from "../../_data/types"

/**
 * PEP-D06 + PEP-D07 · Admissão da internação. Um só documento
 * (`admissao_internacao`) com duas partes, cada uma com sua assinatura.
 */
export const DOC = "admissao_internacao" as const
export const PARTS = ["medica", "enfermagem"] as const
export type AdmissionPart = (typeof PARTS)[number]

// ── Comuns ────────────────────────────────────────────────────

export const DOCTORS = PROFESSIONALS["Médica"]
export const NURSES = PROFESSIONALS.Enfermagem
/** Técnicos de enfermagem (não evoluem, só assinam junto). */
export const TECHS = [
  { name: "Bruno Teles", council: "COREN-DF 50117" },
  { name: "Luana Prado", council: "COREN-DF 48820" },
  { name: "Diego Moura", council: "COREN-DF 52364" },
]
export const personLabel = (
  list: { name: string; council: string }[],
  name: string,
) => `${name} · ${list.find((p) => p.name === name)?.council ?? ""}`

/** "Corado(a)" → "Corada"/"Corado" conforme o sexo do paciente. */
export const gendered = (text: string, p: IPatient) =>
  text.replace(/o\(a\)/g, p.sex === "Feminino" ? "a" : "o")

/** "a, b e c". */
export const joinPt = (items: string[]) =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`

/** Já tem valor (para um modelo não sobrescrever dado do paciente). */
export const filled = (v: unknown) =>
  Array.isArray(v)
    ? v.length > 0
    : typeof v === "string"
      ? !!v.trim()
      : v !== undefined

/** Parte salva (ou o que o mock assume quando ainda não há conteúdo). */
export const partState = <T>(
  s: ISurgery,
  part: AdmissionPart,
): {
  saved?: IDocPart<T>
  status: DocStatus
  signedAt?: string
  signedBy?: string
} => {
  const saved = s.docData?.[`${DOC}:${part}`] as IDocPart<T> | undefined
  if (saved) return { saved, ...saved }
  const doc = s.docs[DOC]
  return { status: doc.status, signedAt: doc.signedAt }
}

// ── PEP-D06 · Admissão médica ─────────────────────────────────

export interface IMedicalAdmission {
  /** "yyyy-MM-ddTHH:mm". */
  dateTime: string
  diagnosis: string
  treatment: string
  history: string
  prevSurgery?: boolean
  prevSurgeryText: string
  drugAllergy?: boolean
  drugAllergyText: string
  exam: string[]
  examNotes: string
  hypothesis: string
  cid: string
  conduct: string[]
  text: string
  doctor: string
}

export const TREATMENTS = ["Eletivo", "Urgência", "Não cirúrgico"]
export const EXAM = [
  "Corado(a)",
  "Hidratado(a)",
  "Afebril",
  "Eupneico(a)",
  "Sem esforço respiratório",
  "Pulsos amplos e rítmicos",
  "Abdome NDN",
]
export const CONDUCT_ELECTIVE =
  "Encaminhado(a) ao centro cirúrgico para cirurgia eletiva"
export const CONDUCT_URGENT =
  "Encaminhado(a) ao centro cirúrgico para cirurgia de urgência"
export const CONDUCT = [
  "Jejum",
  CONDUCT_ELECTIVE,
  CONDUCT_URGENT,
  "Manter medicações de uso contínuo",
  "Profilaxia antibiótica conforme protocolo",
]

export const MEDICAL_PATIENT_FIELDS: (keyof IMedicalAdmission)[] = [
  "diagnosis",
  "history",
  "drugAllergy",
  "drugAllergyText",
  "hypothesis",
  "cid",
]

const NORMAL_EXAM = EXAM.slice(0, 6)

export const MEDICAL_MODELS: {
  name: string
  patch: Partial<IMedicalAdmission>
}[] = [
  {
    name: "Admissão cirúrgica eletiva",
    patch: {
      treatment: "Eletivo",
      exam: NORMAL_EXAM,
      conduct: ["Jejum", CONDUCT_ELECTIVE, "Manter medicações de uso contínuo"],
    },
  },
  {
    name: "Admissão cirúrgica de urgência",
    patch: {
      treatment: "Urgência",
      exam: ["Afebril", "Eupneico(a)", "Pulsos amplos e rítmicos"],
      conduct: [
        "Jejum",
        CONDUCT_URGENT,
        "Profilaxia antibiótica conforme protocolo",
      ],
    },
  },
  {
    name: "Admissão clínica (não cirúrgica)",
    patch: {
      treatment: "Não cirúrgico",
      exam: EXAM,
      conduct: ["Manter medicações de uso contínuo"],
    },
  },
]

export const blankMedical = (
  s: ISurgery,
  p: IPatient,
  h?: IHospitalization,
): IMedicalAdmission => ({
  dateTime: `${TODAY_ISO}T${MOCK_NOW}`,
  diagnosis: h?.diagnosis ?? h?.reason ?? "",
  treatment: s.urgent ? "Urgência" : "Eletivo",
  history: h?.comorbidities?.join(", ") ?? "",
  prevSurgeryText: "",
  drugAllergy: p.allergies.length ? true : undefined,
  drugAllergyText: p.allergies.join(", "),
  exam: [],
  examNotes: "",
  hypothesis: "",
  cid: h?.cid ?? "",
  conduct: [],
  text: "",
  doctor: DOCTORS.some((d) => d.name === s.surgeon) ? s.surgeon : "",
})

export const medicalText = (d: IMedicalAdmission, p: IPatient) => {
  const g = (t: string) => gendered(t, p)
  const treatment =
    d.treatment === "Não cirúrgico"
      ? "TRATAMENTO NÃO CIRÚRGICO"
      : d.treatment === "Urgência"
        ? "TRATAMENTO CIRÚRGICO DE URGÊNCIA"
        : "TRATAMENTO CIRÚRGICO ELETIVO"
  const has = (o: string) => d.exam.includes(o)
  const examLines = [
    ["Corado(a)", "Hidratado(a)", "Afebril"].filter(has).map(g).join(", "),
    [
      has("Eupneico(a)") && g("Eupneico(a)"),
      has("Sem esforço respiratório") && "sem esforço",
    ]
      .filter(Boolean)
      .join(", "),
    has("Pulsos amplos e rítmicos") && "Pulsos amplos e rítmicos",
    has("Abdome NDN") && "Abdome sem alterações",
    d.examNotes.trim(),
  ]
    .filter(Boolean)
    .map((l) => `${String(l).replace(/\.$/, "")}.`)
  const yesNo = (v: boolean | undefined, text: string) =>
    v ? text.trim() || "SIM" : "NEGA"
  const lines = [
    `Paciente com diagnóstico de ${d.diagnosis.trim() || "—"}, ${g("admitido(a)")} para ${treatment}.`,
    "",
    d.history.trim() && `Antecedentes: ${d.history.trim().replace(/\.$/, "")}.`,
    `Cirurgias prévias: ${yesNo(d.prevSurgery, d.prevSurgeryText)}.`,
    `Alergias a medicamentos: ${yesNo(d.drugAllergy, d.drugAllergyText)}.`,
    "",
    "Exame físico:",
    ...examLines,
    "",
    `Hipótese diagnóstica: ${d.hypothesis.trim() || "—"}${d.cid.trim() ? ` (CID ${d.cid.trim()})` : ""}.`,
    "",
    d.conduct.length > 0 &&
      `Conduta: ${joinPt(d.conduct.map((c) => g(c).toLowerCase()))}.`,
  ]
  return lines
    .filter((l) => l !== false && l !== undefined)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .toUpperCase()
}

export const sampleMedical = (
  s: ISurgery,
  p: IPatient,
  h: IHospitalization | undefined,
  complete: boolean,
): IMedicalAdmission => {
  const d: IMedicalAdmission = {
    ...blankMedical(s, p, h),
    diagnosis: h?.diagnosis ?? s.procedure,
    treatment: s.urgent ? "Urgência" : "Eletivo",
    prevSurgery: false,
    drugAllergy: p.allergies.length > 0,
    exam: NORMAL_EXAM,
    hypothesis: h?.diagnosis ?? "",
    conduct: [
      "Jejum",
      s.urgent ? CONDUCT_URGENT : CONDUCT_ELECTIVE,
      "Manter medicações de uso contínuo",
    ],
    doctor: complete ? DOCTORS[0].name : "",
  }
  return complete ? { ...d, text: medicalText(d, p) } : d
}

export const medicalMissing = (d: IMedicalAdmission, p: IPatient) => {
  const yn = (v: boolean | undefined, label: string) => v === undefined && label
  return [
    !d.dateTime && "Diagnóstico e motivo: Data e hora",
    !d.diagnosis.trim() && "Diagnóstico e motivo: Diagnóstico",
    !d.treatment && "Diagnóstico e motivo: Tratamento cirúrgico",
    yn(d.prevSurgery, "Antecedentes: Cirurgias prévias"),
    d.prevSurgery &&
      !d.prevSurgeryText.trim() &&
      "Antecedentes: Quais cirurgias prévias?",
    yn(d.drugAllergy, "Antecedentes: Alergias a medicamentos"),
    d.drugAllergy === false &&
      p.allergies.length > 0 &&
      `Antecedentes: Alergias a medicamentos — marcado “Nega”, mas o cadastro registra: ${p.allergies.join(", ")}`,
    d.drugAllergy &&
      !d.drugAllergyText.trim() &&
      "Antecedentes: Quais alergias a medicamentos?",
    !d.exam.length && "Exame físico: marque ao menos uma opção",
    !d.hypothesis.trim() && "Hipótese diagnóstica: Hipótese diagnóstica",
    !d.conduct.length && "Conduta: marque ao menos uma opção",
    d.conduct.includes(CONDUCT_ELECTIVE) &&
      d.conduct.includes(CONDUCT_URGENT) &&
      "Conduta marcada como cirurgia eletiva e de urgência ao mesmo tempo",
    !d.text.trim() && "Texto da admissão: Admissão médica",
    !d.doctor && "Assinatura: Médico (CRM-DF)",
  ].filter(Boolean) as string[]
}

/** Alergia negada contra o cadastro (destaca a linha em vermelho). */
export const allergyConflict = (d: IMedicalAdmission, p: IPatient) =>
  d.drugAllergy === false && p.allergies.length > 0

// ── PEP-D07 · Admissão na unidade (enfermagem) ────────────────

export interface IUrineRow {
  time: string
  volume: string
  color: string
  aspect: string
}

export interface IVitalRow {
  time: string
  sys: string
  dia: string
  hr: string
  rr: string
  temp: string
  spo2: string
  support: string
}

export interface INursingAdmission {
  arrivalTime: string
  origin: string
  transport: string
  generalState: string
  consciousness: string[]
  breathing: string
  breathingPattern: string
  vitalsState: string
  allergies: string
  allergiesText: string
  anesthesia: string
  venousAccess: string
  accessCondition: string
  devices: string[]
  clinical: string[]
  symptoms: string[]
  bowel: string
  aldrete: string
  eva: string
  fallRisk: string
  conducts: string[]
  text: string
  urine: IUrineRow[]
  vitals: IVitalRow[]
  tech: string
  nurse: string
}

// Opções do frame "Dropdowns · SRPA e enfermagem" e "Centro cirúrgico e anestesia".
export const ORIGINS = [
  "Sala operatória",
  "SRPA",
  "Pronto-socorro",
  "UTI",
  "Domicílio",
]
export const TRANSPORTS = [
  "Maca",
  "Cadeira de rodas",
  "Deambulando",
  "No próprio leito",
]
export const GENERAL_STATES = ["BEG", "REG", "MEG"]
export const GENERAL_STATE_TEXT: Record<string, string> = {
  BEG: "bom estado geral",
  REG: "regular estado geral",
  MEG: "mau estado geral",
}
export const CONSCIOUSNESS = [
  "Consciente",
  "Orientado",
  "Sonolento",
  "Sob efeito anestésico",
]
export const BREATHING = [
  "Ar ambiente",
  "O₂ suplementar",
  "Cateter nasal",
  "Máscara de Venturi",
  "Ventilação mecânica",
]
export const BREATHING_PATTERNS = [
  "Eupneico",
  "Taquipneico",
  "Bradipneico",
  "Dispneico",
]
export const VITALS_STATES = ["Estáveis", "Instáveis"]
export const ALLERGY_OPTIONS = ["Nega", "Sim"]
export const ANESTHESIAS = [
  "Geral",
  "Raqui",
  "Peridural",
  "Bloqueio",
  "Sedação",
  "Local",
]
export const ACCESSES = [
  "MSD",
  "MSE",
  "MID",
  "MIE",
  "Jugular externa",
  "Acesso venoso central",
]
export const ACCESS_TEXT: Record<string, string> = {
  MSD: "periférico em membro superior direito",
  MSE: "periférico em membro superior esquerdo",
  MID: "periférico em membro inferior direito",
  MIE: "periférico em membro inferior esquerdo",
  "Jugular externa": "em jugular externa",
  "Acesso venoso central": "central",
}
export const ACCESS_CONDITIONS = [
  "Pérvio",
  "Infiltrado",
  "Obstruído",
  "Retirado",
]
export const NO_DEVICE = "Nenhum"
export const DEVICES = [
  NO_DEVICE,
  "SVD",
  "Dreno",
  "Cistostomia",
  "Nefrostomia",
  "Irrigação contínua",
  "O₂",
]
const DEVICE_TEXT: Record<string, string> = {
  SVD: "sonda vesical de demora",
  Dreno: "dreno",
  Cistostomia: "cistostomia",
  Nefrostomia: "nefrostomia",
  "Irrigação contínua": "irrigação vesical contínua",
  "O₂": "oxigenoterapia",
}
export const CLINICAL = [
  "Hemodinamicamente estável",
  "Pele íntegra",
  "Perfusão preservada",
]
export const NO_PAIN = "Sem dor"
export const SYMPTOMS = [
  NO_PAIN,
  "Dor",
  "Náuseas",
  "Vômitos",
  "Tontura",
  "Sonolência",
]
export const BOWEL = ["Não avaliada", "Presente", "Flatos presentes", "Ausente"]
export const ALDRETE = ["10", "9", "8", "7", "6 ou menos"]
export const EVA = Array.from({ length: 11 }, (_, i) => String(i))
export const FALL_RISKS = ["Baixo", "Moderado", "Alto"]
export const URINE_COLORS = [
  "Amarelo citrino",
  "Amarelo escuro",
  "Avermelhada",
  "Hematúria franca",
]
export const URINE_ASPECTS = ["Límpido", "Turvo", "Com grumos"]
export const NURSING_CONDUCTS = [
  "Manter monitorização contínua",
  "Controlar sinais vitais conforme protocolo institucional",
  "Manter acesso venoso pérvio",
  "Administrar medicações conforme prescrição médica",
  "Avaliar e registrar a dor periodicamente",
  "Observar sinais de sangramento",
  "Controlar a diurese, quando indicado",
  "Controlar a irrigação contínua, quando prescrita",
  "Reforçar as orientações sobre prevenção de quedas",
  "Orientar o paciente a levantar-se somente com auxílio",
]

/** "Raquianestesia · ASA II" → "Raqui". */
export const anesthesiaOf = (s: ISurgery) => {
  const a = (s.anesthesia ?? "").split(" · ")[0]
  if (!a) return ""
  if (a.startsWith("Raqui")) return "Raqui"
  if (a.startsWith("Bloqueio")) return "Bloqueio"
  return ANESTHESIAS.find((x) => a.startsWith(x)) ?? a
}

/** PAM = (PAS + 2·PAD) / 3. */
export const pamOf = (r: IVitalRow) => {
  const sys = Number(r.sys.replace(",", "."))
  const dia = Number(r.dia.replace(",", "."))
  return sys > 0 && dia > 0 ? String(Math.round((sys + 2 * dia) / 3)) : ""
}

export const blankUrine = (): IUrineRow => ({
  time: "",
  volume: "",
  color: "",
  aspect: "",
})
export const blankVital = (): IVitalRow => ({
  time: "",
  sys: "",
  dia: "",
  hr: "",
  rr: "",
  temp: "",
  spo2: "",
  support: "Ar ambiente",
})

export const NURSING_PATIENT_FIELDS: (keyof INursingAdmission)[] = [
  "allergies",
  "allergiesText",
  "anesthesia",
  "venousAccess",
  "accessCondition",
  "devices",
]

const BASE_CONDUCTS = NURSING_CONDUCTS.filter(
  (c) => !c.includes("irrigação") && !c.includes("diurese"),
)

export const NURSING_MODELS: {
  name: string
  patch: Partial<INursingAdmission>
}[] = [
  {
    name: "Pós-operatório padrão",
    patch: {
      origin: "SRPA",
      transport: "Maca",
      generalState: "BEG",
      consciousness: ["Consciente", "Orientado"],
      breathing: "Ar ambiente",
      breathingPattern: "Eupneico",
      vitalsState: "Estáveis",
      clinical: CLINICAL,
      symptoms: [NO_PAIN],
      bowel: "Não avaliada",
      conducts: BASE_CONDUCTS,
    },
  },
  {
    name: "Pós-operatório urologia (irrigação)",
    patch: {
      origin: "SRPA",
      transport: "Maca",
      generalState: "BEG",
      consciousness: ["Consciente", "Orientado"],
      breathing: "Ar ambiente",
      breathingPattern: "Eupneico",
      vitalsState: "Estáveis",
      devices: ["SVD", "Irrigação contínua"],
      clinical: CLINICAL,
      symptoms: [NO_PAIN],
      bowel: "Não avaliada",
      conducts: NURSING_CONDUCTS,
    },
  },
  {
    name: "Pós-operatório ortopedia (idoso)",
    patch: {
      origin: "SRPA",
      transport: "Maca",
      consciousness: ["Consciente", "Orientado"],
      breathing: "Ar ambiente",
      breathingPattern: "Eupneico",
      vitalsState: "Estáveis",
      fallRisk: "Alto",
      conducts: BASE_CONDUCTS,
    },
  },
]

/**
 * O que dá para aproveitar da alta da SRPA assinada. O formato desse
 * documento é de outro formulário: lê como desconhecido e só usa o que
 * existir com um valor válido.
 */
export const fromSrpa = (
  raw: unknown,
): { patch: Partial<INursingAdmission>; fields: string[] } => {
  const src =
    raw && typeof raw === "object"
      ? (raw as { data?: unknown }).data &&
        typeof (raw as { data?: unknown }).data === "object"
        ? (raw as { data: Record<string, unknown> }).data
        : (raw as Record<string, unknown>)
      : {}
  const patch: Partial<INursingAdmission> = {}
  const fields: string[] = []
  const pick = (
    key: keyof INursingAdmission,
    label: string,
    options: string[],
    ...names: string[]
  ) => {
    for (const n of names) {
      const v = src[n]
      const text = typeof v === "number" ? String(v) : v
      if (typeof text === "string" && options.includes(text)) {
        Object.assign(patch, { [key]: text })
        fields.push(label)
        return
      }
    }
  }
  pick("anesthesia", "anestesia", ANESTHESIAS, "anesthesia", "anesthesiaType")
  pick(
    "venousAccess",
    "acesso venoso",
    ACCESSES,
    "venousAccess",
    "access",
    "accessSite",
  )
  pick(
    "accessCondition",
    "condição do acesso",
    ACCESS_CONDITIONS,
    "accessCondition",
  )
  pick("generalState", "estado geral", GENERAL_STATES, "generalState")
  pick("breathing", "respiração", BREATHING, "breathing", "respiration")
  pick(
    "breathingPattern",
    "padrão respiratório",
    BREATHING_PATTERNS,
    "breathingPattern",
  )
  pick("aldrete", "Aldrete", ALDRETE, "aldreteTotal", "aldrete", "aldreteNow")
  pick("eva", "EVA", EVA, "eva", "pain", "painScore")
  pick("fallRisk", "risco de queda", FALL_RISKS, "fallRisk")
  const devices = src.devices
  if (Array.isArray(devices)) {
    const valid = devices.filter(
      (x): x is string => typeof x === "string" && DEVICES.includes(x),
    )
    if (valid.length) {
      patch.devices = valid
      fields.push("dispositivos")
    }
  }
  return { patch, fields }
}

export const blankNursing = (
  s: ISurgery,
  p: IPatient,
  srpa?: Partial<INursingAdmission>,
): INursingAdmission => ({
  arrivalTime: "",
  origin: s.docs.alta_srpa.status === "assinado" ? "SRPA" : "",
  transport: "",
  generalState: "",
  consciousness: [],
  breathing: "",
  breathingPattern: "",
  vitalsState: "",
  allergies: p.allergies.length ? "Sim" : "",
  allergiesText: p.allergies.join(", "),
  anesthesia: anesthesiaOf(s),
  venousAccess: "",
  accessCondition: "",
  devices: [],
  clinical: [],
  symptoms: [],
  bowel: "",
  aldrete: "",
  eva: "",
  fallRisk: "",
  conducts: [],
  text: "",
  urine: [],
  vitals: [blankVital()],
  tech: "",
  nurse: "",
  ...srpa,
})

export const nursingText = (d: INursingAdmission, p: IPatient) => {
  const g = (t: string) => gendered(t, p)
  const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1)
  const parts: string[] = []
  parts.push(
    `${d.arrivalTime ? `${d.arrivalTime}h – ` : ""}Recebo paciente na unidade de internação${d.origin ? `, ${d.origin === "Domicílio" ? "proveniente do domicílio" : `proveniente ${d.origin === "SRPA" || d.origin === "UTI" ? "da" : "do"} ${d.origin === "Sala operatória" ? "centro cirúrgico" : d.origin}`}` : ""}${d.transport ? `, ${d.transport === "Maca" ? "em maca" : d.transport === "Cadeira de rodas" ? "em cadeira de rodas" : lower(d.transport)}` : ""}, ${g("acompanhado(a)")} pela equipe assistencial.`,
  )
  const state = [
    d.generalState && `em ${GENERAL_STATE_TEXT[d.generalState]}`,
    d.consciousness.includes("Consciente") && "consciente",
    d.consciousness.includes("Orientado") &&
      `${g("lúcido(a)")} e ${g("orientado(a)")} em tempo, espaço e pessoa`,
    d.consciousness.includes("Sonolento") && g("sonolento(a)"),
    d.consciousness.includes("Sob efeito anestésico") &&
      "sob efeito anestésico",
    d.breathing && `em ${lower(d.breathing)}`,
    d.breathingPattern && g(`${lower(d.breathingPattern).slice(0, -1)}o(a)`),
    d.vitalsState &&
      `com sinais vitais ${d.vitalsState === "Estáveis" ? "estáveis" : "instáveis (médico comunicado)"}`,
  ].filter(Boolean) as string[]
  if (state.length) parts.push(`Paciente ${state.join(", ")}.`)
  const sym = d.symptoms.filter((x) => x !== NO_PAIN)
  const symText = [
    d.symptoms.includes(NO_PAIN) ? "Sem queixas álgicas" : "",
    sym.length ? `Refere ${joinPt(sym.map(lower))}` : "",
    !sym.includes("Náuseas") && !sym.includes("Vômitos") && d.symptoms.length
      ? "sem náuseas ou vômitos"
      : "",
  ].filter(Boolean)
  if (symText.length) parts.push(`${symText.join(", ")}.`)
  if (d.clinical.length)
    parts.push(
      `${joinPt(
        d.clinical.map((c) =>
          c === "Hemodinamicamente estável"
            ? "mantendo-se hemodinamicamente estável"
            : c === "Perfusão preservada"
              ? "perfusão periférica preservada"
              : "pele íntegra",
        ),
      ).replace(/^./, (c) => c.toUpperCase())}.`,
    )
  if (d.venousAccess)
    parts.push(
      `Acesso venoso ${ACCESS_TEXT[d.venousAccess] ?? d.venousAccess}${d.accessCondition ? ` ${lower(d.accessCondition)}` : ""}.`,
    )
  const dev = d.devices.filter((x) => x !== NO_DEVICE)
  if (dev.length)
    parts.push(`Em uso de ${joinPt(dev.map((x) => DEVICE_TEXT[x] ?? x))}.`)
  if (d.allergies === "Sim" && d.allergiesText.trim())
    parts.push(`Alergia a ${d.allergiesText.trim()}.`)
  const scales = [
    d.aldrete && `Aldrete e Kroulik ${d.aldrete}/10`,
    d.eva && `EVA ${d.eva}/10`,
    d.fallRisk && `risco ${lower(d.fallRisk)} de queda`,
  ].filter(Boolean) as string[]
  if (scales.length) parts.push(`Escalas: ${joinPt(scales)}.`)
  if (d.bowel && d.bowel !== "Não avaliada")
    parts.push(`Eliminação intestinal: ${lower(d.bowel)}.`)
  parts.push(
    "Paciente e acompanhante orientados quanto aos cuidados pós-operatórios e prevenção de quedas.",
  )
  return parts.join(" ")
}

export const sampleNursing = (
  s: ISurgery,
  p: IPatient,
  srpa: Partial<INursingAdmission> | undefined,
  complete: boolean,
): INursingAdmission => {
  const base = blankNursing(s, p, srpa)
  const d: INursingAdmission = {
    ...base,
    arrivalTime: s.srpaDischargeAt ?? "11:58",
    origin: "SRPA",
    transport: "Maca",
    generalState: base.generalState || "BEG",
    consciousness: ["Consciente", "Orientado"],
    breathing: base.breathing || "Ar ambiente",
    breathingPattern: base.breathingPattern || "Eupneico",
    vitalsState: "Estáveis",
    allergies: p.allergies.length ? "Sim" : "Nega",
    anesthesia: base.anesthesia || "Raqui",
    venousAccess: base.venousAccess || "MSD",
    accessCondition: base.accessCondition || "Pérvio",
    devices: base.devices.length ? base.devices : [NO_DEVICE],
    clinical: CLINICAL,
    symptoms: [NO_PAIN],
    bowel: "Não avaliada",
    aldrete: base.aldrete || "10",
    eva: base.eva || "0",
    fallRisk: base.fallRisk || (p.age >= 65 ? "Alto" : "Baixo"),
    conducts: BASE_CONDUCTS,
    urine: complete
      ? [
          {
            time: "12:00",
            volume: "350",
            color: "Amarelo citrino",
            aspect: "Límpido",
          },
        ]
      : [],
    vitals: [
      {
        time: s.srpaDischargeAt ?? "12:00",
        sys: "126",
        dia: "78",
        hr: "72",
        rr: "16",
        temp: "36,4",
        spo2: "97",
        support: "Ar ambiente",
      },
    ],
    tech: complete ? TECHS[0].name : "",
    nurse: complete ? NURSES[1].name : "",
  }
  return complete ? { ...d, text: nursingText(d, p) } : d
}

export const nursingMissing = (d: INursingAdmission, p: IPatient) => {
  const req = (v: string, label: string) => !v && label
  const vitalsOk = d.vitals.some(
    (r) =>
      r.time && r.sys.trim() && r.dia.trim() && r.hr.trim() && r.spo2.trim(),
  )
  return [
    req(d.arrivalTime, "S · Situação: Horário de chegada à unidade"),
    req(d.origin, "S · Situação: Procedência"),
    req(d.transport, "S · Situação: Transporte"),
    req(d.generalState, "S · Situação: Estado geral"),
    !d.consciousness.length &&
      "S · Situação: Nível de consciência (marque ao menos uma opção)",
    req(d.breathing, "S · Situação: Respiração"),
    req(d.breathingPattern, "S · Situação: Padrão respiratório"),
    req(d.vitalsState, "S · Situação: Sinais vitais"),
    req(d.allergies, "B · Background: Alergias"),
    d.allergies === "Sim" &&
      !d.allergiesText.trim() &&
      "B · Background: Quais alergias?",
    d.allergies === "Nega" &&
      p.allergies.length > 0 &&
      `B · Background: Alergias — marcado “Nega”, mas o cadastro registra: ${p.allergies.join(", ")}`,
    req(d.anesthesia, "B · Background: Anestesia"),
    req(d.venousAccess, "B · Background: Acesso venoso"),
    req(d.accessCondition, "B · Background: Condição do acesso"),
    !d.symptoms.length && "A · Avaliação: Sintomas (marque ao menos uma opção)",
    d.symptoms.includes(NO_PAIN) &&
      d.symptoms.includes("Dor") &&
      "A · Avaliação: Sintomas marcados como “Sem dor” e “Dor” ao mesmo tempo",
    req(d.bowel, "A · Avaliação: Eliminação intestinal"),
    req(d.aldrete, "A · Avaliação: Aldrete e Kroulik"),
    req(d.eva, "A · Avaliação: EVA"),
    req(d.fallRisk, "A · Avaliação: Risco de queda"),
    !d.text.trim() && "Evolução de enfermagem: Texto da evolução",
    d.urine.some((r) => r.volume.trim() && !r.time) &&
      "Débito urinário: Horário da medição",
    !vitalsOk &&
      "Sinais vitais: ao menos uma linha com horário, PAS, PAD, FC e SpO₂",
    req(d.nurse, "Assinaturas: Enfermeiro(a)"),
  ].filter(Boolean) as string[]
}

export const nursingAllergyConflict = (d: INursingAdmission, p: IPatient) =>
  d.allergies === "Nega" && p.allergies.length > 0

/** Aplica um modelo sem sobrescrever o que já veio do paciente. */
export const applyModel = <T extends object>(
  d: T,
  patch: Partial<T>,
  patientFields: (keyof T)[],
) => {
  const keys = Object.keys(patch) as (keyof T)[]
  const kept = keys.filter((k) => patientFields.includes(k) && filled(d[k]))
  const next = {
    ...d,
    ...Object.fromEntries(
      keys.filter((k) => !kept.includes(k)).map((k) => [k, patch[k]]),
    ),
  } as T
  return { next, applied: keys.length - kept.length, kept: kept.length }
}

export const appliedMessage = (name: string, applied: number, kept: number) =>
  `Modelo “${name}” aplicado (${applied} campos).${kept ? ` ${kept} ${kept === 1 ? "campo com dados deste paciente foi mantido" : "campos com dados deste paciente foram mantidos"}.` : ""} Revise antes de assinar.`
