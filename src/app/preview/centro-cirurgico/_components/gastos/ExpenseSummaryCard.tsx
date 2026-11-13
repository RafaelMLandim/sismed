"use client"

import {
  LuCircleCheck,
  LuLock,
  LuReceiptText,
  LuTriangleAlert,
} from "react-icons/lu"

import { fmtBRL } from "../../_data/time"
import type { IExpenseSheet } from "../../_data/types"
import { Avatar } from "../ui"
import { type ExpenseSummary, initialsOf, plural, roleOf } from "./meta"

/** Coluna da esquerda: totais, categorias, pendências e quem lançou. */
export const ExpenseSummaryCard = ({
  summary,
  sheet,
}: {
  summary: ExpenseSummary
  sheet: Pick<IExpenseSheet, "status" | "closedAt" | "closedBy">
}) => {
  const { pending } = summary
  const closed = sheet.status === "fechada"

  return (
    <aside className="flex w-full shrink-0 flex-col self-start rounded-[10px] border border-[#E2E8F0] bg-white lg:w-[300px]">
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] px-[18px] py-4">
        <LuReceiptText className="h-4 w-4 text-[#1A56DB]" />
        <h2 className="text-sm font-bold text-[#1E293B]">Resumo</h2>
      </div>

      <div className="flex flex-col gap-0.5 border-b border-[#E2E8F0] px-[18px] py-4">
        <span className="text-xl font-bold text-[#1E293B]">
          {plural(summary.count, "item lançado", "itens lançados")}
        </span>
        <span className="text-[12.5px] text-[#64748B]">
          Valor estimado {fmtBRL(summary.value)}
        </span>
      </div>

      <ul className="flex flex-col px-[18px] pt-1.5 pb-2.5">
        {summary.groups.map(({ key, label, icon: Icon, count, value }, idx) => (
          <li
            key={key}
            className={
              idx < summary.groups.length - 1
                ? "flex items-center gap-2.5 border-b border-[#E2E8F0] py-2.5"
                : "flex items-center gap-2.5 py-2.5"
            }
          >
            <Icon className="h-[15px] w-[15px] shrink-0 text-[#94A3B8]" />
            <div className="flex flex-1 flex-col gap-px">
              <span className="text-[13px] font-semibold text-[#1E293B]">
                {label}
              </span>
              <span className="text-xs text-[#94A3B8]">{fmtBRL(value)}</span>
            </div>
            <span className="text-[15px] font-bold text-[#1E293B]">
              {count}
            </span>
          </li>
        ))}
      </ul>

      {closed ? (
        <div className="flex flex-col gap-1.5 border-y border-[#A7F3D0] bg-[#ECFDF5] px-[18px] py-3.5">
          <div className="flex items-center gap-1.5">
            <LuLock className="h-3.5 w-3.5 text-[#047857]" />
            <span className="text-[13px] font-bold text-[#047857]">
              Ficha fechada
            </span>
          </div>
          <p className="text-[12.5px] leading-[1.45] text-[#047857]">
            Fechada hoje, {sheet.closedAt ?? "—"} por {sheet.closedBy ?? "—"}.
            Enviada para a conferência da farmácia e o faturamento.
          </p>
        </div>
      ) : pending.length ? (
        <div className="flex flex-col gap-2 border-y border-[#FDE68A] bg-[#FFFBEB] px-[18px] py-3.5">
          <div className="flex items-center gap-1.5">
            <LuTriangleAlert className="h-3.5 w-3.5 text-[#B45309]" />
            <span className="text-[13px] font-bold text-[#92400E]">
              {plural(pending.length, "pendência", "pendências")} para fechar
            </span>
          </div>
          {pending.map((i) => (
            <p
              key={i.id}
              className="text-[12.5px] leading-[1.45] text-[#92400E]"
            >
              {i.name} (OPME) ainda está sem a etiqueta de rastreio.
            </p>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 border-y border-[#A7F3D0] bg-[#ECFDF5] px-[18px] py-3.5">
          <LuCircleCheck className="h-3.5 w-3.5 text-[#047857]" />
          <span className="text-[13px] font-bold text-[#047857]">
            Nenhuma pendência para fechar
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2 px-[18px] pt-3.5 pb-[18px]">
        <span className="text-[10.5px] font-bold tracking-[0.8px] text-[#94A3B8] uppercase">
          Quem lançou
        </span>
        {summary.people.length ? (
          summary.people.map((p) => (
            <div key={p.name} className="flex items-center gap-2.5">
              <Avatar initials={initialsOf(p.name)} size={26} />
              <div className="flex flex-col gap-px">
                <span className="text-[12.5px] font-semibold text-[#1E293B]">
                  {p.name}
                </span>
                <span className="text-[11.5px] text-[#94A3B8]">
                  {roleOf(p.name)} · {plural(p.count, "item", "itens")}
                </span>
              </div>
            </div>
          ))
        ) : (
          <span className="text-[12.5px] text-[#94A3B8]">
            Nenhum item lançado ainda.
          </span>
        )}
      </div>
    </aside>
  )
}
