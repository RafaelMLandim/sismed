"use client"

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react"
import type { ReactNode } from "react"
import type { IconType } from "react-icons"

import { FIELD_STYLES } from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

/**
 * Moldura dos modais do desenho (PEP-M20/M21): cabeçalho com ícone em fundo
 * azul claro, corpo e rodapé cinza claro com borda.
 */
export const ModalFrame = ({
  isOpen,
  onClose,
  icon: Icon,
  title,
  subtitle,
  size = "xl",
  footer,
  children,
}: {
  isOpen: boolean
  onClose: () => void
  icon: IconType
  title: string
  subtitle?: string
  size?: "md" | "lg" | "xl" | "2xl"
  footer: ReactNode
  children: ReactNode
}) => (
  <Modal
    isOpen={isOpen}
    onOpenChange={(open) => !open && onClose()}
    size={size}
    scrollBehavior="inside"
    classNames={{ closeButton: "top-4 right-4 text-[#94A3B8]" }}
  >
    <ModalContent className={cn("rounded-[14px]", FIELD_STYLES)}>
      <ModalHeader className="flex gap-3.5 border-b border-[#E2E8F0] px-6 py-5 pr-12">
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[#EBF0FE]">
          <Icon className="h-[18px] w-[18px] text-[#1A56DB]" />
        </span>
        <div className="flex flex-col gap-[3px]">
          <span className="text-base font-bold text-[#1E293B]">{title}</span>
          {subtitle && (
            <span className="text-[13px] leading-[1.45] font-normal text-[#64748B]">
              {subtitle}
            </span>
          )}
        </div>
      </ModalHeader>
      <ModalBody className="gap-4 px-6 py-[18px]">{children}</ModalBody>
      <ModalFooter className="items-center gap-2.5 rounded-b-[14px] border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-3.5">
        {footer}
      </ModalFooter>
    </ModalContent>
  </Modal>
)
