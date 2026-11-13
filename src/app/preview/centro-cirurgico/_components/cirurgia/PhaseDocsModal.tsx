"use client"

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react"
import { LuArrowRight, LuCircleCheck, LuClock3 } from "react-icons/lu"

import { DOC_META, docsOfPhase } from "../../_data/fixtures"
import type { DocKey, DocPhase, ISurgery } from "../../_data/types"
import { DOC_UI, docResponsible } from "./helpers"
import { SMALL_OUTLINE_BUTTON } from "@/modules/Surgeries/helpers/ui"

export interface PhaseSelection {
  title: string
  phases: DocPhase[]
}

/** Lista os documentos de uma ou mais etapas concluídas ("Ver" do stepper). */
export const PhaseDocsModal = ({
  surgery,
  selection,
  onClose,
  onOpenDoc,
}: {
  surgery: ISurgery
  selection: PhaseSelection | null
  onClose: () => void
  onOpenDoc: (k: DocKey) => void
}) => {
  const keys = selection?.phases.flatMap(docsOfPhase) ?? []
  return (
    <Modal isOpen={!!selection} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-0.5">
          <span className="text-base font-bold text-[#1E293B]">
            {selection?.title}
          </span>
          <span className="text-xs font-normal text-[#64748B]">
            Documentos da etapa · cirurgia #{surgery.id}
          </span>
        </ModalHeader>
        <ModalBody className="gap-0 px-0">
          {keys.map((k) => {
            const d = surgery.docs[k]
            const Icon = DOC_UI[k].icon
            const signed = d.status === "assinado"
            return (
              <div
                key={k}
                className="flex items-center gap-3 border-t border-[#E2E8F0] px-6 py-3 first:border-t-0"
              >
                <span
                  className={
                    signed
                      ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#047857]"
                      : "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F8FAFC] text-[#94A3B8]"
                  }
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[13.5px] font-semibold text-[#1E293B]">
                    {DOC_META[k].title}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#64748B]">
                    {signed ? (
                      <>
                        <LuCircleCheck className="h-3 w-3 text-[#047857]" />
                        Assinado às {d.signedAt}
                      </>
                    ) : (
                      <>
                        <LuClock3 className="h-3 w-3" />
                        {d.status === "em_preenchimento"
                          ? "Em preenchimento"
                          : "Não iniciado"}
                      </>
                    )}
                    <span className="text-[#94A3B8]">
                      · {docResponsible(surgery, k)}
                    </span>
                  </span>
                </div>
                <Button
                  size="sm"
                  className={SMALL_OUTLINE_BUTTON}
                  endContent={<LuArrowRight />}
                  onPress={() => onOpenDoc(k)}
                >
                  {signed ? "Ver" : "Abrir"}
                </Button>
              </div>
            )
          })}
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" onPress={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
