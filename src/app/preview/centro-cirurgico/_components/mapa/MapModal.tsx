"use client"

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react"
import type { ReactNode } from "react"
import { LuCalendar, LuX } from "react-icons/lu"

import { FIELD_STYLES } from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

const WIDTHS = {
  560: "max-w-[560px]",
  720: "max-w-[720px]",
  960: "max-w-[960px]",
  860: "max-w-[860px]",
} as const

/**
 * Modal do mapa (desenho: raio 12, cabeçalho 18×24 com ícone 38, título
 * 17/700, corpo 24 com 16 entre blocos, rodapé #F8FAFC 14×24).
 */
export const MapModal = ({
  title,
  description,
  icon,
  width,
  onClose,
  footer,
  footerClassName,
  badge,
  dismissable = true,
  children,
}: {
  title: string
  description?: ReactNode
  icon: ReactNode
  width: keyof typeof WIDTHS
  onClose: () => void
  footer: ReactNode
  footerClassName?: string
  /** Etiqueta à direita do título (situação do documento). */
  badge?: ReactNode
  /** false: só fecha pelo X/Cancelar (formulários longos não perdem dados). */
  dismissable?: boolean
  children: ReactNode
}) => (
  <Modal
    isOpen
    onClose={onClose}
    hideCloseButton
    isDismissable={dismissable}
    placement="top"
    scrollBehavior="outside"
    classNames={{
      base: cn("w-full rounded-xl border border-[#E2E8F0]", WIDTHS[width]),
    }}
  >
    <ModalContent className={cn(FIELD_STYLES, "leading-[1.25]")}>
      <ModalHeader className="flex items-center gap-3 border-b border-[#E2E8F0] px-6 py-[18px] leading-[1.25]">
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[#EBF0FE] text-[#1A56DB] [&>svg]:h-[19px] [&>svg]:w-[19px]">
          {icon}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[17px] font-bold text-[#1E293B]">{title}</span>
          {description && (
            <span className="text-[12.5px] font-normal text-[#64748B]">
              {description}
            </span>
          )}
        </span>
        {badge && <span className="self-start">{badge}</span>}
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="self-start text-[#94A3B8] hover:text-[#64748B]"
        >
          <LuX size={18} />
        </button>
      </ModalHeader>
      <ModalBody className="flex flex-col gap-4 p-6">{children}</ModalBody>
      <ModalFooter
        className={cn(
          "gap-2.5 rounded-b-xl border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-3.5",
          footerClassName,
        )}
      >
        {footer}
      </ModalFooter>
    </ModalContent>
  </Modal>
)

/** Campo somente leitura (Data, Término previsto, Giro de sala). */
export const ReadOnlyField = ({
  label,
  icon,
  children,
  hint,
  muted,
}: {
  label: string
  icon?: ReactNode
  children: ReactNode
  hint?: ReactNode
  muted?: boolean
}) => (
  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
    <span className="text-xs font-medium text-[#64748B]">{label}</span>
    <div
      className={cn(
        "flex h-10 items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 text-[13px] text-[#1E293B] [&>svg]:h-[15px] [&>svg]:w-[15px] [&>svg]:shrink-0 [&>svg]:text-[#94A3B8]",
        muted ? "bg-[#F8FAFC]" : "bg-white",
      )}
    >
      {icon}
      {children}
    </div>
    {hint && <span className="text-[11px] text-[#94A3B8]">{hint}</span>}
  </div>
)

/** Rótulo com asterisco de obrigatório. */
export const Req = ({ children }: { children: ReactNode }) => (
  <>
    {children} <span className="font-semibold text-[#EF4444]">*</span>
  </>
)

/**
 * Campo de data no visual dos campos do modal: mostra "dd/MM/yyyy" e abre o
 * calendário nativo ao clicar. Valor em "yyyy-MM-dd".
 */
export const DateField = ({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string
  value: string
  min?: string
  max?: string
  onChange: (iso: string) => void
  hint?: ReactNode
}) => (
  <label className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1.5">
    <span className="text-xs font-medium text-[#64748B]">{label}</span>
    <span className="relative flex h-10 items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] text-[#1E293B] hover:border-[#CBD5E1]">
      <LuCalendar className="h-[15px] w-[15px] shrink-0 text-[#94A3B8]" />
      {value ? (
        value.split("-").reverse().join("/")
      ) : (
        <span className="text-[#94A3B8]">dd/mm/aaaa</span>
      )}
      <input
        type="date"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        onClick={(e) => e.currentTarget.showPicker?.()}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </span>
    {hint && <span className="text-[11px] text-[#94A3B8]">{hint}</span>}
  </label>
)
