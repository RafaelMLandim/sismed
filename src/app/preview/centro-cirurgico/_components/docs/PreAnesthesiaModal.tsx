"use client"

import { Input, Select, SelectItem, Textarea, addToast } from "@heroui/react"
import { useMemo, useState } from "react"
import { LuStethoscope } from "react-icons/lu"

import { TODAY_ISO } from "../../_data/days"
import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import type { ISurgery } from "../../_data/types"
import { DateField, MapModal } from "../mapa/MapModal"
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
  Pick,
  Pills,
  YesNo,
  firstKey,
} from "./fields"
import {
  ANESTHETISTS,
  ANTICOAG,
  ANTICOAG_SUSPENDED,
  CARE,
  CARE_GLP1,
  CERVICAL,
  COMORBIDITIES,
  MOUTH,
  NEGA,
  PLACES,
  PLANS,
  POSITIONS,
  PRE_ANESTHESIA_MODELS,
  ROMAN4,
  ROMAN5,
  TEETH,
  THYROMENTAL,
  VERDICTS,
  anesthetistLabel,
  blankPreAnesthesia,
  bmiOf,
  glp1Recent,
  preAnesthesiaMissing,
  samplePreAnesthesia,
  type IPreAnesthesia,
} from "./preAnesthesia"
import { cn } from "@/shared/utils/cn"

const STEPS: DocStep[] = [
  {
    title: "Identificação e histórico",
    sections: [
      "Marque as comorbidades",
      "Informe os medicamentos",
      "Responda se houve complicação",
      "Descreva a complicação",
      "Responda sobre história familiar",
      "Responda sobre o uso de agonista",
      "Informe a última dose",
      "Informe a data da suspensão",
    ],
    content: null,
  },
  {
    title: "Exame físico e via aérea",
    sections: [
      "Informe o peso",
      "Informe a altura",
      "Marque a classificação de Mallampati",
    ],
    content: null,
  },
  {
    title: "Exames",
    sections: [],
    content: null,
  },
  {
    title: "Conclusão e plano",
    sections: [
      "Marque a classificação ASA",
      "Escolha o plano anestésico",
      "Informe o jejum",
      "Marque o parecer",
      "Descreva o motivo",
      "Descreva as ressalvas",
      "Responda se o termo",
      "O termo de consentimento",
    ],
    content: null,
  },
]

/** PEP-D10 · Documento · Avaliação pré-anestésica (fiel ao desenho). */
export const PreAnesthesiaModal = ({
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
  const allVitals = useCC((s) => s.vitals)
  const lastVital = useMemo(
    () =>
      allVitals
        .filter((v) => v.patientId === surgery.patientId)
        .sort(byTime)
        .at(-1),
    [allVitals, surgery.patientId],
  )
  const doc = surgery.docs.pre_anestesica
  const readOnly = doc.status === "assinado"

  const [d, setD] = useState<IPreAnesthesia>(() => {
    const saved = surgery.docData?.pre_anestesica as IPreAnesthesia | undefined
    if (saved) return saved
    if (!patient) return {} as IPreAnesthesia
    return doc.status === "nao_iniciado"
      ? blankPreAnesthesia(surgery, patient, lastVital)
      : samplePreAnesthesia(surgery, patient, lastVital)
  })
  const [model, setModel] = useState<string>()
  const [applied, setApplied] = useState<string>()
  const [submitted, setSubmitted] = useState(false)

  const set = <K extends keyof IPreAnesthesia>(k: K, v: IPreAnesthesia[K]) =>
    setD((o) => ({ ...o, [k]: v }))

  const missing = patient ? preAnesthesiaMissing(d) : []
  const nav = useDocSteps(STEPS, missing)

  if (!patient) return null

  const bmi = bmiOf(d.weight, d.height)
  const fullStomach = d.glp1 && glp1Recent(d.glp1LastDose, surgery.date)
  const err = (cond: boolean) => submitted && cond

  /** "Nega" exclui as demais comorbidades, e vice-versa. */
  const setComorbidities = (v: string[]) => {
    const added = v.find((x) => !d.comorbidities.includes(x))
    set("comorbidities", added === NEGA ? [NEGA] : v.filter((x) => x !== NEGA))
  }

  const setGlp1 = (v: boolean) =>
    setD((o) => ({
      ...o,
      glp1: v,
      care:
        v && !o.care.includes(CARE_GLP1)
          ? [CARE_GLP1, ...o.care]
          : !v
            ? o.care.filter((c) => c !== CARE_GLP1)
            : o.care,
    }))

  const applyModel = () => {
    const m = PRE_ANESTHESIA_MODELS.find((x) => x.name === model)
    if (!m) return
    setD((o) => ({
      ...o,
      ...m.patch,
      care: [...new Set([...o.care, ...(m.patch.care ?? [])])],
    }))
    setApplied(
      `Modelo “${m.name}” aplicado (${Object.keys(m.patch).length} campos). Revise antes de assinar.`,
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
      "pre_anestesica",
      d,
      sign ? "assinado" : "em_preenchimento",
      d.signer,
    )
    addToast({
      title: sign
        ? "Avaliação pré-anestésica assinada"
        : "Rascunho salvo · Avaliação pré-anestésica",
      description: sign
        ? `${anesthetistLabel(d.signer)} · hoje, ${MOCK_NOW}`
        : "Continue quando quiser e assine depois.",
      color: "success",
    })
    onClose()
  }

  return (
    <MapModal
      width={960}
      icon={<LuStethoscope />}
      title="Avaliação pré-anestésica"
      description={<DocPatientLine patient={patient} surgery={surgery} />}
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
          models={PRE_ANESTHESIA_MODELS.map((m) => m.name)}
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
            <div className="grid grid-cols-3 items-start gap-3">
              <div className="flex gap-2">
                <DateField
                  label="Data da avaliação *"
                  value={d.date}
                  max={TODAY_ISO}
                  onChange={(v) => set("date", v)}
                />
                <Input
                  type="time"
                  aria-label="Hora da avaliação"
                  label=" "
                  labelPlacement="outside"
                  variant="bordered"
                  className="w-28"
                  value={d.time}
                  onValueChange={(v) => set("time", v)}
                />
              </div>
              <Pick
                label="Local"
                options={PLACES}
                value={d.place}
                onChange={(v) => set("place", v)}
                disabled={readOnly}
              />
              <Pick
                label="Anestesista"
                required
                options={ANESTHETISTS.map((a) => a.name)}
                value={d.anesthetist}
                onChange={(v) => set("anesthetist", v)}
                disabled={readOnly}
              />
            </div>

            <DocSection>Histórico</DocSection>
            <CheckGroup
              label="Comorbidades"
              required
              columns={4}
              options={COMORBIDITIES}
              value={d.comorbidities}
              onChange={setComorbidities}
              invalid={err(!d.comorbidities.length)}
            />
            <Input
              label="Medicamentos em uso *"
              labelPlacement="outside"
              variant="bordered"
              placeholder="Nome, dose e frequência · ou “Nega”"
              value={d.meds}
              onValueChange={(v) => set("meds", v)}
              isInvalid={err(!d.meds.trim())}
            />
            <YesNo
              label="Anestesias anteriores com complicação?"
              required
              value={d.prevComplications}
              onChange={(v) => set("prevComplications", v)}
              warnOn
              invalid={submitted}
            />
            {d.prevComplications && (
              <Input
                label="Qual complicação? *"
                labelPlacement="outside"
                variant="bordered"
                placeholder="Ex.: náuseas intensas, intubação difícil, reação alérgica"
                value={d.prevComplicationsText}
                onValueChange={(v) => set("prevComplicationsText", v)}
                isInvalid={err(!d.prevComplicationsText.trim())}
              />
            )}
            <YesNo
              label="História familiar de hipertermia maligna?"
              required
              value={d.malignantHyperthermia}
              onChange={(v) => set("malignantHyperthermia", v)}
              warnOn
              invalid={submitted}
            />
            <YesNo
              label="Uso de agonista de GLP-1 (Ozempic, Mounjaro)?"
              required
              value={d.glp1}
              onChange={setGlp1}
              warnOn
              invalid={submitted}
            />
            <div className="grid grid-cols-2 items-start gap-3">
              {d.glp1 ? (
                <DateField
                  label="Última dose *"
                  value={d.glp1LastDose}
                  max={TODAY_ISO}
                  onChange={(v) => set("glp1LastDose", v)}
                  hint={
                    <span
                      className={cn(
                        fullStomach && "font-semibold text-[#B45309]",
                        err(!d.glp1LastDose) && "text-[#EF4444]",
                      )}
                    >
                      {err(!d.glp1LastDose)
                        ? "Escolha a data da última dose."
                        : "Menos de 7 dias: considerar estômago cheio."}
                    </span>
                  }
                />
              ) : (
                <span />
              )}
              <div className="flex flex-col gap-3">
                <Pick
                  label="Anticoagulante ou antiagregante"
                  options={ANTICOAG}
                  value={d.anticoag}
                  onChange={(v) => set("anticoag", v)}
                  disabled={readOnly}
                />
                {d.anticoag === ANTICOAG_SUSPENDED && (
                  <DateField
                    label="Suspenso em *"
                    value={d.anticoagSuspendedOn}
                    max={TODAY_ISO}
                    onChange={(v) => set("anticoagSuspendedOn", v)}
                  />
                )}
              </div>
            </div>
          </>
        )}
        {nav.step === 1 && (
          <>
            <DocSection>Exame físico e via aérea</DocSection>
            <div className="grid grid-cols-6 items-start gap-3">
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
                required
                value={d.height}
                onChange={(v) => set("height", v)}
                invalid={err(!d.height.trim())}
              />
              <Measure label="IMC" value={bmi} readOnly muted />
              <Measure
                label="PA"
                unit="mmHg"
                value={d.pa}
                onChange={(v) => set("pa", v)}
              />
              <Measure
                label="FC"
                unit="bpm"
                value={d.hr}
                onChange={(v) => set("hr", v)}
              />
              <Measure
                label="SpO₂"
                unit="%"
                value={d.spo2}
                onChange={(v) => set("spo2", v)}
              />
            </div>
            <Pills
              label="Mallampati"
              required
              options={ROMAN4}
              value={d.mallampati}
              onChange={(v) => set("mallampati", v)}
              toneOf={(v) =>
                v === "III" || v === "IV" ? "warning" : "primary"
              }
              invalid={submitted}
            />
            <div className="grid grid-cols-4 gap-3">
              <Pick
                label="Abertura bucal"
                options={MOUTH}
                value={d.mouth}
                onChange={(v) => set("mouth", v)}
                disabled={readOnly}
              />
              <Pick
                label="Distância tireomentoniana"
                options={THYROMENTAL}
                value={d.thyromental}
                onChange={(v) => set("thyromental", v)}
                disabled={readOnly}
              />
              <Pick
                label="Mobilidade cervical"
                options={CERVICAL}
                value={d.cervical}
                onChange={(v) => set("cervical", v)}
                disabled={readOnly}
              />
              <Pick
                label="Dentição"
                options={TEETH}
                value={d.teeth}
                onChange={(v) => set("teeth", v)}
                disabled={readOnly}
              />
            </div>
            <Textarea
              label="Ausculta cardiopulmonar"
              labelPlacement="outside"
              variant="bordered"
              minRows={2}
              value={d.auscultation}
              onValueChange={(v) => set("auscultation", v)}
            />
          </>
        )}
        {nav.step === 2 && (
          <>
            <DocSection>Exames</DocSection>
            <div className="grid grid-cols-5 gap-3">
              <Measure
                label="Hemoglobina"
                unit="g/dL"
                value={d.hb}
                onChange={(v) => set("hb", v)}
              />
              <Measure
                label="Plaquetas"
                value={d.platelets}
                onChange={(v) => set("platelets", v)}
              />
              <Measure
                label="INR"
                value={d.inr}
                onChange={(v) => set("inr", v)}
              />
              <Measure
                label="Creatinina"
                unit="mg/dL"
                value={d.creatinine}
                onChange={(v) => set("creatinine", v)}
              />
              <Measure
                label="Glicemia"
                unit="mg/dL"
                value={d.glucose}
                onChange={(v) => set("glucose", v)}
              />
            </div>
            <Input
              label="ECG"
              labelPlacement="outside"
              variant="bordered"
              placeholder="Laudo e data"
              value={d.ecg}
              onValueChange={(v) => set("ecg", v)}
            />
          </>
        )}
        {nav.step === 3 && (
          <>
            <DocSection>Conclusão e plano</DocSection>
            <Pills
              label="Classificação ASA"
              required
              options={ROMAN5}
              value={d.asa}
              onChange={(v) => set("asa", v)}
              invalid={submitted}
            />
            <div className="grid grid-cols-2 gap-3">
              <Pick
                label="Plano anestésico"
                required
                options={PLANS}
                value={d.plan}
                onChange={(v) => set("plan", v)}
                disabled={readOnly}
              />
              <Pick
                label="Posição"
                options={POSITIONS}
                value={d.position}
                onChange={(v) => set("position", v)}
                disabled={readOnly}
              />
            </div>
            <CheckGroup
              label="Cuidados planejados"
              columns={3}
              options={CARE}
              value={d.care}
              onChange={(v) => set("care", v)}
            />
            <div className="grid grid-cols-2 items-start gap-3">
              <Input
                label="Jejum orientado *"
                labelPlacement="outside"
                variant="bordered"
                placeholder="Ex.: sólidos 8 h · líquidos claros 2 h"
                value={d.fasting}
                onValueChange={(v) => set("fasting", v)}
                isInvalid={err(!d.fasting.trim())}
              />
              <Input
                label="Suspender"
                labelPlacement="outside"
                variant="bordered"
                placeholder="Medicamentos a suspender antes da cirurgia"
                value={d.suspend}
                onValueChange={(v) => set("suspend", v)}
              />
            </div>
            <Pills
              label="Parecer"
              required
              options={VERDICTS}
              value={d.verdict}
              onChange={(v) => set("verdict", v)}
              toneOf={(v) =>
                v === "Inapto"
                  ? "danger"
                  : v === "Apto com ressalvas"
                    ? "warning"
                    : "primary"
              }
              invalid={submitted}
            />
            {d.verdict && d.verdict !== "Apto" && (
              <Textarea
                label={d.verdict === "Inapto" ? "Motivo *" : "Ressalvas *"}
                labelPlacement="outside"
                variant="bordered"
                minRows={2}
                value={d.reservations}
                onValueChange={(v) => set("reservations", v)}
                isInvalid={err(!d.reservations.trim())}
              />
            )}
            <YesNo
              label="Termo de consentimento anestésico assinado?"
              required
              value={d.consent}
              onChange={(v) => set("consent", v)}
              warnOn={false}
              invalid={submitted}
            />

            <DocSection>Assinatura</DocSection>
            <div className="w-96">
              <Select
                label="Anestesista (CRM-DF) *"
                labelPlacement="outside"
                variant="bordered"
                disallowEmptySelection
                selectedKeys={[d.signer]}
                onSelectionChange={(k) => set("signer", firstKey(k))}
                isDisabled={readOnly}
              >
                {ANESTHETISTS.map((a) => (
                  <SelectItem key={a.name}>
                    {anesthetistLabel(a.name)}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </>
        )}
      </fieldset>
    </MapModal>
  )
}
