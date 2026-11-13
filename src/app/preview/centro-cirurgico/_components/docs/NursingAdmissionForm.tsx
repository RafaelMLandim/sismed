"use client"

import { Input, Select, SelectItem, Textarea } from "@heroui/react"
import { useState } from "react"

import type { IPatient } from "../../_data/types"
import { Choice, RowTable, TextHeader, TimeInput } from "./admissionFields"
import type { DocStep } from "./steps"
import {
  CheckGroup,
  DocSection,
  InfoBox,
  ModelsBar,
  PendingBox,
  exclusive,
  firstKey,
} from "./fields"
import {
  ACCESSES,
  ACCESS_CONDITIONS,
  ALDRETE,
  ALLERGY_OPTIONS,
  ANESTHESIAS,
  BOWEL,
  BREATHING,
  BREATHING_PATTERNS,
  CLINICAL,
  CONSCIOUSNESS,
  DEVICES,
  EVA,
  FALL_RISKS,
  GENERAL_STATES,
  NO_DEVICE,
  NO_PAIN,
  NURSES,
  NURSING_CONDUCTS,
  NURSING_MODELS,
  NURSING_PATIENT_FIELDS,
  ORIGINS,
  SYMPTOMS,
  TECHS,
  TRANSPORTS,
  URINE_ASPECTS,
  URINE_COLORS,
  VITALS_STATES,
  applyModel,
  appliedMessage,
  blankUrine,
  blankVital,
  nursingAllergyConflict,
  nursingMissing,
  nursingText,
  pamOf,
  personLabel,
  type INursingAdmission,
  type IUrineRow,
  type IVitalRow,
} from "./hospitalAdmission"
import { cn } from "@/shared/utils/cn"

/** Etapas da parte de enfermagem (`sections` = prefixos de `nursingMissing`). */
export const NURSING_STEPS: DocStep[] = [
  { title: "Situação", sections: ["S · Situação"], content: null },
  { title: "Background", sections: ["B · Background"], content: null },
  { title: "Avaliação e conduta", sections: ["A · Avaliação"], content: null },
  {
    title: "Evolução e débito",
    sections: ["Evolução de enfermagem", "Débito urinário"],
    content: null,
  },
  {
    title: "Sinais vitais e assinaturas",
    sections: ["Sinais vitais", "Assinaturas"],
    content: null,
  },
]

const STATE_DESC: Record<string, string> = {
  BEG: "Bom estado geral",
  REG: "Regular estado geral",
  MEG: "Mau estado geral",
}
const RISK_DESC: Record<string, string> = {
  Baixo: "Morse 0 a 24",
  Moderado: "Morse 25 a 44",
  Alto: "Morse 45 ou mais",
}

const Cell = ({
  label,
  value,
  onChange,
  muted,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  muted?: boolean
}) => (
  <Input
    aria-label={label}
    size="sm"
    variant="bordered"
    value={value}
    onValueChange={onChange}
    isReadOnly={muted}
    classNames={muted ? { inputWrapper: "bg-[#F8FAFC]" } : undefined}
  />
)

/** PEP-D07 · Admissão na unidade de internação · parte da enfermagem. */
export const NursingAdmissionForm = ({
  d,
  setD,
  patient,
  readOnly,
  submitted,
  srpa,
  step,
}: {
  /** Etapa atual (índice em `NURSING_STEPS`). */
  step: number
  d: INursingAdmission
  setD: (fn: (o: INursingAdmission) => INursingAdmission) => void
  patient: IPatient
  readOnly: boolean
  submitted: boolean
  /** Alta da SRPA assinada: horário e campos pré-preenchidos. */
  srpa?: { at?: string; fields: string[] }
}) => {
  const [model, setModel] = useState<string>()
  const [applied, setApplied] = useState<string>()
  const set = <K extends keyof INursingAdmission>(
    k: K,
    v: INursingAdmission[K],
  ) => setD((o) => ({ ...o, [k]: v }))
  const err = (cond: boolean) => submitted && cond
  const conflict = nursingAllergyConflict(d, patient)
  const anesthesias = ANESTHESIAS.includes(d.anesthesia)
    ? ANESTHESIAS
    : [...ANESTHESIAS, d.anesthesia].filter(Boolean)

  const setUrine = (i: number, patch: Partial<IUrineRow>) =>
    setD((o) => ({
      ...o,
      urine: o.urine.map((r, j) => (j === i ? { ...r, ...patch } : r)),
    }))
  const setVital = (i: number, patch: Partial<IVitalRow>) =>
    setD((o) => ({
      ...o,
      vitals: o.vitals.map((r, j) => (j === i ? { ...r, ...patch } : r)),
    }))

  const onApply = () => {
    const m = NURSING_MODELS.find((x) => x.name === model)
    if (!m) return
    const r = applyModel(d, m.patch, NURSING_PATIENT_FIELDS)
    setD(() => r.next)
    setApplied(appliedMessage(m.name, r.applied, r.kept))
  }

  const pick = (
    k: keyof INursingAdmission,
    label: string,
    options: string[],
    descriptions?: Record<string, string>,
  ) => (
    <Choice
      label={label}
      required
      options={options}
      value={d[k] as string}
      onChange={(v) => set(k, v as never)}
      invalid={err(!d[k])}
      disabled={readOnly}
      descriptions={descriptions}
    />
  )

  return (
    <>
      {!readOnly && step === 0 && (
        <ModelsBar
          models={NURSING_MODELS.map((m) => m.name)}
          selected={model}
          onSelect={setModel}
          onApply={onApply}
          applied={applied}
        />
      )}
      {submitted && <PendingBox items={nursingMissing(d, patient)} />}

      <fieldset
        disabled={readOnly}
        className={cn("flex flex-col gap-4", readOnly && "pointer-events-none")}
      >
        {step === 0 && (
          <p className="text-xs text-[#64748B]">
            <span className="font-semibold text-[#EF4444]">*</span> Obrigatório
            para assinar. Campos condicionais passam a ser exigidos conforme as
            respostas.
          </p>
        )}
        {srpa && !readOnly && step === 0 && (
          <InfoBox
            title={`Dados trazidos da alta da SRPA assinada${srpa.at ? ` às ${srpa.at}` : ""}`}
          >
            •{" "}
            {srpa.fields.length
              ? `${srpa.fields.join(", ").replace(/^./, (c) => c.toUpperCase())} ${srpa.fields.length === 1 ? "foi pré-preenchido" : "foram pré-preenchidos"}.`
              : "Procedência e anestesia foram pré-preenchidas."}{" "}
            Confira antes de assinar.
          </InfoBox>
        )}

        {step === 0 && (
          <>
            <DocSection>S · Situação</DocSection>
            <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-4">
              <TimeInput
                label="Horário de chegada à unidade *"
                value={d.arrivalTime}
                onChange={(v) => set("arrivalTime", v)}
                invalid={err(!d.arrivalTime)}
              />
              {pick("origin", "Procedência", ORIGINS)}
              {pick("transport", "Transporte", TRANSPORTS)}
              {pick("generalState", "Estado geral", GENERAL_STATES, STATE_DESC)}
            </div>
            <CheckGroup
              label="Nível de consciência"
              required
              columns={4}
              options={CONSCIOUSNESS}
              value={d.consciousness}
              onChange={(v) => set("consciousness", v)}
              invalid={err(!d.consciousness.length)}
            />
            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-3">
              {pick("breathing", "Respiração", BREATHING)}
              {pick(
                "breathingPattern",
                "Padrão respiratório",
                BREATHING_PATTERNS,
              )}
              {pick("vitalsState", "Sinais vitais", VITALS_STATES, {
                Instáveis: "Médico comunicado",
              })}
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <DocSection>B · Background</DocSection>
            <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-4">
              <div
                className={cn(
                  "flex flex-col gap-1",
                  conflict && "rounded-md bg-[#FEF2F2]",
                )}
              >
                {pick("allergies", "Alergias", ALLERGY_OPTIONS)}
                {conflict && (
                  <span className="px-1 pb-1 text-[11px] text-[#B91C1C]">
                    Cadastro registra: {patient.allergies.join(", ")}
                  </span>
                )}
              </div>
              <Choice
                label="Anestesia"
                required
                options={anesthesias}
                value={d.anesthesia}
                onChange={(v) => set("anesthesia", v)}
                invalid={err(!d.anesthesia)}
                disabled={readOnly}
              />
              {pick("venousAccess", "Acesso venoso", ACCESSES)}
              {pick("accessCondition", "Condição do acesso", ACCESS_CONDITIONS)}
            </div>
            {d.allergies === "Sim" && (
              <Input
                label="Quais? *"
                labelPlacement="outside"
                variant="bordered"
                value={d.allergiesText}
                onValueChange={(v) => set("allergiesText", v)}
                isInvalid={err(!d.allergiesText.trim())}
              />
            )}
            <CheckGroup
              label="Dispositivos"
              columns={4}
              options={DEVICES}
              value={d.devices}
              onChange={(v) =>
                set("devices", exclusive(v, d.devices, NO_DEVICE))
              }
            />
          </>
        )}
        {step === 2 && (
          <>
            <DocSection>A · Avaliação</DocSection>
            <CheckGroup
              label="Condição clínica"
              columns={3}
              options={CLINICAL}
              value={d.clinical}
              onChange={(v) => set("clinical", v)}
            />
            <CheckGroup
              label="Sintomas"
              required
              columns={3}
              options={SYMPTOMS}
              value={d.symptoms}
              onChange={(v) => set("symptoms", painExclusive(v, d.symptoms))}
              invalid={err(!d.symptoms.length)}
            />
            <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-4">
              {pick("bowel", "Eliminação intestinal", BOWEL)}
              {pick("aldrete", "Aldrete e Kroulik (de 10)", ALDRETE, {
                "6 ou menos": "Não libera da SRPA",
              })}
              {pick("eva", "EVA (de 10)", EVA, {
                "0": "Sem dor",
                "10": "Pior dor possível",
              })}
              {pick("fallRisk", "Risco de queda", FALL_RISKS, RISK_DESC)}
            </div>

            <DocSection>R · Recomendação e conduta</DocSection>
            <CheckGroup
              label="Condutas"
              options={NURSING_CONDUCTS}
              value={d.conducts}
              onChange={(v) => set("conducts", v)}
            />
          </>
        )}
        {step === 3 && (
          <>
            <DocSection>
              Evolução de enfermagem · admissão na internação
            </DocSection>
            <TextHeader
              label="Texto da evolução"
              readOnly={readOnly}
              onGenerate={() => set("text", nursingText(d, patient))}
            />
            <Textarea
              aria-label="Texto da evolução"
              variant="bordered"
              minRows={6}
              value={d.text}
              onValueChange={(v) => set("text", v)}
              description="Revise e complemente o texto antes de assinar."
              isInvalid={err(!d.text.trim())}
            />

            <DocSection>Débito urinário</DocSection>
            <RowTable
              label="Débito urinário"
              columns={["Horário", "Desprezado (mL)", "Cor", "Aspecto"]}
              template="1fr 2fr 2fr 2fr"
              readOnly={readOnly}
              onAdd={() => set("urine", [...d.urine, blankUrine()])}
              onRemove={(i) =>
                set(
                  "urine",
                  d.urine.filter((_, j) => j !== i),
                )
              }
              rows={d.urine.map((r, i) => [
                <TimeInput
                  key="t"
                  size="sm"
                  label="Horário"
                  value={r.time}
                  onChange={(v) => setUrine(i, { time: v })}
                  invalid={err(!!r.volume.trim() && !r.time)}
                />,
                <Cell
                  key="v"
                  label="Desprezado (mL)"
                  value={r.volume}
                  onChange={(v) => setUrine(i, { volume: v })}
                />,
                <Choice
                  key="c"
                  size="sm"
                  label="Cor"
                  options={URINE_COLORS}
                  value={r.color}
                  onChange={(v) => setUrine(i, { color: v })}
                  disabled={readOnly}
                />,
                <Choice
                  key="a"
                  size="sm"
                  label="Aspecto"
                  options={URINE_ASPECTS}
                  value={r.aspect}
                  onChange={(v) => setUrine(i, { aspect: v })}
                  disabled={readOnly}
                />,
              ])}
            />
          </>
        )}
        {step === 4 && (
          <>
            <DocSection>Sinais vitais e monitorização geral</DocSection>
            <RowTable
              label="Sinais vitais"
              required
              columns={[
                "Horário",
                "PAS",
                "PAD",
                "PAM",
                "FC",
                "FR",
                "Temp.",
                "SpO₂",
                "Suporte",
              ]}
              template="1.1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1.6fr"
              readOnly={readOnly}
              onAdd={() => set("vitals", [...d.vitals, blankVital()])}
              onRemove={(i) =>
                set(
                  "vitals",
                  d.vitals.filter((_, j) => j !== i),
                )
              }
              rows={d.vitals.map((r, i) => [
                <TimeInput
                  key="t"
                  size="sm"
                  label="Horário"
                  value={r.time}
                  onChange={(v) => setVital(i, { time: v })}
                />,
                <Cell
                  key="s"
                  label="PAS"
                  value={r.sys}
                  onChange={(v) => setVital(i, { sys: v })}
                />,
                <Cell
                  key="d"
                  label="PAD"
                  value={r.dia}
                  onChange={(v) => setVital(i, { dia: v })}
                />,
                <Cell key="m" label="PAM" value={pamOf(r)} muted />,
                <Cell
                  key="h"
                  label="FC"
                  value={r.hr}
                  onChange={(v) => setVital(i, { hr: v })}
                />,
                <Cell
                  key="r"
                  label="FR"
                  value={r.rr}
                  onChange={(v) => setVital(i, { rr: v })}
                />,
                <Cell
                  key="te"
                  label="Temperatura"
                  value={r.temp}
                  onChange={(v) => setVital(i, { temp: v })}
                />,
                <Cell
                  key="o"
                  label="SpO₂"
                  value={r.spo2}
                  onChange={(v) => setVital(i, { spo2: v })}
                />,
                <Choice
                  key="su"
                  size="sm"
                  label="Suporte"
                  options={BREATHING}
                  value={r.support}
                  onChange={(v) => setVital(i, { support: v })}
                  disabled={readOnly}
                />,
              ])}
            />

            <DocSection>Assinaturas</DocSection>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                label="Técnico de enfermagem"
                labelPlacement="outside"
                variant="bordered"
                placeholder="Nome e COREN"
                selectedKeys={d.tech ? [d.tech] : []}
                onSelectionChange={(k) => set("tech", firstKey(k))}
                isDisabled={readOnly}
              >
                {TECHS.map((p) => (
                  <SelectItem key={p.name}>
                    {personLabel(TECHS, p.name)}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Enfermeiro(a) *"
                labelPlacement="outside"
                variant="bordered"
                placeholder="Nome e COREN"
                selectedKeys={d.nurse ? [d.nurse] : []}
                onSelectionChange={(k) => set("nurse", firstKey(k))}
                isInvalid={err(!d.nurse)}
                isDisabled={readOnly}
              >
                {NURSES.map((p) => (
                  <SelectItem key={p.name}>
                    {personLabel(NURSES, p.name)}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </>
        )}
      </fieldset>
    </>
  )
}

/** "Sem dor" e "Dor" se excluem; os demais sintomas convivem. */
const painExclusive = (next: string[], prev: string[]) => {
  const added = next.find((x) => !prev.includes(x))
  if (added === NO_PAIN) return next.filter((x) => x !== "Dor")
  if (added === "Dor") return next.filter((x) => x !== NO_PAIN)
  return next
}
