"use client"

import { Button } from "@heroui/react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { LuArrowLeft, LuSearchX } from "react-icons/lu"

import { ExpenseSheetView } from "../../../_components/gastos/ExpenseSheetView"
import { BASE } from "../../../_components/MockShell"
import { PatientShell } from "../../../_components/PatientShell"
import { useSurgery } from "../../../_data/store"
import { OUTLINE_BUTTON } from "@/modules/Surgeries/helpers/ui"

/** PEP-03c · Paciente · Centro cirúrgico · Ficha de gastos. */
export default function FichaDeGastosPage() {
  const { id } = useParams<{ id: string }>()
  const surgery = useSurgery(Number(id))

  if (!surgery) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex max-w-md flex-col items-center gap-3 rounded-[10px] border border-[#E2E8F0] bg-white p-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F8FAFC]">
            <LuSearchX className="h-5 w-5 text-[#94A3B8]" />
          </span>
          <h1 className="text-lg font-bold text-[#1E293B]">
            Cirurgia não encontrada
          </h1>
          <p className="text-[13px] text-[#64748B]">
            Não há cirurgia #{id} neste mock, então não há ficha de gastos para
            mostrar.
          </p>
          <Button
            as={Link}
            href={BASE}
            className={OUTLINE_BUTTON}
            startContent={<LuArrowLeft />}
          >
            Voltar para internações e cirurgias
          </Button>
        </div>
      </div>
    )
  }

  return (
    <PatientShell surgery={surgery}>
      <ExpenseSheetView surgery={surgery} />
    </PatientShell>
  )
}
