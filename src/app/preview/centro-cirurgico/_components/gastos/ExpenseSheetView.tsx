"use client"

import { Button, addToast } from "@heroui/react"
import Link from "next/link"
import { useMemo, useState } from "react"
import {
  LuArrowLeft,
  LuLock,
  LuLockOpen,
  LuPencilLine,
  LuScissors,
} from "react-icons/lu"

import { useCC, useExpenseSheet } from "../../_data/store"
import type { IExpenseItem, ISurgery } from "../../_data/types"
import { BASE } from "../MockShell"
import { Chip, Eyebrow } from "../ui"
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/modules/Surgeries/helpers/ui"
import { ApplyKitModal, suggestKit } from "./ApplyKitModal"
import { CloseSheetModal } from "./CloseSheetModal"
import { EditItemModal } from "./EditItemModal"
import { ExpenseItemsTable } from "./ExpenseItemsTable"
import { ExpenseSummaryCard } from "./ExpenseSummaryCard"
import { GasTaxModal } from "./GasTaxModal"
import { LaunchItemCard } from "./LaunchItemCard"
import { summarize } from "./meta"

const SIDE_LABEL: Partial<Record<NonNullable<ISurgery["side"]>, string>> = {
  Direito: "Direita",
  Esquerdo: "Esquerda",
  Bilateral: "Bilateral",
}

type ModalState =
  | { type: "kit" }
  | { type: "gas" }
  | { type: "close" }
  | { type: "edit"; itemId: string }
  | null

/** PEP-03c · Ficha de gastos da cirurgia. */
export const ExpenseSheetView = ({ surgery: s }: { surgery: ISurgery }) => {
  const sheet = useExpenseSheet(s.id)
  const removeExpenseItem = useCC((st) => st.removeExpenseItem)
  const reopenExpenseSheet = useCC((st) => st.reopenExpenseSheet)
  const [modal, setModal] = useState<ModalState>(null)

  const items = useMemo(() => sheet?.items ?? [], [sheet])
  const summary = useMemo(() => summarize(items), [items])
  const closed = sheet?.status === "fechada"
  const kit = suggestKit(s.procedure)
  const editing =
    modal?.type === "edit"
      ? items.find((i) => i.id === modal.itemId)
      : undefined

  const eyebrow = [
    `Cirurgia #${s.id}`,
    s.procedure,
    s.side ? SIDE_LABEL[s.side] : undefined,
  ]
    .filter(Boolean)
    .join(" · ")

  const remove = (i: IExpenseItem) => {
    removeExpenseItem(s.id, i.id)
    addToast({ title: "Item removido da ficha", description: i.name })
  }

  const reopen = () => {
    reopenExpenseSheet(s.id)
    addToast({
      title: "Ficha reaberta",
      description: "A ficha voltou para edição. Feche de novo ao terminar.",
    })
  }

  const close = () => setModal(null)

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-[5px]">
          <Eyebrow icon={LuScissors}>{eyebrow}</Eyebrow>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[28px] font-bold text-[#1E293B]">
              Ficha de gastos
            </h1>
            {closed ? (
              <Chip tone="success" icon={LuLock}>
                Fechada
              </Chip>
            ) : (
              <Chip tone="warning" icon={LuPencilLine}>
                Em aberto
              </Chip>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            as={Link}
            href={`${BASE}/cirurgias/${s.id}`}
            className={OUTLINE_BUTTON}
            startContent={<LuArrowLeft />}
          >
            Voltar para a cirurgia
          </Button>
          {closed ? (
            <Button
              className={OUTLINE_BUTTON}
              startContent={<LuLockOpen />}
              onPress={reopen}
            >
              Reabrir ficha
            </Button>
          ) : (
            <Button
              className={PRIMARY_BUTTON}
              startContent={<LuLock />}
              onPress={() => setModal({ type: "close" })}
            >
              Fechar ficha de gastos
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <ExpenseSummaryCard
          summary={summary}
          sheet={sheet ?? { status: "aberta" }}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {closed ? (
            <section className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[#E2E8F0] bg-white p-5">
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[#ECFDF5]">
                <LuLock className="h-[18px] w-[18px] text-[#047857]" />
              </span>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-bold text-[#1E293B]">
                  Ficha fechada hoje, {sheet?.closedAt ?? "—"}, por{" "}
                  {sheet?.closedBy ?? "—"}
                </span>
                <span className="text-[12.5px] text-[#64748B]">
                  Somente leitura. Para lançar ou corrigir itens, reabra a
                  ficha.
                </span>
              </div>
              <Button
                size="sm"
                className={OUTLINE_BUTTON}
                startContent={<LuLockOpen />}
                onPress={reopen}
              >
                Reabrir ficha
              </Button>
            </section>
          ) : (
            <LaunchItemCard
              surgeryId={s.id}
              suggestedKit={
                kit ? { name: kit.name, count: kit.items.length } : undefined
              }
              onApplyKit={() => setModal({ type: "kit" })}
              onGasTax={() => setModal({ type: "gas" })}
            />
          )}

          <ExpenseItemsTable
            items={items}
            summary={summary}
            readOnly={closed}
            onEdit={(i) => setModal({ type: "edit", itemId: i.id })}
            onRemove={remove}
          />
        </div>
      </div>

      {modal?.type === "kit" && (
        <ApplyKitModal
          surgeryId={s.id}
          procedure={s.procedure}
          surgeon={s.surgeon}
          onClose={close}
        />
      )}
      {modal?.type === "gas" && (
        <GasTaxModal surgeryId={s.id} onClose={close} />
      )}
      {modal?.type === "close" && (
        <CloseSheetModal surgeryId={s.id} summary={summary} onClose={close} />
      )}
      {editing && (
        <EditItemModal
          key={editing.id}
          surgeryId={s.id}
          item={editing}
          onClose={close}
        />
      )}
    </>
  )
}
