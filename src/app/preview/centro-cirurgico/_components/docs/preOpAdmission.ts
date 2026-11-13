import { PROFESSIONALS } from "../../_data/evolutions"
import type { IPatient, ISurgery, IVitalSign } from "../../_data/types"

/** Conteúdo do D01 · Admissão pré-operatória. */
export interface IPreOpAdmission {
  procedure: string
  informedBy: string
  contactName: string
  contactPhone: string
  communication: string[]
  orthoses: string[]
  adornments?: boolean
  weight: string
  height: string
  glucose: string
  diseases: string[]
  allergies?: boolean
  allergiesText: string
  usesMeds?: boolean
  medsText: string
  glp1?: boolean
  glp1Text: string
  anticoag?: boolean
  anticoagText: string
  prevSurgery?: boolean
  prevSurgeryText: string
  solids: string
  solidsTime: string
  liquids: string
  liquidsTime: string
  sys: string
  dia: string
  temp: string
  hr: string
  spo2: string
  rr: string
  vitalsNote: string
  exams: string[]
  signer: string
}

export const NA = "Não se aplica"

// Opções do desenho (PEP-D01) e do frame "Dropdowns · Centro cirúrgico e anestesia".
export const INFORMED_BY = [
  "Paciente",
  "Acompanhante",
  "Paciente e acompanhante",
  "Prontuário / encaminhamento",
]
export const COMMUNICATION = [
  "Déficit auditivo",
  "Déficit neurológico",
  "Déficit visual",
  "Déficit de fala",
  NA,
]
export const ORTHOSES = [
  "Óculos",
  "Prótese dentária",
  "Marca-passo",
  "Aparelho auditivo",
  "Lentes de contato",
  NA,
]
export const DISEASES = [
  "Diabetes mellitus",
  "Hipertensão arterial",
  "Doença respiratória",
  "Doença psiquiátrica",
  "Neoplasia",
  "Doença neurológica",
  NA,
]
export const DIABETES = DISEASES[0]
export const NO_EXAMS = "Sem exames"
export const EXAMS = [
  "Raio X",
  "USG",
  "Ressonância",
  "Tomografia",
  "Laboratoriais",
  "Cardiológico",
  NO_EXAMS,
]

export const NURSES = PROFESSIONALS.Enfermagem
export const nurseLabel = (name: string) =>
  `${name} · ${NURSES.find((n) => n.name === name)?.council ?? ""}`

/**
 * Campos que trazem dado do próprio paciente: um modelo não sobrescreve
 * quando já estão preenchidos ("2 campos com dados deste paciente foram
 * mantidos").
 */
export const PATIENT_FIELDS: (keyof IPreOpAdmission)[] = [
  "allergies",
  "allergiesText",
  "weight",
  "height",
  "diseases",
]

export const PRE_OP_MODELS: {
  name: string
  patch: Partial<IPreOpAdmission>
}[] = [
  {
    name: "Pré-op padrão (geral)",
    patch: {
      communication: [NA],
      orthoses: [NA],
      adornments: true,
      diseases: [NA],
      prevSurgery: false,
      solids: "Jantar",
      solidsTime: "22:00",
      liquids: "Água",
      liquidsTime: "06:00",
      exams: ["Laboratoriais"],
    },
  },
  {
    name: "Pré-op padrão urologia",
    patch: {
      communication: [NA],
      orthoses: [NA],
      adornments: true,
      diseases: [NA],
      anticoag: false,
      solids: "Jantar",
      solidsTime: "20:00",
      liquids: "Água",
      exams: ["Laboratoriais", "USG"],
    },
  },
  {
    name: "Pré-op ortopedia (idoso)",
    patch: {
      communication: ["Déficit auditivo"],
      orthoses: ["Óculos", "Aparelho auditivo"],
      adornments: true,
      solids: "Jantar",
      solidsTime: "20:00",
      liquids: "Água",
      exams: ["Raio X", "Laboratoriais", "Cardiológico"],
    },
  },
]

/** Já tem valor (para não sobrescrever com o modelo). */
export const filled = (v: unknown) =>
  Array.isArray(v)
    ? v.length > 0
    : typeof v === "string"
      ? !!v.trim()
      : v !== undefined

/** Admissão em branco, com o que o sistema já sabe do paciente. */
export const blankPreOp = (
  s: ISurgery,
  p: IPatient,
  v?: IVitalSign,
): IPreOpAdmission => ({
  procedure: s.procedure,
  informedBy: "",
  contactName: "",
  contactPhone: "",
  communication: [],
  orthoses: [],
  weight: "",
  height: "",
  glucose: "",
  diseases: [],
  allergies: p.allergies.length ? true : undefined,
  allergiesText: p.allergies.join(", "),
  medsText: "",
  glp1Text: "",
  anticoagText: "",
  prevSurgeryText: "",
  solids: "",
  solidsTime: "",
  liquids: "",
  liquidsTime: "",
  sys: v ? String(v.sys) : "",
  dia: v ? String(v.dia) : "",
  temp: v ? String(v.temp).replace(".", ",") : "",
  hr: v ? String(v.hr) : "",
  spo2: v ? String(v.spo2) : "",
  rr: v ? String(v.rr) : "",
  vitalsNote: "",
  exams: [],
  signer: "",
})

/**
 * Admissão já começada (rascunho) ou completa (assinada), para os documentos
 * que o mock começa assim sem conteúdo salvo.
 */
export const samplePreOp = (
  s: ISurgery,
  p: IPatient,
  v: IVitalSign | undefined,
  complete: boolean,
): IPreOpAdmission => ({
  ...blankPreOp(s, p, v),
  informedBy: "Paciente e acompanhante",
  contactName: "Familiar responsável",
  contactPhone: "(61) 99812-4410",
  communication: [NA],
  orthoses: [NA],
  adornments: true,
  weight: "72",
  height: "165",
  diseases: ["Hipertensão arterial"],
  allergies: p.allergies.length > 0,
  usesMeds: true,
  medsText: "Losartana 50 mg pela manhã",
  glp1: false,
  anticoag: false,
  prevSurgery: false,
  solids: "Jantar",
  solidsTime: "20:00",
  liquids: "Água",
  liquidsTime: complete ? "06:00" : "",
  exams: ["Laboratoriais"],
  signer: complete ? NURSES[2].name : "",
})

/** Pendências no formato do desenho: "Seção: campo". */
export const preOpMissing = (d: IPreOpAdmission) => {
  const yn = (v: boolean | undefined, label: string) => v === undefined && label
  return [
    !d.procedure.trim() && "Identificação: Procedimento",
    !d.informedBy && "Responsável: Informações prestadas por",
    !d.contactName.trim() && "Responsável: Contato (nome)",
    !d.contactPhone.trim() && "Responsável: Telefone",
    !d.communication.length && "Comunicação: marque ao menos uma opção",
    !d.orthoses.length && "Órteses e próteses: marque ao menos uma opção",
    yn(d.adornments, "Adornos: paciente orientado(a)?"),
    !d.weight.trim() && "Medidas: Peso",
    d.diseases.includes(DIABETES) &&
      !d.glucose.trim() &&
      "Medidas: Glicemia capilar (diabetes marcado)",
    !d.diseases.length && "Doenças prévias: marque ao menos uma opção",
    yn(d.allergies, "Alergias: Sim ou Nega"),
    d.allergies && !d.allergiesText.trim() && "Alergias: Quais?",
    yn(d.usesMeds, "Medicamentos: uso de medicamentos"),
    d.usesMeds && !d.medsText.trim() && "Medicamentos: Quais?",
    yn(d.glp1, "Medicamentos: remédio para emagrecimento"),
    d.glp1 && !d.glp1Text.trim() && "Medicamentos: Quais? (emagrecimento)",
    yn(d.anticoag, "Medicamentos: anticoagulante"),
    d.anticoag &&
      !d.anticoagText.trim() &&
      "Medicamentos: Qual anticoagulante?",
    yn(d.prevSurgery, "Cirurgias anteriores: Sim ou Não"),
    d.prevSurgery &&
      !d.prevSurgeryText.trim() &&
      "Cirurgias anteriores: Quais?",
    !d.solidsTime && "Jejum: Hora (sólidos)",
    !d.liquidsTime && "Jejum: Hora (líquidos)",
    !d.sys.trim() && "Sinais vitais: PA sistólica",
    !d.dia.trim() && "Sinais vitais: PA diastólica",
    !d.hr.trim() && "Sinais vitais: FC",
    !d.spo2.trim() && "Sinais vitais: SpO₂",
    !d.exams.length && "Exames: marque ao menos uma opção",
    !d.signer && "Assinatura: Enfermagem (COREN-DF)",
  ].filter(Boolean) as string[]
}
