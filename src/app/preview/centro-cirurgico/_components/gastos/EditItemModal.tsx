"use client"

import { Button, Input, addToast } from "@heroui/react"
import { useState } from "react"
import { LuCheck, LuCircleCheck, LuPencil, LuTag } from "react-icons/lu"

import { useCC } from "../../_data/store"
import { fmtBRL } from "../../_data/time"
import type { IExpenseItem } from "../../_data/types"
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/modules/Surgeries/helpers/ui"
import { isPendingLabel } from "./meta"
import { ModalFrame } from "./ModalFrame"
import { QtyStepper } from "./QtyStepper"

/** Editar quantidade/lote de um item e, se for OPME, informar a etiqueta. */
export const EditItemModal = ({
  surgeryId,
  item,
  onClose,
}: {
  surgeryId: number
  item: IExpenseItem
  onClose: () => void
}) => {
  const updateExpenseItem = useCC((s) => s.updateExpenseItem)
  const [qty, setQty] = useState(item.qty)
  const [lot, setLot] = useState(item.lot ?? "")
  const [label, setLabel] = useState("")
  const pending = isPendingLabel(item)
  const hasLot = item.kind !== "Gás" && item.kind !== "Taxa"

  const save = () => {
    const patch: Partial<IExpenseItem> = {
      qty,
      lot: hasLot ? lot.trim() || undefined : item.lot,
    }
    if (pending && label.trim()) patch.trackingLabelPending = false
    updateExpenseItem(surgeryId, item.id, patch)
    addToast({
      title: "Item atualizado",
      description:
        pending && label.trim()
          ? `Etiqueta de rastreio registrada para ${item.name}.`
          : item.name,
      color: "success",
    })
    onClose()
  }

  return (
    <ModalFrame
      isOpen
      onClose={onClose}
      icon={LuPencil}
      title="Editar item da ficha"
      subtitle={`${item.name} · ${item.code}`}
      size="lg"
      footer={
        <>
          <span className="flex-1 text-xs text-[#94A3B8]">
            Valor estimado: {fmtBRL(qty * item.unitPrice)}
          </span>
          <Button className={OUTLINE_BUTTON} onPress={onClose}>
            Cancelar
          </Button>
          <Button
            className={PRIMARY_BUTTON}
            startContent={<LuCheck />}
            onPress={save}
          >
            Salvar
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[#64748B]">
            Quantidade ({item.unit})
          </span>
          <QtyStepper value={qty} onChange={setQty} />
        </div>
        {hasLot && (
          <Input
            label="Lote"
            labelPlacement="outside"
            placeholder="Ex.: CF2311"
            variant="bordered"
            value={lot}
            onValueChange={(v) => setLot(v.toUpperCase())}
            className="max-w-[220px] flex-1"
            classNames={{ input: "font-mono" }}
          />
        )}
      </div>

      {item.kind === "OPME" &&
        (pending ? (
          <div className="flex flex-col gap-2.5 rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] p-3.5">
            <div className="flex items-center gap-2">
              <LuTag className="h-4 w-4 text-[#B45309]" />
              <span className="text-[13.5px] font-bold text-[#92400E]">
                Etiqueta de rastreio pendente
              </span>
            </div>
            <p className="text-[12.5px] leading-[1.45] text-[#92400E]">
              Bipe ou digite o código da etiqueta do lote {item.lot ?? "—"}.
              OPME sem etiqueta não é faturada.
            </p>
            <Input
              aria-label="Código da etiqueta de rastreio"
              placeholder="Código da etiqueta (ex.: ANVISA 80145900123 · série 0042)"
              variant="bordered"
              value={label}
              onValueChange={setLabel}
              classNames={{ inputWrapper: "bg-white" }}
              autoFocus
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-[10px] border border-[#A7F3D0] bg-[#ECFDF5] px-3.5 py-3">
            <LuCircleCheck className="h-4 w-4 text-[#047857]" />
            <span className="text-[13px] font-semibold text-[#047857]">
              Etiqueta de rastreio registrada
            </span>
          </div>
        ))}
    </ModalFrame>
  )
}
