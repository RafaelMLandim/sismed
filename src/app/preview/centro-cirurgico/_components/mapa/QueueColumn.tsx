"use client"

import { useDraggable } from "@dnd-kit/core"
import { Button } from "@heroui/react"
import {
  LuCalendarPlus,
  LuGripVertical,
  LuInbox,
  LuMousePointer2,
  LuMoon,
  LuSun,
  LuSunset,
} from "react-icons/lu"

import type { IPatient, ISurgery } from "../../_data/types"
import { fmtDuration } from "../../_data/time"
import { procedureLabel } from "./schedule"
import { cn } from "@/shared/utils/cn"

const BADGE = "rounded px-[7px] py-[3px] text-[10.5px] font-semibold"

const PERIOD_ICON = {
  Manhã: LuSun,
  Tarde: LuSunset,
  "Qualquer horário": LuMoon,
}

/** Selos de situação do cartão (urgência, pendências, "Tudo ok"…). */
const SituationBadges = ({ s }: { s: ISurgery }) => {
  const [first, ...rest] = s.pendencies
  return (
    <div className="flex flex-wrap gap-1.5 pl-5">
      {s.urgent && (
        <span className={cn(BADGE, "bg-[#FEF2F2] text-[#B91C1C]")}>
          Urgência
        </span>
      )}
      {first ? (
        <>
          <span className={cn(BADGE, "bg-[#FFFBEB] text-[#B45309]")}>
            {first}
          </span>
          {rest.length > 0 && (
            <span
              className={cn(BADGE, "bg-[#FFFBEB] text-[#B45309]")}
              title={rest.join(" · ")}
            >
              +{rest.length} {rest.length === 1 ? "pendência" : "pendências"}
            </span>
          )}
        </>
      ) : /não se aplica/i.test(s.reservations) ? (
        <span className={cn(BADGE, "bg-[#F8FAFC] text-[#64748B]")}>
          {s.reservations}
        </span>
      ) : (
        !s.urgent && (
          <span className={cn(BADGE, "bg-[#ECFDF5] text-[#047857]")}>
            Tudo ok
          </span>
        )
      )}
    </div>
  )
}

export const QueueCardBody = ({
  s,
  patient,
  grip,
}: {
  s: ISurgery
  patient?: IPatient
  grip?: React.ReactNode
}) => {
  const PeriodIcon = PERIOD_ICON[s.preferredPeriod ?? "Qualquer horário"]
  return (
    <div className="flex gap-1.5">
      {grip ?? (
        <LuGripVertical className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#94A3B8]">
            #{s.id}
          </span>
          <span className="flex-1" />
          {s.preferredPeriod && (
            <span className="inline-flex items-center gap-1 rounded bg-[#EBF0FE] px-[7px] py-0.5 text-[10.5px] font-semibold text-[#1A56DB]">
              <PeriodIcon className="h-[11px] w-[11px]" />
              {s.preferredPeriod}
            </span>
          )}
        </div>
        <p className="text-[13.5px] leading-[1.3] font-bold text-[#1E293B]">
          {patient?.name ?? "Paciente"}
        </p>
        <p className="text-[12.5px] leading-[1.4] text-[#1E293B]">
          {procedureLabel(s)}
        </p>
        <p className="text-[11.5px] leading-[1.4] text-[#64748B]">
          {s.surgeon} · {fmtDuration(s.durationMin)} · {s.insurance}
        </p>
      </div>
    </div>
  )
}

const QueueCard = ({
  s,
  patient,
  highlighted,
  onHover,
  onCheck,
}: {
  s: ISurgery
  patient?: IPatient
  highlighted: boolean
  onHover: () => void
  onCheck: () => void
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `queue-${s.id}`,
    data: { surgeryId: s.id },
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={cn(
        "flex cursor-grab touch-none flex-col gap-2 rounded-lg border bg-white py-2.5 pr-3 pl-2 transition-shadow active:cursor-grabbing",
        s.urgent ? "border-[#EF4444]" : "border-[#E2E8F0]",
        highlighted && !s.urgent && "border-[#1A56DB]/50",
        highlighted && "shadow-[0_2px_8px_rgba(26,86,219,0.10)]",
        isDragging && "opacity-40",
      )}
    >
      <QueueCardBody
        s={s}
        patient={patient}
        grip={
          <button
            type="button"
            aria-label={`Arrastar #${s.id} para o mapa`}
            className="h-fit text-[#94A3B8] hover:text-[#64748B]"
            {...attributes}
          >
            <LuGripVertical className="h-3.5 w-3.5" />
          </button>
        }
      />
      <SituationBadges s={s} />
      <div className="pl-5">
        <Button
          size="sm"
          color="primary"
          radius="sm"
          fullWidth
          className="bg-[#1A56DB] text-xs font-semibold"
          startContent={<LuCalendarPlus className="h-[13px] w-[13px]" />}
          onPress={onCheck}
        >
          Checar e alocar
        </Button>
      </div>
    </div>
  )
}

export const QueueColumn = ({
  queue,
  patients,
  highlightId,
  onHover,
  onCheck,
}: {
  queue: ISurgery[]
  patients: Map<string, IPatient>
  highlightId?: number
  onHover: (id: number) => void
  onCheck: (s: ISurgery) => void
}) => (
  <aside className="flex w-[320px] shrink-0 flex-col self-start rounded-[10px] border border-[#E2E8F0] bg-white">
    <div className="flex flex-col gap-1 border-b border-[#E2E8F0] px-4 py-3.5">
      <div className="flex items-center gap-2">
        <LuInbox className="h-[15px] w-[15px] text-[#B45309]" />
        <h2 className="text-sm font-bold text-[#1E293B]">A alocar</h2>
        <span className="rounded-[10px] bg-[#FFFBEB] px-2 py-0.5 text-[11.5px] font-bold text-[#B45309]">
          {queue.length}
        </span>
      </div>
      <p className="text-xs leading-[1.4] text-[#64748B]">
        Confirmadas no acompanhamento, sem sala
      </p>
    </div>
    <div className="flex flex-col gap-2 p-3">
      {queue.map((s) => (
        <QueueCard
          key={s.id}
          s={s}
          patient={patients.get(s.patientId)}
          highlighted={highlightId === s.id}
          onHover={() => onHover(s.id)}
          onCheck={() => onCheck(s)}
        />
      ))}
    </div>
    <div className="flex items-center gap-1.5 border-t border-[#E2E8F0] px-4 py-2.5 text-[11.5px] text-[#94A3B8]">
      <LuMousePointer2 className="h-[13px] w-[13px]" />
      Arraste para um horário livre do mapa
    </div>
  </aside>
)
