import { dayLabel, isoToBR } from "../../_data/days"
import { MOCK_TODAY } from "../../_data/fixtures"
import type {
  IHospitalization,
  IPatient,
  IRoom,
  ISurgery,
} from "../../_data/types"
import { surgeryStep, type JourneyStep } from "../ui"

/**
 * Linha da lista de entrada (PEP-00): uma "passagem" do paciente. Internação e
 * cirurgia do mesmo paciente viram uma linha só, com as duas etiquetas.
 */
export interface IEntryRow {
  key: string
  patient: IPatient
  hosp?: IHospitalization
  surgery?: ISurgery
  procedure: string
  where: string
  doctor: string
  insurance: string
  sector: string
  step: JourneyStep
  stepSub: string
  /** "dd/MM/yyyy" do início da passagem (filtro de período). */
  startDate: string
  situation: "andamento" | "encerrada"
}

export type Situation = "andamento" | "agendadas" | "encerradas" | "todas"
export type TypeFilter = "todos" | "internacao" | "cirurgia"
export type PeriodFilter = "qualquer" | "hoje" | "proximos" | "7d" | "30d"

export interface IFilters {
  type: TypeFilter
  period: PeriodFilter
  doctor: string // "todos" ou nome
  insurance: string
  sector: string
}

export const DEFAULT_FILTERS: IFilters = {
  type: "todos",
  period: "qualquer",
  doctor: "todos",
  insurance: "todos",
  sector: "todos",
}

const SIDE_ABBR: Record<string, string> = {
  Esquerdo: "E",
  Direito: "D",
  Bilateral: "bilateral",
}

export const procedureLabel = (s: ISurgery) => {
  const side = s.side ? SIDE_ABBR[s.side] : undefined
  return side ? `${s.procedure} · ${side}` : s.procedure
}

const CLOSED_STAGES = new Set(["finalizada", "cancelada"])

const lowerFirst = (v: string) => v.charAt(0).toLowerCase() + v.slice(1)

const whereOf = (
  s: ISurgery | undefined,
  h: IHospitalization | undefined,
  rooms: IRoom[],
) => {
  const bed = h?.bed ?? s?.bed
  if (s?.stage === "em_cirurgia") {
    const room = rooms.find((r) => r.id === s.roomId)?.name ?? "Sala"
    return bed ? `${room} · ${lowerFirst(bed)}` : room
  }
  if (s?.stage === "srpa") return (s.srpaBed ?? "SRPA").replace(", ", " · ")
  if (s?.stage === "cancelada" && !h) return "—"
  return bed ?? "—"
}

/** "hoje às 14:00", "amanhã às 08:00", "12/11 às 09:00". */
const whenOf = (s: ISurgery) => {
  const label = dayLabel(s.date)
  return `${label.includes("/") ? `em ${label}` : label} às ${s.start}`
}

const surgerySub = (s: ISurgery, step: JourneyStep) => {
  switch (step) {
    case "em_cirurgia":
      return s.enteredRoomAt ? `desde ${s.enteredRoomAt}` : ""
    case "srpa":
      return s.leftRoomAt ? `desde ${s.leftRoomAt}` : ""
    case "pre_operatorio":
      return s.start ? `cirurgia ${whenOf(s)}` : ""
    case "finalizada":
      return s.srpaDischargeAt ? `alta da SRPA às ${s.srpaDischargeAt}` : "hoje"
    case "cancelada":
      return s.pendencies[0] ?? "hoje"
    default:
      return s.start ? whenOf(s) : ""
  }
}

const SECTOR_LABEL: Record<string, string> = { UTI: "UTI adulto" }

/** Monta as linhas a partir do store (ignora cirurgias ainda "A alocar"). */
export const buildRows = (
  patients: IPatient[],
  surgeries: ISurgery[],
  hospitalizations: IHospitalization[],
  rooms: IRoom[],
): IEntryRow[] => {
  const linked = new Set<number>()
  const rows: IEntryRow[] = []

  const visible = surgeries.filter((s) => s.stage !== "a_alocar")
  for (const s of visible) {
    const patient = patients.find((p) => p.id === s.patientId)
    if (!patient) continue
    const hosp =
      hospitalizations.find((h) => h.id === s.hospitalizationId) ??
      hospitalizations.find(
        (h) =>
          h.patientId === s.patientId &&
          !linked.has(h.id) &&
          !visible.some((o) => o.hospitalizationId === h.id),
      )
    if (hosp) linked.add(hosp.id)

    const closed = CLOSED_STAGES.has(s.stage)
    // Cirurgia encerrada com internação seguindo: a etapa volta a ser a da internação.
    const useHosp = closed && hosp
    const step = useHosp
      ? hosp.discharged
        ? "finalizada"
        : hosp.dischargeToday
        ? "alta_prevista"
        : "internado"
      : surgeryStep(s)
    const sector =
      s.stage === "em_cirurgia" || s.stage === "agendada"
        ? "Centro cirúrgico"
        : s.stage === "srpa"
          ? "SRPA"
          : hosp
            ? (SECTOR_LABEL[hosp.sector] ?? hosp.sector)
            : "Centro cirúrgico"

    rows.push({
      key: `s${s.id}`,
      patient,
      hosp,
      surgery: s,
      procedure: procedureLabel(s),
      where: whereOf(s, hosp, rooms),
      doctor: s.surgeon,
      insurance: s.insurance,
      sector,
      step,
      stepSub: useHosp
        ? hosp.discharged
          ? `alta em ${hosp.discharged.date.split("-").reverse().join("/").slice(0, 5)} às ${hosp.discharged.time}`
          : `${hosp.day}º dia`
        : surgerySub(s, step),
      startDate: hosp?.admittedOn ?? (s.date ? isoToBR(s.date) : MOCK_TODAY),
      situation:
        closed && (!hosp || hosp.discharged) ? "encerrada" : "andamento",
    })
  }

  for (const h of hospitalizations) {
    if (linked.has(h.id)) continue
    const patient = patients.find((p) => p.id === h.patientId)
    if (!patient) continue
    rows.push({
      key: `h${h.id}`,
      patient,
      hosp: h,
      procedure: h.reason,
      where: h.bed,
      doctor: h.doctor,
      insurance: patient.insurance,
      sector: SECTOR_LABEL[h.sector] ?? h.sector,
      step: h.dischargeToday ? "alta_prevista" : "internado",
      stepSub: `${h.day}º dia`,
      startDate: h.admittedOn,
      situation: "andamento",
    })
  }

  return rows.sort(
    (a, b) =>
      STEP_ORDER[a.step] - STEP_ORDER[b.step] ||
      (a.surgery?.start ?? "99").localeCompare(b.surgery?.start ?? "99"),
  )
}

const STEP_ORDER: Record<JourneyStep, number> = {
  em_cirurgia: 0,
  pre_operatorio: 1,
  srpa: 2,
  internado: 3,
  alta_prevista: 4,
  agendada: 5,
  aguardando_chegada: 5,
  a_alocar: 6,
  finalizada: 7,
  cancelada: 8,
}

// ── Filtros ───────────────────────────────────────────────────

export const normalize = (v: string) =>
  v
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()

export const matchesSearch = (r: IEntryRow, query: string) => {
  const q = normalize(query).replace(/^#/, "")
  if (!q) return true
  const hay = [
    r.patient.name,
    r.patient.record,
    r.hosp ? String(r.hosp.id) : "",
    r.surgery ? String(r.surgery.id) : "",
  ]
  return hay.some((v) => normalize(v).includes(q))
}

export const matchesSituation = (r: IEntryRow, s: Situation) => {
  if (s === "todas") return true
  if (s === "encerradas") return r.situation === "encerrada"
  if (s === "agendadas") return r.surgery?.stage === "agendada"
  return r.situation === "andamento"
}

/** "dd/MM/yyyy" → dias até hoje (MOCK_TODAY). */
const daysAgo = (date: string) => {
  const toTime = (d: string) => {
    const [dd, mm, yyyy] = d.split("/").map(Number)
    return Date.UTC(yyyy, mm - 1, dd)
  }
  return Math.round((toTime(MOCK_TODAY) - toTime(date)) / 86_400_000)
}

export const matchesFilters = (r: IEntryRow, f: IFilters) => {
  if (f.type === "internacao" && !r.hosp) return false
  if (f.type === "cirurgia" && !r.surgery) return false
  if (f.period !== "qualquer") {
    const ago = daysAgo(r.startDate)
    if (f.period === "hoje" && ago !== 0) return false
    if (f.period === "proximos" && ago >= 0) return false
    if (f.period === "7d" && (ago < 0 || ago > 7)) return false
    if (f.period === "30d" && (ago < 0 || ago > 30)) return false
  }
  if (f.doctor !== "todos" && r.doctor !== f.doctor) return false
  if (f.insurance !== "todos" && r.insurance !== f.insurance) return false
  if (f.sector !== "todos" && r.sector !== f.sector) return false
  return true
}
