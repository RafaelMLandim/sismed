import { PROFESSIONALS } from "../../_data/evolutions"
import { fromMin, toMin } from "../../_data/time"
import type { ISurgery, IVitalSign } from "../../_data/types"

/** Conteúdo do D03 · Evolução intraoperatória. */
export interface IIntraopEvolution {
  // Identificação e equipe
  surgeon: string
  circulating: string
  scrub: string
  assistant: string
  procedure: string
  cid: string
  // Dados da anestesia
  anesthesiaStart: string
  anesthesiaEnd: string
  anesthesia: string
  anesthetist: string
  ett: string
  lma: string
  wiredTube: string
  // Posicionamento, antissepsia e dispositivos
  positions: string[]
  antisepsis: string[]
  svd: string
  svdNumber: string
  svdWays: string
  svdBalloon: string
  svdBy: string
  cautery: string
  cauteryPlace: string
  incision: string
  incisionPlace: string
  // Admissão em sala e etapas do check list
  roomTime: string
  arrival: string
  sys: string
  dia: string
  hr: string
  spo2: string
  checklist1At: string
  avpSite: string
  avpBy: string
  checklist2At: string
  // Término e encaminhamento
  procedureEnd: string
  complications: string
  complicationsText: string
  srpaAt: string
  venousAccess: string
  // Evolução de enfermagem
  text: string
  signer: string
}

export const NA = "Não se aplica"

// Opções do desenho (PEP-D03) e do frame "Dropdowns · Centro cirúrgico e anestesia".
export const ANESTHESIAS = [
  "Geral",
  "Raqui",
  "Raqui + sedação",
  "Peridural",
  "Bloqueio periférico",
  "Bloqueio periférico + sedação",
  "Sedação",
  "Local",
]
export const ETT = [NA, "Nº 6,5", "Nº 7,0", "Nº 7,5", "Nº 8,0"]
export const LMA = [NA, "Nº 3", "Nº 4", "Nº 5"]
export const WIRED_TUBE = [NA, "Nº 6,5", "Nº 7,0", "Nº 7,5"]
export const POSITIONS = [
  "Dorsal",
  "Ventral",
  "Ginecológica",
  "Lateral",
  "Direita",
  "Esquerda",
  "Proclive",
  "Trendelenburg",
  "Litotomia",
]
export const ANTISEPSIS = [
  "Clorexidina degermante",
  "Clorexidina alcoólica",
  "Clorexidina aquosa",
]
export const SVD = [NA, "Látex", "Silicone"]
export const SVD_WAYS = ["2 vias", "3 vias"]
export const CAUTERY_USED = "Utilizada"
export const CAUTERY = [CAUTERY_USED, "Não utilizada"]
export const INCISION = ["Sim", "Não", "Procedimento endoscópico"]
export const ARRIVAL = [
  "Maca",
  "Cadeira de rodas",
  "Deambulando",
  "No próprio leito",
]
export const AVP_SITES = [
  "MSD",
  "MSE",
  "MID",
  "MIE",
  "Jugular externa",
  "Acesso venoso central",
]
export const ACCESS_CONDITION = [
  "Pérvio",
  "Infiltrado",
  "Obstruído",
  "Retirado",
]
export const NO_COMPLICATIONS = "Sem intercorrências"
export const WITH_COMPLICATIONS = "Com intercorrências"
export const COMPLICATIONS = [NO_COMPLICATIONS, WITH_COMPLICATIONS]

export const NURSES = PROFESSIONALS.Enfermagem
export const nurseLabel = (name: string) =>
  `${name} · ${NURSES.find((n) => n.name === name)?.council ?? ""}`

export const INTRAOP_MODELS: {
  name: string
  patch: Partial<IIntraopEvolution>
}[] = [
  {
    name: "Raqui + SVD 3 vias",
    patch: {
      anesthesia: "Raqui",
      ett: NA,
      lma: NA,
      wiredTube: NA,
      positions: ["Dorsal"],
      antisepsis: ["Clorexidina degermante", "Clorexidina alcoólica"],
      svd: "Silicone",
      svdNumber: "18",
      svdWays: "3 vias",
      svdBalloon: "15",
      cautery: CAUTERY_USED,
      cauteryPlace: "Coxa direita",
      incision: "Sim",
      arrival: "Maca",
      avpSite: "MSE",
      venousAccess: "Pérvio",
    },
  },
  {
    name: "Geral IOT sem SVD",
    patch: {
      anesthesia: "Geral",
      ett: "Nº 7,5",
      lma: NA,
      wiredTube: NA,
      positions: ["Dorsal"],
      antisepsis: ["Clorexidina degermante", "Clorexidina alcoólica"],
      svd: NA,
      cautery: CAUTERY_USED,
      cauteryPlace: "Panturrilha direita",
      incision: "Sim",
      arrival: "Maca",
      avpSite: "MSD",
      venousAccess: "Pérvio",
    },
  },
  {
    name: "Sedação · procedimento endoscópico",
    patch: {
      anesthesia: "Sedação",
      ett: NA,
      lma: NA,
      wiredTube: NA,
      positions: ["Lateral", "Esquerda"],
      antisepsis: [],
      svd: NA,
      cautery: "Não utilizada",
      incision: "Procedimento endoscópico",
      arrival: "Maca",
      avpSite: "MSD",
      venousAccess: "Pérvio",
    },
  },
]

/** "Raquianestesia · ASA III" → "Raqui". */
export const anesthesiaFrom = (s?: string) => {
  const t = (s ?? "").split("·")[0].trim().toLowerCase()
  if (!t) return ""
  if (t.startsWith("raqui")) return "Raqui"
  if (t.startsWith("geral")) return "Geral"
  if (t.startsWith("seda")) return "Sedação"
  if (t.startsWith("perid")) return "Peridural"
  if (t.startsWith("bloq")) return "Bloqueio periférico"
  if (t.startsWith("local")) return "Local"
  return ""
}

/** Procedimento com lateralidade: "Artroplastia parcial de quadril esquerdo". */
export const procedureWithSide = (s: ISurgery) =>
  s.side && s.side !== NA
    ? `${s.procedure} ${s.side.toLowerCase()}`
    : s.procedure

const plus = (hhmm: string, min: number) => fromMin(toMin(hhmm) + min)

/** Evolução em branco, com o que o sistema já sabe da cirurgia. */
export const blankIntraop = (
  s: ISurgery,
  cid: string | undefined,
  v?: IVitalSign,
): IIntraopEvolution => ({
  surgeon: s.surgeon,
  circulating: "",
  scrub: "",
  assistant: "",
  procedure: procedureWithSide(s),
  cid: cid ?? "",
  anesthesiaStart: "",
  anesthesiaEnd: "",
  anesthesia: anesthesiaFrom(s.anesthesia),
  anesthetist: s.anesthetist ?? "",
  ett: NA,
  lma: NA,
  wiredTube: NA,
  positions: [],
  antisepsis: [],
  svd: "",
  svdNumber: "",
  svdWays: "",
  svdBalloon: "",
  svdBy: "",
  cautery: "",
  cauteryPlace: "",
  incision: "",
  incisionPlace: "",
  roomTime: s.enteredRoomAt ?? "",
  arrival: "",
  sys: v ? String(v.sys) : "",
  dia: v ? String(v.dia) : "",
  hr: v ? String(v.hr) : "",
  spo2: v ? String(v.spo2) : "",
  checklist1At: "",
  avpSite: "",
  avpBy: "",
  checklist2At: "",
  procedureEnd: "",
  complications: "",
  complicationsText: "",
  srpaAt: "",
  venousAccess: "",
  text: "",
  signer: "",
})

/**
 * Evolução já começada (rascunho) ou completa (assinada), para os documentos
 * que o mock começa assim sem conteúdo salvo.
 */
export const sampleIntraop = (
  s: ISurgery,
  cid: string | undefined,
  v: IVitalSign | undefined,
  complete: boolean,
): IIntraopEvolution => {
  const room = s.enteredRoomAt ?? "07:22"
  const nurse = NURSES[2].name
  const d: IIntraopEvolution = {
    ...blankIntraop(s, cid, v),
    roomTime: room,
    circulating: nurse,
    scrub: "Diego Martins",
    assistant: "Dr. Hugo Sena",
    anesthesia: anesthesiaFrom(s.anesthesia) || "Raqui",
    anesthetist: s.anesthetist ?? PROFESSIONALS.Anestesia[1].name,
    anesthesiaStart: plus(room, 18),
    anesthesiaEnd: complete ? plus(room, 160) : "",
    positions: ["Lateral", "Direita"],
    antisepsis: ["Clorexidina degermante", "Clorexidina alcoólica"],
    svd: "Silicone",
    svdNumber: "16",
    svdWays: "2 vias",
    svdBalloon: "10",
    svdBy: nurse,
    cautery: CAUTERY_USED,
    cauteryPlace: "Coxa direita",
    incision: "Sim",
    incisionPlace: "Face lateral do quadril",
    arrival: "Maca",
    sys: v ? String(v.sys) : "142",
    dia: v ? String(v.dia) : "86",
    hr: v ? String(v.hr) : "82",
    spo2: v ? String(v.spo2) : "96",
    checklist1At: plus(room, 8),
    avpSite: "MSE",
    avpBy: nurse,
    checklist2At: plus(room, 43),
    procedureEnd: complete ? plus(room, 150) : "",
    complications: NO_COMPLICATIONS,
    srpaAt: complete ? plus(room, 170) : "",
    venousAccess: "Pérvio",
    signer: nurse,
  }
  return { ...d, text: intraopText(d) }
}

const hh = (t: string) => `${t || "__:__"}H`

/** Texto da evolução de enfermagem a partir das marcações (maiúsculas). */
export const intraopText = (d: IIntraopEvolution) => {
  const svd = d.svd && d.svd !== NA
  const admission = [
    `${hh(d.roomTime)} PACIENTE ADMITIDO EM SALA OPERATÓRIA${d.arrival ? ` EM AUXÍLIO DE ${d.arrival}` : ""}`,
    "CONSCIENTE, ORIENTADO EM TEMPO E ESPAÇO, VERBALIZANDO, COM PULSEIRA DE IDENTIFICAÇÃO, COM EXAMES",
    `SSVV ESTÁVEIS PA: ${d.sys || "__"}X${d.dia || "__"} MMHG, FC: ${d.hr || "__"} BPM, SAT: ${d.spo2 || "__"}%;`,
  ].join(", ")
  const first = [
    `${hh(d.checklist1At)} REALIZADA PRIMEIRA ETAPA DO CHECK LIST COM PACIENTE E ANESTESISTA`,
    "FEITA CONFERÊNCIA DA PULSEIRA DE IDENTIFICAÇÃO",
    d.avpSite &&
      `REALIZADO AVP EM ${d.avpSite}${d.avpBy ? ` POR ${d.avpBy}` : ""}`,
    d.cautery === CAUTERY_USED &&
      `COLOCAÇÃO DA PLACA DE BISTURI${d.cauteryPlace ? ` EM ${d.cauteryPlace}` : ""}`,
    d.anesthesia &&
      `REALIZADA ANESTESIA ${d.anesthesia}${d.anesthetist ? ` POR ${d.anesthetist}` : ""}`,
  ]
    .filter(Boolean)
    .join(", ")
  const second = [
    `${hh(d.checklist2At)} REALIZADA SEGUNDA ETAPA DO CHECK LIST COM EQUIPE COMPLETA`,
    svd &&
      [
        `REALIZADA SONDAGEM VESICAL DE DEMORA DE ${d.svd} N° ${d.svdNumber || "__"}`,
        d.svdWays,
        `BALÃO INSUFLADO COM ${d.svdBalloon || "__"} ML`,
        d.svdBy && `POR ${d.svdBy}`,
      ]
        .filter(Boolean)
        .join(", "),
    "INÍCIO DO PROCEDIMENTO",
  ]
    .filter(Boolean)
    .join(", ")
  const end = [
    `${hh(d.procedureEnd)} PROCEDIMENTO REALIZADO ${
      d.complications === WITH_COMPLICATIONS
        ? `COM INTERCORRÊNCIAS${d.complicationsText.trim() ? `: ${d.complicationsText.trim()}` : ""}`
        : "SEM INTERCORRÊNCIAS"
    }`,
    d.srpaAt &&
      `ENCAMINHADO À SRPA ÀS ${d.srpaAt}H${d.venousAccess ? ` COM ACESSO VENOSO ${d.venousAccess}` : ""}`,
  ]
    .filter(Boolean)
    .join(", ")
  return [admission, `${first};`, `${second};`, `${end};`]
    .join("\n")
    .toUpperCase()
}

/** Pendências no formato do desenho: "Seção: campo". */
export const intraopMissing = (d: IIntraopEvolution) => {
  const svd = !!d.svd && d.svd !== NA
  return [
    !d.circulating.trim() && "Equipe: Circulante",
    !d.anesthesiaStart && "Anestesia: Início",
    !d.anesthesiaEnd && "Anestesia: Término",
    !d.anesthesia && "Anestesia: Anestesia",
    !d.anesthetist.trim() && "Anestesia: Anestesia realizada por",
    !d.positions.length && "Posicionamento: marque ao menos uma posição",
    !d.antisepsis.length && "Antissepsia: marque ao menos uma opção",
    !d.svd && "Dispositivos: SVD",
    svd && !d.svdNumber.trim() && "Dispositivos: Nº da SVD",
    svd && !d.svdWays && "Dispositivos: Vias da SVD",
    svd && !d.svdBalloon.trim() && "Dispositivos: Balão insuflado com",
    svd && !d.svdBy.trim() && "Dispositivos: SVD passada por",
    !d.cautery && "Dispositivos: Placa de bisturi elétrico",
    d.cautery === CAUTERY_USED &&
      !d.cauteryPlace.trim() &&
      "Dispositivos: Local da placa",
    !d.incision && "Dispositivos: Incisão cirúrgica",
    d.incision === "Sim" &&
      !d.incisionPlace.trim() &&
      "Dispositivos: Local da incisão",
    !d.roomTime && "Admissão em sala: Horário",
    !d.sys.trim() && "Admissão em sala: PAS",
    !d.dia.trim() && "Admissão em sala: PAD",
    !d.hr.trim() && "Admissão em sala: FC",
    !d.spo2.trim() && "Admissão em sala: SpO₂",
    !d.checklist1At && "Check list: 1ª etapa",
    !d.checklist2At && "Check list: 2ª etapa e início",
    !d.procedureEnd && "Término: Término do procedimento",
    !d.complications && "Término: Intercorrências",
    d.complications === WITH_COMPLICATIONS &&
      !d.complicationsText.trim() &&
      "Término: Descreva as intercorrências",
    !d.srpaAt && "Término: Encaminhamento à SRPA",
    !d.venousAccess && "Término: Acesso venoso",
    !d.text.trim() && "Evolução de enfermagem: Texto da evolução",
    !d.signer && "Assinatura: Enfermagem (COREN-DF)",
  ].filter(Boolean) as string[]
}
