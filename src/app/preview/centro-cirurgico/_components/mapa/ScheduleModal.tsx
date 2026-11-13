"use client"

import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Input,
  Select,
  SelectItem,
  addToast,
} from "@heroui/react"
import { useState } from "react"
import {
  LuCalendarCheck,
  LuCalendarPlus,
  LuCheck,
  LuClock3,
  LuInbox,
  LuOctagonAlert,
  LuTimer,
  LuTriangleAlert,
} from "react-icons/lu"

import {
  ANESTHETISTS,
  DOC_KEYS,
  ROOM_TURNOVER_MIN,
  SURGEONS,
} from "../../_data/fixtures"
import { TODAY_ISO, dayLabel, isPast } from "../../_data/days"
import { useCC, useUnitData } from "../../_data/store"
import { fmtDuration, fromMin, toMin } from "../../_data/time"
import type {
  DocKey,
  ICareNote,
  IDocState,
  ISurgery,
  PreferredPeriod,
} from "../../_data/types"
import { DateField, MapModal, ReadOnlyField, Req } from "./MapModal"
import {
  ANESTHESIA_OPTIONS,
  ASA_OPTIONS,
  BLOOD_OPTIONS,
  DURATION_OPTIONS,
  PERIOD_OPTIONS,
  SIDE_OPTIONS,
  SIZE_OPTIONS,
} from "./options"
import {
  DEFAULT_DURATION,
  TIME_OPTIONS,
  nextInRoom,
  roomStatusAt,
  roomsOn,
  surgeriesOn,
  slotIssues,
} from "./schedule"
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

const pick = (keys: "all" | Set<React.Key>) =>
  keys === "all" ? "" : String(Array.from(keys)[0] ?? "")

const emptyDocs = () =>
  Object.fromEntries(
    DOC_KEYS.map((k) => [k, { status: "nao_iniciado" } as IDocState]),
  ) as Record<DocKey, IDocState>

/** PEP-M07 · Agendar cirurgia. Sem sala e horário → fila "A alocar". */
export const ScheduleModal = ({
  day,
  onDayChange,
  initial,
  onClose,
  onCreated,
}: {
  /** Dia aberto no mapa (vira o dia padrão do agendamento). */
  day: string
  /** Leva o mapa para o dia agendado. */
  onDayChange: (day: string) => void
  initial?: { roomId: string; start: number }
  onClose: () => void
  onCreated?: (id: number) => void
}) => {
  const patients = useCC((s) => s.patients)
  const { unitId, rooms: allRooms, surgeries: allSurgeries } = useUnitData()
  const hospitalizations = useCC((s) => s.hospitalizations)
  const addSurgery = useCC((s) => s.addSurgery)

  const [f, setF] = useState({
    date: isPast(day) ? TODAY_ISO : day,
    patientId: "",
    procedure: "",
    start: initial ? fromMin(initial.start) : "",
    roomId: initial?.roomId ?? "",
    side: "Não se aplica" as NonNullable<ISurgery["side"]>,
    durationKey: "",
    surgeon: "",
    anesthetist: "",
    anesthesia: "Raquianestesia",
    asa: "ASA II",
    size: "Médio porte",
    antibiotic: "",
    blood: "Não",
    period: "Qualquer horário" as PreferredPeriod,
  })
  const [submitted, setSubmitted] = useState(false)
  const set = (patch: Partial<typeof f>) =>
    setF((old) => ({ ...old, ...patch }))

  const rooms = roomsOn(allRooms, f.date)
  const surgeries = surgeriesOn(allSurgeries, f.date)
  const patient = patients.find((p) => p.id === f.patientId)
  const durationMin = f.durationKey ? Number(f.durationKey) : undefined
  const duration = durationMin ?? DEFAULT_DURATION
  const room = rooms.find((r) => r.id === f.roomId)
  const start = f.start ? toMin(f.start) : undefined
  const hasSlot = Boolean(room && start !== undefined)
  const halfSlot = Boolean(room) !== (start !== undefined)
  const nameOf = (s: ISurgery) =>
    patients.find((p) => p.id === s.patientId)?.name ?? `#${s.id}`
  const issues =
    room && start !== undefined
      ? slotIssues(surgeries, room, start, duration, undefined, nameOf)
      : []
  /** Sala bloqueada, fora do expediente ou choque com outra cirurgia: não deixa confirmar. */
  const blocking = issues.some(
    (i) => i.kind === "block" || i.kind === "outside" || i.kind === "overlap",
  )
  const overlap = issues.some((i) => i.kind === "overlap")

  const missing = {
    patient: !f.patientId,
    procedure: !f.procedure.trim(),
    surgeon: !f.surgeon,
  }
  const invalid = Object.values(missing).some(Boolean) || halfSlot || blocking

  const save = () => {
    setSubmitted(true)
    if (invalid || !patient) return
    const careNotes: ICareNote[] = patient.allergies.map((a) => ({
      label: "Alergia",
      value: a,
      tone: "danger",
    }))
    if (f.antibiotic.trim())
      careNotes.push({
        label: "Antibiótico",
        value: f.antibiotic.trim(),
        tone: "primary",
      })
    const end = hasSlot ? fromMin(start! + duration) : undefined
    // Paciente internado já está no hospital: não fica "aguardando chegada".
    const hosp = hospitalizations.find((h) => h.patientId === patient.id)
    const id = addSurgery({
      unitId,
      patientId: patient.id,
      hospitalizationId: hosp?.id,
      bed: hosp?.bed,
      procedure: f.procedure.trim(),
      side: f.side,
      surgeon: f.surgeon,
      anesthetist: f.anesthetist || undefined,
      anesthesia: `${f.anesthesia} · ${f.asa}`,
      insurance: patient.insurance,
      durationMin,
      stage: hasSlot ? "agendada" : "a_alocar",
      arrived: Boolean(hosp),
      roomId: hasSlot ? room!.id : undefined,
      date: hasSlot ? f.date : undefined,
      requestedDate: f.date,
      start: hasSlot ? f.start : undefined,
      end,
      preferredPeriod: hasSlot ? undefined : f.period,
      pendencies: f.anesthesia === "Local" ? [] : ["Pré-anestésica pendente"],
      careNotes,
      reservations:
        f.blood === "Não"
          ? "Sem reserva de sangue"
          : `Reserva de sangue · ${f.blood.toLowerCase()}`,
      docs: emptyDocs(),
    })
    addToast({
      title: hasSlot
        ? `Cirurgia #${id} agendada na ${room!.name} · ${dayLabel(f.date)}, ${f.start}–${end}`
        : `Cirurgia #${id} entrou na fila A alocar`,
      description: overlap
        ? "Ficou com sobreposição de horário: aparece em vermelho no mapa."
        : undefined,
      color: overlap ? "warning" : "success",
    })
    if (hasSlot) onDayChange(f.date)
    onCreated?.(id)
    onClose()
  }

  const status =
    room && start !== undefined ? roomStatusAt(surgeries, room, start) : null
  const next =
    room && start !== undefined
      ? nextInRoom(surgeries, room.id, start + duration)
      : undefined

  return (
    <MapModal
      width={720}
      icon={<LuCalendarPlus />}
      title="Agendar cirurgia"
      description={
        patient
          ? `${patient.name}${patient.allergies.length ? ` · Alergias: ${patient.allergies.join(", ")}` : " · Sem alergias registradas"}`
          : "Selecione o paciente"
      }
      onClose={onClose}
      footer={
        <>
          <Button className={OUTLINE_BUTTON} onPress={onClose}>
            Cancelar
          </Button>
          <Button
            className={cn(PRIMARY_BUTTON, blocking && "opacity-50")}
            startContent={<LuCheck />}
            isDisabled={blocking}
            onPress={save}
          >
            Agendar cirurgia
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <Autocomplete
          label={<Req>Paciente</Req>}
          labelPlacement="outside"
          variant="bordered"
          placeholder="Buscar paciente"
          className="flex-1"
          selectedKey={f.patientId || null}
          onSelectionChange={(key) =>
            set({ patientId: key ? String(key) : "" })
          }
          isInvalid={submitted && missing.patient}
          errorMessage="Selecione o paciente"
        >
          {patients.map((p) => (
            <AutocompleteItem
              key={p.id}
              textValue={p.name}
              description={`${p.age} anos · prontuário ${p.record} · ${p.insurance}`}
            >
              {p.name}
            </AutocompleteItem>
          ))}
        </Autocomplete>
        <Input
          label={<Req>Procedimento</Req>}
          labelPlacement="outside"
          variant="bordered"
          placeholder="Ex.: Artroplastia parcial de quadril"
          className="flex-1"
          value={f.procedure}
          onValueChange={(v) => set({ procedure: v })}
          isInvalid={submitted && missing.procedure}
          errorMessage="Informe o procedimento"
        />
      </div>

      <div className="flex items-start gap-4">
        <DateField
          label="Data *"
          value={f.date}
          min={TODAY_ISO}
          onChange={(date) => set({ date })}
        />
        <Select
          label="Horário"
          labelPlacement="outside"
          variant="bordered"
          placeholder="A definir"
          className="flex-1"
          startContent={
            <LuClock3 className="h-[15px] w-[15px] text-[#94A3B8]" />
          }
          selectedKeys={f.start ? [f.start] : []}
          onSelectionChange={(keys) => set({ start: pick(keys) })}
          isInvalid={submitted && halfSlot && !f.start}
        >
          {TIME_OPTIONS.map((t) => (
            <SelectItem key={t}>{t}</SelectItem>
          ))}
        </Select>
        <Select
          label="Sala"
          labelPlacement="outside"
          variant="bordered"
          placeholder="A definir"
          className="flex-1"
          selectedKeys={f.roomId ? [f.roomId] : []}
          onSelectionChange={(keys) => set({ roomId: pick(keys) })}
          isInvalid={submitted && halfSlot && !f.roomId}
        >
          {rooms.map((r) => {
            const st =
              start !== undefined ? roomStatusAt(surgeries, r, start) : null
            return (
              <SelectItem
                key={r.id}
                textValue={r.name}
                description={
                  st
                    ? st.free
                      ? `Livre das ${fromMin(st.from)} às ${fromMin(st.to)}`
                      : `Ocupada até ${fromMin(st.until)}`
                    : r.specialty
                }
              >
                {r.name}
              </SelectItem>
            )
          })}
        </Select>
        <Select
          label="Lateralidade"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          disallowEmptySelection
          selectedKeys={[f.side]}
          onSelectionChange={(keys) =>
            set({ side: pick(keys) as NonNullable<ISurgery["side"]> })
          }
        >
          {SIDE_OPTIONS.map((o) => (
            <SelectItem key={o.key}>{o.label}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <Select
            label="Duração estimada (opcional)"
            labelPlacement="outside"
            variant="bordered"
            startContent={
              <LuTimer className="h-[15px] w-[15px] text-[#94A3B8]" />
            }
            selectedKeys={[f.durationKey || "none"]}
            disallowEmptySelection
            onSelectionChange={(keys) => {
              const k = pick(keys)
              set({ durationKey: k === "none" ? "" : k })
            }}
          >
            {DURATION_OPTIONS.map((o) => (
              <SelectItem key={o.key || "none"} description={o.description}>
                {o.label}
              </SelectItem>
            ))}
          </Select>
          <span className="text-[11px] leading-[1.4] text-[#94A3B8]">
            Se não souber, deixe em branco: o centro cirúrgico reserva a sala
            com a média do procedimento ({fmtDuration(DEFAULT_DURATION)}) e
            ajusta depois.
          </span>
        </div>
        <ReadOnlyField label="Término previsto" icon={<LuClock3 />} muted>
          {start === undefined
            ? "—"
            : `${durationMin ? "" : "~"}${fromMin(start + duration)}${durationMin ? "" : " (pela média)"}`}
        </ReadOnlyField>
        <ReadOnlyField label="Giro de sala">
          {ROOM_TURNOVER_MIN} min
          <span className="text-xs text-[#94A3B8]">padrão da sala</span>
        </ReadOnlyField>
      </div>

      {halfSlot ? (
        <Alert tone="warning" icon={<LuTriangleAlert />}>
          <strong>Informe sala e horário juntos</strong>
          <span>
            Ou deixe os dois em branco para a cirurgia entrar na fila A alocar.
          </span>
        </Alert>
      ) : !hasSlot ? (
        <div className="flex flex-col gap-3">
          <Alert tone="primary" icon={<LuInbox />}>
            <strong>Sem sala e horário: vai para a fila A alocar</strong>
            <span>
              O centro cirúrgico checa as pendências e aloca no mapa depois.
            </span>
          </Alert>
          <Select
            label="Período preferido"
            labelPlacement="outside"
            variant="bordered"
            className="max-w-[220px]"
            disallowEmptySelection
            selectedKeys={[f.period]}
            onSelectionChange={(keys) =>
              set({ period: pick(keys) as PreferredPeriod })
            }
          >
            {PERIOD_OPTIONS.map((o) => (
              <SelectItem key={o}>{o}</SelectItem>
            ))}
          </Select>
        </div>
      ) : issues.length ? (
        <Alert
          tone={overlap || blocking ? "danger" : "warning"}
          icon={overlap || blocking ? <LuOctagonAlert /> : <LuTriangleAlert />}
        >
          <strong>
            {blocking
              ? `Não dá para agendar na ${room!.name} às ${f.start}`
              : overlap
                ? `Conflito de horário na ${room!.name}`
                : `Cabe na ${room!.name}, mas sem o giro completo`}
          </strong>
          {issues.map((i, idx) => (
            <span key={idx}>• {i.message}</span>
          ))}
        </Alert>
      ) : (
        status?.free && (
          <Alert tone="success" icon={<LuCalendarCheck />}>
            <strong>
              {room!.name} livre das {fromMin(status.from)} às{" "}
              {fromMin(status.to)}
            </strong>
            <span>
              • Ocupa {f.start}–{fromMin(start! + duration)} e reserva o giro
              até {fromMin(start! + duration + ROOM_TURNOVER_MIN)}.
              {next
                ? ` Próxima cirurgia da sala: ${next.start} (${nameOf(next)}).`
                : " Sem outra cirurgia na sala depois."}
            </span>
          </Alert>
        )
      )}

      <div className="flex items-start gap-4">
        <Select
          label={<Req>Cirurgião</Req>}
          labelPlacement="outside"
          variant="bordered"
          placeholder="Selecione"
          className="flex-1"
          selectedKeys={f.surgeon ? [f.surgeon] : []}
          onSelectionChange={(keys) => set({ surgeon: pick(keys) })}
          isInvalid={submitted && missing.surgeon}
          errorMessage="Selecione o cirurgião"
        >
          {SURGEONS.map((o) => (
            <SelectItem key={o}>{o}</SelectItem>
          ))}
        </Select>
        <Select
          label="Anestesista"
          labelPlacement="outside"
          variant="bordered"
          placeholder="A definir"
          className="flex-1"
          selectedKeys={f.anesthetist ? [f.anesthetist] : []}
          onSelectionChange={(keys) => set({ anesthetist: pick(keys) })}
        >
          {ANESTHETISTS.map((o) => (
            <SelectItem key={o}>{o}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="flex items-start gap-4">
        <Select
          label="Tipo de anestesia"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          disallowEmptySelection
          selectedKeys={[f.anesthesia]}
          onSelectionChange={(keys) => set({ anesthesia: pick(keys) })}
        >
          {ANESTHESIA_OPTIONS.map((o) => (
            <SelectItem key={o}>{o}</SelectItem>
          ))}
        </Select>
        <Select
          label="Classificação ASA"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          disallowEmptySelection
          selectedKeys={[f.asa]}
          onSelectionChange={(keys) => set({ asa: pick(keys) })}
        >
          {ASA_OPTIONS.map((o) => (
            <SelectItem key={o.key} description={o.description}>
              {o.key}
            </SelectItem>
          ))}
        </Select>
        <Select
          label="Porte"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          disallowEmptySelection
          selectedKeys={[f.size]}
          onSelectionChange={(keys) => set({ size: pick(keys) })}
        >
          {SIZE_OPTIONS.map((o) => (
            <SelectItem key={o}>{o}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="flex items-start gap-4">
        <Input
          label="Antibioticoprofilaxia"
          labelPlacement="outside"
          variant="bordered"
          placeholder="Ex.: Cefazolina 2 g EV na indução"
          className="flex-1"
          description="Texto livre."
          value={f.antibiotic}
          onValueChange={(v) => set({ antibiotic: v })}
        />
        <Select
          label="Reserva de sangue"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          disallowEmptySelection
          selectedKeys={[f.blood]}
          onSelectionChange={(keys) => set({ blood: pick(keys) })}
        >
          {BLOOD_OPTIONS.map((o) => (
            <SelectItem key={o}>{o}</SelectItem>
          ))}
        </Select>
      </div>

      <p className="text-xs text-[#94A3B8]">
        Ao salvar, o sistema verifica conflito de sala e horário com outras
        cirurgias ativas.
      </p>
    </MapModal>
  )
}

const ALERT_TONE = {
  success:
    "border-[#10B981] bg-[#ECFDF5] [&>svg]:text-[#047857] [&_strong]:text-[#047857]",
  warning:
    "border-[#F59E0B] bg-[#FFFBEB] [&>svg]:text-[#B45309] [&_strong]:text-[#B45309]",
  danger:
    "border-[#EF4444] bg-[#FEF2F2] [&>svg]:text-[#B91C1C] [&_strong]:text-[#B91C1C]",
  primary:
    "border-[#1A56DB] bg-[#EBF0FE] [&>svg]:text-[#1A56DB] [&_strong]:text-[#142D6B]",
} as const

/** Alerta com barra lateral (raio 0 8 8 0), como no desenho. */
const Alert = ({
  tone,
  icon,
  children,
}: {
  tone: keyof typeof ALERT_TONE
  icon: React.ReactNode
  children: React.ReactNode
}) => (
  <div
    className={cn(
      "flex gap-2.5 rounded-r-lg border-l-[3px] px-3.5 py-2.5 [&>svg]:mt-px [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0",
      ALERT_TONE[tone],
    )}
  >
    {icon}
    <div className="flex flex-col gap-1 text-[12.5px] leading-[1.4] text-[#1E293B] [&_strong]:text-[13px] [&_strong]:font-bold">
      {children}
    </div>
  </div>
)
