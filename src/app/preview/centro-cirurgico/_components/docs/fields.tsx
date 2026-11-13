"use client"

import {
  Button,
  Checkbox,
  Input,
  Select,
  SelectItem,
  addToast,
} from "@heroui/react"
import type { ReactNode } from "react"
import {
  LuBookmark,
  LuBookmarkPlus,
  LuCircleAlert,
  LuCircleCheck,
  LuInfo,
  LuTriangleAlert,
} from "react-icons/lu"

import type { IDocState, IPatient, ISurgery } from "../../_data/types"
import { isoToBR } from "../../_data/days"
import { Chip } from "../ui"

import { cn } from "@/shared/utils/cn"

/** Título de seção dos documentos (azul, com linha embaixo). */
export const DocSection = ({ children }: { children: ReactNode }) => (
  <h3 className="mt-2 border-b border-[#E2E8F0] pb-2 text-[13px] font-bold text-[#1A56DB]">
    {children}
  </h3>
)

/** Rótulo de campo com asterisco opcional. */
export const FieldLabel = ({
  children,
  required,
}: {
  children: ReactNode
  required?: boolean
}) => (
  <span className="text-xs font-medium text-[#64748B]">
    {children}
    {required && <span className="ml-0.5 font-semibold text-[#EF4444]">*</span>}
  </span>
)

/** Caixa com várias opções marcáveis (2 ou 3 colunas). */
export const CheckGroup = ({
  label,
  required,
  options,
  value,
  onChange,
  columns = 2,
  invalid,
}: {
  label: string
  required?: boolean
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
  columns?: 2 | 3 | 4
  invalid?: boolean
}) => (
  <div
    className={cn(
      "flex flex-col gap-2 rounded-lg border px-3 py-2.5",
      invalid ? "border-[#EF4444]" : "border-[#E2E8F0]",
    )}
  >
    <FieldLabel required={required}>{label}</FieldLabel>
    <div
      className={cn(
        "grid gap-x-4 gap-y-1.5",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-3",
        columns === 4 && "sm:grid-cols-4",
      )}
    >
      {options.map((o) => (
        <Checkbox
          key={o}
          size="sm"
          isSelected={value.includes(o)}
          onValueChange={(on) =>
            onChange(on ? [...value, o] : value.filter((x) => x !== o))
          }
          classNames={{ label: "text-[12.5px] text-[#1E293B]" }}
        >
          {o}
        </Checkbox>
      ))}
    </div>
  </div>
)

export type PillTone = "primary" | "warning" | "danger"

const PILL_ON: Record<PillTone, string> = {
  primary: "border-[#1A56DB] bg-[#1A56DB] text-white",
  warning: "border-[#F59E0B] bg-[#F59E0B] text-white",
  danger: "border-[#EF4444] bg-[#EF4444] text-white",
}

/**
 * Pergunta com opções em pílulas à direita (Sim/Não, Mallampati, ASA,
 * Parecer). `toneOf` pinta de âmbar/vermelho as respostas de risco.
 */
export const Pills = <T extends string | boolean>({
  label,
  required,
  options,
  value,
  onChange,
  toneOf,
  invalid,
  labelOf = (o) => String(o),
}: {
  label: string
  required?: boolean
  options: readonly T[]
  value: T | undefined
  onChange: (v: T) => void
  toneOf?: (v: T) => PillTone
  invalid?: boolean
  labelOf?: (v: T) => string
}) => (
  <div className="flex items-center justify-between gap-4 border-b border-[#F1F5F9] pb-2.5">
    <span
      className={cn(
        "text-[13px]",
        invalid && value === undefined ? "text-[#B91C1C]" : "text-[#1E293B]",
      )}
    >
      {label}
      {required && (
        <span className="ml-0.5 font-semibold text-[#EF4444]">*</span>
      )}
    </span>
    <div className="flex gap-1.5">
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "min-w-[38px] rounded-full border px-3.5 py-1 text-xs font-semibold",
            value === o
              ? PILL_ON[toneOf?.(o) ?? "primary"]
              : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]",
          )}
        >
          {labelOf(o)}
        </button>
      ))}
    </div>
  </div>
)

const YES_NO = [true, false] as const

/** Pergunta Sim/Não. `warnOn` pinta de âmbar a resposta de risco. */
export const YesNo = ({
  label,
  required,
  value,
  onChange,
  warnOn,
  invalid,
}: {
  label: string
  required?: boolean
  value: boolean | undefined
  onChange: (v: boolean) => void
  warnOn?: boolean
  invalid?: boolean
}) => (
  <Pills
    label={label}
    required={required}
    options={YES_NO}
    value={value}
    onChange={onChange}
    invalid={invalid}
    labelOf={(v) => (v ? "Sim" : "Não")}
    toneOf={(v) => (v === warnOn ? "warning" : "primary")}
  />
)

/** Barra "Meus modelos" no topo dos documentos (D08/D09). */
export const ModelsBar = ({
  models,
  selected,
  onSelect,
  onApply,
  applied,
}: {
  models: string[]
  selected?: string
  onSelect: (name: string) => void
  onApply: () => void
  /** Texto de confirmação depois de aplicar. */
  applied?: string
}) => (
  <div className="flex flex-col gap-2 rounded-lg bg-[#EBF0FE] px-3 py-2.5">
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#1A56DB]">
        <LuBookmark className="h-3.5 w-3.5" />
        Meus modelos
      </span>
      <Select
        aria-label="Modelo"
        size="sm"
        variant="bordered"
        placeholder="Escolha um modelo"
        className="w-64 bg-white"
        selectedKeys={selected ? [selected] : []}
        onSelectionChange={(k) => onSelect(firstKey(k))}
      >
        {models.map((m) => (
          <SelectItem key={m}>{m}</SelectItem>
        ))}
      </Select>
      <Button
        size="sm"
        variant="bordered"
        className="bg-white font-semibold"
        isDisabled={!selected}
        onPress={onApply}
      >
        Aplicar
      </Button>
      <Button
        size="sm"
        variant="bordered"
        className="bg-white font-semibold"
        startContent={<LuBookmarkPlus className="h-3.5 w-3.5" />}
        onPress={() =>
          addToast({
            title: "Salvar como modelo",
            description:
              "No sistema real o modelo iria para a tela Meus modelos (PEP-07).",
          })
        }
      >
        Salvar como modelo
      </Button>
    </div>
    {applied && <span className="text-xs text-[#64748B]">{applied}</span>}
  </div>
)

/** Caixa vermelha de pendências que impedem a assinatura. */
export const PendingBox = ({ items }: { items: string[] }) =>
  items.length ? (
    <div className="flex flex-col gap-1 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5 text-[12.5px] text-[#B91C1C]">
      <span className="flex items-center gap-1.5 font-bold">
        <LuCircleAlert className="h-3.5 w-3.5" />
        Não é possível assinar. Pendências ({items.length}):
      </span>
      <ul className="list-disc pl-8">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  ) : null

/** Faixa azul de informação com borda à esquerda. */
export const InfoBox = ({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) => (
  <div className="flex flex-col gap-0.5 rounded-lg border-l-4 border-[#1A56DB] bg-[#EBF0FE] px-3.5 py-2.5 text-[12.5px]">
    <span className="flex items-center gap-1.5 font-bold text-[#1A56DB]">
      <LuInfo className="h-3.5 w-3.5" />
      {title}
    </span>
    {children && <span className="pl-5 text-[#1E293B]">{children}</span>}
  </div>
)

export const SIDE_ABBR: Record<string, string> = {
  Direito: " D",
  Esquerdo: " E",
  Bilateral: " bilateral",
}

/** Campo de texto com unidade à direita (kg, cm, mmHg…). */
export const Measure = ({
  label,
  unit,
  value,
  onChange,
  required,
  invalid,
  readOnly,
  muted,
}: {
  label: string
  unit?: string
  value: string
  onChange?: (v: string) => void
  required?: boolean
  invalid?: boolean
  readOnly?: boolean
  muted?: boolean
}) => (
  <Input
    label={required ? `${label} *` : label}
    labelPlacement="outside"
    variant="bordered"
    placeholder=" "
    value={value}
    onValueChange={onChange}
    isReadOnly={readOnly}
    isInvalid={invalid}
    classNames={muted ? { inputWrapper: "bg-[#F8FAFC]" } : undefined}
    endContent={
      unit && (
        <span className="text-xs whitespace-nowrap text-[#94A3B8]">{unit}</span>
      )
    }
  />
)

/** Select de opções fixas. */
export const Pick = ({
  label,
  options,
  value,
  onChange,
  required,
  disabled,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
  required?: boolean
  disabled?: boolean
}) => (
  <Select
    label={required ? `${label} *` : label}
    labelPlacement="outside"
    variant="bordered"
    disallowEmptySelection
    selectedKeys={value ? [value] : []}
    onSelectionChange={(k) => onChange(firstKey(k))}
    isDisabled={disabled}
  >
    {options.map((o) => (
      <SelectItem key={o}>{o}</SelectItem>
    ))}
  </Select>
)

/** Linha do paciente no cabeçalho dos documentos (+ alergias em vermelho). */
export const DocPatientLine = ({
  patient,
  surgery,
  withRoom,
}: {
  patient: IPatient
  surgery: ISurgery
  /** "· 05/11/2026 · Sala 1" no lugar de "· cirurgia #id" (D01). */
  withRoom?: string
}) => (
  <span className="flex flex-col gap-1">
    <span>
      {patient.name} · {patient.age} anos · Pront. {patient.record} ·{" "}
      {surgery.procedure}
      {SIDE_ABBR[surgery.side ?? ""] ?? ""}
      {withRoom !== undefined
        ? `${surgery.date ? ` · ${isoToBR(surgery.date)}` : ""}${withRoom ? ` · ${withRoom}` : ""}`
        : ` · cirurgia #${surgery.id}`}
    </span>
    {patient.allergies.length > 0 && (
      <span className="flex items-center gap-1.5 font-semibold text-[#B91C1C]">
        <LuTriangleAlert className="h-3.5 w-3.5" />
        Alergias: {patient.allergies.join(", ")}
      </span>
    )}
  </span>
)

/** Situação do documento à direita do título. */
export const DocBadge = ({ doc }: { doc: IDocState }) =>
  doc.status === "assinado" ? (
    <Chip tone="success" icon={LuCircleCheck}>
      Assinado às {doc.signedAt}
    </Chip>
  ) : (
    <Chip tone="warning">
      {doc.status === "nao_iniciado" ? "Não iniciado" : "Rascunho"}
    </Chip>
  )

/**
 * Marcação com opção exclusiva ("Não se aplica", "Nega", "Sem exames"):
 * marcá-la limpa as outras, e marcar outra a desmarca.
 */
export const exclusive = (next: string[], prev: string[], none: string) => {
  const added = next.find((x) => !prev.includes(x))
  return added === none ? [none] : next.filter((x) => x !== none)
}

/**
 * Primeira chave escolhida num Select do HeroUI. Aceita Set (clique) e texto
 * (o select nativo escondido entrega uma string).
 */
export const firstKey = (k: unknown): string =>
  k instanceof Set ? String(Array.from(k)[0] ?? "") : String(k ?? "")