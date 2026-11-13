"use client"

import {
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  addToast,
} from "@heroui/react"
import { useState } from "react"
import { LuHeartHandshake, LuSparkles } from "react-icons/lu"

import { TODAY_ISO, isoToBR } from "../../_data/days"
import {
  ACTIVITIES,
  CATHETER_CARE,
  DIET,
  EFFORT_ACTIVITY,
  EMERGENCY_DEFAULT,
  EXPECTED,
  GUIDE_MODELS,
  WARNINGS,
} from "../../_data/discharge"
import { PROFESSIONALS } from "../../_data/evolutions"
import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import type {
  IDischarge,
  IDischargeGuide,
  IHospitalization,
  IPatient,
  ISurgery,
} from "../../_data/types"
import { MapModal } from "../mapa/MapModal"
import { Chip } from "../ui"
import { guideFromPrescription, guideText, returnLabel } from "./drafts"
import {
  CheckGroup,
  DocSection,
  FieldLabel,
  ModelsBar,
  PendingBox,
  YesNo,
  firstKey,
} from "../docs/fields"
import { StepsBar, StepsFooter, useDocSteps, type DocStep } from "../docs/steps"

const DOCTORS = PROFESSIONALS["Médica"]
const doctorLabel = (name: string) =>
  `${name} · ${DOCTORS.find((d) => d.name === name)?.council ?? ""}`

/** Rascunho vazio quando não veio da prescrição de alta. */
const blankGuide = (
  surgery: ISurgery,
  discharge?: IDischarge,
): IDischargeGuide =>
  discharge?.prescription
    ? guideFromPrescription(discharge.prescription, surgery)
    : {
        status: "nao_iniciado",
        date: TODAY_ISO,
        time: MOCK_NOW,
        procedure: surgery.procedure,
        diet: [],
        activities: [],
        catheter: false,
        catheterCare: [],
        catheterRemoval: "",
        expected: [],
        meds: "",
        warnings: [],
        emergency: EMERGENCY_DEFAULT,
        returnText: returnLabel(discharge?.prescription),
        bring: "",
        text: "",
        doctor: surgery.surgeon,
      }

/** PEP-D08 · Documento · Orientações ao paciente. */
export const GuideModal = ({
  hosp,
  surgery,
  patient,
  discharge,
  onClose,
}: {
  hosp: IHospitalization
  surgery: ISurgery
  patient: IPatient
  discharge?: IDischarge
  onClose: () => void
}) => {
  const updateDischarge = useCC((s) => s.updateDischarge)
  const readOnly = discharge?.guide?.status === "assinado"
  const [g, setG] = useState<IDischargeGuide>(
    discharge?.guide ?? blankGuide(surgery, discharge),
  )
  const [model, setModel] = useState(g.model)
  const [applied, setApplied] = useState<string>()
  const [submitted, setSubmitted] = useState(false)

  const set = <K extends keyof IDischargeGuide>(k: K, v: IDischargeGuide[K]) =>
    setG((o) => ({ ...o, [k]: v }))

  const needsRest = g.activities.includes(EFFORT_ACTIVITY)
  /** Pendências com a etapa a que pertencem (a caixa mostra só o texto). */
  const pending = (
    [
      [
        "Identificação",
        !g.procedure.trim() && "Informe o procedimento realizado",
      ],
      [
        "Atividades",
        needsRest && !g.restDays && "Informe por quantos dias evitar esforço",
      ],
      [
        "Sonda",
        g.catheter &&
          !g.catheterRemoval.trim() &&
          "Informe quando a sonda será retirada",
      ],
      ["Alerta", !g.warnings.length && "Marque ao menos um sinal de alerta"],
      [
        "Alerta",
        !g.emergency.trim() && "Informe onde procurar em caso de urgência",
      ],
      ["Retorno", !g.returnText.trim() && "Informe o retorno"],
      ["Texto", !g.text.trim() && "Escreva ou gere o texto para o paciente"],
    ] as [string, string | false][]
  ).filter((x): x is [string, string] => !!x[1])
  const missing = pending.map(([, m]) => m)

  const applyModel = () => {
    const m = GUIDE_MODELS.find((x) => x.name === model)
    if (!m) return
    setG((o) => ({
      ...o,
      model: m.name,
      diet: m.diet,
      activities: m.activities,
      restDays: m.restDays,
      catheter: m.catheter,
      catheterCare: m.catheterCare,
      expected: m.expected,
      warnings: m.warnings,
    }))
    const n =
      m.diet.length +
      m.activities.length +
      m.catheterCare.length +
      m.expected.length +
      m.warnings.length
    setApplied(
      `Modelo “${m.name}” aplicado (${n} campos). Revise antes de assinar.`,
    )
  }

  const save = (sign: boolean) => {
    setSubmitted(true)
    if (sign && missing.length) {
      nav.goToFirstPending()
      return
    }
    updateDischarge(hosp.id, {
      guide: {
        ...g,
        status: sign ? "assinado" : "em_preenchimento",
        signedAt: sign ? MOCK_NOW : undefined,
        signedBy: sign ? g.doctor : undefined,
      },
    })
    addToast({
      title: sign ? "Orientações ao paciente assinadas" : "Rascunho salvo",
      description: sign
        ? `${g.doctor} · hoje, ${MOCK_NOW}`
        : "Continue quando quiser e assine depois.",
      color: "success",
    })
    onClose()
  }

  const steps: DocStep[] = [
    {
      title: "Identificação e rotina",
      sections: ["Identificação", "Atividades"],
      content: (
        <>
          <DocSection>Identificação</DocSection>
          <div className="flex gap-3">
            <Input
              label="Data"
              labelPlacement="outside"
              variant="bordered"
              className="w-56"
              isReadOnly
              value={`${isoToBR(g.date)} ${g.time}`}
            />
            <Input
              label="Procedimento realizado *"
              labelPlacement="outside"
              variant="bordered"
              className="flex-1"
              value={g.procedure}
              onValueChange={(v) => set("procedure", v)}
            />
          </div>

          <DocSection>Alimentação e atividades</DocSection>
          <CheckGroup
            label="Alimentação"
            options={DIET}
            value={g.diet}
            onChange={(v) => set("diet", v)}
          />
          <CheckGroup
            label="Atividades"
            options={ACTIVITIES}
            value={g.activities}
            onChange={(v) => set("activities", v)}
          />
          {needsRest && (
            <Input
              type="number"
              label="Evitar esforço por *"
              labelPlacement="outside"
              variant="bordered"
              className="w-44"
              endContent={<span className="text-xs text-[#94A3B8]">dias</span>}
              value={g.restDays ? String(g.restDays) : ""}
              onValueChange={(v) => set("restDays", Number(v) || undefined)}
              isInvalid={submitted && !g.restDays}
            />
          )}
        </>
      ),
    },
    {
      title: "Sonda e sintomas",
      sections: ["Sonda"],
      content: (
        <>
          <DocSection>Sonda vesical e sintomas esperados</DocSection>
          <YesNo
            label="Vai para casa com sonda vesical?"
            value={g.catheter}
            onChange={(v) => set("catheter", v)}
          />
          {g.catheter && (
            <>
              <CheckGroup
                label="Cuidados com a sonda"
                options={CATHETER_CARE}
                value={g.catheterCare}
                onChange={(v) => set("catheterCare", v)}
              />
              <Input
                label="Retirada da sonda em *"
                labelPlacement="outside"
                variant="bordered"
                placeholder="Data e local · ex.: 07/11/2026 · Ambulatório CEUTA, 8h"
                value={g.catheterRemoval}
                onValueChange={(v) => set("catheterRemoval", v)}
                isInvalid={submitted && !g.catheterRemoval.trim()}
              />
            </>
          )}
          <CheckGroup
            label="Pode acontecer e é esperado"
            options={EXPECTED}
            value={g.expected}
            onChange={(v) => set("expected", v)}
          />
        </>
      ),
    },
    {
      title: "Alerta e retorno",
      sections: ["Alerta", "Retorno"],
      content: (
        <>
          <DocSection>Medicações e sinais de alerta</DocSection>
          <Textarea
            label="Medicações e horários"
            labelPlacement="outside"
            variant="bordered"
            minRows={2}
            value={g.meds}
            onValueChange={(v) => set("meds", v)}
          />
          <CheckGroup
            label="Procure atendimento imediatamente se tiver"
            required
            columns={3}
            options={WARNINGS}
            value={g.warnings}
            onChange={(v) => set("warnings", v)}
            invalid={submitted && !g.warnings.length}
          />
          <Input
            label="Em caso de urgência, procurar *"
            labelPlacement="outside"
            variant="bordered"
            value={g.emergency}
            onValueChange={(v) => set("emergency", v)}
          />

          <DocSection>Retorno</DocSection>
          <div className="flex gap-3">
            <Input
              label="Retorno *"
              labelPlacement="outside"
              variant="bordered"
              className="flex-1"
              value={g.returnText}
              onValueChange={(v) => set("returnText", v)}
            />
            <Input
              label="Levar no retorno"
              labelPlacement="outside"
              variant="bordered"
              className="flex-1"
              placeholder="Exames, resultados…"
              value={g.bring}
              onValueChange={(v) => set("bring", v)}
            />
          </div>
        </>
      ),
    },
    {
      title: "Texto e assinatura",
      sections: ["Texto"],
      content: (
        <>
          <DocSection>Texto para o paciente</DocSection>
          <div className="flex items-center justify-between">
            <FieldLabel required>
              Orientações para imprimir e entregar
            </FieldLabel>
            {!readOnly && (
              <Button
                size="sm"
                variant="bordered"
                className="font-semibold"
                startContent={<LuSparkles className="h-3.5 w-3.5" />}
                onPress={() =>
                  set("text", guideText(g, patient, discharge?.prescription))
                }
              >
                Gerar texto a partir das marcações
              </Button>
            )}
          </div>
          <Textarea
            aria-label="Orientações para imprimir e entregar"
            variant="bordered"
            minRows={8}
            value={g.text}
            onValueChange={(v) => set("text", v)}
            description="Revise e complemente o texto antes de assinar."
            isInvalid={submitted && !g.text.trim()}
          />

          <DocSection>Assinatura</DocSection>
          <Select
            label="Médico (CRM-DF) *"
            labelPlacement="outside"
            variant="bordered"
            className="w-96"
            disallowEmptySelection
            selectedKeys={[g.doctor]}
            onSelectionChange={(k) => set("doctor", firstKey(k))}
            isDisabled={readOnly}
          >
            {DOCTORS.map((d) => (
              <SelectItem key={d.name}>{doctorLabel(d.name)}</SelectItem>
            ))}
          </Select>
        </>
      ),
    },
  ]
  const nav = useDocSteps(
    steps,
    pending.map(([sec, m]) => `${sec}: ${m}`),
  )

  return (
    <MapModal
      width={960}
      icon={<LuHeartHandshake />}
      title="Orientações ao paciente"
      description={`${patient.name} · ${patient.age} anos · Pront. ${patient.record} · ${hosp.bed}`}
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
      {readOnly ? (
        <div className="flex items-center gap-2 text-[12.5px] text-[#047857]">
          <Chip tone="success">Assinado</Chip>
          por {g.signedBy} às {g.signedAt} · somente leitura
        </div>
      ) : (
        nav.isFirst && (
          <ModelsBar
            models={GUIDE_MODELS.map((m) => m.name)}
            selected={model}
            onSelect={setModel}
            onApply={applyModel}
            applied={applied}
          />
        )
      )}
      <StepsBar
        steps={steps}
        current={nav.step}
        onSelect={nav.setStep}
        pendingOf={nav.pendingOf}
        showPending={submitted}
      />
      {submitted && <PendingBox items={missing} />}

      <fieldset disabled={readOnly} className="flex flex-col gap-4">
        {nav.isFirst && (
          <p className="text-xs text-[#64748B]">
            <span className="font-semibold text-[#EF4444]">*</span> Obrigatório
            para assinar. Campos condicionais passam a ser exigidos conforme as
            respostas.
          </p>
        )}
        {nav.content}
      </fieldset>
    </MapModal>
  )
}
