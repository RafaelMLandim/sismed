"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { BASE } from "../../../_components/MockShell"
import { PatientShell } from "../../../_components/PatientShell"
import { SummaryScreen } from "../../../_components/resumo/SummaryScreen"
import { useSurgery } from "../../../_data/store"

/** Aba "Resumo" do paciente da cirurgia `id` (PEP-18). */
export default function SummaryPage() {
  const { id } = useParams<{ id: string }>()
  const surgery = useSurgery(Number(id))
  if (!surgery)
    return (
      <p className="p-10 text-sm">
        Cirurgia não encontrada.{" "}
        <Link href={BASE} className="text-[#1A56DB]">
          Voltar
        </Link>
      </p>
    )
  return (
    <PatientShell surgery={surgery} active="resumo">
      <SummaryScreen surgery={surgery} />
    </PatientShell>
  )
}
