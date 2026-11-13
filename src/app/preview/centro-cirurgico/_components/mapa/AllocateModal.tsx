"use client"

import { Button, Select, SelectItem, addToast } from "@heroui/react"
import Link from "next/link"
import { useState, type ReactNode } from "react"
import {
  LuArrowUpRight,
  LuBookmark,
  LuCalendarCheck,
  LuCheck,
  LuCircleAlert,
  LuCircleCheck,
  LuClipboardCheck,
  LuClock3,
  LuDroplet,
  LuLink,
  LuOctagonAlert,
  LuSparkles,
  LuTimer,
  LuTriangleAlert,
  LuUndo2,
} from "react-icons/lu"

import { TODAY_ISO, dayLabel, isPast, isoToBR } from "../../_data/days"
import { ROOM_TURNOVER_MIN } from "../../_data/fixtures"
import { useCC, useUnitData } from "../../_data/store"
import { fmtDuration, fromMin, toMin } from "../../_data/time"
import type { ISurgery } from "../../_data/types"
import { BASE } from "../MockShell"
import { DateField, MapModal, ReadOnlyField, Req } from "./MapModal"
import { BLOOD_OPTIONS, DURATION_OPTIONS } from "./options"
import {
  DEFAULT_DURATION,
  TIME_OPTIONS,
  procedureLabel,
  roomStatusAt,
  roomsOn,
  surgeriesOn,
  slotIssues,
  suggestSlot,
} from "./schedule"
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

const KV = ({
  label,
  children,
  warn,
}: {
  label: string
  children: ReactNode
  warn?: boolean
}) => (
  <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
    <span className="text-[11.5px] text-[#64748B]">{label}</span>
    <span
      className={cn(
        "text-[13px] font-semibold",
        warn ? "text-[#B45309]" : "text-[#1E293B]",
      )}
    >
      {children}
    </span>
  </div>
)

const SectionTitle = ({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
}) => (
  <div className="flex items-end justify-between gap-4 border-b border-[#E2E8F0] pb-1.5">
    <div className="flex flex-col gap-[3px]">
      <h3 className="text-[13.5px] font-bold text-[#1A56DB]">{title}</h3>
      {subtitle && <p className="text-xs text-[#64748B]">{subtitle}</p>}
    </div>
    {right}
  </div>
)

const YesNo = ({
  value,
  onChange,
  label,
}: {
  value: boolean
  onChange: (v: boolean) => void
  label: string
}) => (
  <div
    role="radiogroup"
    aria-label={label}
    className="flex items-center gap-0.5 rounded-[7px] border border-[#E2E8F0] bg-[#F0F2F5] p-0.5"
  >
    {[true, false].map((v) => (
      <button
        key={String(v)}
        type="button"
        role="radio"
        aria-checked={value === v}
        onClick={() => onChange(v)}
        className={cn(
          "rounded-[5px] px-3 py-1 text-xs",
          value === v
            ? v
              ? "bg-[#047857] font-semibold text-white"
              : "bg-[#B45309] font-semibold text-white"
            : "font-medium text-[#64748B]",
        )}
      >
        {v ? "Sim" : "Não"}
      </button>
    ))}
  </div>
)

type CheckState = "ok" | "pendente" | "na"

const CheckRow = ({
  title,
  detail,
  state,
  right,
}: {
  title: string
  detail?: string
  state: CheckState
  right?: ReactNode
}) => (
  <div
    className={cn(
      "flex items-center gap-3 border-b border-[#E2E8F0] px-3.5 py-2.5 last:border-b-0",
      state === "pendente" && "bg-[#FFFBEB]",
    )}
  >
    {state === "ok" ? (
      <LuCircleCheck className="h-4 w-4 shrink-0 text-[#047857]" />
    ) : state === "pendente" ? (
      <LuCircleAlert className="h-4 w-4 shrink-0 text-[#B45309]" />
    ) : (
      <LuClock3 className="h-4 w-4 shrink-0 text-[#94A3B8]" />
    )}
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-[13px] font-semibold text-[#1E293B]">{title}</span>
      {detail && <span className="text-xs text-[#64748B]">{detail}</span>}
    </div>
    {right ??
      (state === "ok" ? (
        <span className="rounded-full bg-[#ECFDF5] px-[9px] py-[3px] text-[11px] font-semibold text-[#047857]">
          Ok
        </span>
      ) : state === "pendente" ? (
        <span className="rounded-full bg-[#FFFBEB] px-[9px] py-[3px] text-[11px] font-semibold text-[#B45309]">
          Pendente
        </span>
      ) : (
        <span className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-[9px] py-[3px] text-[11px] font-semibold text-[#64748B]">
          Não se aplica
        </span>
      ))}
  </div>
)

/** Barra de disponibilidade: livre · esta cirurgia · giro · livre. */
const AvailabilityBar = ({
  from,
  to,
  start,
  end,
}: {
  from: number
  to: number
  start: number
  end: number
}) => {
  const giroEnd = Math.min(end + ROOM_TURNOVER_MIN, to)
  const segs = [
    { min: start - from, label: "", cls: "bg-white" },
    {
      min: end - start,
      label: `Esta cirurgia · ${fromMin(start)}–${fromMin(end)}`,
      cls: "bg-[#1A56DB] text-white",
    },
    {
      min: giroEnd - end,
      label: "Giro",
      cls: "bg-[#FFFBEB] text-[#B45309]",
    },
    {
      min: to - giroEnd,
      label: `Livre · ${fmtDuration(to - giroEnd)}`,
      cls: "bg-white text-[#94A3B8]",
    },
  ]
  const ticks = [from, start, end, giroEnd]
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-[30px] overflow-hidden rounded-md border border-[#E2E8F0] bg-white">
        {segs.map(
          (seg, i) =>
            seg.min > 0 && (
              <div
                key={i}
                style={{ flexGrow: seg.min, flexBasis: 0 }}
                className={cn(
                  "flex min-w-0 items-center justify-center border-r border-[#E2E8F0] text-[11px] font-semibold last:border-r-0",
                  seg.cls,
                )}
              >
                <span className="truncate px-1">{seg.label}</span>
              </div>
            ),
        )}
      </div>
      <div className="flex">
        {segs.map(
          (seg, i) =>
            seg.min > 0 && (
              <div
                key={i}
                style={{ flexGrow: seg.min, flexBasis: 0 }}
                className="flex min-w-0 justify-between text-[10px] font-medium text-[#94A3B8]"
              >
                <span>{fromMin(ticks[i])}</span>
                {i === segs.length - 1 && <span>{fromMin(to)}</span>}
              </div>
            ),
        )}
      </div>
    </div>
  )
}

/**
 * PEP-M11 · Checar e alocar no mapa. Também serve para trocar sala/horário de
 * uma cirurgia já agendada (`surgery.roomId` preenchido).
 */
export const AllocateModal = ({
  surgery,
  day,
  onDayChange,
  initial,
  onClose,
}: {
  surgery: ISurgery
  /** Dia aberto no mapa. */
  day: string
  /** Leva o mapa para o dia em que a cirurgia foi alocada. */
  onDayChange: (day: string) => void
  /** Sala/horário vindos do arrastar no mapa. */
  initial?: { roomId: string; start: number }
  onClose: () => void
}) => {
  const { rooms: allRooms, surgeries: allSurgeries } = useUnitData()
  const patients = useCC((s) => s.patients)
  // Arrastou no mapa → dia do mapa; já alocada → dia dela; da fila → dia pedido.
  const [date, setDate] = useState(() => {
    if (initial) return day
    if (surgery.date) return surgery.date
    if (surgery.requestedDate && !isPast(surgery.requestedDate))
      return surgery.requestedDate
    return day
  })
  const rooms = roomsOn(allRooms, date)
  const surgeries = surgeriesOn(allSurgeries, date)
  const patient = patients.find((p) => p.id === surgery.patientId)
  const allocate = useCC((s) => s.allocate)
  const unallocate = useCC((s) => s.unallocate)

  const isQueued = surgery.stage === "a_alocar"
  const currentDuration =
    surgery.start && surgery.end
      ? toMin(surgery.end) - toMin(surgery.start)
      : surgery.durationMin

  const [durationKey, setDurationKey] = useState(
    String(currentDuration ?? DEFAULT_DURATION),
  )
  const duration = Number(durationKey) || DEFAULT_DURATION
  const durationOptions = DURATION_OPTIONS.filter((o) => o.key)
  if (!durationOptions.some((o) => o.key === durationKey))
    durationOptions.push({ key: durationKey, label: fmtDuration(duration) })
  durationOptions.sort((a, b) => Number(a.key) - Number(b.key))

  const [slot, setSlot] = useState(() => {
    if (initial) return initial
    if (surgery.roomId && surgery.start)
      return { roomId: surgery.roomId, start: toMin(surgery.start) }
    return (
      suggestSlot(
        surgeries,
        rooms,
        duration,
        surgery.preferredPeriod,
        undefined,
        surgery.id,
        date,
      ) ?? { roomId: rooms[0].id, start: toMin("08:45") }
    )
  })
  const [blood, setBlood] = useState(
    /reserva de sangue/i.test(surgery.reservations)
      ? "Tipagem sanguínea"
      : "Não",
  )
  const [opmeOk, setOpmeOk] = useState(true)
  const [examsOk, setExamsOk] = useState(
    !surgery.pendencies.some((p) => /exame/i.test(p)),
  )
  const [bloodOk, setBloodOk] = useState(true)

  const room = rooms.find((r) => r.id === slot.roomId) ?? rooms[0]
  const end = slot.start + duration
  const nameOf = (s: ISurgery) =>
    patients.find((p) => p.id === s.patientId)?.name ?? `#${s.id}`
  const issues = [
    ...(isPast(date)
      ? [{ kind: "outside" as const, message: "Esse dia já passou." }]
      : []),
    ...slotIssues(surgeries, room, slot.start, duration, surgery.id, nameOf),
  ]
  /** Sala bloqueada, fora do expediente ou choque com outra cirurgia: não deixa confirmar. */
  const blocking = issues.some(
    (i) => i.kind === "block" || i.kind === "outside" || i.kind === "overlap",
  )
  const overlap = issues.some((i) => i.kind === "overlap")
  const status = roomStatusAt(surgeries, room, slot.start, surgery.id)

  const suggestOn = (d: string) =>
    suggestSlot(
      surgeriesOn(allSurgeries, d),
      roomsOn(allRooms, d),
      duration,
      surgery.preferredPeriod,
      undefined,
      surgery.id,
      d,
    )

  const applySuggestion = () => {
    const sug = suggestOn(date)
    if (sug) setSlot(sug)
    else
      addToast({
        title: `Nenhum horário livre ${dayLabel(date)} para essa duração`,
        color: "warning",
      })
  }

  /** Troca o dia e já sugere o primeiro horário livre dele. */
  const changeDate = (d: string) => {
    setDate(d)
    const sug = suggestOn(d)
    if (sug) setSlot(sug)
  }

  const confirm = () => {
    allocate(surgery.id, room.id, fromMin(slot.start), fromMin(end), date)
    onDayChange(date)
    addToast({
      title: `#${surgery.id} alocada na ${room.name} · ${dayLabel(date)}, ${fromMin(slot.start)}–${fromMin(end)}`,
      description: overlap
        ? "Ficou com sobreposição de horário: aparece em vermelho no mapa."
        : `Giro de sala reservado até ${fromMin(end + ROOM_TURNOVER_MIN)}.`,
      color: overlap ? "warning" : "success",
    })
    onClose()
  }

  const authPending = surgery.pendencies.some((p) => /autoriza/i.test(p))
  const preAnestOk = surgery.docs.pre_anestesica.status === "assinado"
  const durationLabel = fmtDuration(surgery.durationMin)

  return (
    <MapModal
      width={860}
      icon={<LuClipboardCheck />}
      title={`${isQueued ? "Checar e alocar no mapa" : "Trocar sala ou horário"} · #${surgery.id}`}
      description={`${patient?.name ?? "Paciente"} · ${procedureLabel(surgery)} · ${surgery.surgeon}`}
      onClose={onClose}
      footerClassName="justify-between"
      footer={
        <>
          {isQueued ? (
            <Button
              className={cn(
                OUTLINE_BUTTON,
                "border-[#EF4444] text-[#B91C1C] [&>svg]:text-[#B91C1C]",
              )}
              startContent={<LuUndo2 />}
              onPress={() =>
                addToast({
                  title:
                    "Devolver ao acompanhamento fica fora do escopo deste protótipo",
                })
              }
            >
              Devolver ao acompanhamento
            </Button>
          ) : (
            <Button
              className={cn(
                OUTLINE_BUTTON,
                "border-[#EF4444] text-[#B91C1C] [&>svg]:text-[#B91C1C]",
              )}
              startContent={<LuUndo2 />}
              onPress={() => {
                unallocate(surgery.id)
                addToast({
                  title: `#${surgery.id} voltou para a fila A alocar`,
                  color: "default",
                })
                onClose()
              }}
            >
              Desalocar
            </Button>
          )}
          <div className="flex items-center gap-2.5">
            {isQueued && (
              <Button
                className={cn(OUTLINE_BUTTON, "[&>svg]:text-[#1E293B]")}
                startContent={<LuBookmark />}
                onPress={() =>
                  addToast({
                    title: "Pré-reserva fica fora do escopo deste protótipo",
                  })
                }
              >
                Salvar como pré-reserva
              </Button>
            )}
            <Button
              className={cn(PRIMARY_BUTTON, blocking && "opacity-50")}
              startContent={<LuCheck />}
              isDisabled={blocking}
              onPress={confirm}
            >
              Confirmar no mapa
            </Button>
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-2.5 rounded-lg bg-[#F8FAFC] px-3.5 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <LuLink className="h-3.5 w-3.5 text-[#1A56DB]" />
            <span className="text-[12.5px] font-bold text-[#1E293B]">
              Dados do Acompanhamento cirúrgico
            </span>
            <span className="rounded-full bg-[#ECFDF5] px-[9px] py-[3px] text-[11px] font-semibold text-[#047857]">
              Confirmada
            </span>
          </div>
          <Link
            href={`${BASE}/cirurgias/${surgery.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-[#1A56DB] hover:underline"
          >
            Abrir #{surgery.id}
            <LuArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-5">
          <KV label="Data pedida">
            {isoToBR(surgery.requestedDate ?? surgery.date ?? day)}
            {surgery.preferredPeriod &&
              ` · ${surgery.preferredPeriod.toLowerCase()}`}
          </KV>
          <KV label="Convênio" warn={authPending}>
            {surgery.insurance}
            {surgery.insurance !== "Particular" &&
              (authPending ? " · autorização pendente" : " · guia autorizada")}
          </KV>
          <KV label="Anestesia prevista">
            {surgery.anesthesia ?? "A definir"}
          </KV>
          <KV label="Reservas">{surgery.reservations}</KV>
        </div>
        <div className="flex flex-wrap gap-5">
          <KV label="Equipe">
            {[surgery.surgeon, surgery.anesthetist].filter(Boolean).join(" · ")}
          </KV>
          <KV
            label="Duração informada"
            warn={surgery.durationMin === undefined}
          >
            {surgery.durationMin === undefined
              ? "Não informada"
              : durationLabel}
          </KV>
          <KV label="Lateralidade">
            {
              {
                Direito: "Direita",
                Esquerdo: "Esquerda",
                Bilateral: "Bilateral",
                "Não se aplica": "Não se aplica",
              }[surgery.side ?? "Não se aplica"]
            }
          </KV>
          <KV label="Prioridade" warn={surgery.urgent}>
            {surgery.urgent ? "Urgência" : "Eletiva"}
          </KV>
        </div>
      </div>

      <section className="flex flex-col gap-3.5">
        <SectionTitle
          title="Definição do centro cirúrgico"
          subtitle={
            surgery.durationMin === undefined
              ? `Duração não informada pelo cirurgião: reservamos ${fmtDuration(DEFAULT_DURATION)} (média) e ajustamos depois.`
              : "Sala e horário sugeridos pelo primeiro espaço livre que respeita o giro e o período pedido."
          }
          right={
            <button
              type="button"
              onClick={applySuggestion}
              className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#1A56DB] hover:underline"
            >
              <LuSparkles className="h-3 w-3" />
              Primeiro horário livre
            </button>
          }
        />
        <div className="flex gap-4">
          <DateField
            label="Data *"
            value={date}
            min={TODAY_ISO}
            onChange={changeDate}
          />
          <Select
            label={<Req>Sala</Req>}
            labelPlacement="outside"
            variant="bordered"
            className="flex-1"
            disallowEmptySelection
            selectedKeys={[slot.roomId]}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0]
              if (key) setSlot((s) => ({ ...s, roomId: String(key) }))
            }}
          >
            {rooms.map((r) => {
              const st = roomStatusAt(surgeries, r, slot.start, surgery.id)
              return (
                <SelectItem
                  key={r.id}
                  textValue={r.name}
                  description={
                    st.free
                      ? `Livre das ${fromMin(st.from)} às ${fromMin(st.to)}`
                      : `Ocupada até ${fromMin(st.until)}`
                  }
                >
                  {r.name}
                </SelectItem>
              )
            })}
          </Select>
          <Select
            label={<Req>Início</Req>}
            labelPlacement="outside"
            variant="bordered"
            className="flex-1"
            disallowEmptySelection
            startContent={
              <LuClock3 className="h-[15px] w-[15px] text-[#94A3B8]" />
            }
            selectedKeys={[fromMin(slot.start)]}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0]
              if (key) setSlot((s) => ({ ...s, start: toMin(String(key)) }))
            }}
          >
            {TIME_OPTIONS.map((t) => (
              <SelectItem key={t}>{t}</SelectItem>
            ))}
          </Select>
          <Select
            label={<Req>Duração</Req>}
            labelPlacement="outside"
            variant="bordered"
            className="flex-1"
            disallowEmptySelection
            startContent={
              <LuTimer className="h-[15px] w-[15px] text-[#94A3B8]" />
            }
            selectedKeys={[durationKey]}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0]
              if (key) setDurationKey(String(key))
            }}
          >
            {durationOptions.map((o) => (
              <SelectItem key={o.key}>{o.label}</SelectItem>
            ))}
          </Select>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-1 gap-4">
            <ReadOnlyField label="Término previsto" icon={<LuClock3 />} muted>
              {fromMin(end)}
            </ReadOnlyField>
            <ReadOnlyField label="Giro de sala">
              {ROOM_TURNOVER_MIN} min
              <span className="text-xs text-[#94A3B8]">padrão</span>
            </ReadOnlyField>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Select
              label={<Req>Reserva de sangue</Req>}
              labelPlacement="outside"
              variant="bordered"
              disallowEmptySelection
              startContent={
                <LuDroplet className="h-[15px] w-[15px] text-[#94A3B8]" />
              }
              selectedKeys={[blood]}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0]
                if (key) setBlood(String(key))
              }}
            >
              {BLOOD_OPTIONS.map((o) => (
                <SelectItem key={o}>{o}</SelectItem>
              ))}
            </Select>
            <span className="text-[11px] text-[#94A3B8]">
              {/reserva de sangue/i.test(surgery.reservations)
                ? "Cirurgião pediu reserva no acompanhamento."
                : "Padrão do perfil. Cirurgião não pediu reserva."}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-3">
          {issues.length === 0 && status.free ? (
            <>
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#047857]">
                <LuCalendarCheck className="h-[15px] w-[15px] shrink-0" />
                {room.name} livre das {fromMin(status.from)} às{" "}
                {fromMin(status.to)} · cabe a cirurgia + giro
              </div>
              <AvailabilityBar
                from={status.from}
                to={status.to}
                start={slot.start}
                end={end}
              />
            </>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div
                className={cn(
                  "flex items-center gap-2 text-[13px] font-semibold",
                  overlap || blocking ? "text-[#B91C1C]" : "text-[#B45309]",
                )}
              >
                {overlap || blocking ? (
                  <LuOctagonAlert className="h-[15px] w-[15px] shrink-0" />
                ) : (
                  <LuTriangleAlert className="h-[15px] w-[15px] shrink-0" />
                )}
                {blocking
                  ? `Não dá para alocar na ${room.name} às ${fromMin(slot.start)}`
                  : overlap
                    ? `Conflito de horário na ${room.name}`
                    : `Cabe na ${room.name}, mas sem o giro completo`}
              </div>
              <ul className="flex flex-col gap-0.5 pl-6 text-[12.5px] leading-[1.4] text-[#1E293B]">
                {issues.map((i, idx) => (
                  <li key={idx}>• {i.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3.5">
        <SectionTitle
          title="Checagem antes de confirmar"
          right={
            <span className="flex items-center gap-1 text-[11.5px] text-[#94A3B8]">
              Itens configurados em Cadastros › Checagens de alocação
              <LuArrowUpRight className="h-3 w-3" />
            </span>
          }
        />
        <div className="flex flex-col rounded-lg border border-[#E2E8F0]">
          <CheckRow
            title="Autorização do convênio"
            state={
              surgery.insurance === "Particular"
                ? "na"
                : authPending
                  ? "pendente"
                  : "ok"
            }
            detail={
              surgery.insurance === "Particular"
                ? "Particular · não precisa de guia"
                : authPending
                  ? "Vem do Acompanhamento cirúrgico · guia ainda não autorizada"
                  : "Vem do Acompanhamento cirúrgico · guia autorizada"
            }
          />
          <CheckRow
            title="OPME e materiais especiais"
            state={opmeOk ? "ok" : "pendente"}
            right={
              <YesNo
                label="OPME confirmado"
                value={opmeOk}
                onChange={setOpmeOk}
              />
            }
          />
          <CheckRow
            title="Avaliação pré-anestésica"
            state={preAnestOk ? "ok" : "pendente"}
            detail={
              preAnestOk
                ? `Vem do Prontuário · assinada às ${surgery.docs.pre_anestesica.signedAt}`
                : "Vem do Prontuário · avaliação pré-anestésica ainda não assinada"
            }
          />
          <CheckRow
            title="Exames pré-operatórios"
            state={examsOk ? "ok" : "pendente"}
            right={
              <YesNo
                label="Exames anexados"
                value={examsOk}
                onChange={setExamsOk}
              />
            }
          />
          <CheckRow
            title={`Reserva de sangue (${blood === "Não" ? "não pedida" : blood.toLowerCase()})`}
            state={blood === "Não" ? "na" : bloodOk ? "ok" : "pendente"}
            right={
              blood === "Não" ? undefined : (
                <YesNo
                  label="Reserva confirmada"
                  value={bloodOk}
                  onChange={setBloodOk}
                />
              )
            }
          />
        </div>
        <p className="text-xs text-[#94A3B8]">
          Pendências não impedem a alocação: ficam visíveis no mapa, na recepção
          e no prontuário até serem resolvidas.
        </p>
      </section>
    </MapModal>
  )
}
