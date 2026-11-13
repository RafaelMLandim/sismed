"use client"

import { Button, Input, Select, SelectItem, addToast } from "@heroui/react"
import { useState } from "react"
import { LuCheck, LuOctagonAlert, LuWrench } from "react-icons/lu"

import { MOCK_NOW } from "../../_data/fixtures"
import { TODAY_ISO, dayLabel, isPast, longBR } from "../../_data/days"
import { useCC } from "../../_data/store"
import { fromMin, toMin } from "../../_data/time"
import type { IRoom } from "../../_data/types"
import { DAY_END, DAY_START, SNAP_MIN, roomSurgeries } from "./schedule"
import { MapModal } from "./MapModal"
import { useDay } from "./useDay"
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

const REASONS = [
  "Manutenção preventiva",
  "Manutenção corretiva",
  "Limpeza terminal",
  "Falta de equipe",
  "Outro motivo",
]

/** 07:00 … 19:00 de 15 em 15 min (o término pode ser 19:00). */
const TIMES = Array.from(
  { length: (DAY_END - DAY_START) / SNAP_MIN + 1 },
  (_, i) => fromMin(DAY_START + i * SNAP_MIN),
)

const roundUp = (min: number) => Math.ceil(min / SNAP_MIN) * SNAP_MIN

/**
 * Bloquear uma sala do mapa por um período (manutenção, limpeza…). Não deixa
 * bloquear por cima de cirurgia marcada: elas precisam ser movidas antes.
 */
export const BlockRoomModal = ({
  day,
  room,
  onClose,
}: {
  /** Dia do bloqueio (o dia aberto no mapa). */
  day: string
  room: IRoom
  onClose: () => void
}) => {
  const { surgeries } = useDay(day)
  const today = day === TODAY_ISO
  const patients = useCC((s) => s.patients)
  const setRoomBlock = useCC((s) => s.setRoomBlock)

  const defaultStart = today
    ? fromMin(
        Math.min(Math.max(roundUp(toMin(MOCK_NOW)), DAY_START), DAY_END - 60),
      )
    : fromMin(DAY_START)
  const [start, setStart] = useState(room.block?.start ?? defaultStart)
  const [end, setEnd] = useState(
    room.block?.end ?? fromMin(toMin(defaultStart) + 120),
  )
  const [reason, setReason] = useState(room.block?.reason ?? REASONS[0])
  const [detail, setDetail] = useState(room.block?.detail ?? "")

  const invalidRange = toMin(end) <= toMin(start)
  const clashes = invalidRange
    ? []
    : roomSurgeries(surgeries, room.id).filter(
        (s) => toMin(s.start!) < toMin(end) && toMin(start) < toMin(s.end!),
      )
  const nameOf = (patientId: string) =>
    patients.find((p) => p.id === patientId)?.name ?? "Paciente"
  const past = isPast(day)
  const blocked = invalidRange || clashes.length > 0 || past

  const save = () => {
    setRoomBlock(room.id, day, {
      start,
      end,
      reason,
      detail: detail.trim() || reason.toLowerCase(),
    })
    addToast({
      title: `${room.name} bloqueada ${dayLabel(day)}, das ${start} às ${end}`,
      description: `${reason}. Ninguém consegue alocar cirurgia nesse período.`,
      color: "success",
    })
    onClose()
  }

  return (
    <MapModal
      width={720}
      icon={<LuWrench />}
      title={`Bloquear ${room.name}`}
      description={`${longBR(day)} · a sala fica indisponível no mapa durante o período.`}
      onClose={onClose}
      footer={
        <>
          <Button className={OUTLINE_BUTTON} onPress={onClose}>
            Cancelar
          </Button>
          <Button
            className={cn(PRIMARY_BUTTON, blocked && "opacity-50")}
            startContent={<LuCheck />}
            isDisabled={blocked}
            onPress={save}
          >
            Bloquear sala
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <Select
          label="Início"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          disallowEmptySelection
          selectedKeys={[start]}
          onSelectionChange={(k) => setStart(String([...k][0]))}
        >
          {TIMES.slice(0, -1).map((t) => (
            <SelectItem key={t}>{t}</SelectItem>
          ))}
        </Select>
        <Select
          label="Término"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          disallowEmptySelection
          selectedKeys={[end]}
          onSelectionChange={(k) => setEnd(String([...k][0]))}
          isInvalid={invalidRange}
          errorMessage="O término precisa ser depois do início"
        >
          {TIMES.slice(1).map((t) => (
            <SelectItem key={t}>{t}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="flex items-start gap-4">
        <Select
          label="Motivo"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          disallowEmptySelection
          selectedKeys={[reason]}
          onSelectionChange={(k) => setReason(String([...k][0]))}
        >
          {REASONS.map((r) => (
            <SelectItem key={r}>{r}</SelectItem>
          ))}
        </Select>
        <Input
          label="Detalhe (opcional)"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          placeholder="Ex.: ar-condicionado e foco cirúrgico"
          value={detail}
          onValueChange={setDetail}
        />
      </div>

      {past && (
        <p className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] font-semibold text-[#B91C1C]">
          Esse dia já passou: não dá para bloquear a sala.
        </p>
      )}
      {clashes.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3">
          <span className="flex items-center gap-2 text-[13px] font-semibold text-[#B91C1C]">
            <LuOctagonAlert className="h-[15px] w-[15px]" />
            Há cirurgias marcadas nesse período
          </span>
          <ul className="flex flex-col gap-0.5 pl-6 text-[12.5px] text-[#1E293B]">
            {clashes.map((s) => (
              <li key={s.id}>
                • #{s.id} · {nameOf(s.patientId)} ({s.start}–{s.end})
              </li>
            ))}
          </ul>
          <span className="pl-6 text-[12px] text-[#64748B]">
            Mova ou desaloque essas cirurgias antes de bloquear a sala.
          </span>
        </div>
      )}
    </MapModal>
  )
}
