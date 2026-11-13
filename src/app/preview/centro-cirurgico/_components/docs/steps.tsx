"use client"

import { Button } from "@heroui/react"
import { useState, type ReactNode } from "react"
import {
  LuArrowLeft,
  LuArrowRight,
  LuCheck,
  LuPenLine,
  LuSave,
} from "react-icons/lu"

import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

/**
 * Uma etapa de um documento longo. `sections` são os prefixos das pendências
 * ("Equipe", "Anestesia"…) que pertencem a esta etapa: com eles a barra
 * marca de vermelho as etapas com campos faltando.
 */
export interface DocStep {
  title: string
  sections?: string[]
  content: ReactNode
}

const belongs = (item: string, step: DocStep) =>
  !!step.sections?.some((s) => item.startsWith(s))

/**
 * Documento em etapas: só uma etapa aparece por vez, sem rolagem longa.
 * Navegação livre (clicar em qualquer etapa); ao tentar assinar com
 * pendências, `goToFirstPending` leva à primeira etapa com campo faltando.
 */
export const useDocSteps = (steps: DocStep[], missing: string[]) => {
  const [current, setCurrent] = useState(0)
  const step = Math.min(current, steps.length - 1)
  const pendingOf = (i: number) =>
    missing.filter((m) => belongs(m, steps[i])).length
  const firstPending = steps.findIndex((_, i) => pendingOf(i) > 0)

  return {
    step,
    setStep: setCurrent,
    isFirst: step === 0,
    isLast: step === steps.length - 1,
    next: () => setCurrent(Math.min(step + 1, steps.length - 1)),
    back: () => setCurrent(Math.max(step - 1, 0)),
    pendingOf,
    goToFirstPending: () => {
      if (firstPending >= 0) setCurrent(firstPending)
    },
    content: steps[step]?.content,
  }
}

/**
 * Barra de etapas no topo do documento. Mostra o número de pendências de
 * cada etapa só depois da primeira tentativa de assinar (`showPending`).
 */
export const StepsBar = ({
  steps,
  current,
  onSelect,
  pendingOf,
  showPending,
}: {
  steps: DocStep[]
  current: number
  onSelect: (i: number) => void
  pendingOf: (i: number) => number
  showPending: boolean
}) => (
  <nav aria-label="Etapas do documento" className="flex flex-col gap-2">
    <ol className="flex flex-wrap items-center gap-1.5">
      {steps.map((s, i) => {
        const active = i === current
        const pending = showPending ? pendingOf(i) : 0
        const done = showPending && !pending && i !== current
        return (
          <li key={s.title} className="flex items-center gap-1.5">
            {i > 0 && <span className="h-px w-3 bg-[#CBD5E1]" aria-hidden />}
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 text-[12px] font-semibold whitespace-nowrap transition-colors",
                active
                  ? "border-[#1A56DB] bg-[#EBF0FE] text-[#1A56DB]"
                  : pending
                    ? "border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2]"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                  active
                    ? "bg-[#1A56DB] text-white"
                    : pending
                      ? "bg-[#EF4444] text-white"
                      : done
                        ? "bg-[#16A34A] text-white"
                        : "bg-[#F1F5F9] text-[#64748B]",
                )}
              >
                {done ? <LuCheck className="h-3 w-3" /> : i + 1}
              </span>
              {s.title}
              {pending > 0 && (
                <span className="rounded-full bg-[#EF4444] px-1.5 text-[10.5px] text-white">
                  {pending}
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ol>
    <span className="text-[11.5px] text-[#94A3B8]">
      Etapa {current + 1} de {steps.length} · {steps[current]?.title}
    </span>
  </nav>
)

/**
 * Rodapé dos documentos em etapas: Cancelar e Salvar rascunho sempre;
 * Voltar/Próxima para navegar; "Assinar e finalizar" só na última etapa.
 */
export const StepsFooter = ({
  isFirst,
  isLast,
  onBack,
  onNext,
  onCancel,
  onSaveDraft,
  onSign,
  signLabel = "Assinar e finalizar",
  readOnly,
}: {
  isFirst: boolean
  isLast: boolean
  onBack: () => void
  onNext: () => void
  onCancel: () => void
  onSaveDraft?: () => void
  onSign?: () => void
  signLabel?: string
  readOnly?: boolean
}) => (
  <div className="flex w-full items-center gap-2.5">
    <Button className={OUTLINE_BUTTON} onPress={onCancel}>
      {readOnly ? "Fechar" : "Cancelar"}
    </Button>
    {!readOnly && onSaveDraft && (
      <Button
        className={OUTLINE_BUTTON}
        startContent={<LuSave />}
        onPress={onSaveDraft}
      >
        Salvar rascunho
      </Button>
    )}
    <span className="flex-1" />
    {!isFirst && (
      <Button
        className={OUTLINE_BUTTON}
        startContent={<LuArrowLeft />}
        onPress={onBack}
      >
        Voltar
      </Button>
    )}
    {!isLast ? (
      <Button
        className={PRIMARY_BUTTON}
        endContent={<LuArrowRight />}
        onPress={onNext}
      >
        Próxima etapa
      </Button>
    ) : (
      !readOnly &&
      onSign && (
        <Button
          className={PRIMARY_BUTTON}
          startContent={<LuPenLine />}
          onPress={onSign}
        >
          {signLabel}
        </Button>
      )
    )}
  </div>
)
