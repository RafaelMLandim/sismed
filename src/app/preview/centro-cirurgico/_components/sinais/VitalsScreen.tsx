"use client"

import { Button, addToast } from "@heroui/react"
import { useMemo, useState } from "react"
import type { IconType } from "react-icons"
import {
  LuActivity,
  LuAlarmClock,
  LuDroplet,
  LuDroplets,
  LuHeartPulse,
  LuHistory,
  LuInfo,
  LuListChecks,
  LuPlus,
  LuPrinter,
  LuSmile,
  LuThermometer,
  LuTrendingUp,
  LuTriangleAlert,
  LuTruck,
  LuWind,
} from "react-icons/lu"

import { TODAY_ISO, isoToBR } from "../../_data/days"
import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import { fromMin, toMin } from "../../_data/time"
import type { ISurgery, IVitalSign } from "../../_data/types"
import { RegisterVitalsModal } from "./RegisterVitalsModal"
import {
  VITAL_KEYS,
  VITAL_META,
  alertsOf,
  byTime,
  inPeriod,
  joinLabels,
  nextReading,
  statusOf,
  valueOf,
  type Period,
  type VitalKey,
} from "./rules"
import {
  CARD,
  OUTLINE_BUTTON,
  PRIMARY_BUTTON,
} from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

const ICONS: Record<VitalKey, IconType> = {
  pa: LuActivity,
  hr: LuHeartPulse,
  rr: LuWind,
  temp: LuThermometer,
  spo2: LuDroplets,
  pain: LuSmile,
}

const PERIODS: { key: Period; label: string; title: string }[] = [
  { key: "hoje", label: "Hoje", title: "hoje" },
  { key: "24h", label: "24 h", title: "últimas 24 h" },
  { key: "internacao", label: "Internação", title: "toda a internação" },
]

/** Coluna da tabela de histórico (sinal + largura do desenho). */
const COLS: { key: VitalKey; head: string; w: string }[] = [
  { key: "pa", head: "PA (mmHg)", w: "w-[110px]" },
  { key: "hr", head: "FC (bpm)", w: "w-[90px]" },
  { key: "rr", head: "FR (irpm)", w: "w-[90px]" },
  { key: "temp", head: "Temp. (°C)", w: "w-[100px]" },
  { key: "spo2", head: "SpO₂ (%)", w: "w-[90px]" },
  { key: "pain", head: "Dor", w: "w-[60px]" },
]

const HEAD =
  "text-[10.5px] leading-[1.55] font-bold tracking-[0.6px] text-[#94A3B8] uppercase"

/**
 * Aba "Sinais vitais" do paciente (PEP-16): últimos valores, alerta de valor
 * fora do limite, histórico por período, tendência da PA sistólica e os
 * próximos passos antes do centro cirúrgico.
 */
export const VitalsScreen = ({ surgery }: { surgery: ISurgery }) => {
  const all = useCC((s) => s.vitals)
  const notifyDoctor = useCC((s) => s.notifyDoctor)
  const hasHosp = Boolean(surgery.hospitalizationId)

  const [period, setPeriod] = useState<Period>("hoje")
  const [open, setOpen] = useState(false)

  const mine = useMemo(
    () => all.filter((v) => v.patientId === surgery.patientId).sort(byTime),
    [all, surgery.patientId],
  )
  const last = mine[mine.length - 1]
  const rows = inPeriod(mine, period)
  const next = nextReading(last)
  const lastAlerts = last ? alertsOf(last) : []
  const periodTitle = PERIODS.find((p) => p.key === period)!.title

  return (
    <div className="flex flex-col gap-5">
      {/* Título */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.9px] text-[#1A56DB] uppercase">
            <LuHeartPulse className="h-[13px] w-[13px]" />
            {hasHosp ? "Internação" : "Atendimento"}
          </span>
          <h1 className="text-[28px] leading-tight font-bold text-[#1E293B]">
            Sinais vitais
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {next && (
            <span className="flex items-center gap-1.5 px-1.5 text-[12.5px] text-[#64748B]">
              <LuAlarmClock className="h-3.5 w-3.5 text-[#B45309]" />
              Próxima aferição prevista: {next}
            </span>
          )}
          <Button
            className={OUTLINE_BUTTON}
            startContent={<LuPrinter />}
            onPress={() => window.print()}
          >
            Imprimir
          </Button>
          <Button
            className={PRIMARY_BUTTON}
            startContent={<LuPlus />}
            onPress={() => setOpen(true)}
          >
            Registrar sinais vitais
          </Button>
        </div>
      </div>

      {/* Alerta da última aferição */}
      {last && lastAlerts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-lg bg-[#FFFBEB] px-4 py-3">
          <LuTriangleAlert className="h-4 w-4 shrink-0 text-[#B45309]" />
          <span className="flex-1 text-[12.5px] font-semibold text-[#B45309]">
            {capitalize(joinLabels(lastAlerts))} fora do limite às {last.time}
            {last.date !== TODAY_ISO ? ` de ${isoToBR(last.date)}` : ""}
            {last.doctorNotifiedAt
              ? ` · médico comunicado às ${last.doctorNotifiedAt}`
              : " · médico ainda não comunicado"}
            {surgery.stage === "agendada"
              ? " · reavaliar antes do transporte ao centro cirúrgico"
              : ""}
          </span>
          {!last.doctorNotifiedAt && (
            <Button
              size="sm"
              variant="bordered"
              className="border-1 border-[#F59E0B] bg-white font-semibold text-[#B45309]"
              onPress={() => {
                notifyDoctor(last.id, MOCK_NOW)
                addToast({
                  title: `Comunicação ao médico registrada às ${MOCK_NOW}`,
                  color: "success",
                })
              }}
            >
              Registrar que o médico foi comunicado
            </Button>
          )}
        </div>
      )}

      {/* Últimos valores */}
      {last ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {VITAL_KEYS.map((k) => (
            <MetricCard key={k} k={k} v={last} />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            CARD,
            "flex flex-col items-center gap-2 px-6 py-10 text-center",
          )}
        >
          <LuHeartPulse className="h-6 w-6 text-[#94A3B8]" />
          <span className="text-[14px] font-semibold text-[#1E293B]">
            Nenhuma aferição registrada
          </span>
          <span className="text-[13px] text-[#64748B]">
            Use “Registrar sinais vitais” para lançar a primeira.
          </span>
        </div>
      )}

      {last && (
        <div className="flex flex-col gap-5 xl:flex-row">
          {/* Histórico */}
          <section className={cn(CARD, "flex min-w-0 flex-1 flex-col")}>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
              <span className="flex items-center gap-2 text-[13px] font-bold text-[#1E293B]">
                <LuHistory className="h-4 w-4 text-[#1A56DB]" />
                Histórico de aferições · {periodTitle}
              </span>
              <div className="flex gap-1.5">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPeriod(p.key)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      period === p.key
                        ? "border-[#1A56DB] bg-[#1A56DB] text-white"
                        : "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B]",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </header>
            <div className="overflow-x-auto">
              <div className="min-w-[860px]">
                <div className="flex gap-4 bg-[#F8FAFC] px-5 py-[11px]">
                  <span className={cn(HEAD, "w-[90px] shrink-0")}>Horário</span>
                  {COLS.map((c) => (
                    <span key={c.key} className={cn(HEAD, c.w, "shrink-0")}>
                      {c.head}
                    </span>
                  ))}
                  <span className={cn(HEAD, "flex-1")}>Registrado por</span>
                </div>
                {rows.length === 0 && (
                  <p className="px-5 py-6 text-[13px] text-[#64748B]">
                    Nenhuma aferição {periodTitle}.
                  </p>
                )}
                {rows.map((v) => (
                  <HistoryRow key={v.id} v={v} />
                ))}
              </div>
            </div>
            <footer className="flex items-center gap-1.5 border-t border-[#E2E8F0] px-5 py-3.5 text-xs text-[#64748B]">
              <LuInfo className="h-3.5 w-3.5 shrink-0" />
              Valores fora do limite ficam em vermelho. Limites: PA ≥ 140/90,
              temperatura ≥ 37,8 °C, SpO₂ &lt; 94%.
            </footer>
          </section>

          {/* Coluna lateral */}
          <aside className="flex w-full shrink-0 flex-col gap-5 xl:w-[340px]">
            <TrendCard rows={rows} title={periodTitle} />
            <NextSteps surgery={surgery} next={next} />
          </aside>
        </div>
      )}

      {open && (
        <RegisterVitalsModal
          patientId={surgery.patientId}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const MetricCard = ({ k, v }: { k: VitalKey; v: IVitalSign }) => {
  const Icon = ICONS[k]
  const st = statusOf(v, k)
  const alert = st.tone === "alert"
  return (
    <div className={cn(CARD, "flex flex-col gap-2.5 px-5 py-[18px]")}>
      <span className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B]">
        <Icon className="h-3.5 w-3.5" />
        {VITAL_META[k].label}
      </span>
      <span className="flex items-end gap-1">
        <span
          className={cn(
            "text-[26px] leading-none font-bold",
            alert ? "text-[#B91C1C]" : "text-[#1E293B]",
          )}
        >
          {valueOf(v, k)}
        </span>
        <span className="text-[12.5px] text-[#64748B]">
          {VITAL_META[k].unit}
        </span>
      </span>
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "rounded px-2 py-[3px] text-[11px] font-semibold",
            alert
              ? "bg-[#FEF2F2] text-[#B91C1C]"
              : "bg-[#ECFDF5] text-[#047857]",
          )}
        >
          {st.label}
        </span>
        <span className="text-[11.5px] text-[#94A3B8]">
          {v.date === TODAY_ISO
            ? v.time
            : `${isoToBR(v.date).slice(0, 5)} ${v.time}`}
        </span>
      </span>
    </div>
  )
}

const HistoryRow = ({ v }: { v: IVitalSign }) => (
  <div className="flex items-center gap-4 border-t border-[#E2E8F0] px-5 py-4 text-[13px] leading-[1.55]">
    <span className="flex w-[90px] shrink-0 flex-col">
      <span className="font-bold text-[#1E293B]">{v.time}</span>
      {v.date !== TODAY_ISO && (
        <span className="text-[11px] text-[#94A3B8]">
          {isoToBR(v.date).slice(0, 5)}
        </span>
      )}
    </span>
    {COLS.map((c) => {
      const alert = statusOf(v, c.key).tone === "alert"
      return (
        <span
          key={c.key}
          className={cn(
            c.w,
            "shrink-0",
            alert
              ? "font-semibold text-[#B91C1C]"
              : c.key === "pa"
                ? "font-semibold text-[#1E293B]"
                : "text-[#1E293B]",
          )}
        >
          {valueOf(v, c.key)}
        </span>
      )
    })}
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-[#1E293B]">{v.by}</span>
      {v.doctorNotifiedAt && (
        <span className="text-[11.5px] text-[#B45309]">
          Médico comunicado às {v.doctorNotifiedAt}
        </span>
      )}
      {v.note && <span className="text-[11.5px] text-[#64748B]">{v.note}</span>}
    </span>
  </div>
)

/** Barras da PA sistólica (até 6 aferições do período, em ordem). */
const TrendCard = ({ rows, title }: { rows: IVitalSign[]; title: string }) => {
  const bars = [...rows].sort(byTime).slice(-6)
  return (
    <section className={cn(CARD, "flex flex-col gap-4 px-6 py-5")}>
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-[7px] text-[13px] font-bold text-[#1E293B]">
          <LuTrendingUp className="h-[15px] w-[15px] text-[#1A56DB]" />
          PA sistólica · {title}
        </span>
        <span className="text-[11.5px] text-[#94A3B8]">mmHg</span>
      </header>
      {bars.length ? (
        <div className="flex h-[170px] items-end justify-around gap-3">
          {bars.map((v) => {
            const high = v.sys >= 140
            return (
              <div
                key={v.id}
                className="flex flex-col items-center justify-end gap-[5px]"
              >
                <span
                  className={cn(
                    "text-xs font-bold",
                    high ? "text-[#B91C1C]" : "text-[#1E293B]",
                  )}
                >
                  {v.sys}
                </span>
                <span
                  className={cn(
                    "w-9 rounded-t",
                    high ? "bg-[#EF4444]" : "bg-[#1A56DB]",
                  )}
                  style={{ height: Math.max(8, Math.min(v.sys, 200) * 0.7) }}
                />
                <span className="text-[11.5px] text-[#64748B]">{v.time}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-[13px] text-[#64748B]">Sem aferições no período.</p>
      )}
      <div className="flex items-center gap-3.5 text-[11.5px] text-[#64748B]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#1A56DB]" />
          Dentro do limite
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#EF4444]" />
          Acima de 140
        </span>
      </div>
    </section>
  )
}

/** "Antes do centro cirúrgico" (cirurgia agendada) ou próximos passos. */
const NextSteps = ({
  surgery,
  next,
}: {
  surgery: ISurgery
  next: string | null
}) => {
  const beforeOR = surgery.stage === "agendada" && surgery.date === TODAY_ISO
  const diabetic = surgery.careNotes.some((n) => /diab/i.test(n.label))
  const transport =
    beforeOR && surgery.start
      ? fromMin(Math.max(toMin(surgery.start) - 30, toMin(MOCK_NOW)))
      : null
  const items: { icon: IconType; text: string; warn?: boolean }[] = [
    ...(next
      ? [
          {
            icon: LuAlarmClock,
            text: `Reaferir sinais vitais às ${next}`,
            warn: true,
          },
        ]
      : []),
    ...(diabetic
      ? [{ icon: LuDroplet, text: "Registrar glicemia capilar" }]
      : []),
    ...(transport
      ? [{ icon: LuTruck, text: `Liberar transporte às ${transport}` }]
      : []),
  ]
  if (!items.length) return null
  return (
    <section className={cn(CARD, "flex flex-col gap-4 px-6 py-5")}>
      <span className="flex items-center gap-[7px] text-[13px] font-bold text-[#1E293B]">
        <LuListChecks className="h-[15px] w-[15px] text-[#1A56DB]" />
        {beforeOR ? "Antes do centro cirúrgico" : "Próximos passos"}
      </span>
      {items.map((i) => (
        <span
          key={i.text}
          className="flex items-center gap-2.5 text-[12.5px] text-[#1E293B]"
        >
          <i.icon
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              i.warn ? "text-[#B45309]" : "text-[#64748B]",
            )}
          />
          {i.text}
        </span>
      ))}
    </section>
  )
}
