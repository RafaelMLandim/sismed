import { TODAY_ISO, addDays } from "../../_data/days"
import { MOCK_NOW } from "../../_data/fixtures"
import { fromMin, toMin } from "../../_data/time"
import type { IVitalSign } from "../../_data/types"

/**
 * Regras dos sinais vitais do mock. Limites do desenho (PEP-16):
 * PA ≥ 140/90, temperatura ≥ 37,8 °C, SpO₂ < 94%. Os demais seguem faixas
 * usuais de adulto.
 */

export type VitalKey = "pa" | "hr" | "rr" | "temp" | "spo2" | "pain"

export type Tone = "ok" | "alert"

export interface IVitalStatus {
  label: string
  tone: Tone
}

export const VITAL_META: Record<
  VitalKey,
  { label: string; short: string; unit: string }
> = {
  pa: { label: "PA", short: "PA", unit: "mmHg" },
  hr: { label: "Frequência cardíaca", short: "FC", unit: "bpm" },
  rr: { label: "Frequência respiratória", short: "FR", unit: "irpm" },
  temp: { label: "Temperatura", short: "temperatura", unit: "°C" },
  spo2: { label: "Saturação de O₂", short: "SpO₂", unit: "%" },
  pain: { label: "Dor (0–10)", short: "dor", unit: "/10" },
}

export const VITAL_KEYS = Object.keys(VITAL_META) as VitalKey[]

const ok = (label = "Normal"): IVitalStatus => ({ label, tone: "ok" })
const alert = (label: string): IVitalStatus => ({ label, tone: "alert" })

export const statusOf = (v: IVitalSign, k: VitalKey): IVitalStatus => {
  switch (k) {
    case "pa":
      if (v.sys >= 140 || v.dia >= 90) return alert("Elevada")
      if (v.sys < 90 || v.dia < 60) return alert("Baixa")
      return ok()
    case "hr":
      if (v.hr > 100) return alert("Taquicardia")
      if (v.hr < 50) return alert("Bradicardia")
      return ok()
    case "rr":
      if (v.rr > 24) return alert("Taquipneia")
      if (v.rr < 10) return alert("Bradipneia")
      return ok()
    case "temp":
      if (v.temp >= 38.5) return alert("Febre")
      if (v.temp >= 37.8) return alert("Febrícula")
      if (v.temp < 35.5) return alert("Hipotermia")
      return ok()
    case "spo2":
      return v.spo2 < 94 ? alert("Baixa") : ok()
    case "pain":
      if (v.pain === 0) return ok("Sem dor")
      if (v.pain <= 3) return ok("Leve")
      if (v.pain <= 6) return ok("Moderada")
      return alert("Intensa")
  }
}

/** "164/96", "37,9", "95". */
export const valueOf = (v: IVitalSign, k: VitalKey) => {
  switch (k) {
    case "pa":
      return `${v.sys}/${v.dia}`
    case "temp":
      return v.temp.toFixed(1).replace(".", ",")
    default:
      return String(v[k])
  }
}

/** Sinais fora do limite numa aferição. */
export const alertsOf = (v: IVitalSign) =>
  VITAL_KEYS.filter((k) => statusOf(v, k).tone === "alert")

/** Ordem cronológica. */
export const byTime = (a: IVitalSign, b: IVitalSign) =>
  a.date === b.date ? toMin(a.time) - toMin(b.time) : a.date < b.date ? -1 : 1

export type Period = "hoje" | "24h" | "internacao"

/** Aferições do período, da mais recente para a mais antiga. */
export const inPeriod = (list: IVitalSign[], period: Period) => {
  const yesterday = addDays(TODAY_ISO, -1)
  return list
    .filter((v) => {
      if (period === "internacao") return true
      if (period === "hoje") return v.date === TODAY_ISO
      return (
        v.date === TODAY_ISO ||
        (v.date === yesterday && toMin(v.time) >= toMin(MOCK_NOW))
      )
    })
    .sort((a, b) => byTime(b, a))
}

/**
 * Próxima aferição: 1h depois se a última teve alerta, 2h se estava tudo
 * normal. Nunca antes de agora.
 */
export const nextReading = (last?: IVitalSign) => {
  if (!last) return null
  const gap = alertsOf(last).length ? 60 : 120
  const base = last.date === TODAY_ISO ? toMin(last.time) : toMin(MOCK_NOW)
  const next = Math.max(base + gap, toMin(MOCK_NOW))
  return next >= 24 * 60 ? null : fromMin(next)
}

/** "PA e temperatura", "PA, FC e temperatura". */
export const joinLabels = (keys: VitalKey[]) => {
  const names = keys.map((k) => VITAL_META[k].short)
  if (names.length <= 1) return names.join("")
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`
}
