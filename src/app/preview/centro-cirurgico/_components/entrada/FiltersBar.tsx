"use client"

import { Button, Input } from "@heroui/react"
import { LuSearch } from "react-icons/lu"

import { INSURANCES } from "../../_data/fixtures"
import { outOfScope, FilterDropdown, type IOption } from "./parts"
import type { IFilters, Situation } from "./rows"
import { CARD } from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

const SITUATIONS: { key: Situation; label: string }[] = [
  { key: "andamento", label: "Em andamento" },
  { key: "agendadas", label: "Agendadas" },
  { key: "encerradas", label: "Encerradas" },
  { key: "todas", label: "Todas" },
]

const TYPE_OPTIONS: IOption[] = [
  { key: "todos", label: "Internação e cirurgia" },
  { key: "internacao", label: "Somente internação" },
  { key: "cirurgia", label: "Somente cirurgia" },
]

const PERIOD_OPTIONS: IOption[] = [
  { key: "qualquer", label: "Qualquer data" },
  { key: "hoje", label: "Hoje" },
  { key: "proximos", label: "Próximos dias" },
  { key: "7d", label: "Últimos 7 dias" },
  { key: "30d", label: "Últimos 30 dias" },
  { key: "personalizado", label: "Personalizado…" },
]

const BASE_SECTORS = [
  "Centro cirúrgico",
  "SRPA",
  "Clínica cirúrgica",
  "Clínica médica",
  "UTI adulto",
]

const ALL: IOption = { key: "todos", label: "Todos" }
const toOptions = (values: string[]): IOption[] => [
  ALL,
  ...values.map((v) => ({ key: v, label: v })),
]

export const FiltersBar = ({
  query,
  onQuery,
  situation,
  onSituation,
  counts,
  filters,
  onFilters,
  doctors,
  sectors,
  onClear,
}: {
  query: string
  onQuery: (q: string) => void
  situation: Situation
  onSituation: (s: Situation) => void
  counts: Record<Situation, number>
  filters: IFilters
  onFilters: (patch: Partial<IFilters>) => void
  doctors: string[]
  sectors: string[]
  onClear: () => void
}) => {
  const sectorOptions = toOptions([
    ...BASE_SECTORS,
    ...sectors.filter((s) => !BASE_SECTORS.includes(s)),
  ])

  return (
    <div className={cn(CARD, "flex flex-col gap-3 px-4 py-3.5")}>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          aria-label="Buscar paciente"
          variant="bordered"
          value={query}
          onValueChange={onQuery}
          isClearable
          onClear={() => onQuery("")}
          placeholder="Buscar paciente por nome, prontuário, CPF ou nº da internação/cirurgia"
          startContent={
            <LuSearch className="h-4 w-4 shrink-0 text-[#94A3B8]" />
          }
          className="min-w-[280px] flex-1"
          classNames={{
            inputWrapper: cn(
              "h-10 min-h-10 rounded-lg border-1 bg-white px-3 shadow-none",
              query
                ? "border-[#1A56DB] data-[hover=true]:border-[#1A56DB]"
                : "border-[#E2E8F0]",
              "group-data-[focus=true]:border-[#1A56DB]",
            ),
            input:
              "text-[13.5px] font-medium text-[#1E293B] placeholder:font-normal placeholder:text-[#94A3B8]",
          }}
        />

        <div
          role="tablist"
          aria-label="Situação"
          className="flex gap-0.5 rounded-[9px] border border-[#E2E8F0] bg-[#F8FAFC] p-[3px]"
        >
          {SITUATIONS.map((s) => {
            const active = s.key === situation
            return (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSituation(s.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-[7px] px-3 py-[7px] text-[12.5px] transition-colors",
                  active
                    ? "bg-white font-bold text-[#1E293B] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                    : "font-medium text-[#64748B] hover:text-[#1E293B]",
                )}
              >
                {s.label}
                {s.key !== "todas" && (
                  <span
                    className={cn(
                      "text-[11.5px] font-semibold",
                      active ? "text-[#1A56DB]" : "text-[#94A3B8]",
                    )}
                  >
                    {counts[s.key].toLocaleString("pt-BR")}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Tipo"
          value={filters.type}
          options={TYPE_OPTIONS}
          onChange={(k) => onFilters({ type: k as IFilters["type"] })}
        />
        <FilterDropdown
          label="Período"
          value={filters.period}
          defaultKey="qualquer"
          options={PERIOD_OPTIONS}
          onChange={(k) =>
            k === "personalizado"
              ? outOfScope("Período personalizado")
              : onFilters({ period: k as IFilters["period"] })
          }
        />
        <FilterDropdown
          label="Médico"
          value={filters.doctor}
          options={toOptions(doctors)}
          onChange={(k) => onFilters({ doctor: k })}
        />
        <FilterDropdown
          label="Convênio"
          value={filters.insurance}
          options={toOptions(INSURANCES)}
          onChange={(k) => onFilters({ insurance: k })}
        />
        <FilterDropdown
          label="Setor"
          value={filters.sector}
          options={sectorOptions}
          onChange={(k) => onFilters({ sector: k })}
        />
        <div className="flex-1" />
        <Button
          size="sm"
          variant="light"
          className="h-auto min-w-0 px-1 text-[12.5px] font-medium text-[#1A56DB] data-[hover=true]:bg-transparent data-[hover=true]:underline"
          onPress={onClear}
        >
          Limpar filtros
        </Button>
      </div>
    </div>
  )
}
