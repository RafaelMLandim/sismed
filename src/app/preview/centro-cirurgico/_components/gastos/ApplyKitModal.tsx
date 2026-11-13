"use client"

import { Button, Checkbox, Select, SelectItem, addToast } from "@heroui/react"
import { useState } from "react"
import { LuPackageOpen, LuPlus } from "react-icons/lu"

import { PROCEDURE_KITS } from "../../_data/expenses"
import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"
import { stockLot } from "./catalog"
import { CURRENT_USER } from "./meta"
import { ModalFrame } from "./ModalFrame"
import { QtyStepper } from "./QtyStepper"

type Kit = (typeof PROCEDURE_KITS)[number]
type Row = { checked: boolean; qty: number }

const rowsOf = (kit?: Kit): Row[] =>
  kit?.items.map((i) => ({ checked: true, qty: i.qty })) ?? []

/** Kit sugerido para o procedimento (palavra-chave no nome do kit). */
export const suggestKit = (procedure: string): Kit | undefined => {
  const p = procedure.toLowerCase()
  if (p.includes("artroplastia") || p.includes("quadril"))
    return PROCEDURE_KITS.find((k) => k.id === "kit-artroplastia")
  if (p.includes("vídeo") || p.includes("video") || p.includes("laparosc"))
    return PROCEDURE_KITS.find((k) => k.id === "kit-video")
  if (p.includes("hernio") || p.includes("hérnia") || p.includes("hernia"))
    return PROCEDURE_KITS.find((k) => k.id === "kit-hernia")
  return undefined
}

/** PEP-M20 · Aplicar kit na ficha de gastos. */
export const ApplyKitModal = ({
  surgeryId,
  procedure,
  surgeon,
  onClose,
}: {
  surgeryId: number
  procedure: string
  surgeon: string
  onClose: () => void
}) => {
  const addExpenseItems = useCC((s) => s.addExpenseItems)
  // Sem kit para o procedimento, nada vem marcado: escolher um kit de outra
  // cirurgia por engano lançaria itens que não foram usados.
  const suggested = suggestKit(procedure)
  const [kitId, setKitId] = useState(suggested?.id ?? "")
  const kit = PROCEDURE_KITS.find((k) => k.id === kitId)
  const [rows, setRows] = useState<Row[]>(() => rowsOf(kit))

  const checked = rows.filter((r) => r.checked).length
  const total = rows.length

  const setRow = (idx: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)))

  const apply = () => {
    if (!kit || !checked) return
    addExpenseItems(
      surgeryId,
      kit.items
        .map((i, idx) => ({ i, r: rows[idx] }))
        .filter(({ r }) => r.checked)
        .map(({ i, r }) => ({
          ...i,
          qty: r.qty,
          lot:
            i.kind === "Gás" || i.kind === "Taxa"
              ? undefined
              : (stockLot(i.code) ??
                `SL${i.code.replace(/\D/g, "").slice(-5)}`),
          launchedBy: CURRENT_USER,
          launchedAt: MOCK_NOW,
          origin: "Kit" as const,
          trackingLabelPending: i.kind === "OPME" ? true : undefined,
        })),
    )
    addToast({
      title: `Kit aplicado: ${checked} ${checked === 1 ? "item lançado" : "itens lançados"}`,
      description: kit.name,
      color: "success",
    })
    onClose()
  }

  return (
    <ModalFrame
      isOpen
      onClose={onClose}
      icon={LuPackageOpen}
      title="Aplicar kit na ficha de gastos"
      subtitle="Desmarque o que não foi usado e ajuste as quantidades."
      size="2xl"
      footer={
        <>
          <span className="flex-1 text-xs text-[#94A3B8]">
            Os itens entram com origem “Kit” e o lote do estoque da sala.
          </span>
          <Button className={OUTLINE_BUTTON} onPress={onClose}>
            Cancelar
          </Button>
          <Button
            className={PRIMARY_BUTTON}
            startContent={<LuPlus />}
            isDisabled={!checked}
            onPress={apply}
          >
            Lançar {checked} {checked === 1 ? "item" : "itens"}
          </Button>
        </>
      }
    >
      <Select
        label="Kit"
        labelPlacement="outside"
        variant="bordered"
        placeholder="Escolha um kit"
        description={
          suggested
            ? undefined
            : `Nenhum kit cadastrado para “${procedure}”. Escolha um kit só se ele foi usado.`
        }
        selectedKeys={kitId ? [kitId] : []}
        onSelectionChange={(keys) => {
          const next = String(Array.from(keys)[0] ?? "")
          setKitId(next)
          setRows(rowsOf(PROCEDURE_KITS.find((k) => k.id === next)))
        }}
      >
        {PROCEDURE_KITS.map((k) => (
          <SelectItem key={k.id} textValue={`${k.name} · padrão do ${surgeon}`}>
            {k.name} · padrão do {surgeon}
          </SelectItem>
        ))}
      </Select>

      <div className="flex flex-col overflow-hidden rounded-[10px] border border-[#E2E8F0]">
        <div className="flex items-center gap-3 border-b border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-[9px]">
          <Checkbox
            size="sm"
            aria-label="Marcar todos"
            isSelected={checked === total && total > 0}
            isIndeterminate={checked > 0 && checked < total}
            onValueChange={(v) =>
              setRows((rs) => rs.map((r) => ({ ...r, checked: v })))
            }
          />
          <span className="flex-1 text-[12.5px] font-semibold text-[#1E293B]">
            {checked} de {total} itens marcados
          </span>
          <span className="w-[110px] text-center text-[10.5px] font-bold tracking-[0.6px] text-[#94A3B8] uppercase">
            Qtd
          </span>
        </div>
        {kit?.items.map((i, idx) => {
          const r = rows[idx]
          if (!r) return null
          return (
            <div
              key={i.code}
              className="flex items-center gap-3 border-b border-[#E2E8F0] px-3.5 py-2.5 last:border-b-0"
            >
              <Checkbox
                size="sm"
                aria-label={i.name}
                isSelected={r.checked}
                onValueChange={(v) => setRow(idx, { checked: v })}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-px">
                <span
                  className={cn(
                    "text-[13.5px] font-medium",
                    r.checked ? "text-[#1E293B]" : "text-[#94A3B8]",
                  )}
                >
                  {i.name}
                </span>
                <span className="text-xs text-[#94A3B8]">
                  {i.kind} · padrão do kit: {i.qty} {i.unit}
                </span>
              </div>
              <QtyStepper
                size="sm"
                value={r.qty}
                disabled={!r.checked}
                highlight={r.qty !== i.qty}
                label={`Quantidade de ${i.name}`}
                onChange={(qty) => setRow(idx, { qty })}
              />
            </div>
          )
        })}
      </div>
    </ModalFrame>
  )
}
