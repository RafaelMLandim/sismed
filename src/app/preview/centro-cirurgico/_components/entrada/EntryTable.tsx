"use client"

import { Button } from "@heroui/react"
import { useRouter } from "next/navigation"
import { LuChevronLeft, LuChevronRight, LuSearchX } from "react-icons/lu"

import { Avatar, StepChip } from "../ui"
import { BASE } from "../MockShell"
import { AttendanceTags, ROW_BUTTON, outOfScope } from "./parts"
import type { IEntryRow } from "./rows"
import { CARD } from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

export const PAGE_SIZE = 7

const HEAD = "text-[10.5px] font-bold tracking-[0.6px] text-[#94A3B8] uppercase"

/** Abre a cirurgia (PEP-03); internação sem cirurgia está fora do mock. */
export const useOpenRow = () => {
  const router = useRouter()
  return (r: IEntryRow) => {
    if (r.surgery) router.push(`${BASE}/cirurgias/${r.surgery.id}`)
    else outOfScope(`Internação #${r.hosp?.id} de ${r.patient.name}`)
  }
}

const PageButton = ({
  active,
  disabled,
  onPress,
  label,
  children,
}: {
  active?: boolean
  disabled?: boolean
  onPress: () => void
  label: string
  children: React.ReactNode
}) => (
  <Button
    isIconOnly
    size="sm"
    variant={active ? "solid" : "bordered"}
    aria-label={label}
    isDisabled={disabled}
    onPress={onPress}
    className={cn(
      "h-[30px] w-[30px] min-w-0 rounded-[7px] text-[12.5px] font-semibold [&>svg]:h-3.5 [&>svg]:w-3.5",
      active
        ? "bg-[#1A56DB] text-white"
        : "border-1 border-[#E2E8F0] bg-transparent text-[#64748B]",
    )}
  >
    {children}
  </Button>
)

export const EntryTable = ({
  rows,
  total,
  page,
  onPage,
  footerLabel,
  onClear,
}: {
  /** Linhas da página atual. */
  rows: IEntryRow[]
  total: number
  page: number
  onPage: (p: number) => void
  /** "em andamento", "agendadas"… */
  footerLabel: string
  onClear: () => void
}) => {
  const open = useOpenRow()
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className={cn(CARD, "flex flex-1 flex-col overflow-hidden")}>
      <div className="overflow-x-auto">
        <div className="min-w-[1120px]">
          <div className="flex gap-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] px-[18px] py-2.5">
            <span className={cn(HEAD, "w-[250px] shrink-0")}>Paciente</span>
            <span className={cn(HEAD, "w-[150px] shrink-0")}>Atendimento</span>
            <span className={cn(HEAD, "flex-1")}>Procedimento ou motivo</span>
            <span className={cn(HEAD, "w-[120px] shrink-0")}>Onde está</span>
            <span className={cn(HEAD, "w-[150px] shrink-0")}>Médico</span>
            <span className={cn(HEAD, "w-[190px] shrink-0")}>Etapa</span>
            <span className="w-20 shrink-0" />
          </div>

          {rows.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8FAFC]">
                <LuSearchX className="h-5 w-5 text-[#94A3B8]" />
              </span>
              <p className="text-sm font-semibold text-[#1E293B]">
                Nenhuma passagem encontrada
              </p>
              <p className="text-[12.5px] text-[#64748B]">
                Ajuste a busca ou os filtros para ver outros pacientes.
              </p>
              <Button
                size="sm"
                variant="light"
                className="text-[12.5px] font-medium text-[#1A56DB]"
                onPress={onClear}
              >
                Limpar filtros
              </Button>
            </div>
          )}

          {rows.map((r) => (
            <div
              key={r.key}
              className="flex items-center gap-3.5 border-b border-[#E2E8F0] px-[18px] py-3 transition-colors hover:bg-[#F7F9FF]"
            >
              <div className="flex w-[250px] shrink-0 items-center gap-2.5">
                <Avatar initials={r.patient.initials} size={34} />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[13.5px] font-semibold text-[#1E293B]">
                    {r.patient.name}
                  </span>
                  <span className="text-xs text-[#94A3B8]">
                    {r.patient.age} anos · Pront. {r.patient.record}
                  </span>
                </div>
              </div>
              <AttendanceTags hospId={r.hosp?.id} surgeryId={r.surgery?.id} />
              <span className="min-w-0 flex-1 text-[13px] text-[#1E293B]">
                {r.procedure}
              </span>
              <span
                className={cn(
                  "w-[120px] shrink-0 text-[13px]",
                  r.where === "—" ? "text-[#94A3B8]" : "text-[#1E293B]",
                )}
              >
                {r.where}
              </span>
              <span className="w-[150px] shrink-0 text-[13px] text-[#64748B]">
                {r.doctor}
              </span>
              <div className="flex w-[190px] shrink-0 flex-col items-start gap-[3px]">
                <StepChip step={r.step} />
                {r.stepSub && (
                  <span className="text-[11.5px] text-[#94A3B8]">
                    {r.stepSub}
                  </span>
                )}
              </div>
              <div className="flex w-20 shrink-0 justify-end">
                <Button
                  size="sm"
                  variant="bordered"
                  endContent={<LuChevronRight />}
                  onPress={() => open(r)}
                  className={cn(
                    ROW_BUTTON,
                    "border-1 border-[#E2E8F0] bg-white text-[#1A56DB]",
                  )}
                >
                  Abrir
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-3 px-[18px] py-3">
        <span className="flex-1 text-[12.5px] text-[#94A3B8]">
          Mostrando {rows.length} de {total} {footerLabel}
        </span>
        {pages > 1 && (
          <div className="flex items-center gap-1">
            <PageButton
              label="Página anterior"
              disabled={page === 1}
              onPress={() => onPage(page - 1)}
            >
              <LuChevronLeft />
            </PageButton>
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <PageButton
                key={p}
                label={`Página ${p}`}
                active={p === page}
                onPress={() => onPage(p)}
              >
                {p}
              </PageButton>
            ))}
            <PageButton
              label="Próxima página"
              disabled={page === pages}
              onPress={() => onPage(page + 1)}
            >
              <LuChevronRight />
            </PageButton>
          </div>
        )}
      </div>
    </div>
  )
}
