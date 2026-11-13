"use client"

import { Button } from "@heroui/react"
import Link from "next/link"
import { LuCalendarPlus, LuOctagonAlert, LuPlus } from "react-icons/lu"

import { ROOM_TURNOVER_MIN } from "../../_data/fixtures"
import { fmtDuration, fromMin, toMin } from "../../_data/time"
import type { IPatient, IRoom, ISurgery } from "../../_data/types"
import { BASE } from "../MockShell"
import { StepChip, surgeryStep } from "../ui"
import { DAY_END, DAY_START, procedureLabel } from "./schedule"
import { COLUMN_LABEL } from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

/** Visão "Lista": tabela simples das cirurgias do dia. */
export const ListView = ({
  rows,
  rooms,
  patients,
  conflicts,
  onCheck,
}: {
  rows: ISurgery[]
  rooms: IRoom[]
  patients: Map<string, IPatient>
  conflicts: Set<number>
  onCheck: (s: ISurgery) => void
}) => {
  const roomName = (id?: string) => rooms.find((r) => r.id === id)?.name
  const sorted = [...rows].sort(
    (a, b) =>
      (a.start ? toMin(a.start) : 9999) - (b.start ? toMin(b.start) : 9999) ||
      (a.roomId ?? "").localeCompare(b.roomId ?? "") ||
      a.id - b.id,
  )
  return (
    <section className="min-w-0 flex-1 overflow-x-auto rounded-[10px] border border-[#E2E8F0] bg-white">
      <table className="w-full min-w-[860px] text-left text-[13px]">
        <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <tr>
            {[
              "Horário",
              "Sala",
              "Paciente",
              "Procedimento",
              "Cirurgião",
              "Etapa",
              "",
            ].map((h) => (
              <th key={h} className={cn(COLUMN_LABEL, "px-4 py-2.5")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => {
            const p = patients.get(s.patientId)
            const conflict = conflicts.has(s.id)
            return (
              <tr
                key={s.id}
                className={cn(
                  "border-b border-[#E2E8F0] last:border-b-0",
                  s.stage === "cancelada" && "opacity-60",
                )}
              >
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {s.start ? (
                    <span className="flex items-center gap-1 font-semibold">
                      {conflict && (
                        <LuOctagonAlert
                          className="h-[13px] w-[13px] text-[#B91C1C]"
                          aria-label="Conflito de horário"
                        />
                      )}
                      {s.start}–{s.end}
                    </span>
                  ) : (
                    <span className="text-[#94A3B8]">
                      {s.preferredPeriod ?? "A definir"}
                    </span>
                  )}
                  <span className="block text-[11.5px] text-[#64748B]">
                    {s.start && s.end
                      ? fmtDuration(toMin(s.end) - toMin(s.start))
                      : fmtDuration(s.durationMin)}
                  </span>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {roomName(s.roomId) ?? (
                    <span className="text-[#94A3B8]">Sem sala</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <span className="font-semibold">{p?.name}</span>
                  <span className="block text-[11.5px] text-[#94A3B8]">
                    #{s.id} · {s.insurance}
                  </span>
                </td>
                <td className="px-4 py-2.5">{procedureLabel(s)}</td>
                <td className="px-4 py-2.5 text-[#64748B]">{s.surgeon}</td>
                <td className="px-4 py-2.5">
                  <StepChip step={surgeryStep(s)} />
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  {s.stage === "a_alocar" ? (
                    <Button
                      size="sm"
                      color="primary"
                      radius="sm"
                      className="bg-[#1A56DB] text-xs font-semibold"
                      startContent={
                        <LuCalendarPlus className="h-[13px] w-[13px]" />
                      }
                      onPress={() => onCheck(s)}
                    >
                      Checar e alocar
                    </Button>
                  ) : (
                    <Link
                      href={`${BASE}/cirurgias/${s.id}`}
                      className="text-xs font-semibold text-[#1A56DB] hover:underline"
                    >
                      Abrir
                    </Link>
                  )}
                </td>
              </tr>
            )
          })}
          {!sorted.length && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-[#94A3B8]">
                Nenhuma cirurgia neste filtro.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  )
}

const SLOT = 30
const SLOTS = Array.from(
  { length: (DAY_END - DAY_START) / SLOT },
  (_, i) => DAY_START + i * SLOT,
)

type Cell =
  | { kind: "free" }
  | { kind: "block"; label: string }
  | { kind: "giro" }
  | { kind: "surgery"; s: ISurgery }

const cellOf = (room: IRoom, list: ISurgery[], t: number): Cell => {
  const hit = list.find((s) => toMin(s.start!) < t + SLOT && t < toMin(s.end!))
  if (hit) return { kind: "surgery", s: hit }
  if (
    room.block &&
    toMin(room.block.start) < t + SLOT &&
    t < toMin(room.block.end)
  )
    return { kind: "block", label: room.block.reason }
  if (
    list.some(
      (s) => toMin(s.end!) <= t && t < toMin(s.end!) + ROOM_TURNOVER_MIN,
    )
  )
    return { kind: "giro" }
  return { kind: "free" }
}

/**
 * Visão "Slots": grade de 30 em 30 min por sala. Slot livre abre o "Agendar
 * cirurgia" com sala e horário preenchidos.
 */
export const SlotsView = ({
  rooms,
  surgeries,
  patients,
  conflicts,
  isDimmed,
  onPickSlot,
}: {
  rooms: IRoom[]
  surgeries: ISurgery[]
  patients: Map<string, IPatient>
  conflicts: Set<number>
  isDimmed: (s: ISurgery) => boolean
  onPickSlot: (roomId: string, start: number) => void
}) => (
  <section className="min-w-0 flex-1 overflow-x-auto rounded-[10px] border border-[#E2E8F0] bg-white">
    <div
      className="grid min-w-[1100px]"
      style={{ gridTemplateColumns: `120px repeat(${SLOTS.length}, 1fr)` }}
    >
      <div className="border-b border-[#E2E8F0] bg-[#F8FAFC]" />
      {SLOTS.map((t) => (
        <div
          key={t}
          className="border-b border-l border-[#E2E8F0] bg-[#F8FAFC] py-2 text-center text-[10.5px] text-[#94A3B8]"
        >
          {t % 60 === 0 ? fromMin(t) : ""}
        </div>
      ))}
      {rooms.map((room) => {
        const list = surgeries.filter(
          (s) => s.roomId === room.id && s.stage !== "cancelada",
        )
        return [
          <div
            key={`${room.id}-name`}
            className="flex flex-col justify-center border-b border-[#E2E8F0] px-3 py-2"
          >
            <span className="text-[13px] font-bold text-[#1E293B]">
              {room.name}
            </span>
            <span className="truncate text-[11px] text-[#64748B]">
              {room.specialty}
            </span>
          </div>,
          ...SLOTS.map((t) => {
            const c = cellOf(room, list, t)
            const base =
              "h-14 border-b border-l border-[#E2E8F0] p-0.5 text-[10px]"
            if (c.kind === "surgery") {
              const p = patients.get(c.s.patientId)
              const conflict = conflicts.has(c.s.id)
              const tone =
                c.s.stage === "finalizada"
                  ? "bg-[#ECFDF5] border-[#10B981] text-[#047857]"
                  : c.s.stage === "em_cirurgia" || c.s.stage === "srpa"
                    ? "bg-[#EBF0FE] border-[#1A56DB] text-[#1A56DB]"
                    : "bg-white border-[#94A3B8] text-[#1E293B]"
              return (
                <div key={`${room.id}-${t}`} className={base}>
                  <Link
                    href={`${BASE}/cirurgias/${c.s.id}`}
                    title={`${c.s.start}–${c.s.end} · ${p?.name} · ${procedureLabel(c.s)}`}
                    className={cn(
                      "flex h-full items-center justify-center overflow-hidden rounded border font-semibold",
                      tone,
                      conflict &&
                        "border-[#EF4444] bg-[#FEF2F2] text-[#B91C1C]",
                      isDimmed(c.s) && "opacity-25",
                    )}
                  >
                    {p?.initials}
                  </Link>
                </div>
              )
            }
            if (c.kind === "block")
              return (
                <div key={`${room.id}-${t}`} className={base} title={c.label}>
                  <div className="h-full rounded border border-[#F59E0B] bg-[#FFFBEB]" />
                </div>
              )
            if (c.kind === "giro")
              return (
                <div
                  key={`${room.id}-${t}`}
                  className={base}
                  title="Giro de sala"
                >
                  <div className="h-full rounded border border-[#E2E8F0] bg-[#F8FAFC]" />
                </div>
              )
            return (
              <div key={`${room.id}-${t}`} className={base}>
                <button
                  type="button"
                  aria-label={`Agendar na ${room.name} às ${fromMin(t)}`}
                  title={`Livre · agendar às ${fromMin(t)}`}
                  onClick={() => onPickSlot(room.id, t)}
                  className="group flex h-full w-full items-center justify-center rounded text-[#1A56DB] hover:bg-[#EBF0FE]"
                >
                  <LuPlus className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                </button>
              </div>
            )
          }),
        ]
      })}
    </div>
    <p className="border-t border-[#E2E8F0] px-4 py-2.5 text-[11.5px] text-[#94A3B8]">
      Slots de 30 min · clique num horário livre para agendar · giro de sala de{" "}
      {ROOM_TURNOVER_MIN} min já reservado após cada cirurgia
    </p>
  </section>
)
