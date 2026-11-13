"use client"

import { Input, Select, SelectItem, Textarea } from "@heroui/react"
import { useState } from "react"
import { LuCalendar } from "react-icons/lu"

import type { IPatient } from "../../_data/types"
import { Choice, TextHeader } from "./admissionFields"
import type { DocStep } from "./steps"
import {
  CheckGroup,
  DocSection,
  ModelsBar,
  PendingBox,
  Pills,
  YesNo,
  firstKey,
} from "./fields"
import {
  CONDUCT,
  CONDUCT_ELECTIVE,
  CONDUCT_URGENT,
  DOCTORS,
  EXAM,
  MEDICAL_MODELS,
  MEDICAL_PATIENT_FIELDS,
  TREATMENTS,
  allergyConflict,
  applyModel,
  appliedMessage,
  gendered,
  medicalMissing,
  medicalText,
  personLabel,
  type IMedicalAdmission,
} from "./hospitalAdmission"
import { cn } from "@/shared/utils/cn"

const SIM_NEGA = [true, false] as const

/** Etapas da parte médica (`sections` = prefixos de `medicalMissing`). */
export const MEDICAL_STEPS: DocStep[] = [
  {
    title: "Diagnóstico e antecedentes",
    sections: ["Diagnóstico e motivo", "Antecedentes"],
    content: null,
  },
  { title: "Exame físico", sections: ["Exame físico"], content: null },
  {
    title: "Hipótese e conduta",
    sections: ["Hipótese diagnóstica", "Conduta"],
    content: null,
  },
  {
    title: "Texto e assinatura",
    sections: ["Texto da admissão", "Assinatura"],
    content: null,
  },
]

/** PEP-D06 · Admissão da internação · parte médica. */
export const MedicalAdmissionForm = ({
  d,
  setD,
  patient,
  readOnly,
  submitted,
  step,
}: {
  /** Etapa atual (índice em `MEDICAL_STEPS`). */
  step: number
  d: IMedicalAdmission
  setD: (fn: (o: IMedicalAdmission) => IMedicalAdmission) => void
  patient: IPatient
  readOnly: boolean
  submitted: boolean
}) => {
  const [model, setModel] = useState<string>()
  const [applied, setApplied] = useState<string>()
  const set = <K extends keyof IMedicalAdmission>(
    k: K,
    v: IMedicalAdmission[K],
  ) => setD((o) => ({ ...o, [k]: v }))
  const err = (cond: boolean) => submitted && cond
  const g = (t: string) => gendered(t, patient)
  const conflict = allergyConflict(d, patient)
  const bothSurgeries =
    d.conduct.includes(CONDUCT_ELECTIVE) && d.conduct.includes(CONDUCT_URGENT)

  const onApply = () => {
    const m = MEDICAL_MODELS.find((x) => x.name === model)
    if (!m) return
    const r = applyModel(d, m.patch, MEDICAL_PATIENT_FIELDS)
    setD(() => r.next)
    setApplied(appliedMessage(m.name, r.applied, r.kept))
  }

  return (
    <>
      {!readOnly && step === 0 && (
        <ModelsBar
          models={MEDICAL_MODELS.map((m) => m.name)}
          selected={model}
          onSelect={setModel}
          onApply={onApply}
          applied={applied}
        />
      )}
      {submitted && <PendingBox items={medicalMissing(d, patient)} />}

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

        {step === 0 && (
          <>
            <DocSection>Diagnóstico e motivo da admissão</DocSection>
            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[1fr_2fr_1fr]">
              <Input
                type="datetime-local"
                label="Data e hora *"
                labelPlacement="outside"
                variant="bordered"
                value={d.dateTime}
                onValueChange={(v) => set("dateTime", v)}
                isInvalid={err(!d.dateTime)}
                startContent={
                  <LuCalendar className="h-4 w-4 shrink-0 text-[#94A3B8]" />
                }
              />
              <Input
                label="Diagnóstico *"
                labelPlacement="outside"
                variant="bordered"
                placeholder=" "
                value={d.diagnosis}
                onValueChange={(v) => set("diagnosis", v)}
                isInvalid={err(!d.diagnosis.trim())}
              />
              <Choice
                label="Tratamento cirúrgico"
                required
                options={TREATMENTS}
                value={d.treatment}
                onChange={(v) => set("treatment", v)}
                invalid={err(!d.treatment)}
                disabled={readOnly}
              />
            </div>

            <DocSection>Antecedentes</DocSection>
            <Input
              label="Antecedentes"
              labelPlacement="outside"
              variant="bordered"
              placeholder="Comorbidades e medicamentos de uso contínuo"
              value={d.history}
              onValueChange={(v) => set("history", v)}
            />
            <YesNo
              label="Cirurgias prévias"
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
            <div
              className={cn(
                "-mx-2 rounded-md px-2 pt-2.5",
                conflict && "bg-[#FEF2F2]",
              )}
            >
              <Pills
                label="Alergias a medicamentos"
                required
                options={SIM_NEGA}
                value={d.drugAllergy}
                onChange={(v) => set("drugAllergy", v)}
                labelOf={(v) => (v ? "Sim" : "Nega")}
                toneOf={(v) => (v ? "warning" : "primary")}
                invalid={submitted}
              />
              {conflict && (
                <p className="pb-2 text-xs text-[#B91C1C]">
                  O cadastro do paciente registra:{" "}
                  {patient.allergies.join(", ")}.
                </p>
              )}
            </div>
            {d.drugAllergy && (
              <Input
                label="Quais? *"
                labelPlacement="outside"
                variant="bordered"
                value={d.drugAllergyText}
                onValueChange={(v) => set("drugAllergyText", v)}
                isInvalid={err(!d.drugAllergyText.trim())}
              />
            )}
          </>
        )}
        {step === 1 && (
          <>
            <DocSection>Exame físico</DocSection>
            <CheckGroup
              label="Exame físico"
              required
              columns={4}
              options={EXAM.map(g)}
              value={d.exam.map(g)}
              onChange={(v) =>
                set(
                  "exam",
                  EXAM.filter((o) => v.includes(g(o))),
                )
              }
              invalid={err(!d.exam.length)}
            />
            <Textarea
              label="Alterações ao exame físico"
              labelPlacement="outside"
              variant="bordered"
              minRows={2}
              placeholder=" "
              value={d.examNotes}
              onValueChange={(v) => set("examNotes", v)}
              description="Descreva somente o que estiver diferente do padrão marcado acima."
            />
          </>
        )}
        {step === 2 && (
          <>
            <DocSection>Hipótese diagnóstica e conduta</DocSection>
            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[4fr_1fr]">
              <Input
                label="Hipótese diagnóstica *"
                labelPlacement="outside"
                variant="bordered"
                placeholder=" "
                value={d.hypothesis}
                onValueChange={(v) => set("hypothesis", v)}
                isInvalid={err(!d.hypothesis.trim())}
              />
              <Input
                label="CID"
                labelPlacement="outside"
                variant="bordered"
                placeholder=" "
                value={d.cid}
                onValueChange={(v) => set("cid", v)}
              />
            </div>
            <div className={cn(bothSurgeries && "rounded-lg bg-[#FEF2F2]")}>
              <CheckGroup
                label="Conduta"
                required
                options={CONDUCT.map(g)}
                value={d.conduct.map(g)}
                onChange={(v) =>
                  set(
                    "conduct",
                    CONDUCT.filter((o) => v.includes(g(o))),
                  )
                }
                invalid={err(!d.conduct.length) || bothSurgeries}
              />
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <DocSection>Texto da admissão</DocSection>
            <TextHeader
              label="Admissão médica"
              readOnly={readOnly}
              onGenerate={() => set("text", medicalText(d, patient))}
            />
            <Textarea
              aria-label="Admissão médica"
              variant="bordered"
              minRows={10}
              classNames={{ input: "font-mono text-[12.5px]" }}
              value={d.text}
              onValueChange={(v) => set("text", v)}
              description="Revise e complemente o texto antes de assinar."
              isInvalid={err(!d.text.trim())}
            />

            <DocSection>Assinatura</DocSection>
            <div className="w-full sm:w-96">
              <Select
                label="Médico (CRM-DF) *"
                labelPlacement="outside"
                variant="bordered"
                placeholder="Nome e CRM"
                selectedKeys={d.doctor ? [d.doctor] : []}
                onSelectionChange={(k) => set("doctor", firstKey(k))}
                isInvalid={err(!d.doctor)}
                isDisabled={readOnly}
              >
                {DOCTORS.map((p) => (
                  <SelectItem key={p.name}>
                    {personLabel(DOCTORS, p.name)}
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
