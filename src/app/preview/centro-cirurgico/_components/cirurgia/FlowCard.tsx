"use client"

import { Button } from "@heroui/react"
import type { ReactNode } from "react"
import type { IconType } from "react-icons"
import { LuArrowRight } from "react-icons/lu"

import { cn } from "@/shared/utils/cn"

export type FlowTone = "primary" | "warning" | "success" | "neutral"

const ICON_TONE: Record<FlowTone, string> = {
  primary: "bg-[#EBF0FE] text-[#1A56DB]",
  warning: "bg-[#FFFBEB] text-[#B45309]",
  success: "bg-[#ECFDF5] text-[#047857]",
  neutral: "bg-[#F8FAFC] text-[#64748B]",
}

const STATUS_TONE: Record<FlowTone, string> = {
  primary: "text-[#1A56DB]",
  warning: "text-[#B45309]",
  success: "text-[#047857]",
  neutral: "text-[#64748B]",
}

/**
 * Cartão da grade de documentos (PEP-03*): ícone + etiqueta no topo, título,
 * situação colorida, descrição, responsável e botão de largura total.
 */
export const FlowCard = ({
  icon: Icon,
  tone,
  tag,
  title,
  status,
  statusIcon: StatusIcon,
  description,
  footer,
  actionLabel,
  onAction,
  highlighted,
}: {
  icon: IconType
  tone: FlowTone
  tag?: string
  title: string
  status: ReactNode
  statusIcon?: IconType
  description?: ReactNode
  footer?: ReactNode
  actionLabel: string
  onAction: () => void
  /** Próximo passo sugerido: borda azul e botão sólido. */
  highlighted?: boolean
}) => (
  <article
    className={cn(
      "flex min-w-0 flex-col rounded-xl border bg-white",
      highlighted ? "border-[#1A56DB]" : "border-[#E2E8F0]",
    )}
  >
    <div className="flex items-center gap-2.5 px-[18px] pt-4">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-[9px]",
          ICON_TONE[tone],
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="flex-1" />
      {tag && (
        <span className="text-[11.5px] font-semibold text-[#94A3B8]">
          {tag}
        </span>
      )}
    </div>
    <div className="flex flex-1 flex-col gap-1 px-[18px] pt-3.5 pb-4">
      <h3 className="text-[15px] font-bold text-[#1E293B]">{title}</h3>
      <span
        className={cn(
          "flex items-center gap-[5px] text-sm font-semibold",
          STATUS_TONE[tone],
        )}
      >
        {StatusIcon && <StatusIcon className="h-3.5 w-3.5" />}
        {status}
      </span>
      {description && (
        <p className="text-[12.5px] text-[#64748B]">{description}</p>
      )}
      {footer && <p className="text-[12.5px] text-[#94A3B8]">{footer}</p>}
    </div>
    <div className="px-[18px] pb-[18px]">
      <Button
        fullWidth
        variant={highlighted ? "solid" : "bordered"}
        color={highlighted ? "primary" : "default"}
        className={cn(
          "font-semibold",
          !highlighted && "border-1 border-[#E2E8F0] bg-white text-[#1E293B]",
        )}
        endContent={
          <LuArrowRight
            className={cn(
              "h-[15px] w-[15px]",
              highlighted ? "text-white" : "text-[#64748B]",
            )}
          />
        }
        onPress={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  </article>
)
