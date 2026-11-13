"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { BASE } from "../../../_components/MockShell"
import { PatientShell } from "../../../_components/PatientShell"
import { VitalsScreen } from "../../../_components/sinais/VitalsScreen"
import { useSurgery } from "../../../_data/store"

/** Aba "Sinais vitais" do paciente da cirurgia `id` (PEP-16). */
export default function VitalsPage() {
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
    <PatientShell surgery={surgery} active="sinais">
      <VitalsScreen surgery={surgery} />
    </PatientShell>
  )
}
