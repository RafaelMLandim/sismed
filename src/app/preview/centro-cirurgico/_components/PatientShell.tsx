"use client"

import { addToast } from "@heroui/react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import {
  LuBedDouble,
  LuChevronDown,
  LuClipboardList,
  LuFileText,
  LuFolderOpen,
  LuHeartPulse,
  LuLogOut,
  LuPill,
  LuScissors,
  LuTriangleAlert,
} from "react-icons/lu"

import { useCC } from "../_data/store"
import type { ISurgery } from "../_data/types"
import { isoToBR } from "../_data/days"
import { MOCK_TODAY } from "../_data/fixtures"
import { BASE } from "./MockShell"
import { cn } from "@/shared/utils/cn"

const TABS = [
  { key: "resumo", label: "Resumo", icon: LuClipboardList },
  { key: "evolucoes", label: "Evoluções", icon: LuFileText },
  { key: "prescricao", label: "Prescrição", icon: LuPill },
  { key: "sinais", label: "Sinais vitais", icon: LuHeartPulse },
  { key: "cirurgia", label: "Cirurgia", icon: LuScissors },
  { key: "documentos", label: "Documentos", icon: LuFolderOpen },
  { key: "alta", label: "Alta", icon: LuLogOut },
] as const

type TabKey = (typeof TABS)[number]["key"]

/**
 * Cabeçalho do paciente + barra de abas (PEP-03*). Só a aba "Cirurgia" está no
 * escopo do mock; as outras mostram um aviso.
 */
/** Abas já implementadas no mock → caminho dentro de /cirurgias/[id]. */
const TAB_PATHS: Partial<Record<TabKey, string>> = {
  cirurgia: "",
  sinais: "/sinais-vitais",
  evolucoes: "/evolucoes",
  resumo: "/resumo-internacao",
  alta: "/alta",
}

export const PatientShell = ({
  surgery,
  active = "cirurgia",
  children,
}: {
  surgery: ISurgery
  /** Aba destacada. */
  active?: TabKey
  children: ReactNode
}) => {
  const router = useRouter()
  const patient = useCC((s) =>
    s.patients.find((p) => p.id === surgery.patientId),
  )
  const hosp = useCC((s) =>
    s.hospitalizations.find((h) => h.id === surgery.hospitalizationId),
  )
  if (!patient) return null

  const badge = hosp?.discharged
    ? `Alta em ${isoToBR(hosp.discharged.date)} às ${hosp.discharged.time} · ${hosp.day} ${hosp.day === 1 ? "dia" : "dias"} de internação`
    : hosp
      ? `${patient.sex === "Feminino" ? "Internada" : "Internado"} · ${hosp.bed} · ${hosp.day}º dia`
      : surgery.stage === "a_alocar"
        ? "Cirurgia a alocar"
        : "Cirurgia ambulatorial"

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#EBF0FE] text-[13px] font-bold text-[#1A56DB]">
            {patient.initials}
          </span>
          <div className="flex flex-col gap-[3px]">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold tracking-[0.3px] text-[#1E293B] uppercase">
                {patient.name}
              </span>
              <span
                className={cn(
                  "rounded px-2 py-[3px] text-[11px] font-semibold",
                  hosp?.discharged
                    ? "bg-[#ECFDF5] text-[#047857]"
                    : "bg-[#EBF0FE] text-[#1A56DB]",
                )}
              >
                {badge}
              </span>
            </div>
            <span className="text-xs text-[#64748B]">
              {patient.age} anos · {patient.sex} · Pront. {patient.record} ·{" "}
              {surgery.insurance}
              {hosp ? ` · ${hosp.sector}` : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {patient.allergies.map((a) => (
            <span
              key={a}
              className="flex items-center gap-[5px] rounded-full bg-[#FEF2F2] px-2.5 py-1 text-[11px] font-semibold text-[#EF4444]"
            >
              <LuTriangleAlert className="h-3 w-3" />
              Alergia: {a}
            </span>
          ))}
          {patient.risks.map((r) => (
            <span
              key={r}
              className="flex items-center gap-[5px] rounded-full bg-[#FFFBEB] px-2.5 py-1 text-[11px] font-semibold text-[#B45309]"
            >
              <LuTriangleAlert className="h-3 w-3" />
              {r}
            </span>
          ))}
        </div>
      </header>

      <nav className="flex items-center justify-between border-b border-[#E2E8F0] bg-white px-6">
        <div className="flex gap-[22px]">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = key === active
            const path = TAB_PATHS[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() =>
                  isActive
                    ? undefined
                    : path !== undefined
                      ? router.push(`${BASE}/cirurgias/${surgery.id}${path}`)
                      : addToast({
                          title: `Aba "${label}" fora do escopo do mock`,
                          description:
                            "Este preview cobre só o fluxo do centro cirúrgico.",
                        })
                }
                className={cn(
                  "flex items-center gap-[7px] border-b-2 px-0.5 pt-[13px] pb-3 text-[13px]",
                  isActive
                    ? "border-[#1A56DB] font-semibold text-[#1A56DB]"
                    : "border-transparent text-[#64748B] hover:text-[#1E293B]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-1.5 py-[13px] text-[13px] text-[#64748B]">
          <LuBedDouble className="h-3.5 w-3.5" />
          {hosp
            ? `Internação de ${hosp.admittedOn}`
            : `Atendimento de ${surgery.date ? isoToBR(surgery.date) : MOCK_TODAY}`}
          <LuChevronDown className="h-3.5 w-3.5 text-[#94A3B8]" />
        </div>
      </nav>

      <main className="flex flex-1 flex-col gap-5 px-6 py-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
