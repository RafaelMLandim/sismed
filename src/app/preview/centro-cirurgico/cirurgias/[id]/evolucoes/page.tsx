"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { BASE } from "../../../_components/MockShell"
import { PatientShell } from "../../../_components/PatientShell"
import { EvolutionsScreen } from "../../../_components/evolucoes/EvolutionsScreen"
import { useSurgery } from "../../../_data/store"

/** Aba "Evoluções" do paciente da cirurgia `id` (PEP-15). */
export default function EvolutionsPage() {
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
    <PatientShell surgery={surgery} active="evolucoes">
      <EvolutionsScreen surgery={surgery} />
    </PatientShell>
  )
}
