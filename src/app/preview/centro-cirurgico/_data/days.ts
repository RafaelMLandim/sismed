/**
 * Datas do mock em ISO ("yyyy-MM-dd"). "Hoje" é fixo (05/11/2026), como o
 * relógio do mock (MOCK_NOW), para os textos relativos baterem.
 */
export const TODAY_ISO = "2026-11-05"

const WEEKDAYS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
]

const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

const toIso = (d: Date) => d.toISOString().slice(0, 10)

export const addDays = (iso: string, n: number) => {
  const d = parse(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return toIso(d)
}

/** Dias de `from` até `to` (negativo se `to` for antes). */
export const daysBetween = (from: string, to: string) =>
  Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000)

/** "2026-11-05" → "05/11/2026". */
export const isoToBR = (iso: string) => iso.split("-").reverse().join("/")

/** "05/11/2026" → "2026-11-05". */
export const brToIso = (br: string) => br.split("/").reverse().join("-")

/** "quinta-feira, 05/11/2026". */
export const longBR = (iso: string) =>
  `${WEEKDAYS[parse(iso).getUTCDay()]}, ${isoToBR(iso)}`

/** "hoje", "amanhã", "ontem" ou "06/11". */
export const dayLabel = (iso: string = TODAY_ISO) => {
  const diff = daysBetween(TODAY_ISO, iso)
  if (diff === 0) return "hoje"
  if (diff === 1) return "amanhã"
  if (diff === -1) return "ontem"
  return isoToBR(iso).slice(0, 5)
}

export const isPast = (iso: string) => daysBetween(TODAY_ISO, iso) < 0
export const isToday = (iso: string) => iso === TODAY_ISO
