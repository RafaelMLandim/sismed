"use client"

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  addToast,
} from "@heroui/react"
import { LuBedDouble, LuChevronDown, LuScissors } from "react-icons/lu"

import { cn } from "@/shared/utils/cn"

export const outOfScope = (what: string) =>
  addToast({
    title: what,
    description: "Fora do escopo deste preview do Centro cirúrgico.",
    color: "default",
  })

/** Etiquetas "Internação #1180" / "Cirurgia #4227" da coluna Atendimento. */
export const AttendanceTags = ({
  hospId,
  surgeryId,
  muted,
}: {
  hospId?: number | string
  surgeryId?: number | string
  muted?: boolean
}) => (
  <div className="flex w-[150px] shrink-0 flex-col gap-[3px]">
    {hospId !== undefined && (
      <span className="flex items-center gap-[5px]">
        <LuBedDouble className="h-3 w-3 text-[#94A3B8]" />
        <span
          className={cn(
            "text-[12.5px]",
            muted ? "text-[#94A3B8]" : "text-[#1E293B]",
          )}
        >
          Internação
        </span>
        <span className="font-mono text-xs text-[#94A3B8]">#{hospId}</span>
      </span>
    )}
    {surgeryId !== undefined && (
      <span className="flex items-center gap-[5px]">
        <LuScissors className="h-3 w-3 text-[#94A3B8]" />
        <span
          className={cn(
            "text-[12.5px]",
            muted ? "text-[#94A3B8]" : "text-[#1E293B]",
          )}
        >
          Cirurgia
        </span>
        <span className="font-mono text-xs text-[#94A3B8]">#{surgeryId}</span>
      </span>
    )}
  </div>
)

/** Botão pequeno da linha ("Abrir", "Ver"): padding 6×12, 12.5/600, raio 7. */
export const ROW_BUTTON =
  "h-[30px] min-w-0 gap-1 rounded-[7px] px-3 text-[12.5px] font-semibold [&>svg]:h-[13px] [&>svg]:w-[13px]"

export interface IOption {
  key: string
  label: string
}

/** Filtro em pílula ("Tipo: Internação e cirurgia ⌄") com menu do HeroUI. */
export const FilterDropdown = ({
  label,
  value,
  options,
  onChange,
  defaultKey = "todos",
}: {
  label: string
  value: string
  options: IOption[]
  onChange: (key: string) => void
  defaultKey?: string
}) => {
  const current = options.find((o) => o.key === value)?.label ?? value
  const active = value !== defaultKey
  return (
    <Dropdown placement="bottom-start">
      <DropdownTrigger>
        <Button
          size="sm"
          variant="bordered"
          className={cn(
            "h-auto min-w-0 gap-1.5 rounded-lg border-1 bg-white px-2.5 py-[7px] text-[12.5px]",
            active ? "border-[#1A56DB] bg-[#EBF0FE]/40" : "border-[#E2E8F0]",
          )}
        >
          <span className="text-[#64748B]">{label}:</span>
          <span className="font-semibold text-[#1E293B]">{current}</span>
          <LuChevronDown className="h-3 w-3 text-[#94A3B8]" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label={label}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={new Set([value])}
        onAction={(key) => onChange(String(key))}
        className="max-h-80 overflow-y-auto"
        itemClasses={{
          base: "data-[selected=true]:bg-[#EBF0FE] data-[selected=true]:text-[#1A56DB]",
          title: "text-[13px]",
        }}
      >
        {options.map((o) => (
          <DropdownItem key={o.key}>{o.label}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}
