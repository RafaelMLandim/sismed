"use client"

import { Input, Select, SelectItem, addToast } from "@heroui/react"
import { useMemo, useState } from "react"
import { LuClipboardCheck, LuClock3 } from "react-icons/lu"

import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import type { ISurgery } from "../../_data/types"
import { MapModal } from "../mapa/MapModal"
import { byTime } from "../sinais/rules"
import { StepsBar, StepsFooter, useDocSteps, type DocStep } from "./steps"
import {
  CheckGroup,
  DocBadge,
  DocPatientLine,
  DocSection,
  Measure,
  ModelsBar,
  PendingBox,
  Pills,
  YesNo,
  exclusive,
  firstKey,
} from "./fields"
import {
  COMMUNICATION,
  DIABETES,
  DISEASES,
  EXAMS,
  INFORMED_BY,
  NA,
  NO_EXAMS,
  NURSES,
  ORTHOSES,
  PATIENT_FIELDS,
  PRE_OP_MODELS,
  blankPreOp,
  filled,
  nurseLabel,
  preOpMissing,
  samplePreOp,
  type IPreOpAdmission,
} from "./preOpAdmission"
import { cn } from "@/shared/utils/cn"

const SIM_NEGA = [true, false] as const

/** Campo de hora com ícone de relógio. */
const TimeField = ({
  label,
  value,
  onChange,
  invalid,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  invalid?: boolean
}) => (
  <Input
    type="time"
    label={label}
    labelPlacement="outside"
    variant="bordered"
    value={value}
    onValueChange={onChange}
    isInvalid={invalid}
    startContent={<LuClock3 className="h-4 w-4 shrink-0 text-[#94A3B8]" />}
  />
)

const STEPS: DocStep[] = [
  {
    title: "Identificação e responsável",
    sections: ["Identificação", "Responsável"],
    content: null,
  },
  {
    title: "Comunicação e histórico",
    sections: [
      "Comunicação",
      "Órteses",
      "Adornos",
      "Medidas",
      "Doenças prévias",
      "Alergias",
    ],
    content: null,
  },
  {
    title: "Medicamentos e jejum",
    sections: ["Medicamentos", "Cirurgias anteriores", "Jejum"],
    content: null,
  },
  {
    title: "Sinais vitais e exames",
    sections: ["Sinais vitais", "Exames", "Assinatura"],
    content: null,
  },
]

/** PEP-D01 · Documento · Admissão pré-operatória (fiel ao desenho). */
export const PreOpAdmissionModal = ({
  surgery,
  onClose,
}: {
  surgery: ISurgery
  onClose: () => void
}) => {
  const saveDoc = useCC((s) => s.saveDoc)
  const patient = useCC((s) =>
    s.patients.find((p) => p.id === surgery.patientId),
  )
  const room = useCC((s) => s.rooms.find((r) => r.id === surgery.roomId))
  const allVitals = useCC((s) => s.vitals)
  const lastVital = useMemo(
    () =>
      allVitals
        .filter((v) => v.patientId === surgery.patientId)
        .sort(byTime)
        .at(-1),
    [allVitals, surgery.patientId],
  )
  const doc = surgery.docs.admissao_pre_op
  const readOnly = doc.status === "assinado"

  const [d, setD] = useState<IPreOpAdmission>(() => {
    const saved = surgery.docData?.admissao_pre_op as
      | IPreOpAdmission
      | undefined
    if (saved) return saved
    if (!patient) return {} as IPreOpAdmission
    return doc.status === "nao_iniciado"
      ? blankPreOp(surgery, patient, lastVital)
      : samplePreOp(surgery, patient, lastVital, readOnly)
  })
  const [model, setModel] = useState<string>()
  const [applied, setApplied] = useState<string>()
  const [submitted, setSubmitted] = useState(false)

  const set = <K extends keyof IPreOpAdmission>(k: K, v: IPreOpAdmission[K]) =>
    setD((o) => ({ ...o, [k]: v }))
  const missing = patient ? preOpMissing(d) : []
  const nav = useDocSteps(STEPS, missing)

  if (!patient) return null

  const err = (cond: boolean) => submitted && cond
  const diabetic = d.diseases.includes(DIABETES)

  const applyModel = () => {
    const m = PRE_OP_MODELS.find((x) => x.name === model)
    if (!m) return
    const keys = Object.keys(m.patch) as (keyof IPreOpAdmission)[]
    const kept = keys.filter((k) => PATIENT_FIELDS.includes(k) && filled(d[k]))
    const patch = Object.fromEntries(
      keys.filter((k) => !kept.includes(k)).map((k) => [k, m.patch[k]]),
    )
    setD((o) => ({ ...o, ...patch }))
    setApplied(
      `Modelo “${m.name}” aplicado (${keys.length - kept.length} campos).${kept.length ? ` ${kept.length} ${kept.length === 1 ? "campo com dados deste paciente foi mantido" : "campos com dados deste paciente foram mantidos"}.` : ""} Revise antes de assinar.`,
    )
  }

  const save = (sign: boolean) => {
    setSubmitted(true)
    if (sign && missing.length) {
      nav.goToFirstPending()
      return
    }
    saveDoc(
      surgery.id,
      "admissao_pre_op",
      d,
      sign ? "assinado" : "em_preenchimento",
      d.signer,
    )
    addToast({
      title: sign
        ? "Admissão pré-operatória assinada"
        : "Rascunho salvo · Admissão pré-operatória",
      description: sign
        ? `${nurseLabel(d.signer)} · hoje, ${MOCK_NOW}`
        : "Continue quando quiser e assine depois.",
      color: "success",
    })
    onClose()
  }

  return (
    <MapModal
      width={960}
      icon={<LuClipboardCheck />}
      title="Admissão pré-operatória"
      description={
        <DocPatientLine
          patient={patient}
          surgery={surgery}
          withRoom={room?.name ?? ""}
        />
      }
      badge={<DocBadge doc={doc} />}
      onClose={onClose}
      dismissable={false}
      footer={
        <StepsFooter
          readOnly={readOnly}
          isFirst={nav.isFirst}
          isLast={nav.isLast}
          onBack={nav.back}
          onNext={nav.next}
          onCancel={onClose}
          onSaveDraft={() => save(false)}
          onSign={() => save(true)}
        />
      }
    >
      {!readOnly && nav.isFirst && (
        <ModelsBar
          models={PRE_OP_MODELS.map((m) => m.name)}
          selected={model}
          onSelect={setModel}
          onApply={applyModel}
          applied={applied}
        />
      )}
      <StepsBar
        steps={STEPS}
        current={nav.step}
        onSelect={nav.setStep}
        pendingOf={nav.pendingOf}
        showPending={submitted}
      />
      {submitted && <PendingBox items={missing} />}

      <fieldset
        disabled={readOnly}
        className={cn("flex flex-col gap-4", readOnly && "pointer-events-none")}
      >
        {nav.isFirst && (
          <p className="text-xs text-[#64748B]">
            <span className="font-semibold text-[#EF4444]">*</span> Obrigatório
            para assinar. Campos condicionais passam a ser exigidos conforme as
            respostas.
          </p>
        )}
        {nav.step === 0 && (
          <>
            <DocSection>Identificação</DocSection>
            <div className="grid grid-cols-[2fr_1fr] gap-3">
              <Input
                label="Procedimento *"
                labelPlacement="outside"
                variant="bordered"
                value={d.procedure}
                onValueChange={(v) => set("procedure", v)}
                isInvalid={err(!d.procedure.trim())}
              />
              <Input
                label="Médico"
                labelPlacement="outside"
                variant="bordered"
                isReadOnly
                value={surgery.surgeon}
              />
            </div>

            <DocSection>Responsável pelas informações</DocSection>
            <div className="grid grid-cols-3 items-start gap-3">
              <Select
                label="Informações prestadas por *"
                labelPlacement="outside"
                variant="bordered"
                placeholder="Selecione"
                selectedKeys={d.informedBy ? [d.informedBy] : []}
                onSelectionChange={(k) => set("informedBy", firstKey(k))}
                isInvalid={err(!d.informedBy)}
                isDisabled={readOnly}
              >
                {INFORMED_BY.map((o) => (
                  <SelectItem key={o}>{o}</SelectItem>
                ))}
              </Select>
              <Input
                label="Em caso de necessidade, contatar: nome *"
                labelPlacement="outside"
                variant="bordered"
                placeholder="Nome (parentesco)"
                value={d.contactName}
                onValueChange={(v) => set("contactName", v)}
                isInvalid={err(!d.contactName.trim())}
              />
              <Input
                label="Telefone *"
                labelPlacement="outside"
                variant="bordered"
                placeholder="(61) 99999-9999"
                value={d.contactPhone}
                onValueChange={(v) => set("contactPhone", v)}
                isInvalid={err(!d.contactPhone.trim())}
              />
            </div>
          </>
        )}
        {nav.step === 1 && (
          <>
            <DocSection>Comunicação e órteses</DocSection>
            <div className="grid grid-cols-2 gap-3">
              <CheckGroup
                label="Comunicação"
                required
                columns={3}
                options={COMMUNICATION}
                value={d.communication}
                onChange={(v) =>
                  set("communication", exclusive(v, d.communication, NA))
                }
                invalid={err(!d.communication.length)}
              />
              <CheckGroup
                label="Órteses e próteses"
                required
                columns={3}
                options={ORTHOSES}
                value={d.orthoses}
                onChange={(v) => set("orthoses", exclusive(v, d.orthoses, NA))}
                invalid={err(!d.orthoses.length)}
              />
            </div>
            <YesNo
              label="Paciente orientado(a) à retirada de adornos?"
              required
              value={d.adornments}
              onChange={(v) => set("adornments", v)}
              warnOn={false}
              invalid={submitted}
            />

            <DocSection>Medidas, doenças prévias e alergias</DocSection>
            <div className="grid grid-cols-3 items-start gap-3">
              <Measure
                label="Peso"
                unit="kg"
                required
                value={d.weight}
                onChange={(v) => set("weight", v)}
                invalid={err(!d.weight.trim())}
              />
              <Measure
                label="Altura"
                unit="cm"
                value={d.height}
                onChange={(v) => set("height", v)}
              />
              <div className="flex flex-col gap-1">
                <Measure
                  label="Glicemia capilar"
                  unit="mg/dL"
                  required={diabetic}
                  value={d.glucose}
                  onChange={(v) => set("glucose", v)}
                  invalid={err(diabetic && !d.glucose.trim())}
                />
                {diabetic && (
                  <span className="text-[11px] text-[#94A3B8]">
                    Obrigatória: diabetes marcado
                  </span>
                )}
              </div>
            </div>
            <CheckGroup
              label="Doenças prévias"
              required
              columns={4}
              options={DISEASES}
              value={d.diseases}
              onChange={(v) => set("diseases", exclusive(v, d.diseases, NA))}
              invalid={err(!d.diseases.length)}
            />
            <Pills
              label="Alergias"
              required
              options={SIM_NEGA}
              value={d.allergies}
              onChange={(v) => set("allergies", v)}
              labelOf={(v) => (v ? "Sim" : "Nega")}
              toneOf={(v) => (v ? "warning" : "primary")}
              invalid={submitted}
            />
            {d.allergies && (
              <Input
                label="Quais? *"
                labelPlacement="outside"
                variant="bordered"
                value={d.allergiesText}
                onValueChange={(v) => set("allergiesText", v)}
                isInvalid={err(!d.allergiesText.trim())}
              />
            )}
          </>
        )}
        {nav.step === 2 && (
          <>
            <DocSection>Medicamentos</DocSection>
            <YesNo
              label="Uso de medicamentos"
              required
              value={d.usesMeds}
              onChange={(v) => set("usesMeds", v)}
              invalid={submitted}
            />
            {d.usesMeds && (
              <Input
                label="Quais? *"
                labelPlacement="outside"
                variant="bordered"
                placeholder="Medicamento, dose e horário"
                value={d.medsText}
                onValueChange={(v) => set("medsText", v)}
                isInvalid={err(!d.medsText.trim())}
              />
            )}
            <YesNo
              label="Faz uso de algum remédio para emagrecimento, como Mounjaro ou Ozempic?"
              required
              value={d.glp1}
              onChange={(v) => set("glp1", v)}
              warnOn
              invalid={submitted}
            />
            {d.glp1 && (
              <Input
                label="Quais? *"
                labelPlacement="outside"
                variant="bordered"
                placeholder="Nome, dose e data da última aplicação"
                value={d.glp1Text}
                onValueChange={(v) => set("glp1Text", v)}
                isInvalid={err(!d.glp1Text.trim())}
              />
            )}
            <YesNo
              label="Faz uso de algum anticoagulante?"
              required
              value={d.anticoag}
              onChange={(v) => set("anticoag", v)}
              warnOn
              invalid={submitted}
            />
            {d.anticoag && (
              <Input
                label="Qual? *"
                labelPlacement="outside"
                variant="bordered"
                placeholder="Nome, dose e quando foi suspenso"
                value={d.anticoagText}
                onValueChange={(v) => set("anticoagText", v)}
                isInvalid={err(!d.anticoagText.trim())}
              />
            )}

            <DocSection>Cirurgias anteriores e jejum</DocSection>
            <YesNo
              label="Cirurgias anteriores"
              required
              value={d.prevSurgery}
              onChange={(v) => set("prevSurgery", v)}
              invalid={submitted}
            />
            {d.prevSurgery && (
              <Input
                label="Quais? *"
                labelPlacement="outside"
                variant="bordered"
                placeholder="Cirurgia (ano)"
                value={d.prevSurgeryText}
                onValueChange={(v) => set("prevSurgeryText", v)}
                isInvalid={err(!d.prevSurgeryText.trim())}
              />
            )}
            <div className="grid grid-cols-4 gap-3">
              <Input
                label="Sólidos"
                labelPlacement="outside"
                variant="bordered"
                placeholder="Última refeição"
                value={d.solids}
                onValueChange={(v) => set("solids", v)}
              />
              <TimeField
                label="Hora *"
                value={d.solidsTime}
                onChange={(v) => set("solidsTime", v)}
                invalid={err(!d.solidsTime)}
              />
              <Input
                label="Líquidos"
                labelPlacement="outside"
                variant="bordered"
                placeholder="Último líquido"
                value={d.liquids}
                onValueChange={(v) => set("liquids", v)}
              />
              <TimeField
                label="Hora *"
                value={d.liquidsTime}
                onChange={(v) => set("liquidsTime", v)}
                invalid={err(!d.liquidsTime)}
              />
            </div>
          </>
        )}
        {nav.step === 3 && (
          <>
            <DocSection>Sinais vitais</DocSection>
            <div className="grid grid-cols-4 gap-3">
              <Measure
                label="PA sistólica"
                unit="mmHg"
                required
                value={d.sys}
                onChange={(v) => set("sys", v)}
                invalid={err(!d.sys.trim())}
              />
              <Measure
                label="PA diastólica"
                unit="mmHg"
                required
                value={d.dia}
                onChange={(v) => set("dia", v)}
                invalid={err(!d.dia.trim())}
              />
              <Measure
                label="Temperatura"
                unit="°C"
                value={d.temp}
                onChange={(v) => set("temp", v)}
              />
              <Measure
                label="FC"
                unit="bpm"
                required
                value={d.hr}
                onChange={(v) => set("hr", v)}
                invalid={err(!d.hr.trim())}
              />
            </div>
            <div className="grid grid-cols-[1fr_1fr_2fr] gap-3">
              <Measure
                label="SpO₂"
                unit="%"
                required
                value={d.spo2}
                onChange={(v) => set("spo2", v)}
                invalid={err(!d.spo2.trim())}
              />
              <Measure
                label="FR"
                unit="irpm"
                value={d.rr}
                onChange={(v) => set("rr", v)}
              />
              <Input
                label="Observações"
                labelPlacement="outside"
                variant="bordered"
                placeholder="—"
                value={d.vitalsNote}
                onValueChange={(v) => set("vitalsNote", v)}
              />
            </div>

            <DocSection>Exames com o paciente na admissão</DocSection>
            <CheckGroup
              label="Exames"
              required
              columns={4}
              options={EXAMS}
              value={d.exams}
              onChange={(v) => set("exams", exclusive(v, d.exams, NO_EXAMS))}
              invalid={err(!d.exams.length)}
            />

            <DocSection>Assinatura</DocSection>
            <div className="w-96">
              <Select
                label="Enfermagem (COREN-DF) *"
                labelPlacement="outside"
                variant="bordered"
                placeholder="Nome e COREN"
                selectedKeys={d.signer ? [d.signer] : []}
                onSelectionChange={(k) => set("signer", firstKey(k))}
                isInvalid={err(!d.signer)}
                isDisabled={readOnly}
              >
                {NURSES.map((n) => (
                  <SelectItem key={n.name}>{nurseLabel(n.name)}</SelectItem>
                ))}
              </Select>
            </div>
          </>
        )}
      </fieldset>
    </MapModal>
  )
}
