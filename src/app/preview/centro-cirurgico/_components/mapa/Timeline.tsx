"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LuArrowUpRight,
  LuCalendarClock,
  LuEllipsisVertical,
  LuLockOpen,
  LuOctagonAlert,
  LuRefreshCw,
  LuTriangleAlert,
  LuUndo2,
  LuWrench,
} from "react-icons/lu"

import { TODAY_ISO, isPast } from "../../_data/days"
import { MOCK_NOW, ROOM_TURNOVER_MIN } from "../../_data/fixtures"
import { fmtDuration, fromMin, toMin } from "../../_data/time"
import type { IPatient, IRoom, ISurgery } from "../../_data/types"
import { BASE } from "../MockShell"
import { STEP_META, surgeryStep } from "../ui"
import {
  DAY_END,
  DAY_START,
  HOUR_PX,
  laneLayout,
  procedureLabel,
  pxOf,
} from "./schedule"
import { cn } from "@/shared/utils/cn"

/** Sombra de onde a cirurgia vai cair (sugestão ou arrastando). */
export interface IGhost {
  roomId: string
  start: number
  duration: number
  title: string
  name: string
  procedure: string
  conflict?: boolean
  /** Duração não informada → "(média)". */
  estimated?: boolean
  dragging?: boolean
}

const HOURS = Array.from(
  { length: (DAY_END - DAY_START) / 60 },
  (_, i) => DAY_START + i * 60,
)

const GRID_BG = {
  backgroundImage:
    "linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(#E2E8F080 1px, transparent 1px)",
  backgroundSize: `100% ${HOUR_PX}px, 100% ${HOUR_PX / 2}px`,
}

const BLOCK_TONE: Record<ISurgery["stage"], string> = {
  em_cirurgia: "bg-[#EBF0FE] border-[#1A56DB]",
  srpa: "bg-[#EBF0FE] border-[#1A56DB]",
  agendada: "bg-white border-[#E2E8F0] hover:border-[#94A3B8]",
  finalizada: "bg-[#ECFDF5] border-[#10B981]",
  cancelada: "bg-[#F8FAFC] border-[#E2E8F0] opacity-60",
  a_alocar: "bg-white border-[#E2E8F0]",
}

const MiniChip = ({
  className,
  children,
}: {
  className: string
  children: React.ReactNode
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] text-[11px] leading-none font-semibold whitespace-nowrap",
      className,
    )}
  >
    {children}
  </span>
)

const SurgeryBlock = ({
  s,
  patient,
  conflict,
  dim,
  lane,
  lanes,
  onReallocate,
  onUnallocate,
}: {
  s: ISurgery
  patient?: IPatient
  conflict: boolean
  dim: boolean
  lane: number
  lanes: number
  onReallocate: (s: ISurgery) => void
  onUnallocate: (s: ISurgery) => void
}) => {
  const router = useRouter()
  const start = toMin(s.start!)
  const duration = toMin(s.end!) - start
  const cancelled = s.stage === "cancelada"
  const step = surgeryStep(s)
  const stepLabel = s.stage === "srpa" ? "SRPA" : STEP_META[step].label
  const stepClass =
    s.stage === "em_cirurgia" || s.stage === "srpa"
      ? "bg-[#EBF0FE] text-[#1A56DB]"
      : s.stage === "finalizada"
        ? "bg-[#ECFDF5] text-[#047857]"
        : "border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"
  const href = `${BASE}/cirurgias/${s.id}`
  const editable = s.stage === "agendada"
  const width = `calc((100% - 12px) / ${lanes})`

  return (
    <div
      className={cn(
        "group absolute z-10 transition-opacity",
        dim && "opacity-25 hover:opacity-70",
      )}
      style={{
        top: pxOf(start) + 1,
        height: Math.max((duration / 60) * HOUR_PX - 2, 22),
        left: `calc(6px + ${width} * ${lane})`,
        width,
      }}
    >
      <Link
        href={href}
        prefetch={false}
        title={`${s.start}–${s.end} · ${patient?.name ?? ""} · ${procedureLabel(s)}`}
        className={cn(
          "flex h-full flex-col gap-[3px] overflow-hidden rounded-md border px-2 py-1.5 transition-colors",
          lanes > 1 && lane > 0 && "ml-0.5",
          BLOCK_TONE[s.stage],
          conflict && !cancelled && "border-[#EF4444] hover:border-[#EF4444]",
        )}
      >
        <span className="truncate pr-4 text-[10.5px] font-semibold text-[#64748B]">
          {s.start}–{s.end} · {fmtDuration(duration)}
        </span>
        <span className="flex min-w-0 items-center gap-1">
          {conflict && !cancelled && (
            <LuOctagonAlert
              className="h-[13px] w-[13px] shrink-0 text-[#B91C1C]"
              aria-label="Conflito de horário"
            />
          )}
          <span
            className={cn(
              "truncate text-xs font-bold",
              cancelled ? "text-[#94A3B8] line-through" : "text-[#1E293B]",
            )}
          >
            {patient?.name ?? "Paciente"}
          </span>
        </span>
        {duration >= 60 && (
          <span className="truncate text-[11.5px] text-[#64748B]">
            {procedureLabel(s)}
          </span>
        )}
        {duration >= 90 && (
          <span className="flex flex-wrap gap-1 overflow-hidden">
            <MiniChip className={stepClass}>{stepLabel}</MiniChip>
            {!!patient?.allergies.length && (
              <MiniChip className="bg-[#FEF2F2] text-[#B91C1C]">
                <LuTriangleAlert className="h-3 w-3" />
                Alergia
              </MiniChip>
            )}
          </span>
        )}
      </Link>
      <div className="absolute top-1 right-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <button
              type="button"
              aria-label={`Ações da cirurgia #${s.id}`}
              className="flex h-5 w-5 items-center justify-center rounded bg-white/80 text-[#64748B] hover:bg-white hover:text-[#1E293B]"
            >
              <LuEllipsisVertical className="h-3.5 w-3.5" />
            </button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Ações da cirurgia"
            disabledKeys={editable ? [] : ["move", "unallocate"]}
            onAction={(key) => {
              if (key === "open") router.push(href)
              if (key === "move") onReallocate(s)
              if (key === "unallocate") onUnallocate(s)
            }}
          >
            <DropdownItem
              key="open"
              startContent={<LuArrowUpRight className="h-4 w-4" />}
            >
              Abrir cirurgia
            </DropdownItem>
            <DropdownItem
              key="move"
              startContent={<LuCalendarClock className="h-4 w-4" />}
              description={editable ? undefined : "Só cirurgias agendadas"}
            >
              Trocar sala ou horário
            </DropdownItem>
            <DropdownItem
              key="unallocate"
              className="text-[#B91C1C]"
              color="danger"
              startContent={<LuUndo2 className="h-4 w-4" />}
              description={
                editable
                  ? "Volta para a fila A alocar"
                  : "Só cirurgias agendadas"
              }
            >
              Desalocar
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  )
}

const Turnover = ({ end, dim }: { end: number; dim: boolean }) => {
  const visibleEnd = Math.min(end + ROOM_TURNOVER_MIN, DAY_END)
  if (visibleEnd <= end) return null
  return (
    <div
      className={cn(
        "absolute right-1.5 left-1.5 flex items-center gap-1.5 overflow-hidden rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 text-[11px] text-[#94A3B8]",
        dim && "opacity-25",
      )}
      style={{
        top: pxOf(end) + 1,
        height: ((visibleEnd - end) / 60) * HOUR_PX - 2,
      }}
    >
      <LuRefreshCw className="h-3 w-3 shrink-0" />
      <span className="truncate">Giro de sala · {ROOM_TURNOVER_MIN} min</span>
    </div>
  )
}

const Ghost = ({ g }: { g: IGhost }) => (
  <div
    className={cn(
      "pointer-events-none absolute right-1.5 left-1.5 z-20 flex flex-col gap-[3px] overflow-hidden rounded-md border border-dashed px-2 py-1.5",
      g.conflict
        ? "border-[#EF4444] bg-[#FEF2F2]/90"
        : "border-[#1A56DB] bg-[#EBF0FE]/60",
    )}
    style={{
      top: pxOf(g.start) + 1,
      height: Math.max((g.duration / 60) * HOUR_PX - 2, 22),
    }}
  >
    <span
      className={cn(
        "truncate text-[10.5px] font-semibold",
        g.conflict ? "text-[#B91C1C]" : "text-[#1A56DB]",
      )}
    >
      {g.title} · {fromMin(g.start)}–{fromMin(g.start + g.duration)} ·{" "}
      {fmtDuration(g.duration)}
      {g.estimated && " (média)"}
    </span>
    <span className="truncate text-xs font-bold text-[#1E293B]">{g.name}</span>
    {g.duration >= 60 && (
      <span className="truncate text-[11.5px] text-[#64748B]">
        {g.procedure}
      </span>
    )}
  </div>
)

const RoomColumn = ({
  room,
  surgeries,
  patients,
  conflicts,
  isDimmed,
  ghost,
  onReallocate,
  onUnallocate,
}: {
  room: IRoom
  surgeries: ISurgery[]
  patients: Map<string, IPatient>
  conflicts: Set<number>
  isDimmed: (s: ISurgery) => boolean
  ghost?: IGhost
  onReallocate: (s: ISurgery) => void
  onUnallocate: (s: ISurgery) => void
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `room-${room.id}`,
    data: { roomId: room.id },
  })
  const lanes = laneLayout(surgeries)
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative min-w-[200px] flex-1 border-l border-[#E2E8F0] transition-colors",
        isOver && "bg-[#EBF0FE]/30",
      )}
      style={{ ...GRID_BG, height: pxOf(DAY_END) }}
    >
      {room.block && (
        <div
          className="absolute right-1.5 left-1.5 z-10 flex flex-col gap-1 rounded-md border border-[#F59E0B] bg-[#FFFBEB] p-2.5"
          style={{
            top: pxOf(toMin(room.block.start)) + 1,
            height:
              ((toMin(room.block.end) - toMin(room.block.start)) / 60) *
                HOUR_PX -
              2,
          }}
        >
          <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#B45309]">
            <LuWrench className="h-3.5 w-3.5 shrink-0" />
            {room.block.reason}
          </span>
          <span className="text-[11.5px] text-[#B45309]">
            {room.block.start}–{room.block.end} · {room.block.detail}
          </span>
        </div>
      )}
      {surgeries
        .filter((s) => s.stage !== "cancelada")
        .map((s) => (
          <Turnover
            key={`giro-${s.id}`}
            end={toMin(s.end!)}
            dim={isDimmed(s)}
          />
        ))}
      {surgeries.map((s) => {
        const l = lanes.get(s.id) ?? { lane: 0, lanes: 1 }
        return (
          <SurgeryBlock
            key={s.id}
            s={s}
            patient={patients.get(s.patientId)}
            conflict={conflicts.has(s.id)}
            dim={isDimmed(s)}
            lane={l.lane}
            lanes={l.lanes}
            onReallocate={onReallocate}
            onUnallocate={onUnallocate}
          />
        )
      })}
      {ghost && <Ghost g={ghost} />}
    </div>
  )
}

export const Timeline = ({
  day,
  rooms,
  surgeries,
  patients,
  conflicts,
  isDimmed,
  ghost,
  onReallocate,
  onUnallocate,
  onBlockRoom,
  onUnblockRoom,
}: {
  /** Dia mostrado ("yyyy-MM-dd"): a linha "Agora" só aparece hoje. */
  day: string
  rooms: IRoom[]
  /** Cirurgias alocadas (inclui canceladas, que aparecem apagadas). */
  surgeries: ISurgery[]
  patients: Map<string, IPatient>
  conflicts: Set<number>
  isDimmed: (s: ISurgery) => boolean
  ghost?: IGhost
  onReallocate: (s: ISurgery) => void
  onUnallocate: (s: ISurgery) => void
  /** Abre o modal de bloqueio (novo ou edição). */
  onBlockRoom: (room: IRoom) => void
  onUnblockRoom: (room: IRoom) => void
}) => {
  // Fora de hoje não há linha "Agora": dia futuro conta como antes de tudo,
  // dia passado como depois de tudo (bloqueios já terminaram).
  const now =
    day === TODAY_ISO
      ? toMin(MOCK_NOW)
      : isPast(day)
        ? Number.POSITIVE_INFINITY
        : Number.NEGATIVE_INFINITY
  return (
    <section className="min-w-0 flex-1 overflow-x-auto rounded-[10px] border border-[#E2E8F0] bg-white">
      <div className="min-w-fit">
        <div className="flex border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="w-14 shrink-0" />
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex min-w-[200px] flex-1 flex-col gap-0.5 border-l border-[#E2E8F0] px-3 py-2.5"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[13.5px] font-bold text-[#1E293B]">
                  {room.name}
                </span>
                {room.block && toMin(room.block.end) > now && (
                  <span className="inline-flex items-center gap-[5px] rounded-full bg-[#FFFBEB] px-[9px] py-[3px] text-[11px] font-semibold text-[#B45309]">
                    <LuWrench className="h-3 w-3" />
                    Bloqueada
                  </span>
                )}
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <button
                      type="button"
                      aria-label={`Opções da ${room.name}`}
                      className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-[#94A3B8] hover:bg-white hover:text-[#1E293B]"
                    >
                      <LuEllipsisVertical className="h-4 w-4" />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label={`Opções da ${room.name}`}
                    disabledKeys={room.block ? [] : ["unblock"]}
                    onAction={(key) =>
                      key === "unblock"
                        ? onUnblockRoom(room)
                        : onBlockRoom(room)
                    }
                  >
                    <DropdownItem
                      key="block"
                      startContent={<LuWrench className="h-4 w-4" />}
                    >
                      {room.block ? "Editar bloqueio" : "Bloquear sala"}
                    </DropdownItem>
                    <DropdownItem
                      key="unblock"
                      startContent={<LuLockOpen className="h-4 w-4" />}
                    >
                      Desbloquear sala
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
              <span className="truncate text-[11.5px] text-[#64748B]">
                {room.block && toMin(room.block.end) > now
                  ? `${room.block.reason} até ${room.block.end}`
                  : room.specialty}
              </span>
            </div>
          ))}
        </div>
        <div className="relative flex">
          <div
            className="relative w-14 shrink-0"
            style={{ height: pxOf(DAY_END) }}
          >
            {HOURS.map((h) => (
              <span
                key={h}
                className="absolute right-2 text-[11px] text-[#94A3B8]"
                style={{ top: pxOf(h) + 3 }}
              >
                {fromMin(h)}
              </span>
            ))}
          </div>
          {rooms.map((room) => (
            <RoomColumn
              key={room.id}
              room={room}
              surgeries={surgeries.filter((s) => s.roomId === room.id)}
              patients={patients}
              conflicts={conflicts}
              isDimmed={isDimmed}
              ghost={ghost?.roomId === room.id ? ghost : undefined}
              onReallocate={onReallocate}
              onUnallocate={onUnallocate}
            />
          ))}
          {now > DAY_START && now < DAY_END && (
            <div
              className="pointer-events-none absolute right-0 left-[52px] z-30 flex items-center"
              style={{ top: pxOf(now) - 4 }}
              aria-label={`Agora (${MOCK_NOW})`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#EF4444]" />
              <span className="h-0.5 flex-1 bg-[#EF4444]" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export const Legend = () => (
  <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
    {[
      ["Em andamento", "bg-[#EBF0FE] border-[#1A56DB]"],
      ["Agendada", "bg-white border-[#E2E8F0]"],
      ["Finalizada", "bg-[#ECFDF5] border-[#10B981]"],
      ["Giro de sala", "bg-[#F8FAFC] border-[#E2E8F0]"],
      ["Bloqueio", "bg-[#FFFBEB] border-[#F59E0B]"],
      ["Conflito de horário", "bg-[#FEF2F2] border-[#EF4444]"],
    ].map(([label, cls]) => (
      <span key={label} className="flex items-center gap-1.5">
        <span className={cn("h-3.5 w-3.5 rounded-[3px] border", cls)} />
        {label}
      </span>
    ))}
    <span className="flex items-center gap-1.5">
      <span className="h-0.5 w-3.5 bg-[#EF4444]" />
      Agora ({MOCK_NOW})
    </span>
    <span className="flex items-center gap-1.5">
      <span className="h-3.5 w-3.5 rounded-[3px] border border-dashed border-[#1A56DB] bg-[#EBF0FE]/60" />
      Sugestão de horário
    </span>
  </div>
)
