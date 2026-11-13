import { isoToBR } from "../../_data/days"
import { PROFESSIONALS } from "../../_data/evolutions"
import type { ISurgery } from "../../_data/types"
import {
  ANESTHESIAS,
  ANTISEPSIS,
  NA,
  POSITIONS,
  anesthesiaFrom,
  procedureWithSide,
  type IIntraopEvolution,
} from "./intraopEvolution"

export { ANESTHESIAS, ANTISEPSIS, NA, POSITIONS }

/** Conteúdo do D05 · Descrição cirúrgica. */
export interface ISurgicalDescription {
  // Identificação do ato cirúrgico
  date: string // "dd/MM/yyyy HH:mm"
  start: string
  end: string
  character: string
  procedure: string
  code: string
  cid: string
  side: string
  // Equipe
  surgeon: string
  assistant: string
  anesthetist: string
  scrub: string
  // Anestesia, posicionamento e antissepsia
  anesthesia: string
  positions: string[]
  antisepsis: string[]
  // Diagnóstico
  preDiagnosis: string
  postDiagnosis: string
  // Achados, materiais, sondas e drenos
  findings: string
  pathology?: boolean
  pathologyMaterial: string
  culture?: boolean
  cultureMaterial: string
  opme?: boolean
  opmeText: string
  catheter?: boolean
  catheterText: string
  drain?: boolean
  drainText: string
  // Desfecho
  bleeding: string
  wound: string
  destination: string
  complications?: boolean
  complicationsText: string
  // Descrição do procedimento
  text: string
  postOp: string
  signer: string
}

// Opções do desenho (PEP-D05) e do frame "Dropdowns · Centro cirúrgico e anestesia".
export const CHARACTER = ["Eletivo", "Urgência", "Emergência"]
export const SIDES = [NA, "Direito", "Esquerdo", "Bilateral"]
export const BLEEDING = ["Desprezível", "Pequeno", "Moderado", "Grande"]
export const BLEEDING_HINT: Record<string, string> = {
  Pequeno: "Menos de 100 mL",
  Moderado: "100 a 500 mL",
  Grande: "Mais de 500 mL",
}
export const WOUND = [
  "Limpa",
  "Potencialmente contaminada",
  "Contaminada",
  "Infectada",
]
export const DESTINATION = [
  "SRPA",
  "UTI",
  "Internação (enfermaria)",
  "Internação (apartamento)",
  "Alta para domicílio",
]

export const SURGEONS = PROFESSIONALS.Médica
export const surgeonLabel = (name: string) => {
  const council = SURGEONS.find((p) => p.name === name)?.council
  return council ? `${name} · ${council}` : name
}

/** Campos que vêm do paciente/cirurgia: um modelo não os sobrescreve. */
export const PATIENT_FIELDS: (keyof ISurgicalDescription)[] = [
  "procedure",
  "cid",
  "side",
  "surgeon",
  "anesthetist",
  "anesthesia",
  "preDiagnosis",
]

export const DESCRIPTION_MODELS: {
  name: string
  patch: Partial<ISurgicalDescription>
}[] = [
  {
    name: "Cistoscopia com biópsia (padrão)",
    patch: {
      character: "Eletivo",
      code: "0409010095",
      anesthesia: "Sedação",
      positions: ["Litotomia"],
      antisepsis: ["Clorexidina degermante", "Clorexidina aquosa"],
      findings:
        "Uretra sem alterações. Bexiga trabeculada, com lesão vegetante de cerca de 2 cm em parede lateral esquerda, distante dos meatos ureterais.",
      pathology: true,
      pathologyMaterial:
        "Fragmentos de lesão vesical (frasco 1) e base da lesão (frasco 2)",
      culture: false,
      opme: false,
      catheter: true,
      catheterText: "Foley 3 vias nº 20, com irrigação",
      drain: false,
      bleeding: "Desprezível",
      wound: "Potencialmente contaminada",
      destination: "SRPA",
      postOp:
        "Irrigação vesical contínua com SF 0,9%. Retirar SVD em 48 h se urina clara. Analgesia conforme prescrição.",
    },
  },
  {
    name: "Artroplastia de quadril (padrão)",
    patch: {
      character: "Eletivo",
      anesthesia: "Raqui",
      positions: ["Lateral", "Direita"],
      antisepsis: ["Clorexidina degermante", "Clorexidina alcoólica"],
      pathology: false,
      culture: false,
      opme: true,
      opmeText: "Prótese parcial de quadril cimentada (haste e cabeça bipolar)",
      catheter: true,
      catheterText: "Foley 2 vias nº 16",
      drain: true,
      drainText: "Dreno de sucção 3,2 mm em loja cirúrgica",
      bleeding: "Moderado",
      wound: "Limpa",
      destination: "SRPA",
      postOp:
        "Manter dreno aberto e anotar débito. Profilaxia de TEV conforme protocolo. Abdução de MMII com coxim. Fisioterapia no 1º PO.",
    },
  },
  {
    name: "Colecistectomia vídeo (padrão)",
    patch: {
      character: "Eletivo",
      anesthesia: "Geral",
      positions: ["Dorsal", "Proclive"],
      antisepsis: ["Clorexidina degermante", "Clorexidina alcoólica"],
      pathology: true,
      pathologyMaterial: "Vesícula biliar",
      culture: false,
      opme: false,
      catheter: false,
      drain: false,
      bleeding: "Desprezível",
      wound: "Potencialmente contaminada",
      destination: "SRPA",
      postOp:
        "Dieta líquida após 6 h, progredir conforme aceitação. Deambulação precoce. Analgesia conforme prescrição.",
    },
  },
]

const SIDE_TEXT: Record<string, string> = {
  Direito: "Direito",
  Esquerdo: "Esquerdo",
  Bilateral: "Bilateral",
}

const today = (s: ISurgery) => (s.date ? isoToBR(s.date) : "")

/** Descrição em branco, com o que o sistema já sabe (cirurgia e D03). */
export const blankDescription = (
  s: ISurgery,
  cid: string | undefined,
  intraop?: IIntraopEvolution,
): ISurgicalDescription => ({
  date: [today(s), s.start ?? ""].filter(Boolean).join(" "),
  start: intraop?.checklist2At ?? "",
  end: intraop?.procedureEnd ?? "",
  character: s.urgent ? "Urgência" : "Eletivo",
  procedure: s.procedure,
  code: "",
  cid: cid ?? "",
  side: SIDE_TEXT[s.side ?? ""] ?? NA,
  surgeon: s.surgeon,
  assistant: intraop?.assistant ?? "",
  anesthetist: s.anesthetist ?? "",
  scrub: intraop?.scrub ?? "",
  anesthesia: intraop?.anesthesia || anesthesiaFrom(s.anesthesia),
  positions: intraop?.positions ?? [],
  antisepsis: intraop?.antisepsis ?? [],
  preDiagnosis: "",
  postDiagnosis: "",
  findings: "",
  pathology: undefined,
  pathologyMaterial: "",
  culture: undefined,
  cultureMaterial: "",
  opme: undefined,
  opmeText: "",
  catheter: undefined,
  catheterText: "",
  drain: undefined,
  drainText: "",
  bleeding: "",
  wound: "",
  destination: "",
  complications: undefined,
  complicationsText: "",
  text: "",
  postOp: "",
  signer: "",
})

/** Descrição já começada (rascunho) ou completa (assinada) para o mock. */
export const sampleDescription = (
  s: ISurgery,
  cid: string | undefined,
  intraop: IIntraopEvolution | undefined,
  complete: boolean,
  female = false,
): ISurgicalDescription => {
  const d: ISurgicalDescription = {
    ...blankDescription(s, cid, intraop),
    start: intraop?.checklist2At || s.start || "07:18",
    end: complete ? intraop?.procedureEnd || s.end || "08:40" : "",
    procedure: procedureWithSide(s),
    assistant: intraop?.assistant || "Dr. Hugo Sena",
    scrub: intraop?.scrub || "Diego Martins",
    anesthesia: intraop?.anesthesia || anesthesiaFrom(s.anesthesia) || "Raqui",
    positions: intraop?.positions.length ? intraop.positions : ["Dorsal"],
    antisepsis: intraop?.antisepsis.length
      ? intraop.antisepsis
      : ["Clorexidina degermante", "Clorexidina alcoólica"],
    preDiagnosis: cid ? `${s.procedure} indicada (CID ${cid})` : "",
    postDiagnosis: complete ? "O mesmo" : "",
    findings: complete
      ? "Achados compatíveis com o diagnóstico pré-operatório."
      : "",
    pathology: false,
    culture: false,
    opme: false,
    catheter: false,
    drain: false,
    bleeding: "Desprezível",
    wound: "Limpa",
    destination: "SRPA",
    complications: complete ? false : undefined,
    signer: complete ? s.surgeon : "",
  }
  return complete ? { ...d, text: descriptionText(d, female) } : d
}

const lower = (t: string) => t.trim().toLowerCase()
const sentence = (t: string) => {
  const s = t.trim().replace(/\.$/, "")
  return s ? `${s.charAt(0).toUpperCase()}${s.slice(1)}.` : ""
}
const list = (xs: string[]) =>
  xs.length <= 1
    ? (xs[0] ?? "")
    : `${xs.slice(0, -1).join(", ")} e ${xs.at(-1)}`

/** Texto da descrição técnica a partir das marcações (como no desenho). */
export const descriptionText = (d: ISurgicalDescription, female = false) =>
  [
    d.positions.length || d.anesthesia
      ? sentence(
          [
            d.positions.length &&
              `Paciente em posição ${lower(list(d.positions))}`,
            d.anesthesia && `sob anestesia ${lower(d.anesthesia)}`,
          ]
            .filter(Boolean)
            .join(", "),
        )
      : "",
    d.antisepsis.length &&
      `Realizada antissepsia com ${lower(list(d.antisepsis))} e colocação de campos estéreis.`,
    d.procedure && `Realizada ${lower(d.procedure)}.`,
    d.findings.trim() && `Achados: ${lower(d.findings).replace(/\.$/, "")}.`,
    d.pathology &&
      `Material enviado para anatomopatológico${d.pathologyMaterial.trim() ? `: ${lower(d.pathologyMaterial)}` : ""}.`,
    d.culture &&
      `Material enviado para cultura${d.cultureMaterial.trim() ? `: ${lower(d.cultureMaterial)}` : ""}.`,
    d.opme &&
      d.opmeText.trim() &&
      `Material especial utilizado: ${lower(d.opmeText)}.`,
    d.catheter &&
      `Passada sonda vesical${d.catheterText.trim() ? ` ${d.catheterText.trim()}` : ""}.`,
    d.drain &&
      `Deixado dreno${d.drainText.trim() ? `: ${lower(d.drainText)}` : ""}.`,
    d.bleeding && `Sangramento ${lower(d.bleeding)}.`,
    d.complications === undefined
      ? ""
      : d.complications
        ? `Procedimento com intercorrências${d.complicationsText.trim() ? `: ${lower(d.complicationsText).replace(/\.$/, "")}` : ""}.`
        : "Procedimento sem intercorrências.",
    d.destination &&
      (d.destination === "Alta para domicílio"
        ? "Paciente com alta para domicílio em bom estado geral."
        : `Paciente ${female ? "encaminhada" : "encaminhado"} à ${d.destination.startsWith("Internação") ? lower(d.destination) : d.destination} em bom estado geral.`),
  ]
    .filter(Boolean)
    .join(" ")

/** Pendências no formato do desenho: "Seção: campo". */
export const descriptionMissing = (d: ISurgicalDescription) =>
  [
    !d.date.trim() && "Identificação: Data",
    !d.start && "Identificação: Início da cirurgia",
    !d.end && "Identificação: Término da cirurgia",
    !d.procedure.trim() && "Identificação: Procedimento realizado",
    !d.cid.trim() && "Identificação: CID",
    !d.side && "Identificação: Lateralidade",
    !d.surgeon.trim() && "Equipe: Cirurgião",
    !d.anesthesia && "Anestesia: Anestesia",
    !d.positions.length && "Posicionamento: marque ao menos uma posição",
    !d.preDiagnosis.trim() && "Diagnóstico: Diagnóstico pré-operatório",
    !d.postDiagnosis.trim() && "Diagnóstico: Diagnóstico pós-operatório",
    !d.findings.trim() && "Achados: Achados operatórios",
    d.pathology === undefined &&
      "Achados: Material enviado para anatomopatológico?",
    d.pathology && !d.pathologyMaterial.trim() && "Achados: Qual material?",
    d.culture && !d.cultureMaterial.trim() && "Achados: Material para cultura",
    d.opme && !d.opmeText.trim() && "Achados: Qual OPME ou material especial?",
    d.catheter === undefined &&
      "Sondas: Sonda vesical ao final do procedimento?",
    d.catheter && !d.catheterText.trim() && "Sondas: Tipo, calibre e vias",
    d.drain === undefined && "Drenos: Dreno?",
    d.drain && !d.drainText.trim() && "Drenos: Tipo e local do dreno",
    !d.bleeding && "Desfecho: Sangramento",
    !d.destination && "Desfecho: Destino",
    d.complications === undefined && "Desfecho: Houve intercorrências?",
    d.complications &&
      !d.complicationsText.trim() &&
      "Desfecho: Descreva as intercorrências",
    !d.text.trim() && "Descrição do procedimento: Descrição técnica",
    !d.signer && "Assinatura: Cirurgião (CRM-DF)",
  ].filter(Boolean) as string[]
