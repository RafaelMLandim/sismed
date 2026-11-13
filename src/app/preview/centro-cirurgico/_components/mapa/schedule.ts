/**
 * Regras de agenda do mapa cirúrgico (mock): grade, conflitos, giro de sala e
 * busca do primeiro horário livre. Tudo em minutos desde 00:00 do dia do mock.
 */
import { TODAY_ISO, isPast } from "../../_data/days"
import { MOCK_NOW, ROOM_TURNOVER_MIN } from "../../_data/fixtures"
import { fromMin, toMin } from "../../_data/time"
import type { IRoom, ISurgery, PreferredPeriod } from "../../_data/types"

/** Grade da linha do tempo: 07:00 até 19:00 (fim do expediente das salas). */
export const DAY_START = 7 * 60
export const DAY_END = 19 * 60
export const HOUR_PX = 68
export const SNAP_MIN = 15
/** Duração usada quando o cirurgião não informou. */
export const DEFAULT_DURATION = 60
/** Início do período da tarde para a preferência "Manhã"/"Tarde". */
export const AFTERNOON = 12 * 60

export const pxOf = (min: number) => ((min - DAY_START) / 60) * HOUR_PX

/** Horários de 15 em 15 min para os selects (07:00 … 18:45). */
export const TIME_OPTIONS = Array.from(
  { length: (DAY_END - DAY_START) / SNAP_MIN },
  (_, i) => fromMin(DAY_START + i * SNAP_MIN),
)

export const durationOf = (s: ISurgery) => s.durationMin ?? DEFAULT_DURATION

/** Cirurgias que ocupam a sala (alocadas e não canceladas). */
export const isOnMap = (s: ISurgery) =>
  Boolean(s.roomId && s.start && s.end) &&
  s.stage !== "a_alocar" &&
  s.stage !== "cancelada"

export const roomSurgeries = (
  surgeries: ISurgery[],
  roomId: string,
  ignoreId?: number,
) =>
  surgeries
    .filter((s) => s.roomId === roomId && isOnMap(s) && s.id !== ignoreId)
    .sort((a, b) => toMin(a.start!) - toMin(b.start!))

/** Ids das cirurgias com sobreposição de horário na mesma sala ou no bloqueio. */
export const conflictIds = (surgeries: ISurgery[], rooms: IRoom[]) => {
  const ids = new Set<number>()
  for (const room of rooms) {
    const list = roomSurgeries(surgeries, room.id)
    list.forEach((a, i) => {
      const a1 = toMin(a.start!)
      const a2 = toMin(a.end!)
      if (room.block) {
        if (a1 < toMin(room.block.end) && toMin(room.block.start) < a2)
          ids.add(a.id)
      }
      for (const b of list.slice(i + 1)) {
        if (a1 < toMin(b.end!) && toMin(b.start!) < a2) {
          ids.add(a.id)
          ids.add(b.id)
        }
      }
    })
  }
  return ids
}

export type SlotIssue =
  | { kind: "block"; message: string }
  | { kind: "overlap"; message: string; with: ISurgery }
  | { kind: "turnover"; message: string; with: ISurgery }
  | { kind: "outside"; message: string }

/**
 * Problemas de colocar `[start, start+duration)` na sala: bloqueio, sobreposição
 * com outra cirurgia, giro de sala insuficiente ou fora do expediente.
 */
export const slotIssues = (
  surgeries: ISurgery[],
  room: IRoom,
  start: number,
  duration: number,
  ignoreId?: number,
  patientName: (s: ISurgery) => string = () => "outra cirurgia",
): SlotIssue[] => {
  const end = start + duration
  const issues: SlotIssue[] = []
  if (start < DAY_START || end > DAY_END)
    issues.push({
      kind: "outside",
      message: `Fora do horário das salas (${fromMin(DAY_START)}–${fromMin(DAY_END)}).`,
    })
  if (room.block) {
    const b1 = toMin(room.block.start)
    const b2 = toMin(room.block.end)
    if (start < b2 && b1 < end)
      issues.push({
        kind: "block",
        message: `${room.name} bloqueada das ${room.block.start} às ${room.block.end} · ${room.block.reason.toLowerCase()}.`,
      })
  }
  for (const s of roomSurgeries(surgeries, room.id, ignoreId)) {
    const s1 = toMin(s.start!)
    const s2 = toMin(s.end!)
    if (start < s2 && s1 < end) {
      issues.push({
        kind: "overlap",
        with: s,
        message: `Sobrepõe ${patientName(s)} (${s.start}–${s.end}) na ${room.name}.`,
      })
    } else if (end + ROOM_TURNOVER_MIN > s1 && start < s1) {
      issues.push({
        kind: "turnover",
        with: s,
        message: `Sem giro de ${ROOM_TURNOVER_MIN} min antes de ${patientName(s)} (${s.start}).`,
      })
    } else if (s2 + ROOM_TURNOVER_MIN > start && s2 <= start) {
      issues.push({
        kind: "turnover",
        with: s,
        message: `Sem giro de ${ROOM_TURNOVER_MIN} min depois de ${patientName(s)} (termina ${s.end}).`,
      })
    }
  }
  return issues
}

/** Intervalos ocupados da sala (cirurgia + giro, e o bloqueio). */
const busyOf = (
  surgeries: ISurgery[],
  room: IRoom,
  ignoreId?: number,
): { from: number; to: number }[] => {
  const busy = roomSurgeries(surgeries, room.id, ignoreId).map((s) => ({
    from: toMin(s.start!),
    to: toMin(s.end!) + ROOM_TURNOVER_MIN,
  }))
  if (room.block)
    busy.push({ from: toMin(room.block.start), to: toMin(room.block.end) })
  return busy
}

/**
 * Situação da sala no horário `at`: livre (com a janela livre em volta) ou
 * ocupada até quando.
 */
export const roomStatusAt = (
  surgeries: ISurgery[],
  room: IRoom,
  at: number,
  ignoreId?: number,
):
  | { free: true; from: number; to: number }
  | { free: false; until: number } => {
  const busy = busyOf(surgeries, room, ignoreId)
  const inside = busy.filter((b) => b.from <= at && at < b.to)
  if (inside.length) {
    // emenda ocupações encadeadas (cirurgia → giro → bloqueio)
    let until = Math.max(...inside.map((b) => b.to))
    let grew = true
    while (grew) {
      grew = false
      for (const b of busy)
        if (b.from <= until && b.to > until) {
          until = b.to
          grew = true
        }
    }
    return { free: false, until: Math.min(until, DAY_END) }
  }
  let from = DAY_START
  let to = DAY_END
  for (const b of busy) {
    if (b.to <= at) from = Math.max(from, b.to)
    else if (b.from >= at) to = Math.min(to, b.from)
  }
  return { free: true, from, to }
}

/** Próxima cirurgia da sala depois de `at`. */
export const nextInRoom = (
  surgeries: ISurgery[],
  roomId: string,
  at: number,
  ignoreId?: number,
) =>
  roomSurgeries(surgeries, roomId, ignoreId).find((s) => toMin(s.start!) >= at)

const roundUp = (min: number) => Math.ceil(min / SNAP_MIN) * SNAP_MIN

const inPeriod = (start: number, period?: PreferredPeriod) => {
  if (period === "Manhã") return start < AFTERNOON
  if (period === "Tarde") return start >= AFTERNOON
  return true
}

/**
 * Primeiro horário livre (de 15 em 15 min, a partir de agora se for hoje) em qualquer
 * sala, respeitando giro, bloqueios e o período preferido. Se não houver no
 * período, cai para qualquer horário. `roomId` restringe a uma sala.
 */
export const suggestSlot = (
  surgeries: ISurgery[],
  rooms: IRoom[],
  duration: number,
  period?: PreferredPeriod,
  roomId?: string,
  ignoreId?: number,
  /** Dia buscado: hoje começa de agora; dias futuros, do início da grade. */
  day: string = TODAY_ISO,
) => {
  if (isPast(day)) return null
  const first =
    day === TODAY_ISO
      ? Math.max(DAY_START, roundUp(toMin(MOCK_NOW)))
      : DAY_START
  const candidates = roomId ? rooms.filter((r) => r.id === roomId) : rooms
  const search = (withPeriod: boolean) => {
    for (let t = first; t + duration <= DAY_END; t += SNAP_MIN) {
      if (withPeriod && !inPeriod(t, period)) continue
      for (const room of candidates) {
        if (!slotIssues(surgeries, room, t, duration, ignoreId).length)
          return { roomId: room.id, start: t }
      }
    }
    return null
  }
  return search(true) ?? search(false)
}

/** Faixas lado a lado para cirurgias sobrepostas na mesma sala. */
export const laneLayout = (list: ISurgery[]) => {
  const sorted = [...list].sort(
    (a, b) => toMin(a.start!) - toMin(b.start!) || a.id - b.id,
  )
  const laneEnds: number[] = []
  const lane = new Map<number, number>()
  for (const s of sorted) {
    const st = toMin(s.start!)
    let i = laneEnds.findIndex((end) => end <= st)
    if (i === -1) i = laneEnds.length
    laneEnds[i] = toMin(s.end!)
    lane.set(s.id, i)
  }
  const result = new Map<number, { lane: number; lanes: number }>()
  for (const s of sorted) {
    const group = sorted.filter(
      (o) => toMin(o.start!) < toMin(s.end!) && toMin(s.start!) < toMin(o.end!),
    )
    const lanes = Math.max(...group.map((o) => lane.get(o.id)!)) + 1
    result.set(s.id, { lane: lane.get(s.id)!, lanes })
  }
  return result
}

/** "Nefrolitotripsia percutânea D" (lado abreviado como no desenho). */
export const procedureLabel = (s: ISurgery) => {
  const side =
    s.side === "Direito"
      ? " D"
      : s.side === "Esquerdo"
        ? " E"
        : s.side === "Bilateral"
          ? " bilateral"
          : ""
  return `${s.procedure}${side}`
}

/** Salas com o bloqueio do dia `day` em `block` (o resto do código lê `block`). */
export const roomsOn = (rooms: IRoom[], day: string): IRoom[] =>
  rooms.map((r) => {
    const b = r.blocks.find((x) => x.date === day)
    return {
      ...r,
      block: b && {
        start: b.start,
        end: b.end,
        reason: b.reason,
        detail: b.detail,
      },
    }
  })

/** Cirurgias do dia `day` + a fila "A alocar" (que não tem dia). */
export const surgeriesOn = (surgeries: ISurgery[], day: string) =>
  surgeries.filter(
    (s) => s.stage === "a_alocar" || (s.date ?? TODAY_ISO) === day,
  )
