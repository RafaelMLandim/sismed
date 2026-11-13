"use client"

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@heroui/react"
import { useState } from "react"
import {
  LuChevronDown,
  LuChevronUp,
  LuInbox,
  LuPencil,
  LuTag,
  LuTrash2,
} from "react-icons/lu"

import type { IExpenseItem } from "../../_data/types"
import {
  SMALL_OUTLINE_BUTTON,
  SMALL_PRIMARY_BUTTON,
} from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"
import {
  type ExpenseSummary,
  GROUPS,
  KIND_CHIP,
  type KindGroup,
  ORIGIN_ICON,
  isPendingLabel,
} from "./meta"

const PAGE = 10

const HEAD =
  "text-[10.5px] font-bold tracking-[0.6px] text-[#94A3B8] uppercase shrink-0"

/** Abas por tipo + tabela de itens lançados (PEP-03c). */
export const ExpenseItemsTable = ({
  items,
  summary,
  readOnly,
  onEdit,
  onRemove,
}: {
  items: IExpenseItem[]
  summary: ExpenseSummary
  readOnly: boolean
  onEdit: (item: IExpenseItem) => void
  onRemove: (item: IExpenseItem) => void
}) => {
  const [filter, setFilter] = useState<KindGroup | "all">("all")
  const [showAll, setShowAll] = useState(false)

  const group = GROUPS.find((g) => g.key === filter)
  const filtered = group
    ? items.filter((i) => group.kinds.includes(i.kind))
    : items
  const visible = showAll ? filtered : filtered.slice(0, PAGE)

  const tabs = [
    { key: "all" as const, label: "Todos", count: summary.count },
    ...summary.groups.map((g) => ({
      key: g.key,
      label: g.label,
      count: g.count,
    })),
  ]

  return (
    <section className="flex flex-col rounded-[10px] border border-[#E2E8F0] bg-white">
      <div
        role="tablist"
        aria-label="Filtrar por tipo"
        className="flex gap-5 overflow-x-auto border-b border-[#E2E8F0] px-5"
      >
        {tabs.map((t) => {
          const on = t.key === filter
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(t.key)}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 pt-[13px] pb-[11px] text-[13px]",
                on
                  ? "border-[#1A56DB] font-bold text-[#1A56DB]"
                  : "border-transparent font-medium text-[#64748B] hover:text-[#1E293B]",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "rounded-full px-[7px] py-px text-[11px] font-semibold",
                  on
                    ? "bg-[#EBF0FE] text-[#1A56DB]"
                    : "bg-[#F8FAFC] text-[#94A3B8]",
                )}
              >
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="flex gap-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-[9px]">
            <span className={cn(HEAD, "flex-1 shrink")}>Item</span>
            <span className={cn(HEAD, "w-[110px]")}>Tipo</span>
            <span className={cn(HEAD, "w-[70px]")}>Qtd</span>
            <span className={cn(HEAD, "w-[100px]")}>Lote</span>
            <span className={cn(HEAD, "w-[150px]")}>Lançado por</span>
            <span className={cn(HEAD, "w-[130px]")}>Origem</span>
            {!readOnly && (
              <span className={cn(HEAD, "w-14")}>
                <span className="sr-only">Ações</span>
              </span>
            )}
          </div>

          {visible.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
              <LuInbox className="h-6 w-6 text-[#94A3B8]" />
              <span className="text-[13px] text-[#64748B]">
                {items.length
                  ? "Nenhum item deste tipo na ficha."
                  : "Nenhum item lançado ainda. Busque no estoque ou aplique o kit do procedimento."}
              </span>
            </div>
          )}

          {visible.map((i) => (
            <Row
              key={i.id}
              item={i}
              readOnly={readOnly}
              onEdit={() => onEdit(i)}
              onRemove={() => onRemove(i)}
            />
          ))}
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center gap-3 border-t border-[#E2E8F0] px-5 py-3">
          <span className="flex-1 text-[12.5px] text-[#94A3B8]">
            Mostrando {visible.length} de {filtered.length}{" "}
            {filtered.length === 1 ? "item" : "itens"}
          </span>
          {filtered.length > PAGE && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="flex items-center gap-1 text-[12.5px] font-semibold text-[#1A56DB] hover:underline"
            >
              {showAll ? "Mostrar menos" : "Ver todos"}
              {showAll ? (
                <LuChevronUp className="h-3.5 w-3.5" />
              ) : (
                <LuChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      )}
    </section>
  )
}

const Row = ({
  item: i,
  readOnly,
  onEdit,
  onRemove,
}: {
  item: IExpenseItem
  readOnly: boolean
  onEdit: () => void
  onRemove: () => void
}) => {
  const [confirm, setConfirm] = useState(false)
  const pending = isPendingLabel(i)
  const OriginIcon = ORIGIN_ICON[i.origin]

  return (
    <div
      className={cn(
        "flex items-center gap-3.5 border-b border-[#E2E8F0] px-5 py-[11px] last:border-b-0",
        pending && "bg-[#FFFCF3]",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13.5px] font-semibold text-[#1E293B]">
          {i.name}
        </span>
        {pending ? (
          <button
            type="button"
            disabled={readOnly}
            onClick={onEdit}
            className="flex items-center gap-[5px] text-left text-xs font-medium text-[#B45309] enabled:hover:underline"
          >
            <LuTag className="h-3 w-3 shrink-0" />
            {i.code} · etiqueta de rastreio pendente
          </button>
        ) : (
          <span className="text-xs text-[#94A3B8]">{i.code}</span>
        )}
      </div>
      <div className="w-[110px] shrink-0">
        <span
          className={cn(
            "rounded-full px-[9px] py-0.5 text-[11.5px] font-semibold",
            KIND_CHIP[i.kind],
          )}
        >
          {i.kind}
        </span>
      </div>
      <span className="w-[70px] shrink-0 text-[13.5px] font-semibold text-[#1E293B]">
        {i.qty} {i.unit}
      </span>
      <span className="w-[100px] shrink-0 truncate font-mono text-[12.5px] text-[#64748B]">
        {i.lot || "—"}
      </span>
      <div className="flex w-[150px] shrink-0 flex-col gap-px">
        <span className="truncate text-[12.5px] text-[#1E293B]">
          {i.launchedBy}
        </span>
        <span className="text-[11.5px] text-[#94A3B8]">
          hoje, {i.launchedAt}
        </span>
      </div>
      <div className="flex w-[130px] shrink-0 items-center gap-1.5">
        <OriginIcon className="h-[13px] w-[13px] text-[#94A3B8]" />
        <span className="text-[12.5px] text-[#64748B]">{i.origin}</span>
      </div>
      {!readOnly && (
        <div className="flex w-14 shrink-0 justify-end gap-1">
          <Tooltip
            content={
              pending
                ? "Editar e informar etiqueta"
                : "Editar quantidade e lote"
            }
            delay={400}
          >
            <Button
              isIconOnly
              size="sm"
              variant="light"
              aria-label={`Editar ${i.name}`}
              className="h-[26px] w-[26px] min-w-0 rounded-md text-[#94A3B8]"
              onPress={onEdit}
            >
              <LuPencil className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
          <Popover
            placement="bottom-end"
            isOpen={confirm}
            onOpenChange={setConfirm}
          >
            <PopoverTrigger>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label={`Remover ${i.name}`}
                className="h-[26px] w-[26px] min-w-0 rounded-md text-[#94A3B8] data-[hover=true]:text-[#EF4444]"
              >
                <LuTrash2 className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] items-start gap-3 p-3.5">
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-bold text-[#1E293B]">
                  Remover da ficha?
                </span>
                <span className="text-xs leading-[1.45] text-[#64748B]">
                  {i.qty} {i.unit} · {i.name}
                </span>
              </div>
              <div className="flex w-full justify-end gap-2">
                <Button
                  size="sm"
                  className={SMALL_OUTLINE_BUTTON}
                  onPress={() => setConfirm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className={cn(SMALL_PRIMARY_BUTTON, "bg-[#EF4444]")}
                  startContent={<LuTrash2 />}
                  onPress={() => {
                    setConfirm(false)
                    onRemove()
                  }}
                >
                  Remover
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )
}
