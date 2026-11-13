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
import { LuLogOut, LuSparkles } from "react-icons/lu"

import { TODAY_ISO } from "../../_data/days"
import {
  CONDITIONS,
  DESTINATIONS,
  DISCHARGE_TYPES,
  GUIDANCE,
} from "../../_data/discharge"
import { PROFESSIONALS } from "../../_data/evolutions"
import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import type {
  DischargeType,
  IDischarge,
  IDischargeSummary,
  IHospitalization,
  IPatient,
  ISurgery,
} from "../../_data/types"
import { DateField, MapModal } from "../mapa/MapModal"
import { Chip } from "../ui"
import { bedPhrase, summaryDraft, summaryText } from "./drafts"
import {
  CheckGroup,
  DocSection,
  FieldLabel,
  InfoBox,
  PendingBox,
  YesNo,
  firstKey,
} from "../docs/fields"
import { StepsBar, StepsFooter, useDocSteps, type DocStep } from "../docs/steps"

const DOCTORS = PROFESSIONALS["Médica"]

/** PEP-D09 · Documento · Sumário de alta. */
export const SummaryDocModal = ({
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
  const readOnly = discharge?.summary?.status === "assinado"
  const [s, setS] = useState<IDischargeSummary>(
    () =>
      discharge?.summary ??
      summaryDraft({
        hosp,
        surgery,
        prescription: discharge?.prescription,
        guide: discharge?.guide,
      }),
  )
  const [submitted, setSubmitted] = useState(false)

  const set = <K extends keyof IDischargeSummary>(
    k: K,
    v: IDischargeSummary[K],
  ) => setS((o) => ({ ...o, [k]: v }))

  /** Pendências de outros documentos: aparecem desde a abertura. */
  const blockers = [
    discharge?.guide?.status !== "assinado" &&
      "As orientações ao paciente ainda não foram assinadas",
  ].filter(Boolean) as string[]
  /** Pendências com a etapa a que pertencem (a caixa mostra só o texto). */
  const pending = (
    [
      ["Alta", !s.companion.trim() && "Informe quem acompanha a alta"],
      ["Diagnóstico", !s.diagnosis.trim() && "Informe o diagnóstico"],
      ["Diagnóstico", !s.cid.trim() && "Informe o CID"],
      [
        "Diagnóstico",
        !s.procedure.trim() && "Informe o procedimento realizado",
      ],
      [
        "Evolução",
        s.complications &&
          !s.complicationsText.trim() &&
          "Descreva as intercorrências",
      ],
      [
        "Evolução",
        !s.conditions.length && "Marque ao menos uma condição na alta",
      ],
      [
        "Dispositivos",
        s.catheter && !s.catheterRemoval && "Informe a retirada da sonda",
      ],
      ["Prescrição", !s.meds.trim() && "Informe as medicações de alta"],
      [
        "Prescrição",
        !s.guidance.length && "Marque ao menos uma orientação fornecida",
      ],
      ["Seguimento", !s.followUp.trim() && "Informe o retorno ambulatorial"],
      [
        "Seguimento",
        s.certificate && !s.leaveDays && "Informe os dias de afastamento",
      ],
      ["Resumo", !s.text.trim() && "Escreva ou gere o resumo da internação"],
    ] as [string, string | false | undefined][]
  ).filter((x): x is [string, string] => !!x[1])
  const missing = pending.map(([, m]) => m)

  const save = (sign: boolean) => {
    setSubmitted(true)
    if (sign && (blockers.length || missing.length)) {
      nav.goToFirstPending()
      return
    }
    updateDischarge(hosp.id, {
      summary: {
        ...s,
        status: sign ? "assinado" : "em_preenchimento",
        signedAt: sign ? MOCK_NOW : undefined,
        signedBy: sign ? s.doctor : undefined,
      },
    })
    addToast({
      title: sign ? "Sumário de alta assinado" : "Rascunho salvo",
      description: sign
        ? "A alta já pode ser registrada."
        : "Continue quando quiser e assine depois.",
      color: "success",
    })
    onClose()
  }

  const steps: DocStep[] = [
    {
      title: "Alta e diagnóstico",
      sections: ["Alta", "Diagnóstico"],
      content: (
        <>
          <DocSection>Alta</DocSection>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="flex gap-2">
              <DateField
                label="Data da alta *"
                value={s.date}
                min={TODAY_ISO}
                onChange={(v) => set("date", v)}
              />
              <Input
                type="time"
                label="Hora"
                labelPlacement="outside"
                variant="bordered"
                className="w-28"
                value={s.time}
                onValueChange={(v) => set("time", v)}
              />
            </div>
            <Select
              label="Tipo de alta *"
              labelPlacement="outside"
              variant="bordered"
              disallowEmptySelection
              selectedKeys={[s.type]}
              onSelectionChange={(k) =>
                set("type", firstKey(k) as DischargeType)
              }
              isDisabled={readOnly}
            >
              {DISCHARGE_TYPES.map((t) => (
                <SelectItem key={t}>{t}</SelectItem>
              ))}
            </Select>
            <Select
              label="Destino *"
              labelPlacement="outside"
              variant="bordered"
              disallowEmptySelection
              selectedKeys={[s.destination]}
              onSelectionChange={(k) => set("destination", firstKey(k))}
              isDisabled={readOnly}
            >
              {DESTINATIONS.map((d) => (
                <SelectItem key={d}>{d}</SelectItem>
              ))}
            </Select>
            <Input
              label="Alta acompanhada por *"
              labelPlacement="outside"
              variant="bordered"
              placeholder="Nome (parentesco)"
              value={s.companion}
              onValueChange={(v) => set("companion", v)}
              isInvalid={submitted && !s.companion.trim()}
            />
          </div>

          <DocSection>Diagnóstico e procedimento</DocSection>
          <div className="flex gap-3">
            <Input
              label="Diagnóstico *"
              labelPlacement="outside"
              variant="bordered"
              className="flex-1"
              value={s.diagnosis}
              onValueChange={(v) => set("diagnosis", v)}
            />
            <Input
              label="CID *"
              labelPlacement="outside"
              variant="bordered"
              className="w-32"
              value={s.cid}
              onValueChange={(v) => set("cid", v)}
            />
          </div>
          <div className="flex gap-3">
            <Input
              label="Procedimento realizado *"
              labelPlacement="outside"
              variant="bordered"
              className="flex-1"
              value={s.procedure}
              onValueChange={(v) => set("procedure", v)}
            />
            <div className="w-44">
              <DateField
                label="Data do procedimento"
                value={s.procedureDate}
                onChange={(v) => set("procedureDate", v)}
              />
            </div>
            <Input
              label="Anestesia"
              labelPlacement="outside"
              variant="bordered"
              className="w-44"
              value={s.anesthesia}
              onValueChange={(v) => set("anesthesia", v)}
            />
          </div>
        </>
      ),
    },
    {
      title: "Evolução e dispositivos",
      sections: ["Evolução", "Dispositivos"],
      content: (
        <>
          <DocSection>Evolução</DocSection>
          <YesNo
            label="Houve intercorrências durante a internação?"
            required
            value={s.complications}
            onChange={(v) => set("complications", v)}
          />
          {s.complications && (
            <Textarea
              label="Descreva as intercorrências *"
              labelPlacement="outside"
              variant="bordered"
              minRows={2}
              value={s.complicationsText}
              onValueChange={(v) => set("complicationsText", v)}
              isInvalid={submitted && !s.complicationsText.trim()}
            />
          )}
          <CheckGroup
            label="Condições na alta"
            required
            columns={4}
            options={CONDITIONS}
            value={s.conditions}
            onChange={(v) => set("conditions", v)}
            invalid={submitted && !s.conditions.length}
          />

          <DocSection>Dispositivos na alta</DocSection>
          <YesNo
            label="Alta com sonda vesical?"
            required
            value={s.catheter}
            onChange={(v) => set("catheter", v)}
          />
          {s.catheter && (
            <div className="w-56">
              <DateField
                label="Retirada prevista para *"
                value={s.catheterRemoval}
                min={TODAY_ISO}
                onChange={(v) => set("catheterRemoval", v)}
              />
            </div>
          )}
          <YesNo
            label="Alta com dreno?"
            required
            value={s.drain}
            onChange={(v) => set("drain", v)}
          />
        </>
      ),
    },
    {
      title: "Prescrição e seguimento",
      sections: ["Prescrição", "Seguimento"],
      content: (
        <>
          <DocSection>Prescrição de alta e orientações</DocSection>
          <Textarea
            label="Medicações de alta *"
            labelPlacement="outside"
            variant="bordered"
            minRows={2}
            value={s.meds}
            onValueChange={(v) => set("meds", v)}
            isInvalid={submitted && !s.meds.trim()}
          />
          <CheckGroup
            label="Orientações fornecidas"
            required
            options={GUIDANCE}
            value={s.guidance}
            onChange={(v) => set("guidance", v)}
            invalid={submitted && !s.guidance.length}
          />

          <DocSection>Seguimento</DocSection>
          <Input
            label="Retorno ambulatorial *"
            labelPlacement="outside"
            variant="bordered"
            value={s.followUp}
            onValueChange={(v) => set("followUp", v)}
            isInvalid={submitted && !s.followUp.trim()}
          />
          <YesNo
            label="Aguardar resultado de anatomopatológico?"
            required
            value={s.pathology}
            onChange={(v) => set("pathology", v)}
          />
          <YesNo
            label="Atestado médico fornecido?"
            required
            value={s.certificate}
            onChange={(v) => set("certificate", v)}
          />
          {s.certificate && (
            <Input
              type="number"
              label="Dias de afastamento *"
              labelPlacement="outside"
              variant="bordered"
              className="w-44"
              value={s.leaveDays ? String(s.leaveDays) : ""}
              onValueChange={(v) => set("leaveDays", Number(v) || undefined)}
              isInvalid={submitted && !s.leaveDays}
              description="Obrigatório: atestado fornecido."
            />
          )}
        </>
      ),
    },
    {
      title: "Resumo e assinatura",
      sections: ["Resumo"],
      content: (
        <>
          <DocSection>Resumo de alta</DocSection>
          <div className="flex items-center justify-between">
            <FieldLabel required>Resumo da internação</FieldLabel>
            {!readOnly && (
              <Button
                size="sm"
                variant="bordered"
                className="font-semibold"
                startContent={<LuSparkles className="h-3.5 w-3.5" />}
                onPress={() =>
                  set("text", summaryText(s, patient.sex === "Feminino"))
                }
              >
                Gerar texto a partir das marcações
              </Button>
            )}
          </div>
          <Textarea
            aria-label="Resumo da internação"
            variant="bordered"
            minRows={5}
            value={s.text}
            onValueChange={(v) => set("text", v)}
            description="Revise e complemente o texto antes de assinar."
            isInvalid={submitted && !s.text.trim()}
          />

          <DocSection>Assinatura</DocSection>
          <Select
            label="Médico (CRM-DF) *"
            labelPlacement="outside"
            variant="bordered"
            className="w-96"
            disallowEmptySelection
            selectedKeys={[s.doctor]}
            onSelectionChange={(k) => set("doctor", firstKey(k))}
            isDisabled={readOnly}
          >
            {DOCTORS.map((d) => (
              <SelectItem key={d.name}>{`${d.name} · ${d.council}`}</SelectItem>
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
      icon={<LuLogOut />}
      title="Sumário de alta"
      description={
        <span className="flex items-center gap-2">
          {patient.name} · {patient.age} anos · Pront. {patient.record} ·{" "}
          {hosp.bed}
          {readOnly ? (
            <Chip tone="success">Assinado</Chip>
          ) : (
            <Chip tone="warning">Rascunho</Chip>
          )}
        </span>
      }
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
        <p className="text-[12.5px] text-[#047857]">
          Assinado por {s.signedBy} às {s.signedAt} · somente leitura
        </p>
      ) : (
        <>
          <PendingBox
            items={submitted ? [...blockers, ...missing] : blockers}
          />
          {nav.isFirst && (
            <InfoBox title="Com o sumário assinado, a alta pode ser registrada">
              O registro (aba Alta) encerra a internação e envia{" "}
              {bedPhrase(hosp.bed)} para higienização.
            </InfoBox>
          )}
        </>
      )}
      <StepsBar
        steps={steps}
        current={nav.step}
        onSelect={nav.setStep}
        pendingOf={nav.pendingOf}
        showPending={submitted}
      />

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
