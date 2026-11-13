"use client"

import { Button, addToast } from "@heroui/react"
import type { IconType } from "react-icons"
import {
  LuActivity,
  LuArrowRight,
  LuCalendarClock,
  LuCheck,
  LuCircleCheck,
  LuClock3,
  LuHeartPulse,
  LuLock,
  LuLogIn,
  LuPrinter,
} from "react-icons/lu"

import { TODAY_ISO, dayLabel, isoToBR } from "../../_data/days"
import { DOC_META, docsOfPhase } from "../../_data/fixtures"
import { missingDocs, useCC } from "../../_data/store"
import type { DocPhase, ISurgery, SurgeryStage } from "../../_data/types"
import { agoText, plural, untilText } from "./helpers"
import type { PhaseSelection } from "./PhaseDocsModal"
import { BASE } from "../MockShell"
import { cn } from "@/shared/utils/cn"

const ADVANCE_LABEL: Partial<Record<SurgeryStage, string>> = {
  agendada: "Mover para Em sala",
  em_cirurgia: "Mover para SRPA",
  srpa: "Dar alta da SRPA",
}

const ADVANCE_TOAST: Partial<Record<SurgeryStage, string>> = {
  agendada: "Paciente em sala",
  em_cirurgia: "Paciente movido para a SRPA",
  srpa: "Alta da SRPA registrada · cirurgia finalizada",
}

/** Cartão "Situação": o que está acontecendo agora + ação principal + etapas. */
export const StatusHero = ({
  surgery: s,
  roomName,
  onOpenPhase,
}: {
  surgery: ISurgery
  roomName?: string
  onOpenPhase: (sel: PhaseSelection) => void
}) => (
  <section className="flex flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
    <NowRow surgery={s} roomName={roomName} />
    <Stepper surgery={s} roomName={roomName} onOpenPhase={onOpenPhase} />
  </section>
)

const NowRow = ({
  surgery: s,
  roomName,
}: {
  surgery: ISurgery
  roomName?: string
}) => {
  const advanceStage = useCC((st) => st.advanceStage)
  const markArrived = useCC((st) => st.markArrived)
  const missing = missingDocs(s)
  /** Agendada para outro dia: não entra na sala hoje. */
  const otherDay = s.stage === "agendada" && !!s.date && s.date !== TODAY_ISO
  const room = roomName ?? "Sala a definir"

  let icon: IconType
  let iconBg: string
  let title: string
  let subtitle: string
  switch (s.stage) {
    case "agendada":
      icon = s.arrived ? LuCalendarClock : LuClock3
      iconBg = s.arrived ? "bg-[#F59E0B]" : "bg-[#94A3B8]"
      title = `Cirurgia ${dayLabel(s.date).includes("/") ? `em ${dayLabel(s.date)}` : dayLabel(s.date)} às ${s.start ?? "--:--"}`
      subtitle = [
        room,
        s.start && (otherDay ? isoToBR(s.date!) : untilText(s.start)),
        s.arrived
          ? s.bed
            ? `paciente no ${s.bed.replace(/^Leito/, "leito")}`
            : "paciente na unidade"
          : "paciente ainda não chegou",
      ]
        .filter(Boolean)
        .join(" · ")
      break
    case "em_cirurgia":
      icon = LuActivity
      iconBg = "bg-[#1A56DB]"
      title = s.enteredRoomAt
        ? `Em cirurgia ${agoText(s.enteredRoomAt)}`
        : "Em cirurgia"
      subtitle = [
        s.enteredRoomAt && `Entrou na ${room} às ${s.enteredRoomAt}`,
        s.end && `término previsto às ${s.end}`,
      ]
        .filter(Boolean)
        .join(" · ")
      break
    case "srpa":
      icon = LuHeartPulse
      iconBg = "bg-[#7C3AED]"
      title = s.leftRoomAt
        ? `Na recuperação ${agoText(s.leftRoomAt)}`
        : "Na recuperação"
      subtitle = [
        s.leftRoomAt && `Saiu da ${room} às ${s.leftRoomAt}`,
        s.srpaBed,
      ]
        .filter(Boolean)
        .join(" · ")
      break
    default:
      icon = LuCircleCheck
      iconBg = "bg-[#10B981]"
      title = "Cirurgia finalizada"
      subtitle = [
        s.srpaDischargeAt && `Alta da SRPA às ${s.srpaDischargeAt}`,
        s.bed
          ? `voltou para o ${s.bed.replace(/^Leito/, "leito")}`
          : "paciente liberado",
      ]
        .filter(Boolean)
        .join(" · ")
  }
  const Icon = icon

  const advance = () => {
    if (otherDay) {
      addToast({
        title: `Cirurgia marcada para ${isoToBR(s.date!)}`,
        description: "O paciente só entra na sala no dia da cirurgia.",
        color: "warning",
      })
      return
    }
    if (missing.length) {
      addToast({
        title: `Falta assinar ${plural(missing.length, "documento", "documentos")}`,
        description: missing.map((k) => DOC_META[k].title).join(", "),
        color: "warning",
      })
      return
    }
    const res = advanceStage(s.id)
    if (res.ok) addToast({ title: ADVANCE_TOAST[s.stage], color: "success" })
  }

  const notArrived = s.stage === "agendada" && !s.arrived
  const label = ADVANCE_LABEL[s.stage]
  const locked = missing.length > 0 || otherDay

  return (
    <div className="flex flex-wrap items-center gap-[18px] px-6 py-5">
      <span
        className={cn(
          "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-white",
          iconBg,
        )}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div className="flex min-w-[220px] flex-1 flex-col gap-1">
        <span className="text-[22px] font-bold text-[#1E293B]">{title}</span>
        <span className="text-sm text-[#64748B]">{subtitle}</span>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {notArrived ? (
          <>
            <Button
              size="lg"
              color="primary"
              className="font-semibold"
              startContent={<LuLogIn className="h-4 w-4" />}
              onPress={() => {
                markArrived(s.id)
                addToast({
                  title: "Chegada registrada",
                  description:
                    "Os documentos pré-operatórios já podem ser preenchidos.",
                  color: "success",
                })
              }}
            >
              Registrar chegada
            </Button>
            <span className="text-[12.5px] text-[#94A3B8]">
              Depois da chegada, o paciente pode ir para a sala
            </span>
          </>
        ) : label ? (
          <>
            <Button
              size="lg"
              color={locked ? "default" : "primary"}
              className={cn(
                "font-semibold",
                locked && "bg-[#E2E8F0] text-[#94A3B8]",
              )}
              startContent={locked ? <LuLock className="h-4 w-4" /> : undefined}
              endContent={
                locked ? undefined : <LuArrowRight className="h-4 w-4" />
              }
              onPress={advance}
            >
              {label}
            </Button>
            <span className="text-[12.5px] text-[#94A3B8]">
              {otherDay
                ? `Marcada para ${dayLabel(s.date)} (${isoToBR(s.date!)})`
                : locked
                  ? `Falta assinar ${plural(missing.length, "documento", "documentos")}${s.stage === "srpa" ? "" : " abaixo"}`
                  : "Documentos da etapa assinados"}
            </span>
          </>
        ) : (
          <>
            <Button
              size="lg"
              variant="bordered"
              className="border-1 border-[#E2E8F0] bg-white font-semibold"
              startContent={<LuPrinter className="h-4 w-4" />}
              onPress={() =>
                window.open(`${BASE}/cirurgias/${s.id}/resumo`, "_blank")
              }
            >
              Imprimir resumo
            </Button>
            <span className="text-[12.5px] text-[#94A3B8]">
              Todos os documentos assinados
            </span>
          </>
        )}
      </div>
    </div>
  )
}

const STAGE_INDEX: Partial<Record<SurgeryStage, number>> = {
  agendada: 0,
  em_cirurgia: 1,
  srpa: 2,
  finalizada: 4,
}

const Stepper = ({
  surgery: s,
  roomName,
  onOpenPhase,
}: {
  surgery: ISurgery
  roomName?: string
  onOpenPhase: (sel: PhaseSelection) => void
}) => {
  const current = STAGE_INDEX[s.stage] ?? 0
  const signedOf = (phase: DocPhase) =>
    docsOfPhase(phase).filter((k) => s.docs[k].status === "assinado").length

  const steps: {
    title: string
    pending: string
    done: string
    phases: DocPhase[]
  }[] = [
    {
      title: "Antes da sala",
      pending: "Pré-operatório",
      done: `Concluído · ${plural(signedOf("antes"), "documento", "documentos")}`,
      phases: ["antes"],
    },
    {
      title: "Na sala",
      pending: roomName && s.start ? `${roomName} às ${s.start}` : "Sala",
      done: `Concluído · ${plural(signedOf("sala"), "documento", "documentos")}`,
      phases: ["sala"],
    },
    {
      title: "Recuperação (SRPA)",
      pending: "Depois da sala",
      done: s.srpaDischargeAt
        ? `Alta às ${s.srpaDischargeAt}`
        : `Concluído · ${plural(signedOf("srpa"), "documento", "documentos")}`,
      phases: ["srpa"],
    },
    {
      title: "Finalizada",
      pending: "Descrição cirúrgica e alta da SRPA",
      done: s.srpaDischargeAt
        ? `Concluída às ${s.srpaDischargeAt}`
        : "Concluída",
      phases: ["antes", "sala", "srpa", "depois"],
    },
  ]

  return (
    <ol className="grid grid-cols-1 border-t border-[#E2E8F0] bg-[#F8FAFC] sm:grid-cols-2 xl:grid-cols-4">
      {steps.map((step, i) => {
        const done = i < current || (i === 3 && current === 4)
        const active = i === current
        return (
          <li
            key={step.title}
            className={cn(
              "flex items-center gap-2.5 border-[#E2E8F0] px-5 py-3 not-last:border-b sm:not-last:border-r xl:not-last:border-b-0",
              active && "bg-[#EBF0FE]",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold",
                done && "bg-[#10B981] text-white",
                active && "bg-[#1A56DB] text-white",
                !done &&
                  !active &&
                  "border border-[#CBD5E1] bg-white text-[#94A3B8]",
              )}
            >
              {done ? <LuCheck className="h-[13px] w-[13px]" /> : i + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-px">
              <span
                className={cn(
                  "text-[13.5px]",
                  active
                    ? "font-bold text-[#1A56DB]"
                    : done
                      ? "font-semibold text-[#1E293B]"
                      : "font-semibold text-[#94A3B8]",
                )}
              >
                {step.title}
              </span>
              <span
                className={cn(
                  "truncate text-xs",
                  active ? "text-[#1A56DB]" : "text-[#94A3B8]",
                )}
              >
                {active ? "Agora" : done ? step.done : step.pending}
              </span>
            </div>
            {done && (
              <button
                type="button"
                className="text-[12.5px] font-semibold text-[#1A56DB] hover:underline"
                onClick={() =>
                  onOpenPhase({ title: step.title, phases: step.phases })
                }
              >
                Ver
              </button>
            )}
          </li>
        )
      })}
    </ol>
  )
}
