"use client"

import { Button, addToast } from "@heroui/react"
import { useMemo, useState } from "react"
import {
  LuPackageOpen,
  LuPlus,
  LuScanBarcode,
  LuSearch,
  LuTabletSmartphone,
  LuWind,
  LuX,
} from "react-icons/lu"

import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import { fmtBRL } from "../../_data/time"
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"
import { type ICatalogItem, searchStock } from "./catalog"
import { CURRENT_USER, KIND_CHIP } from "./meta"
import { QtyStepper } from "./QtyStepper"

/** Cartão "Lançar item": busca no estoque + quantidade + atalhos. */
export const LaunchItemCard = ({
  surgeryId,
  suggestedKit,
  onApplyKit,
  onGasTax,
}: {
  surgeryId: number
  suggestedKit?: { name: string; count: number }
  onApplyKit: () => void
  onGasTax: () => void
}) => {
  const addExpenseItems = useCC((s) => s.addExpenseItems)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<ICatalogItem | null>(null)
  const [qty, setQty] = useState(1)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const results = useMemo(() => searchStock(query), [query])

  const pick = (item: ICatalogItem) => {
    setSelected(item)
    setQuery(item.name)
    setOpen(false)
  }

  const clear = () => {
    setSelected(null)
    setQuery("")
    setQty(1)
  }

  const launch = () => {
    const item = selected ?? (results.length === 1 ? results[0] : null)
    if (!item) {
      addToast({
        title: "Escolha um item do estoque",
        description: "Busque por nome, código ou código de barras.",
        color: "warning",
      })
      return
    }
    addExpenseItems(surgeryId, [
      {
        name: item.name,
        code: item.code,
        kind: item.kind,
        qty,
        unit: item.unit,
        lot: item.lot,
        launchedBy: CURRENT_USER,
        launchedAt: MOCK_NOW,
        origin: "Manual",
        unitPrice: item.unitPrice,
        trackingLabelPending: item.kind === "OPME" ? true : undefined,
      },
    ])
    addToast({
      title: "Item lançado",
      description: `${qty} ${item.unit} · ${item.name}`,
      color: "success",
    })
    clear()
  }

  return (
    <section className="flex flex-col gap-3 rounded-[10px] border border-[#E2E8F0] bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-sm font-bold text-[#1E293B]">Lançar item</h2>
        <span className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <LuTabletSmartphone className="h-3.5 w-3.5" />
          Itens bipados no tablet da sala entram aqui sozinhos
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[260px] flex-1">
          <div className="flex h-[42px] items-center gap-2.5 rounded-lg border border-[#E2E8F0] bg-white px-3 focus-within:border-[#1A56DB]">
            <LuSearch className="h-4 w-4 shrink-0 text-[#94A3B8]" />
            <input
              aria-label="Buscar no estoque"
              value={query}
              placeholder="Buscar no estoque por nome, código ou código de barras"
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 120)}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelected(null)
                setActive(0)
                setOpen(true)
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault()
                  setActive((a) => Math.min(a + 1, results.length - 1))
                } else if (e.key === "ArrowUp") {
                  e.preventDefault()
                  setActive((a) => Math.max(a - 1, 0))
                } else if (e.key === "Enter") {
                  e.preventDefault()
                  if (open && results[active] && !selected)
                    pick(results[active])
                  else launch()
                } else if (e.key === "Escape") setOpen(false)
              }}
              className="min-w-0 flex-1 bg-transparent text-[13.5px] text-[#1E293B] outline-none placeholder:text-[#94A3B8]"
            />
            {query ? (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={clear}
                className="text-[#94A3B8] hover:text-[#64748B]"
              >
                <LuX className="h-4 w-4" />
              </button>
            ) : (
              <LuScanBarcode
                aria-hidden
                className="h-[18px] w-[18px] shrink-0 text-[#1A56DB]"
              />
            )}
          </div>

          {open && query.trim() && !selected && (
            <ul
              role="listbox"
              className="absolute top-[46px] right-0 left-0 z-20 max-h-80 overflow-auto rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-lg"
            >
              {results.length ? (
                results.map((r, idx) => (
                  <li key={r.code} role="option" aria-selected={idx === active}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => pick(r)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left",
                        idx === active && "bg-[#F8FAFC]",
                      )}
                    >
                      <div className="flex flex-1 flex-col gap-px">
                        <span className="text-[13px] font-semibold text-[#1E293B]">
                          {r.name}
                        </span>
                        <span className="text-xs text-[#94A3B8]">
                          {r.code}
                          {r.lot ? ` · lote ${r.lot}` : ""} ·{" "}
                          {fmtBRL(r.unitPrice)}/{r.unit}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-[9px] py-0.5 text-[11.5px] font-semibold",
                          KIND_CHIP[r.kind],
                        )}
                      >
                        {r.kind}
                      </span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2.5 text-[13px] text-[#94A3B8]">
                  Nenhum item do estoque para “{query.trim()}”.
                </li>
              )}
            </ul>
          )}
        </div>

        <QtyStepper value={qty} onChange={setQty} />

        <Button
          className={cn(PRIMARY_BUTTON, "h-[42px] px-[18px]")}
          startContent={<LuPlus />}
          onPress={launch}
        >
          Lançar
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          size="sm"
          className={cn(OUTLINE_BUTTON, "h-8 px-3")}
          startContent={<LuPackageOpen />}
          onPress={onApplyKit}
        >
          Aplicar kit do procedimento
        </Button>
        <Button
          size="sm"
          className={cn(OUTLINE_BUTTON, "h-8 px-3")}
          startContent={<LuWind />}
          onPress={onGasTax}
        >
          Lançar gás ou taxa
        </Button>
        {suggestedKit && (
          <span className="text-xs text-[#94A3B8]">
            Kit sugerido: {suggestedKit.name} ({suggestedKit.count}{" "}
            {suggestedKit.count === 1 ? "item" : "itens"})
          </span>
        )}
      </div>
    </section>
  )
}
