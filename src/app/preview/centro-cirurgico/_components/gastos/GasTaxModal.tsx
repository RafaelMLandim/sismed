"use client"

import { Button, Select, SelectItem, addToast } from "@heroui/react"
import { useState } from "react"
import { LuPlus, LuWind } from "react-icons/lu"

import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import { fmtBRL } from "../../_data/time"
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/modules/Surgeries/helpers/ui"
import { GAS_TAX_CATALOG } from "./catalog"
import { CURRENT_USER } from "./meta"
import { ModalFrame } from "./ModalFrame"
import { QtyStepper } from "./QtyStepper"

/** "Lançar gás ou taxa": gás em minutos, taxa por uso. */
export const GasTaxModal = ({
  surgeryId,
  onClose,
}: {
  surgeryId: number
  onClose: () => void
}) => {
  const addExpenseItems = useCC((s) => s.addExpenseItems)
  const [code, setCode] = useState(GAS_TAX_CATALOG[0].code)
  const [qty, setQty] = useState(60)
  const item = GAS_TAX_CATALOG.find((g) => g.code === code)
  const isGas = item?.kind === "Gás"

  const launch = () => {
    if (!item) return
    addExpenseItems(surgeryId, [
      {
        name: item.name,
        code: item.code,
        kind: item.kind,
        qty,
        unit: item.unit,
        launchedBy: CURRENT_USER,
        launchedAt: MOCK_NOW,
        origin: "Manual",
        unitPrice: item.unitPrice,
      },
    ])
    addToast({
      title: `${item.kind} lançad${item.kind === "Taxa" ? "a" : "o"}`,
      description: `${qty} ${item.unit} · ${item.name}`,
      color: "success",
    })
    onClose()
  }

  return (
    <ModalFrame
      isOpen
      onClose={onClose}
      icon={LuWind}
      title="Lançar gás ou taxa"
      subtitle="Gases são cobrados por minuto de uso; taxas, por uso do equipamento ou da sala."
      size="lg"
      footer={
        <>
          <span className="flex-1 text-xs text-[#94A3B8]">
            {item ? `Valor estimado: ${fmtBRL(qty * item.unitPrice)}` : ""}
          </span>
          <Button className={OUTLINE_BUTTON} onPress={onClose}>
            Cancelar
          </Button>
          <Button
            className={PRIMARY_BUTTON}
            startContent={<LuPlus />}
            isDisabled={!item}
            onPress={launch}
          >
            Lançar
          </Button>
        </>
      }
    >
      <Select
        label="Gás ou taxa"
        labelPlacement="outside"
        variant="bordered"
        disallowEmptySelection
        selectedKeys={[code]}
        onSelectionChange={(keys) => {
          const next = String(Array.from(keys)[0] ?? "")
          const nextItem = GAS_TAX_CATALOG.find((g) => g.code === next)
          setCode(next)
          if (nextItem) setQty(nextItem.kind === "Gás" ? 60 : 1)
        }}
      >
        {(["Gás", "Taxa"] as const).flatMap((kind) =>
          GAS_TAX_CATALOG.filter((g) => g.kind === kind).map((g) => (
            <SelectItem
              key={g.code}
              textValue={g.name}
              description={`${kind} · ${g.code} · ${fmtBRL(g.unitPrice)}/${g.unit}`}
            >
              {g.name}
            </SelectItem>
          )),
        )}
      </Select>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[#64748B]">
          {isGas ? "Tempo de uso (minutos)" : "Quantidade de usos"}
        </span>
        <div className="flex items-center gap-3">
          <QtyStepper value={qty} onChange={setQty} />
          {isGas && (
            <div className="flex gap-1.5">
              {[30, 60, 90, 120].map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={qty === m ? "flat" : "bordered"}
                  color={qty === m ? "primary" : "default"}
                  className="min-w-0 px-2.5"
                  onPress={() => setQty(m)}
                >
                  {m} min
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalFrame>
  )
}
