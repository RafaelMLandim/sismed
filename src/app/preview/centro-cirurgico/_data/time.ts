/** Utilitários de horário "HH:mm" do mock (sem fuso, tudo no dia de hoje). */

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

export const fromMin = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`

/** 150 → "2h30", 60 → "1h", 45 → "45 min". */
export const fmtDuration = (min?: number) => {
  if (min === undefined) return "Duração não informada"
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m} min`
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`
}

/** Minutos entre dois horários "HH:mm". */
export const diffMin = (from: string, to: string) => toMin(to) - toMin(from)

/** Intervalos [a,b) se sobrepõem. */
export const overlaps = (a1: string, a2: string, b1: string, b2: string) =>
  toMin(a1) < toMin(b2) && toMin(b1) < toMin(a2)

export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
