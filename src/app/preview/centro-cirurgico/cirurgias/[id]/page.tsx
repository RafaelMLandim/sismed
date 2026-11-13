"use client"

import { useParams } from "next/navigation"
import { Suspense } from "react"

import { SurgeryTab } from "../../_components/cirurgia/SurgeryTab"

/** PEP-03* · Paciente › Cirurgia (preview mockado do Centro cirúrgico). */
export default function CirurgiaPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <Suspense>
      <SurgeryTab id={Number(id)} />
    </Suspense>
  )
}
