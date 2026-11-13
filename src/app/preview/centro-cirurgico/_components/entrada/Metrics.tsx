"use client"

import type { IconType } from "react-icons"
import {
  LuActivity,
  LuBedDouble,
  LuCalendarClock,
  LuHeartPulse,
  LuLogOut,
} from "react-icons/lu"

import { TODAY_ISO } from "../../_data/days"
import { useUnitData } from "../../_data/store"
import { CARD } from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

const Metric = ({
  icon: Icon,
  label,
  value,
  valueClass = "text-[#1E293B]",
}: {
  icon: IconType
  label: string
  value: number
  valueClass?: string
}) => (
  <div className={cn(CARD, "flex flex-1 items-center gap-2.5 px-3.5 py-3")}>
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F8FAFC]">
      <Icon className="h-4 w-4 text-[#64748B]" />
    </span>
    <div className="flex min-w-0 flex-col gap-px">
      <span className="truncate text-[11.5px] text-[#64748B]">{label}</span>
      <span className={cn("text-xl leading-6 font-bold", valueClass)}>
        {value}
      </span>
    </div>
  </div>
)

/** Indicadores do topo, calculados a partir do store. */
export const Metrics = () => {
  const { surgeries, hospitalizations } = useUnitData()
  const count = (stage: string) =>
    surgeries.filter((s) => s.stage === stage).length

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <Metric
        icon={LuBedDouble}
        label="Internados agora"
        value={hospitalizations.length}
      />
      <Metric
        icon={LuActivity}
        label="Em cirurgia agora"
        value={count("em_cirurgia")}
        valueClass="text-[#1A56DB]"
      />
      <Metric
        icon={LuHeartPulse}
        label="Na recuperação (SRPA)"
        value={count("srpa")}
        valueClass="text-[#7C3AED]"
      />
      <Metric
        icon={LuCalendarClock}
        label="Cirurgias ainda hoje"
        value={
          surgeries.filter(
            (s) =>
              s.stage === "agendada" && (s.date ?? TODAY_ISO) === TODAY_ISO,
          ).length
        }
      />
      <Metric
        icon={LuLogOut}
        label="Altas previstas hoje"
        value={hospitalizations.filter((h) => h.dischargeToday).length}
        valueClass="text-[#047857]"
      />
    </div>
  )
}
