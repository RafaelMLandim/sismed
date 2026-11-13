"use client"

import { Button, Checkbox, Input, addToast } from "@heroui/react"
import { useState } from "react"
import { LuCheck, LuHeartPulse, LuTriangleAlert } from "react-icons/lu"

import { TODAY_ISO } from "../../_data/days"
import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import { toMin } from "../../_data/time"
import type { IVitalSign } from "../../_data/types"
import { CURRENT_USER } from "../gastos/meta"
import { MapModal } from "../mapa/MapModal"
import { VITAL_META, alertsOf, joinLabels, statusOf } from "./rules"
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

/** Faixa aceita em cada campo (valores fora disso são erro de digitação). */
const RANGES = {
  sys: [50, 260],
  dia: [30, 160],
  hr: [20, 220],
  rr: [4, 60],
  temp: [32, 43],
  spo2: [50, 100],
  pain: [0, 10],
} as const

type Field = keyof typeof RANGES

const LABELS: Record<Field, string> = {
  sys: "PA sistólica",
  dia: "PA diastólica",
  hr: "Frequência cardíaca",
  rr: "Frequência respiratória",
  temp: "Temperatura",
  spo2: "Saturação de O₂",
  pain: "Dor (0–10)",
}

const UNITS: Record<Field, string> = {
  sys: "mmHg",
  dia: "mmHg",
  hr: "bpm",
  rr: "irpm",
  temp: "°C",
  spo2: "%",
  pain: "/10",
}

const parse = (s: string) => Number(s.replace(",", "."))

/**
 * "Registrar sinais vitais": horário, os 6 sinais e observação. Se algum
 * valor sair do limite, pede para marcar se o médico foi comunicado.
 */
export const RegisterVitalsModal = ({
  patientId,
  onClose,
}: {
  patientId: string
  onClose: () => void
}) => {
  const addVital = useCC((s) => s.addVital)
  const [time, setTime] = useState(MOCK_NOW)
  const [values, setValues] = useState<Record<Field, string>>({
    sys: "",
    dia: "",
    hr: "",
    rr: "",
    temp: "",
    spo2: "",
    pain: "",
  })
  const [note, setNote] = useState("")
  const [notified, setNotified] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const errorOf = (f: Field) => {
    const raw = values[f].trim()
    if (!raw) return "Obrigatório"
    const n = parse(raw)
    const [min, max] = RANGES[f]
    if (Number.isNaN(n) || n < min || n > max) return `Entre ${min} e ${max}`
    return undefined
  }
  const fields = Object.keys(RANGES) as Field[]
  const timeError =
    toMin(time) > toMin(MOCK_NOW) ? "Não pode ser depois de agora" : undefined
  const invalid = fields.some((f) => errorOf(f)) || Boolean(timeError)

  // Prévia com os valores digitados para mostrar o alerta antes de salvar.
  const preview: IVitalSign | null = fields.every((f) => !errorOf(f))
    ? {
        id: "preview",
        patientId,
        date: TODAY_ISO,
        time,
        sys: parse(values.sys),
        dia: parse(values.dia),
        hr: parse(values.hr),
        rr: parse(values.rr),
        temp: parse(values.temp),
        spo2: parse(values.spo2),
        pain: parse(values.pain),
        by: CURRENT_USER,
      }
    : null
  const alerts = preview ? alertsOf(preview) : []

  const save = () => {
    setSubmitted(true)
    if (invalid || !preview) return
    addVital({
      ...preview,
      note: note.trim() || undefined,
      doctorNotifiedAt: alerts.length && notified ? MOCK_NOW : undefined,
    })
    addToast({
      title: `Sinais vitais registrados às ${time}`,
      description: alerts.length
        ? `${joinLabels(alerts)} fora do limite${notified ? " · médico comunicado" : " · comunique o médico"}`
        : "Todos os valores dentro do limite.",
      color: alerts.length ? "warning" : "success",
    })
    onClose()
  }

  const field = (f: Field) => {
    const err = submitted ? errorOf(f) : undefined
    const n = parse(values[f])
    const k = f === "sys" || f === "dia" ? "pa" : f
    const out = preview && !errorOf(f) && statusOf(preview, k).tone === "alert"
    return (
      <Input
        key={f}
        label={LABELS[f]}
        labelPlacement="outside"
        variant="bordered"
        inputMode="decimal"
        placeholder="—"
        value={values[f]}
        onValueChange={(v) => setValues((o) => ({ ...o, [f]: v }))}
        endContent={<span className="text-xs text-[#94A3B8]">{UNITS[f]}</span>}
        isInvalid={Boolean(err)}
        errorMessage={err}
        classNames={{
          input: cn(out && !Number.isNaN(n) && "font-semibold text-[#B91C1C]"),
        }}
      />
    )
  }

  return (
    <MapModal
      width={720}
      icon={<LuHeartPulse />}
      title="Registrar sinais vitais"
      description={`Aferição de hoje · registrado por ${CURRENT_USER}`}
      onClose={onClose}
      footer={
        <>
          <Button className={OUTLINE_BUTTON} onPress={onClose}>
            Cancelar
          </Button>
          <Button
            className={PRIMARY_BUTTON}
            startContent={<LuCheck />}
            onPress={save}
          >
            Salvar aferição
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-3 items-start gap-4">
        <Input
          type="time"
          label="Horário"
          labelPlacement="outside"
          variant="bordered"
          value={time}
          onValueChange={setTime}
          isInvalid={Boolean(timeError)}
          errorMessage={timeError}
        />
        {field("sys")}
        {field("dia")}
        {field("hr")}
        {field("rr")}
        {field("temp")}
        {field("spo2")}
        {field("pain")}
      </div>

      <Input
        label="Observação (opcional)"
        labelPlacement="outside"
        variant="bordered"
        placeholder="Ex.: Antes do transporte ao centro cirúrgico"
        value={note}
        onValueChange={setNote}
      />

      {alerts.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg bg-[#FFFBEB] px-4 py-3">
          <span className="flex items-center gap-2 text-[13px] font-semibold text-[#B45309]">
            <LuTriangleAlert className="h-4 w-4" />
            {joinLabels(alerts)} fora do limite
          </span>
          <Checkbox size="sm" isSelected={notified} onValueChange={setNotified}>
            <span className="text-[13px]">
              Médico comunicado agora ({MOCK_NOW})
            </span>
          </Checkbox>
        </div>
      )}

      <p className="text-xs text-[#94A3B8]">
        Limites: PA ≥ 140/90, temperatura ≥ {"37,8"} °C, SpO₂ &lt; 94%.{" "}
        {VITAL_META.pain.label}: 7 ou mais é dor intensa.
      </p>
    </MapModal>
  )
}
