"use client"

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { addToast } from "@heroui/react"
import { useMemo, useState } from "react"

import { ROOM_TURNOVER_MIN } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import { fromMin } from "../../_data/time"
import type { ISurgery } from "../../_data/types"
import { TODAY_ISO, dayLabel, isPast } from "../../_data/days"
import { AllocateModal } from "./AllocateModal"
import { BlockRoomModal } from "./BlockRoomModal"
import { useDay } from "./useDay"
import { ListView, SlotsView } from "./AltViews"
import { matchesFilter, type MapFilter, type MapView } from "./filters"
import { MapFilters, MapHeader } from "./MapToolbar"
import { QueueCardBody, QueueColumn } from "./QueueColumn"
import {
  DAY_END,
  DAY_START,
  HOUR_PX,
  SNAP_MIN,
  conflictIds,
  durationOf,
  isOnMap,
  procedureLabel,
  slotIssues,
  suggestSlot,
} from "./schedule"
import { ScheduleModal } from "./ScheduleModal"
import { Legend, Timeline, type IGhost } from "./Timeline"
import { FIELD_STYLES } from "@/modules/Surgeries/helpers/ui"

type Dialog =
  | { kind: "schedule"; initial?: { roomId: string; start: number } }
  | { kind: "block"; roomId: string }
  | {
      kind: "allocate"
      surgeryId: number
      initial?: { roomId: string; start: number }
    }
  | null

/** Posição do ponteiro na coluna da sala → horário (de 15 em 15 min). */
const dropTarget = (
  e: DragMoveEvent | DragEndEvent,
  duration: number,
): { roomId: string; start: number } | null => {
  const roomId = e.over?.data.current?.roomId as string | undefined
  if (!e.over || !roomId) return null
  const activator = e.activatorEvent as PointerEvent | MouseEvent | undefined
  const y =
    activator && "clientY" in activator
      ? activator.clientY + e.delta.y
      : (e.active.rect.current.translated?.top ?? e.over.rect.top)
  const minutes = ((y - e.over.rect.top) / HOUR_PX) * 60
  const snapped = DAY_START + Math.round(minutes / SNAP_MIN) * SNAP_MIN
  const start = Math.min(Math.max(snapped, DAY_START), DAY_END - duration)
  return { roomId, start }
}

export const MapScreen = () => {
  const [day, setDay] = useState(TODAY_ISO)
  const { rooms, surgeries } = useDay(day)
  const patientList = useCC((s) => s.patients)
  const allocate = useCC((s) => s.allocate)
  const unallocate = useCC((s) => s.unallocate)
  const setRoomBlock = useCC((s) => s.setRoomBlock)

  const [filter, setFilter] = useState<MapFilter>("todas")
  const [view, setView] = useState<MapView>("timeline")
  const [hoverId, setHoverId] = useState<number>()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [dragId, setDragId] = useState<number>()
  const [dragGhost, setDragGhost] = useState<IGhost | null>(null)

  const patients = useMemo(
    () => new Map(patientList.map((p) => [p.id, p])),
    [patientList],
  )
  const nameOf = (s: ISurgery) => patients.get(s.patientId)?.name ?? `#${s.id}`

  const queue = surgeries.filter((s) => s.stage === "a_alocar")
  const placed = surgeries.filter(
    (s) => s.stage !== "a_alocar" && s.roomId && s.start && s.end,
  )
  const conflicts = useMemo(
    () => conflictIds(surgeries, rooms),
    [surgeries, rooms],
  )

  const counts: Record<MapFilter, number> = {
    todas: 0,
    agendadas: 0,
    andamento: 0,
    finalizadas: 0,
    canceladas: 0,
    sobreposicoes: 0,
    a_alocar: 0,
  }
  for (const s of surgeries)
    for (const key of Object.keys(counts) as MapFilter[])
      if (matchesFilter(s, key, conflicts)) counts[key]++

  const isDimmed = (s: ISurgery) =>
    filter !== "todas" && !matchesFilter(s, filter, conflicts)

  // Sugestão (sombra no mapa) da cirurgia em destaque na fila.
  const highlighted =
    queue.find((s) => s.id === hoverId) ?? (queue.length ? queue[0] : undefined)
  const suggestion = useMemo(() => {
    if (!highlighted) return null
    const slot = suggestSlot(
      surgeries,
      rooms,
      durationOf(highlighted),
      highlighted.preferredPeriod,
      undefined,
      undefined,
      day,
    )
    if (!slot) return null
    const ghost: IGhost = {
      ...slot,
      duration: durationOf(highlighted),
      title: "Sugestão",
      name: patients.get(highlighted.patientId)?.name ?? "",
      procedure: procedureLabel(highlighted),
      estimated: highlighted.durationMin === undefined,
    }
    return ghost
  }, [highlighted, surgeries, rooms, patients, day])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )
  const dragged = surgeries.find((s) => s.id === dragId)

  const onDragStart = (e: DragStartEvent) =>
    setDragId(e.active.data.current?.surgeryId as number)

  const onDragMove = (e: DragMoveEvent) => {
    if (!dragged) return
    const target = dropTarget(e, durationOf(dragged))
    if (!target) return setDragGhost(null)
    const room = rooms.find((r) => r.id === target.roomId)!
    const issues = slotIssues(
      surgeries,
      room,
      target.start,
      durationOf(dragged),
      dragged.id,
    )
    setDragGhost({
      ...target,
      duration: durationOf(dragged),
      title: "Soltar",
      name: nameOf(dragged),
      procedure: procedureLabel(dragged),
      estimated: dragged.durationMin === undefined,
      conflict: issues.some((i) => i.kind !== "turnover"),
      dragging: true,
    })
  }

  const onDragEnd = (e: DragEndEvent) => {
    const s = dragged
    setDragId(undefined)
    setDragGhost(null)
    if (!s) return
    const duration = durationOf(s)
    const target = dropTarget(e, duration)
    if (!target) return
    if (isPast(day)) {
      addToast({
        title: "Esse dia já passou",
        description: "Escolha hoje ou um dia futuro para alocar.",
        color: "warning",
      })
      return
    }
    const room = rooms.find((r) => r.id === target.roomId)!
    const issues = slotIssues(
      surgeries,
      room,
      target.start,
      duration,
      s.id,
      nameOf,
    )
    if (issues.length) {
      addToast({
        title: `Confira o horário na ${room.name}`,
        description: issues[0].message,
        color: "warning",
      })
      setDialog({ kind: "allocate", surgeryId: s.id, initial: target })
      return
    }
    const end = target.start + duration
    allocate(s.id, room.id, fromMin(target.start), fromMin(end), day)
    addToast({
      title: `#${s.id} alocada na ${room.name} · ${dayLabel(day)}, ${fromMin(target.start)}–${fromMin(end)}`,
      description: `${nameOf(s)} · giro de sala reservado até ${fromMin(end + ROOM_TURNOVER_MIN)}${s.pendencies.length ? ` · pendências: ${s.pendencies.join(", ")}` : ""}`,
      color: "success",
    })
  }

  const doUnallocate = (s: ISurgery) => {
    unallocate(s.id)
    addToast({
      title: `#${s.id} voltou para a fila A alocar`,
      description: `${nameOf(s)} · ${s.start}–${s.end} liberado`,
    })
  }

  const dialogSurgery =
    dialog?.kind === "allocate"
      ? surgeries.find((s) => s.id === dialog.surgeryId)
      : undefined

  const listRows = surgeries.filter((s) =>
    filter === "todas" ? true : matchesFilter(s, filter, conflicts),
  )

  return (
    <main
      className={`flex w-full flex-col gap-[18px] px-8 pt-6 pb-8 ${FIELD_STYLES}`}
    >
      <MapHeader
        day={day}
        onDayChange={setDay}
        allocated={surgeries.filter(isOnMap).length}
        rooms={rooms.length}
        queue={queue.length}
        onSchedule={() => setDialog({ kind: "schedule" })}
      />
      <MapFilters
        counts={counts}
        filter={filter}
        onFilter={setFilter}
        view={view}
        onView={setView}
      />

      {view === "timeline" && (
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onDragCancel={() => {
            setDragId(undefined)
            setDragGhost(null)
          }}
        >
          <div className="flex items-start gap-4">
            {queue.length > 0 && (
              <QueueColumn
                queue={queue}
                patients={patients}
                highlightId={highlighted?.id}
                onHover={setHoverId}
                onCheck={(s) =>
                  setDialog({ kind: "allocate", surgeryId: s.id })
                }
              />
            )}
            <Timeline
              day={day}
              rooms={rooms}
              surgeries={placed}
              patients={patients}
              conflicts={conflicts}
              isDimmed={isDimmed}
              ghost={
                dragId !== undefined
                  ? (dragGhost ?? undefined)
                  : filter === "todas" || filter === "a_alocar"
                    ? (suggestion ?? undefined)
                    : undefined
              }
              onReallocate={(s) =>
                setDialog({ kind: "allocate", surgeryId: s.id })
              }
              onUnallocate={doUnallocate}
              onBlockRoom={(room) =>
                setDialog({ kind: "block", roomId: room.id })
              }
              onUnblockRoom={(room) => {
                setRoomBlock(room.id, day, undefined)
                addToast({
                  title: `${room.name} desbloqueada`,
                  description: "A sala volta a aceitar cirurgias.",
                  color: "success",
                })
              }}
            />
          </div>
          <DragOverlay dropAnimation={null}>
            {dragged && (
              <div className="w-[296px] cursor-grabbing rounded-lg border border-[#1A56DB] bg-white py-2.5 pr-3 pl-2 shadow-lg">
                <QueueCardBody
                  s={dragged}
                  patient={patients.get(dragged.patientId)}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {view === "lista" && (
        <ListView
          rows={listRows}
          rooms={rooms}
          patients={patients}
          conflicts={conflicts}
          onCheck={(s) => setDialog({ kind: "allocate", surgeryId: s.id })}
        />
      )}

      {view === "slots" && (
        <SlotsView
          rooms={rooms}
          surgeries={placed}
          patients={patients}
          conflicts={conflicts}
          isDimmed={isDimmed}
          onPickSlot={(roomId, start) =>
            setDialog({ kind: "schedule", initial: { roomId, start } })
          }
        />
      )}

      {view !== "lista" && <Legend />}

      {dialog?.kind === "schedule" && (
        <ScheduleModal
          day={day}
          onDayChange={setDay}
          initial={dialog.initial}
          onClose={() => setDialog(null)}
          onCreated={(id) => setHoverId(id)}
        />
      )}
      {dialog?.kind === "block" && (
        <BlockRoomModal
          day={day}
          room={rooms.find((r) => r.id === dialog.roomId)!}
          onClose={() => setDialog(null)}
        />
      )}
      {dialogSurgery && dialog?.kind === "allocate" && (
        <AllocateModal
          key={dialogSurgery.id}
          surgery={dialogSurgery}
          day={day}
          onDayChange={setDay}
          initial={dialog.initial}
          onClose={() => setDialog(null)}
        />
      )}
    </main>
  )
}
