"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { BASE } from "../../../_components/MockShell"
import { PatientShell } from "../../../_components/PatientShell"
import { DischargeScreen } from "../../../_components/alta/DischargeScreen"
import { useSurgery } from "../../../_data/store"

/** Aba "Alta" do paciente da cirurgia `id` (PEP-17a/17b). */
export default function DischargePage() {
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
    <PatientShell surgery={surgery} active="alta">
      <DischargeScreen surgery={surgery} />
    </PatientShell>
  )
}
