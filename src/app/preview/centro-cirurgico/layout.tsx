import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { MockShell } from "./_components/MockShell"

/**
 * Preview (dev-only) do fluxo do Centro cirúrgico desenhado no
 * "Centro cirurgico.pen". Sem backend: dados mockados em `_data/`.
 */
export default function CentroCirurgicoPreviewLayout({
  children,
}: {
  children: ReactNode
}) {
  if (process.env.NODE_ENV !== "development") notFound()
  return <MockShell>{children}</MockShell>
}
