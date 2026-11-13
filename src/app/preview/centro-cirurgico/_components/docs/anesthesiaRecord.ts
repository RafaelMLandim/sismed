import { TODAY_ISO } from "../../_data/days"
import { PROFESSIONALS } from "../../_data/evolutions"
import { MOCK_NOW } from "../../_data/fixtures"
import type { ISurgery } from "../../_data/types"
import { fmtDuration, fromMin, toMin } from "../../_data/time"
import type { IPreAnesthesia } from "./preAnesthesia"

/** Momentos da linha do tempo que chegam do tablet da sala. */
export type TimelineKind =
  | "entrada"
  | "monitorizacao"
  | "tecnica"
  | "bloqueio"
  | "inicio"
  | "fim"
  | "saida"

export interface ITimelineEvent {
  kind: TimelineKind
  /** "HH:mm"; vazio = ainda não aconteceu (cirurgia em andamento). */
  time: string
}

/** Uma coluna da tabela de sinais vitais intraoperatórios (tablet). */
export interface IIntraopVital {
  time: string
  sys: number
  dia: number
  hr: number
  spo2: number
  /** undefined = sem capnografia na hora da aferição ("—"). */
  etco2?: number
  temp: number
}

export interface IDrugRow {
  id: string
  time: string
  drug: string
  dose: string
  route: string
  note: string
}

/** Conteúdo do D11 · Boletim anestésico. */
export interface IAnesthesiaRecord {
  timeline: ITimelineEvent[]
  technique: string
  asa: string
  position: string
  venousAccess: string
  needle: string
  space: string
  punctures: string
  localAnesthetic: string
  sensoryLevel: string
  monitoring: string[]
  airway: string
  intubation: string
  tube: string
  vitals: IIntraopVital[]
  drugs: IDrugRow[]
  ringer: string
  saline: string
  blood: string
  diuresis: string
  bleeding: string
  irrigation: string
  incidents?: boolean
  incidentsText: string
  destination: string
  exitCondition: string
  aldrete: string
  pain: string
  postOpPrescription: string
  signer: string
}

export const ANESTHETISTS = PROFESSIONALS.Anestesia
export const anesthetistLabel = (name: string) =>
  `${name} · ${ANESTHETISTS.find((a) => a.name === name)?.council ?? ""}`

// Opções do frame "Dropdowns · Centro cirúrgico e anestesia".
export const TECHNIQUES = [
  "Geral balanceada",
  "Geral venosa total",
  "Raquianestesia",
  "Raquianestesia + sedação",
  "Peridural",
  "Bloqueio periférico + sedação",
  "Sedação",
]
export const ASA = ["I", "II", "III", "IV", "V"]
export const POSITIONS = [
  "Decúbito dorsal",
  "Litotomia",
  "Prona",
  "Lateral",
  "Cadeira de praia",
  "Trendelenburg",
]
export const SPACES = ["L2–L3", "L3–L4", "L4–L5"]
export const SENSORY_LEVELS = ["T4", "T6", "T8", "T10", "T12"]
export const MONITORING = [
  "ECG",
  "PANI",
  "SpO₂",
  "Capnografia",
  "Temperatura",
  "PAI",
  "BIS",
  "TOF",
]
export const AIRWAYS = [
  "Ar ambiente",
  "Cateter nasal de O₂ 2 L/min",
  "Máscara facial",
  "Máscara laríngea",
  "Intubação orotraqueal",
]
export const INTUBATION = [
  "Não se aplica",
  "Fácil",
  "Difícil",
  "Com videolaringoscópio",
]
export const NOT_APPLICABLE = INTUBATION[0]
/** Tubo endotraqueal (mesma lista do D03). */
export const TUBES = ["Não se aplica", "Nº 6,5", "Nº 7,0", "Nº 7,5", "Nº 8,0"]
export const ROUTES = ["EV", "Raqui", "Peridural", "IM", "SC", "Inalatória"]
export const ALDRETE = ["10", "9", "8", "7", "6 ou menos"]
export const PAIN = ["0", "1 a 3", "4 a 6", "7 a 9", "10"]
export const DESTINATIONS = [
  "SRPA",
  "UTI",
  "Internação (enfermaria)",
  "Internação (apartamento)",
  "Alta para domicílio",
]

export type TechniqueKind = "neuraxial" | "geral" | "bloqueio" | "sedacao"

export const techniqueKind = (t: string): TechniqueKind => {
  const a = t.toLowerCase()
  if (a.startsWith("raqui") || a.startsWith("peridural")) return "neuraxial"
  if (a.startsWith("geral")) return "geral"
  if (a.startsWith("bloqueio")) return "bloqueio"
  return "sedacao"
}

/** Rótulo de cada evento da linha do tempo, conforme a técnica. */
export const timelineLabel = (e: ITimelineEvent, d: IAnesthesiaRecord) => {
  const kind = techniqueKind(d.technique)
  switch (e.kind) {
    case "entrada":
      return "Entrada em sala"
    case "monitorizacao":
      return "Monitorização"
    case "tecnica":
      return kind === "geral"
        ? "Indução"
        : kind === "neuraxial"
          ? d.technique.startsWith("Peridural")
            ? "Peridural"
            : "Raquianestesia"
          : kind === "bloqueio"
            ? "Bloqueio periférico"
            : "Sedação"
    case "bloqueio":
      return kind === "geral"
        ? "Intubação"
        : kind === "neuraxial" && d.sensoryLevel
          ? `Bloqueio em ${d.sensoryLevel}`
          : "Bloqueio instalado"
    case "inicio":
      return "Início da cirurgia"
    case "fim":
      return "Fim da cirurgia"
    case "saida":
      return d.destination === "SRPA" || !d.destination
        ? "Saída para SRPA"
        : "Saída de sala"
  }
}

const eventTime = (d: IAnesthesiaRecord, k: TimelineKind) =>
  d.timeline.find((e) => e.kind === k)?.time ?? ""

const span = (from: string, to: string) =>
  from && to ? fmtDuration(toMin(to) - toMin(from)) : "Em andamento"

/** Tempos de anestesia, cirúrgico e em sala (a partir da linha do tempo). */
export const durationsOf = (d: IAnesthesiaRecord) => ({
  anesthesia: span(eventTime(d, "tecnica"), eventTime(d, "saida")),
  surgery: span(eventTime(d, "inicio"), eventTime(d, "fim")),
  room: span(eventTime(d, "entrada"), eventTime(d, "saida")),
})

/** Número em ml de um campo de texto ("1.000", "250", "") → 0 se vazio. */
export const mlOf = (v: string) =>
  Number(v.replace(/\./g, "").replace(",", ".")) || 0

export const fmtMl = (v: number) =>
  `${v > 0 ? "+ " : v < 0 ? "− " : ""}${Math.abs(v).toLocaleString("pt-BR")} ml`

export const balanceOf = (d: IAnesthesiaRecord) =>
  mlOf(d.ringer) +
  mlOf(d.saline) +
  mlOf(d.blood) -
  mlOf(d.diuresis) -
  mlOf(d.bleeding) -
  mlOf(d.irrigation)

/** PAS com queda maior que 20% da primeira aferição → vermelho. */
export const isHypotension = (v: IIntraopVital, first?: IIntraopVital) =>
  !!first && v.sys < first.sys * 0.8

let rowSeq = 0
export const newDrugRow = (p: Partial<IDrugRow> = {}): IDrugRow => ({
  id: `drug-${++rowSeq}`,
  time: "",
  drug: "",
  dose: "",
  route: "EV",
  note: "",
  ...p,
})

/** Modelos de "Meus modelos" (PEP-07) para o boletim. */
export const ANESTHESIA_RECORD_MODELS: {
  name: string
  patch: Partial<IAnesthesiaRecord>
}[] = [
  {
    name: "Raqui + sedação (padrão)",
    patch: {
      technique: "Raquianestesia + sedação",
      venousAccess: "18G · MSD",
      needle: "Quincke 25G",
      space: "L3–L4",
      punctures: "1",
      localAnesthetic: "Bupivacaína 0,5% pesada 15 mg",
      sensoryLevel: "T10",
      monitoring: ["ECG", "PANI", "SpO₂", "Capnografia", "Temperatura"],
      airway: AIRWAYS[1],
      intubation: NOT_APPLICABLE,
      tube: NOT_APPLICABLE,
      postOpPrescription:
        "Manter O₂ se SpO₂ menor que 92%. Dipirona 1 g EV se dor. Liberar dieta após regressão do bloqueio.",
    },
  },
  {
    name: "Geral balanceada · IOT",
    patch: {
      technique: "Geral balanceada",
      venousAccess: "18G · MSE",
      monitoring: ["ECG", "PANI", "SpO₂", "Capnografia", "Temperatura", "BIS"],
      airway: "Intubação orotraqueal",
      intubation: "Fácil",
      tube: "Nº 7,5",
      postOpPrescription:
        "O₂ por cateter nasal 2 L/min. Dipirona 1 g EV 6/6 h se dor. Ondansetrona 4 mg EV se náuseas.",
    },
  },
  {
    name: "Sedação · exame endoscópico",
    patch: {
      technique: "Sedação",
      venousAccess: "22G · MSE",
      monitoring: ["ECG", "PANI", "SpO₂", "Capnografia"],
      airway: AIRWAYS[1],
      intubation: NOT_APPLICABLE,
      tube: NOT_APPLICABLE,
      postOpPrescription:
        "Observar até Aldrete 10. Liberar dieta leve após 1 hora.",
    },
  },
]

const techniqueOf = (s: ISurgery, pre?: IPreAnesthesia) => {
  const plan = (pre?.plan ?? s.anesthesia?.split(" · ")[0] ?? "").toLowerCase()
  if (plan.startsWith("raqui +") || plan.startsWith("raqui+"))
    return "Raquianestesia + sedação"
  if (plan.startsWith("raqui")) return "Raquianestesia"
  if (plan.startsWith("peridural")) return "Peridural"
  if (plan.startsWith("bloqueio")) return "Bloqueio periférico + sedação"
  if (plan.startsWith("sedação") || plan.startsWith("local")) return "Sedação"
  if (plan.includes("venosa total")) return "Geral venosa total"
  return "Geral balanceada"
}

const asaOf = (s: ISurgery, pre?: IPreAnesthesia) =>
  pre?.asa ?? s.anesthesia?.match(/ASA (IV|V|I{1,3})/)?.[1] ?? ""

/**
 * Horário de referência e o "agora" do tablet. Cirurgias que ainda não saíram
 * da sala hoje só mostram o que já aconteceu até MOCK_NOW.
 */
const clockOf = (s: ISurgery) => {
  const entry = toMin(s.enteredRoomAt ?? s.start ?? "08:00")
  const live = !s.leftRoomAt && (!s.date || s.date === TODAY_ISO)
  const now = live ? toMin(MOCK_NOW) : Infinity
  return { entry, now }
}

/** Linha do tempo vinda do tablet, deslocada para os horários da cirurgia. */
const timelineOf = (s: ISurgery): ITimelineEvent[] => {
  const { entry, now } = clockOf(s)
  const exit = s.leftRoomAt ? toMin(s.leftRoomAt) : undefined
  const incision = entry + 22
  const planned =
    s.durationMin ??
    (s.start && s.end ? toMin(s.end) - toMin(s.start) : undefined) ??
    68
  // Sem saída registrada: o fim segue a duração prevista.
  const end =
    exit !== undefined ? Math.max(incision + 10, exit - 8) : incision + planned
  const out = exit ?? end + 8
  const at = (min: number) => (min <= now ? fromMin(min) : "")
  return [
    { kind: "entrada", time: at(entry) },
    { kind: "monitorizacao", time: at(entry + 6) },
    { kind: "tecnica", time: at(entry + 10) },
    { kind: "bloqueio", time: at(entry + 18) },
    { kind: "inicio", time: at(incision) },
    { kind: "fim", time: at(end) },
    { kind: "saida", time: at(out) },
  ]
}

// Valores do desenho (PA, FC, SpO₂, EtCO₂, temperatura) a cada coluna.
const VITALS_SAMPLE: Omit<IIntraopVital, "time">[] = [
  { sys: 148, dia: 86, hr: 78, spo2: 96, temp: 36.4 },
  { sys: 132, dia: 78, hr: 74, spo2: 98, etco2: 34, temp: 36.3 },
  { sys: 104, dia: 62, hr: 92, spo2: 98, etco2: 35, temp: 36.1 },
  { sys: 118, dia: 70, hr: 80, spo2: 99, etco2: 36, temp: 36.0 },
  { sys: 122, dia: 72, hr: 76, spo2: 99, etco2: 35, temp: 35.9 },
  { sys: 126, dia: 74, hr: 74, spo2: 99, etco2: 35, temp: 35.9 },
  { sys: 124, dia: 72, hr: 72, spo2: 99, etco2: 34, temp: 35.8 },
  { sys: 128, dia: 76, hr: 74, spo2: 98, etco2: 34, temp: 35.8 },
]

/** Sinais vitais do tablet: 3 min após a entrada, depois a cada 10–15 min. */
const vitalsOf = (s: ISurgery, timeline: ITimelineEvent[]): IIntraopVital[] => {
  const { entry, now } = clockOf(s)
  const out = timeline.find((e) => e.kind === "saida")?.time
  const last = out ? toMin(out) : Infinity
  const offsets = [3, 13, 23]
  for (let t = 38; entry + t <= last && t < 600; t += 15) offsets.push(t)
  return offsets
    .map((o) => entry + o)
    .filter((m) => m <= now && m <= last)
    .map((m, i) => ({
      time: fromMin(m),
      ...VITALS_SAMPLE[Math.min(i, VITALS_SAMPLE.length - 1)],
    }))
}

/** Fármacos registrados no tablet, conforme a técnica. */
const drugsOf = (s: ISurgery, technique: string): IDrugRow[] => {
  const { entry, now } = clockOf(s)
  const kind = techniqueKind(technique)
  const rows: [number, string, string, string, string][] =
    kind === "geral"
      ? [
          [
            6,
            "Cefazolina",
            "2 g",
            "EV",
            "Profilaxia · 60 min antes da incisão",
          ],
          [10, "Fentanil", "150 mcg", "EV", "Indução"],
          [10, "Propofol", "150 mg", "EV", "Indução"],
          [11, "Rocurônio", "50 mg", "EV", "Intubação"],
          [14, "Sevoflurano", "2%", "Inalatória", "Manutenção"],
          [24, "Dexametasona", "8 mg", "EV", "Profilaxia de náuseas"],
        ]
      : kind === "sedacao"
        ? [
            [6, "Midazolam", "2 mg", "EV", "Sedação leve"],
            [10, "Fentanil", "50 mcg", "EV", ""],
            [10, "Propofol", "80 mg", "EV", "Sedação"],
          ]
        : [
            [6, "Midazolam", "2 mg", "EV", "Sedação leve"],
            [
              8,
              "Cefazolina",
              "2 g",
              "EV",
              "Profilaxia · 60 min antes da incisão",
            ],
            [10, "Bupivacaína 0,5% pesada", "15 mg", "Raqui", ""],
            [10, "Morfina", "80 mcg", "Raqui", "Analgesia pós-operatória"],
            [24, "Efedrina", "10 mg", "EV", "Hipotensão 104/62"],
            [28, "Ondansetrona", "4 mg", "EV", "Profilaxia de náuseas"],
          ]
  return rows
    .filter(([o]) => entry + o <= now)
    .map(([o, drug, dose, route, note]) =>
      newDrugRow({ time: fromMin(entry + o), drug, dose, route, note }),
    )
}

/** Boletim em branco: só o que veio do tablet e do D10. */
export const blankAnesthesiaRecord = (
  s: ISurgery,
  pre?: IPreAnesthesia,
): IAnesthesiaRecord => {
  const timeline = timelineOf(s)
  return {
    timeline,
    technique: techniqueOf(s, pre),
    asa: asaOf(s, pre),
    position: pre?.position ?? POSITIONS[0],
    venousAccess: "",
    needle: "",
    space: "",
    punctures: "",
    localAnesthetic: "",
    sensoryLevel: "",
    monitoring: [],
    airway: "",
    intubation: "",
    tube: "",
    vitals: vitalsOf(s, timeline),
    drugs: [],
    ringer: "",
    saline: "",
    blood: "",
    diuresis: "",
    bleeding: "",
    irrigation: "",
    incidentsText: "",
    destination: "",
    exitCondition: "",
    aldrete: "",
    pain: "",
    postOpPrescription: "",
    signer: s.anesthetist ?? ANESTHETISTS[0].name,
  }
}

/**
 * Boletim preenchido (exemplo do desenho), para os documentos que o mock
 * começa em rascunho (`complete = false`) ou assinados.
 */
export const sampleAnesthesiaRecord = (
  s: ISurgery,
  pre: IPreAnesthesia | undefined,
  complete: boolean,
): IAnesthesiaRecord => {
  const base = blankAnesthesiaRecord(s, pre)
  const kind = techniqueKind(base.technique)
  const model =
    ANESTHESIA_RECORD_MODELS[kind === "geral" ? 1 : kind === "sedacao" ? 2 : 0]
      .patch
  const partial: IAnesthesiaRecord = {
    ...base,
    ...model,
    technique: base.technique,
    asa: base.asa || "II",
    ...(kind === "bloqueio"
      ? {
          needle: "Stimuplex 22G 50 mm",
          localAnesthetic: "Ropivacaína 0,5% 20 ml",
        }
      : {}),
    ...(kind === "neuraxial" && base.technique.startsWith("Peridural")
      ? {
          needle: "Tuohy 18G",
          localAnesthetic: "Ropivacaína 0,75% 15 ml",
          sensoryLevel: "T8",
        }
      : {}),
    drugs: drugsOf(s, base.technique),
    ringer: "1.000",
    saline: "250",
  }
  if (!complete) return { ...partial, postOpPrescription: "" }
  const first = partial.vitals[0]
  const hypo = partial.vitals.find((v) => isHypotension(v, first))
  return {
    ...partial,
    diuresis: kind === "neuraxial" ? "350" : "",
    bleeding: "200",
    incidents: !!hypo && kind === "neuraxial",
    incidentsText:
      hypo && kind === "neuraxial"
        ? `${hypo.time} hipotensão (${hypo.sys}/${hypo.dia}) após o bloqueio, revertida com efedrina 10 mg EV e 250 ml de SF 0,9%. Sem outras intercorrências.`
        : "",
    destination: "SRPA",
    exitCondition:
      kind === "neuraxial"
        ? "Estável, consciente, bloqueio em regressão"
        : "Estável, acordado, respirando espontaneamente",
    aldrete: "9",
    pain: "0",
  }
}

/** Pendências para assinar (campos obrigatórios e condicionais). */
export const anesthesiaRecordMissing = (d: IAnesthesiaRecord) => {
  const kind = techniqueKind(d.technique)
  const needsNeedle = kind === "neuraxial" || kind === "bloqueio"
  const incomplete = d.drugs.filter(
    (r) =>
      (r.drug.trim() || r.dose.trim()) &&
      !(r.drug.trim() && r.dose.trim() && r.time),
  )
  return [
    !d.technique && "Escolha a técnica anestésica",
    !d.asa && "Escolha a classificação ASA",
    !d.venousAccess.trim() && "Informe o acesso venoso",
    needsNeedle && !d.needle.trim() && "Informe a agulha",
    kind === "neuraxial" && !d.space && "Escolha o espaço da punção",
    needsNeedle && !d.localAnesthetic.trim() && "Informe o anestésico local",
    kind === "neuraxial" && !d.sensoryLevel && "Escolha o nível sensitivo",
    kind === "geral" &&
      (!d.intubation || d.intubation === NOT_APPLICABLE) &&
      "Informe como foi a intubação",
    !d.monitoring.length && "Marque a monitorização utilizada",
    incomplete.length > 0 &&
      `Complete horário, fármaco e dose em ${incomplete.length} linha(s) de fármacos`,
    d.incidents === undefined && "Responda se houve intercorrências",
    d.incidents && !d.incidentsText.trim() && "Descreva as intercorrências",
    !d.destination && "Escolha o destino",
    !d.exitCondition.trim() && "Informe a condição na saída",
  ].filter(Boolean) as string[]
}
