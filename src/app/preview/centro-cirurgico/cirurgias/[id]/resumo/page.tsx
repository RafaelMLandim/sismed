"use client"

import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { Suspense } from "react"

import { BASE } from "../../../_components/MockShell"
import { SurgeryReport } from "../../../_components/resumo/SurgeryReport"
import { useSurgery } from "../../../_data/store"

const Report = () => {
  const { id } = useParams<{ id: string }>()
  const auto = useSearchParams().get("auto") !== "0"
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
  return <SurgeryReport surgery={surgery} autoPrint={auto} />
}

export default function SurgeryReportPage() {
  return (
    <Suspense>
      <Report />
    </Suspense>
  )
}
