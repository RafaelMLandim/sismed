"use client"

import { Button, addToast } from "@heroui/react"
import {
  LuCalendar,
  LuCalendarPlus,
  LuCalendarRange,
  LuCheck,
  LuChevronLeft,
  LuChevronRight,
  LuDoorOpen,
  LuInbox,
  LuLayoutGrid,
  LuList,
  LuScissors,
} from "react-icons/lu"

import { TODAY_ISO, addDays, longBR } from "../../_data/days"
import { UnitPicker } from "../UnitPicker"
import { FILTERS, type MapFilter, type MapView } from "./filters"
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

const outOfScope = (what: string) =>
  addToast({
    title: `${what} fica fora do escopo deste protótipo`,
    color: "default",
  })

const PICKER =
  "flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-[13px]"

export const MapHeader = ({
  day,
  onDayChange,
  allocated,
  rooms,
  queue,
  onSchedule,
}: {
  allocated: number
  rooms: number
  queue: number
  onSchedule: () => void
  /** Dia mostrado no mapa ("yyyy-MM-dd"). */
  day: string
  onDayChange: (day: string) => void
}) => (
  <header className="flex flex-wrap items-end justify-between gap-4">
    <div className="flex flex-col gap-[5px]">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.5px] text-[#1A56DB] uppercase">
        <LuScissors className="h-[13px] w-[13px]" />
        Centro cirúrgico › Prontuário
      </div>
      <h1 className="text-2xl font-bold text-[#1E293B]">Mapa cirúrgico</h1>
      <p className="text-[13px] text-[#64748B]">
        {allocated} alocados em {rooms} salas ·{" "}
        {queue
          ? `${queue} ${queue === 1 ? "vinda" : "vindas"} do acompanhamento cirúrgico aguardando alocação`
          : "nenhuma cirurgia aguardando alocação"}{" "}
        · {longBR(day)}
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-2.5">
      <UnitPicker />
      <div className={PICKER}>
        <button
          type="button"
          aria-label="Dia anterior"
          onClick={() => onDayChange(addDays(day, -1))}
          className="text-[#64748B] hover:text-[#1E293B]"
        >
          <LuChevronLeft className="h-3.5 w-3.5" />
        </button>
        <label className="relative flex cursor-pointer items-center gap-2">
          <LuCalendar className="h-[15px] w-[15px] text-[#64748B]" />
          <span className="font-semibold text-[#1E293B]">
            {day.split("-").reverse().join("/")}
          </span>
          <input
            type="date"
            aria-label="Escolher dia"
            value={day}
            onChange={(e) => e.target.value && onDayChange(e.target.value)}
            onClick={(e) => e.currentTarget.showPicker?.()}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <button
          type="button"
          aria-label="Próximo dia"
          onClick={() => onDayChange(addDays(day, 1))}
          className="text-[#64748B] hover:text-[#1E293B]"
        >
          <LuChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {day !== TODAY_ISO && (
        <Button
          className={OUTLINE_BUTTON}
          onPress={() => onDayChange(TODAY_ISO)}
        >
          Hoje
        </Button>
      )}
      <Button
        className={cn(OUTLINE_BUTTON, "[&>svg]:text-[#1E293B]")}
        startContent={<LuDoorOpen />}
        onPress={() => outOfScope("O cadastro de salas")}
      >
        Salas
      </Button>
      <Button
        className={PRIMARY_BUTTON}
        startContent={<LuCalendarPlus />}
        onPress={onSchedule}
      >
        Agendar cirurgia
      </Button>
    </div>
  </header>
)

const VIEWS: { key: MapView; label: string; icon: typeof LuList }[] = [
  { key: "lista", label: "Lista", icon: LuList },
  { key: "slots", label: "Slots", icon: LuLayoutGrid },
  { key: "timeline", label: "Linha do tempo", icon: LuCalendarRange },
]

export const MapFilters = ({
  counts,
  filter,
  onFilter,
  view,
  onView,
}: {
  counts: Record<MapFilter, number>
  filter: MapFilter
  onFilter: (f: MapFilter) => void
  view: MapView
  onView: (v: MapView) => void
}) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div className="flex flex-wrap items-center gap-2" role="group">
      {FILTERS.map(({ key, label }) => {
        const active = filter === key
        const count = counts[key]
        const special =
          key === "sobreposicoes"
            ? count
              ? "bg-[#FFFBEB] text-[#B45309] border-transparent"
              : null
            : key === "a_alocar"
              ? count
                ? "bg-[#EBF0FE] text-[#1A56DB] border-transparent"
                : "bg-[#F8FAFC] text-[#94A3B8] border-transparent"
              : null
        const Icon =
          key === "a_alocar" ? (count ? LuInbox : LuCheck) : undefined
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onFilter(active ? "todas" : key)}
            className={cn(
              "inline-flex items-center gap-[5px] rounded-full border px-[9px] py-[3px] text-[11px] font-semibold transition-colors",
              active
                ? "border-[#1A56DB] bg-[#1A56DB] text-white"
                : (special ??
                    "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B]"),
            )}
          >
            {Icon && <Icon className="h-3 w-3" />}
            {label} · {count}
          </button>
        )
      })}
    </div>
    <nav
      aria-label="Visualização"
      className="flex items-center gap-[3px] rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-[3px]"
    >
      {VIEWS.map(({ key, label, icon: Icon }) => {
        const active = view === key
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onView(key)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px]",
              active
                ? "bg-white font-semibold text-[#1E293B] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                : "font-medium text-[#64748B] hover:text-[#1E293B]",
            )}
          >
            <Icon
              className={cn(
                "h-3.5 w-3.5",
                active ? "text-[#1A56DB]" : "text-[#64748B]",
              )}
            />
            {label}
          </button>
        )
      })}
    </nav>
  </div>
)
