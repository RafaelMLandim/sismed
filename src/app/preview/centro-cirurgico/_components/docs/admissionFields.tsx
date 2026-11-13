"use client"

import { Button, Input, Select, SelectItem } from "@heroui/react"
import type { ReactNode } from "react"
import { LuClock3, LuPlus, LuSparkles, LuX } from "react-icons/lu"

import { FieldLabel, firstKey } from "./fields"

/** Select com placeholder e destaque de obrigatório (D06/D07). */
export const Choice = ({
  label,
  options,
  value,
  onChange,
  required,
  invalid,
  disabled,
  size,
  descriptions,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
  required?: boolean
  invalid?: boolean
  disabled?: boolean
  size?: "sm"
  descriptions?: Record<string, string>
}) => (
  <Select
    label={size ? undefined : required ? `${label} *` : label}
    aria-label={label}
    labelPlacement="outside"
    variant="bordered"
    size={size}
    placeholder="Selecione"
    selectedKeys={value ? [value] : []}
    onSelectionChange={(k) => onChange(firstKey(k))}
    isInvalid={invalid}
    isDisabled={disabled}
  >
    {options.map((o) => (
      <SelectItem key={o} description={descriptions?.[o]}>
        {o}
      </SelectItem>
    ))}
  </Select>
)

/** Campo de hora com ícone de relógio. */
export const TimeInput = ({
  label,
  value,
  onChange,
  invalid,
  size,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  invalid?: boolean
  size?: "sm"
}) => (
  <Input
    type="time"
    label={size ? undefined : label}
    aria-label={label}
    labelPlacement="outside"
    variant="bordered"
    size={size}
    value={value}
    onValueChange={onChange}
    isInvalid={invalid}
    startContent={
      size ? undefined : (
        <LuClock3 className="h-4 w-4 shrink-0 text-[#94A3B8]" />
      )
    }
  />
)

/** Rótulo do texto livre + "Gerar texto a partir das marcações". */
export const TextHeader = ({
  label,
  readOnly,
  onGenerate,
}: {
  label: string
  readOnly: boolean
  onGenerate: () => void
}) => (
  <div className="flex items-center justify-between">
    <FieldLabel required>{label}</FieldLabel>
    {!readOnly && (
      <Button
        size="sm"
        variant="bordered"
        className="font-semibold"
        startContent={<LuSparkles className="h-3.5 w-3.5" />}
        onPress={onGenerate}
      >
        Gerar texto a partir das marcações
      </Button>
    )}
  </div>
)

/** Tabela editável com cabeçalho, remover linha e "Adicionar linha". */
export const RowTable = ({
  label,
  required,
  columns,
  template,
  rows,
  readOnly,
  onAdd,
  onRemove,
}: {
  label: string
  required?: boolean
  columns: string[]
  /** grid-template-columns sem a coluna do botão de remover. */
  template: string
  rows: ReactNode[][]
  readOnly: boolean
  onAdd: () => void
  onRemove: (i: number) => void
}) => {
  const grid = { gridTemplateColumns: `${template} 32px` }
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
        <div className="min-w-[720px]">
          <div
            className="grid gap-1.5 border-b border-[#E2E8F0] bg-[#F8FAFC] px-2 py-2 text-[10.5px] font-semibold tracking-wide text-[#94A3B8] uppercase"
            style={grid}
          >
            {columns.map((c) => (
              <span key={c} className="px-1">
                {c}
              </span>
            ))}
          </div>
          {rows.length === 0 && (
            <p className="px-3 py-3 text-xs text-[#94A3B8]">
              Nenhuma linha registrada.
            </p>
          )}
          {rows.map((cells, i) => (
            <div
              key={i}
              className="grid items-center gap-1.5 px-2 py-1.5"
              style={grid}
            >
              {cells}
              {!readOnly && (
                <button
                  type="button"
                  aria-label="Remover linha"
                  onClick={() => onRemove(i)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E2E8F0] text-[#94A3B8] hover:bg-[#F8FAFC]"
                >
                  <LuX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      {!readOnly && (
        <Button
          size="sm"
          variant="bordered"
          className="self-start font-semibold"
          startContent={<LuPlus className="h-3.5 w-3.5" />}
          onPress={onAdd}
        >
          Adicionar linha
        </Button>
      )}
    </div>
  )
}
