import type { IconType } from "react-icons"
import {
  LuBone,
  LuPackage,
  LuPackageOpen,
  LuPencil,
  LuPill,
  LuScanBarcode,
  LuWind,
} from "react-icons/lu"

import type {
  ExpenseKind,
  ExpenseOrigin,
  IExpenseItem,
} from "../../_data/types"

/** Usuário logado no mock. */
export const CURRENT_USER = "Ana Lima"

/** Grupos do resumo e das abas: gás e taxa ficam juntos. */
export type KindGroup = "Material" | "Medicamento" | "OPME" | "GasTaxa"

export const GROUPS: {
  key: KindGroup
  label: string
  icon: IconType
  kinds: ExpenseKind[]
}[] = [
  { key: "Material", label: "Materiais", icon: LuPackage, kinds: ["Material"] },
  {
    key: "Medicamento",
    label: "Medicamentos",
    icon: LuPill,
    kinds: ["Medicamento"],
  },
  { key: "OPME", label: "OPME", icon: LuBone, kinds: ["OPME"] },
  {
    key: "GasTaxa",
    label: "Gases e taxas",
    icon: LuWind,
    kinds: ["Gás", "Taxa"],
  },
]

export const KIND_CHIP: Record<ExpenseKind, string> = {
  Material: "bg-[#F8FAFC] text-[#64748B]",
  Medicamento: "bg-[#EBF0FE] text-[#1A56DB]",
  OPME: "bg-[#F3EEFF] text-[#5B21B6]",
  Gás: "bg-[#ECFEFF] text-[#0E7490]",
  Taxa: "bg-[#ECFEFF] text-[#0E7490]",
}

export const ORIGIN_ICON: Record<ExpenseOrigin, IconType> = {
  Manual: LuPencil,
  "Bipado na sala": LuScanBarcode,
  Kit: LuPackageOpen,
}

/** Função de quem lança (coluna "QUEM LANÇOU"). */
const ROLES: Record<string, string> = {
  "Ana Lima": "Circulante",
  "Dr. Marcos Teixeira": "Anestesista",
  "Dra. Renata Alves": "Cirurgiã",
  Farmácia: "Kit",
}

export const roleOf = (name: string) => ROLES[name] ?? "Equipe"

export const initialsOf = (name: string) =>
  name
    .replace(/^(Dr|Dra)\.\s*/, "")
    .split(" ")
    .filter(Boolean)
    .reduce(
      (acc, w, i, arr) => (i === 0 || i === arr.length - 1 ? acc + w[0] : acc),
      "",
    )
    .toUpperCase()

export const itemTotal = (i: IExpenseItem) => i.qty * i.unitPrice

export const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`

export const isPendingLabel = (i: IExpenseItem) =>
  i.kind === "OPME" && !!i.trackingLabelPending

/** Totais da ficha: geral, por grupo, por quem lançou e pendências. */
export const summarize = (items: IExpenseItem[]) => {
  const groups = GROUPS.map((g) => {
    const list = items.filter((i) => g.kinds.includes(i.kind))
    return {
      ...g,
      count: list.length,
      value: list.reduce((acc, i) => acc + itemTotal(i), 0),
    }
  })

  const byPerson = new Map<string, number>()
  items.forEach((i) =>
    byPerson.set(i.launchedBy, (byPerson.get(i.launchedBy) ?? 0) + 1),
  )
  const people = [...byPerson.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return {
    count: items.length,
    value: items.reduce((acc, i) => acc + itemTotal(i), 0),
    groups,
    people,
    pending: items.filter(isPendingLabel),
  }
}

export type ExpenseSummary = ReturnType<typeof summarize>
