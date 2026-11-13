"use client"

import { Button } from "@heroui/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { LuFlaskConical, LuRotateCcw } from "react-icons/lu"

import { useCC } from "../_data/store"
import { cn } from "@/shared/utils/cn"

export const BASE = "/preview/centro-cirurgico"

const LINKS = [
  { href: BASE, label: "Internações e cirurgias" },
  { href: `${BASE}/mapa`, label: "Mapa cirúrgico" },
]

/**
 * Hidrata o store do localStorage antes de renderizar (evita divergência com o
 * SSR) e mostra uma barra flutuante de dev com atalhos e "Resetar dados".
 */
export const MockShell = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false)
  const pathname = usePathname()
  const reset = useCC((s) => s.reset)

  useEffect(() => {
    Promise.resolve(useCC.persist.rehydrate()).then(() => setReady(true))
  }, [])

  if (!ready) return null

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-16 font-sans text-[#1E293B] print:bg-white print:pb-0">
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white/95 py-1 pr-1 pl-3 text-xs shadow-lg backdrop-blur print:hidden">
        <LuFlaskConical className="h-3.5 w-3.5 text-[#7C3AED]" />
        <span className="mr-1 font-semibold text-[#5B21B6]">Mock</span>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-full px-2.5 py-1 font-medium text-[#64748B] hover:bg-[#F8FAFC]",
              pathname === l.href && "bg-[#EBF0FE] text-[#1A56DB]",
            )}
          >
            {l.label}
          </Link>
        ))}
        <Button
          size="sm"
          variant="light"
          radius="full"
          startContent={<LuRotateCcw />}
          onPress={() => reset()}
        >
          Resetar dados
        </Button>
      </div>
    </div>
  )
}
