"use client"

import type { ReactNode } from "react"
import type { IconType } from "react-icons"
import {
  LuActivity,
  LuBedDouble,
  LuCalendarClock,
  LuCircleCheck,
  LuCircleX,
  LuClipboardCheck,
  LuClock3,
  LuHeartPulse,
  LuInbox,
  LuLogOut,
} from "react-icons/lu"

import type { IHospitalization, ISurgery } from "../_data/types"
import { cn } from "@/shared/utils/cn"

/**
 * Tokens do "Centro cirurgico.pen" (variáveis do arquivo). Usar via classes
 * arbitrárias do Tailwind: `text-[#1E293B]` etc. Mantidos aqui como referência.
 */
export const T = {
  primary: "#1A56DB",
  primaryLight: "#EBF0FE",
  primaryDark: "#142D6B",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  bgCard: "#FFFFFF",
  bgElevated: "#F8FAFC",
  bgPage: "#F0F2F5",
  border: "#E2E8F0",
  success: "#10B981",
  successLight: "#ECFDF5",
  successText: "#047857",
  danger: "#EF4444",
  dangerLight: "#FEF2F2",
  dangerText: "#B91C1C",
  warning: "#F59E0B",
  warningLight: "#FFFBEB",
  warningText: "#B45309",
  ai: "#7C3AED",
  aiLight: "#F3EEFF",
  aiDark: "#5B21B6",
} as const

export type ChipTone =
  | "primary"
  | "warning"
  | "ai"
  | "success"
  | "cyan"
  | "neutral"
  | "danger"

const TONE_CLASS: Record<ChipTone, string> = {
  primary: "bg-[#EBF0FE] text-[#1A56DB]",
  warning: "bg-[#FFFBEB] text-[#B45309]",
  ai: "bg-[#F3EEFF] text-[#5B21B6]",
  success: "bg-[#ECFDF5] text-[#047857]",
  cyan: "bg-[#ECFEFF] text-[#0E7490]",
  neutral: "bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]",
  danger: "bg-[#FEF2F2] text-[#B91C1C]",
}

/** Chip arredondado com ícone (padding 3×9, 12/600, ícone 12). */
export const Chip = ({
  tone,
  icon: Icon,
  children,
  className,
}: {
  tone: ChipTone
  icon?: IconType
  children: ReactNode
  className?: string
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] text-xs font-semibold whitespace-nowrap",
      TONE_CLASS[tone],
      className,
    )}
  >
    {Icon && <Icon className="h-3 w-3 shrink-0" />}
    {children}
  </span>
)

/** Etapa exibida na lista de entrada (PEP-00) e nos cabeçalhos. */
export type JourneyStep =
  | "aguardando_chegada"
  | "pre_operatorio"
  | "agendada"
  | "em_cirurgia"
  | "srpa"
  | "finalizada"
  | "cancelada"
  | "a_alocar"
  | "internado"
  | "alta_prevista"

export const STEP_META: Record<
  JourneyStep,
  { label: string; tone: ChipTone; icon: IconType }
> = {
  aguardando_chegada: {
    label: "Aguardando chegada",
    tone: "neutral",
    icon: LuClock3,
  },
  pre_operatorio: {
    label: "Pré-operatório",
    tone: "warning",
    icon: LuClipboardCheck,
  },
  agendada: { label: "Agendada", tone: "neutral", icon: LuCalendarClock },
  em_cirurgia: { label: "Em cirurgia", tone: "primary", icon: LuActivity },
  srpa: { label: "Recuperação (SRPA)", tone: "ai", icon: LuHeartPulse },
  finalizada: { label: "Finalizada", tone: "success", icon: LuCircleCheck },
  cancelada: { label: "Cancelada", tone: "danger", icon: LuCircleX },
  a_alocar: { label: "A alocar", tone: "warning", icon: LuInbox },
  internado: { label: "Internado", tone: "success", icon: LuBedDouble },
  alta_prevista: { label: "Alta prevista hoje", tone: "cyan", icon: LuLogOut },
}

/**
 * Etapa de uma cirurgia na jornada: antes da sala, "Agendada" vira
 * "Aguardando chegada" (paciente não chegou) ou "Pré-operatório" (chegou e tem
 * documento pré-operatório em andamento).
 */
export const surgeryStep = (s: ISurgery): JourneyStep => {
  if (s.stage !== "agendada") return s.stage
  if (!s.arrived) return "aguardando_chegada"
  const started =
    s.docs.pre_anestesica.status !== "nao_iniciado" ||
    s.docs.admissao_pre_op.status !== "nao_iniciado"
  return started ? "pre_operatorio" : "agendada"
}

export const hospitalizationStep = (h: IHospitalization): JourneyStep =>
  h.dischargeToday ? "alta_prevista" : "internado"

export const StepChip = ({
  step,
  label,
  className,
}: {
  step: JourneyStep
  /** Sobrescreve o texto (ex.: "Na SRPA" no título do paciente). */
  label?: string
  className?: string
}) => {
  const m = STEP_META[step]
  return (
    <Chip tone={m.tone} icon={m.icon} className={className}>
      {label ?? m.label}
    </Chip>
  )
}

/** Avatar redondo com iniciais. */
export const Avatar = ({
  initials,
  size = 32,
  className,
}: {
  initials: string
  size?: number
  className?: string
}) => (
  <span
    style={{ width: size, height: size, fontSize: size * 0.36 }}
    className={cn(
      "inline-flex shrink-0 items-center justify-center rounded-full bg-[#EBF0FE] font-bold text-[#1A56DB]",
      className,
    )}
  >
    {initials}
  </span>
)

/** Rótulo pequeno em caixa alta com ícone (breadcrumb do desenho). */
export const Eyebrow = ({
  icon: Icon,
  children,
}: {
  icon?: IconType
  children: ReactNode
}) => (
  <div className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.9px] text-[#1A56DB] uppercase">
    {Icon && <Icon className="h-[13px] w-[13px]" />}
    {children}
  </div>
)
