"use client"

import { Button, Checkbox, Input, addToast } from "@heroui/react"
import { useState } from "react"
import {
  LuCheck,
  LuCircleCheck,
  LuLock,
  LuScanBarcode,
  LuTag,
  LuTriangleAlert,
} from "react-icons/lu"

import { useCC } from "../../_data/store"
import { fmtBRL } from "../../_data/time"
import type { IExpenseItem } from "../../_data/types"
import {
  OUTLINE_BUTTON,
  PRIMARY_BUTTON,
  SMALL_OUTLINE_BUTTON,
  SMALL_PRIMARY_BUTTON,
} from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"
import { CURRENT_USER, type ExpenseSummary, plural } from "./meta"
import { ModalFrame } from "./ModalFrame"

/** PEP-M21 · Fechar ficha de gastos (bloqueado por OPME sem etiqueta). */
export const CloseSheetModal = ({
  surgeryId,
  summary,
  onClose,
}: {
  surgeryId: number
  summary: ExpenseSummary
  onClose: () => void
}) => {
  const closeExpenseSheet = useCC((s) => s.closeExpenseSheet)
  const [confirmed, setConfirmed] = useState(false)
  const blocked = summary.pending.length > 0 || summary.count === 0
  const canClose = !blocked && confirmed

  const close = () => {
    if (!canClose) return
    closeExpenseSheet(surgeryId, CURRENT_USER)
    addToast({
      title: "Ficha de gastos fechada",
      description: "Enviada para a conferência da farmácia e o faturamento.",
      color: "success",
    })
    onClose()
  }

  return (
    <ModalFrame
      isOpen
      onClose={onClose}
      icon={LuLock}
      title="Fechar ficha de gastos"
      subtitle="Depois de fechada, a ficha vai para a conferência da farmácia e para o faturamento."
      size="xl"
      footer={
        <>
          <Button className={OUTLINE_BUTTON} onPress={onClose}>
            Cancelar
          </Button>
          <Button
            className={cn(
              PRIMARY_BUTTON,
              !canClose && "bg-[#E2E8F0] text-[#94A3B8] opacity-100",
            )}
            startContent={<LuLock />}
            isDisabled={!canClose}
            onPress={close}
          >
            Fechar ficha
          </Button>
        </>
      }
    >
      <div className="flex flex-col overflow-hidden rounded-[10px] border border-[#E2E8F0]">
        {summary.groups.map((g) => (
          <div
            key={g.key}
            className="flex items-center border-b border-[#E2E8F0] px-3.5 py-2.5 text-[13.5px] text-[#1E293B]"
          >
            <span className="flex-1">{g.label}</span>
            <span className="font-semibold">
              {plural(g.count, "item", "itens")}
            </span>
          </div>
        ))}
        <div className="flex items-center bg-[#F8FAFC] px-3.5 py-[11px] text-[13.5px] font-bold text-[#1E293B]">
          <span className="flex-1">Total</span>
          <span>
            {plural(summary.count, "item", "itens")} · {fmtBRL(summary.value)}
          </span>
        </div>
      </div>

      {summary.pending.map((i) => (
        <PendingLabel key={i.id} surgeryId={surgeryId} item={i} />
      ))}

      {summary.count === 0 && (
        <div className="flex items-center gap-3 rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] px-3.5 py-3">
          <LuTriangleAlert className="h-[17px] w-[17px] shrink-0 text-[#B45309]" />
          <span className="text-[13px] text-[#92400E]">
            A ficha não tem itens lançados.
          </span>
        </div>
      )}

      {!blocked && (
        <div className="flex items-center gap-2 rounded-[10px] border border-[#A7F3D0] bg-[#ECFDF5] px-3.5 py-3">
          <LuCircleCheck className="h-4 w-4 text-[#047857]" />
          <span className="text-[13px] font-semibold text-[#047857]">
            Nenhuma pendência. A ficha pode ser fechada.
          </span>
        </div>
      )}

      <Checkbox
        size="sm"
        isSelected={confirmed}
        onValueChange={setConfirmed}
        classNames={{ label: "text-[13.5px] text-[#1E293B]" }}
      >
        Conferi os itens com a equipe da sala
      </Checkbox>
    </ModalFrame>
  )
}

/** Aviso de OPME sem etiqueta com registro inline da etiqueta. */
const PendingLabel = ({
  surgeryId,
  item,
}: {
  surgeryId: number
  item: IExpenseItem
}) => {
  const updateExpenseItem = useCC((s) => s.updateExpenseItem)
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState("")

  const register = () => {
    if (!label.trim()) return
    updateExpenseItem(surgeryId, item.id, { trackingLabelPending: false })
    addToast({
      title: "Etiqueta registrada",
      description: item.name,
      color: "success",
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] px-3.5 py-3">
      <div className="flex items-center gap-3">
        <LuTag className="h-[17px] w-[17px] shrink-0 text-[#B45309]" />
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-[13.5px] font-bold text-[#92400E]">
            {item.name} sem etiqueta de rastreio
          </span>
          <span className="text-[12.5px] leading-[1.45] text-[#92400E]">
            Cole a etiqueta do lote {item.lot ?? "—"} para poder fechar. OPME
            sem etiqueta não é faturada.
          </span>
        </div>
        {!editing && (
          <Button
            size="sm"
            className={cn(SMALL_OUTLINE_BUTTON, "h-8 shrink-0 px-3")}
            startContent={<LuScanBarcode />}
            onPress={() => setEditing(true)}
          >
            Registrar etiqueta
          </Button>
        )}
      </div>
      {editing && (
        <div className="flex items-center gap-2 pl-[29px]">
          <Input
            aria-label="Código da etiqueta de rastreio"
            placeholder="Bipe ou digite o código da etiqueta"
            variant="bordered"
            size="sm"
            autoFocus
            value={label}
            onValueChange={setLabel}
            onKeyDown={(e) => e.key === "Enter" && register()}
            classNames={{ inputWrapper: "bg-white" }}
          />
          <Button
            size="sm"
            className={cn(SMALL_PRIMARY_BUTTON, "h-8 shrink-0")}
            startContent={<LuCheck />}
            isDisabled={!label.trim()}
            onPress={register}
          >
            Salvar
          </Button>
          <Button
            size="sm"
            className={cn(SMALL_OUTLINE_BUTTON, "h-8 shrink-0")}
            onPress={() => setEditing(false)}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}
