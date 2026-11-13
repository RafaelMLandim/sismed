"use client"

import {
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  addToast,
} from "@heroui/react"
import { useMemo, useState } from "react"
import { LuActivity, LuClock3, LuSparkles } from "react-icons/lu"

import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import type { ISurgery } from "../../_data/types"
import { MapModal } from "../mapa/MapModal"
import { byTime } from "../sinais/rules"
import {
  CheckGroup,
  DocBadge,
  DocPatientLine,
  DocSection,
  FieldLabel,
  Measure,
  ModelsBar,
  PendingBox,
  firstKey,
} from "./fields"
import {
  ACCESS_CONDITION,
  ANESTHESIAS,
  ANTISEPSIS,
  ARRIVAL,
  AVP_SITES,
  CAUTERY,
  CAUTERY_USED,
  COMPLICATIONS,
  ETT,
  INCISION,
  INTRAOP_MODELS,
  LMA,
  NA,
  NURSES,
  POSITIONS,
  SVD,
  SVD_WAYS,
  WIRED_TUBE,
  WITH_COMPLICATIONS,
  blankIntraop,
  intraopMissing,
  intraopText,
  nurseLabel,
  sampleIntraop,
  type IIntraopEvolution,
} from "./intraopEvolution"
import { StepsBar, StepsFooter, useDocSteps, type DocStep } from "./steps"
import { cn } from "@/shared/utils/cn"

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

/** Texto livre com rótulo em cima. */
const Text = ({
  label,
  value,
  onChange,
  invalid,
  placeholder,
  readOnly,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  invalid?: boolean
  placeholder?: string
  readOnly?: boolean
}) => (
  <Input
    label={label}
    labelPlacement="outside"
    variant="bordered"
    placeholder={placeholder ?? " "}
    value={value}
    onValueChange={onChange}
    isInvalid={invalid}
    isReadOnly={readOnly}
  />
)

/** Select com "Selecione" enquanto vazio. */
const Sel = ({
  label,
  options,
  value,
  onChange,
  invalid,
  disabled,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
  invalid?: boolean
  disabled?: boolean
}) => (
  <Select
    label={label}
    labelPlacement="outside"
    variant="bordered"
    placeholder="Selecione"
    selectedKeys={value ? [value] : []}
    onSelectionChange={(k) => onChange(firstKey(k))}
    isInvalid={invalid}
    isDisabled={disabled}
  >
    {options.map((o) => (
      <SelectItem key={o}>{o}</SelectItem>
    ))}
  </Select>
)

/** PEP-D03 · Documento · Evolução intraoperatória (fiel ao desenho). */
export const IntraopEvolutionModal = ({
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
  const cid = useCC(
    (s) =>
      s.hospitalizations.find((h) => h.id === surgery.hospitalizationId)?.cid,
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
  const doc = surgery.docs.evolucao_intraop
  const readOnly = doc.status === "assinado"

  const [d, setD] = useState<IIntraopEvolution>(() => {
    const saved = surgery.docData?.evolucao_intraop as
      | IIntraopEvolution
      | undefined
    if (saved) return saved
    return doc.status === "nao_iniciado"
      ? blankIntraop(surgery, cid, lastVital)
      : sampleIntraop(surgery, cid, lastVital, readOnly)
  })
  const [model, setModel] = useState<string>()
  const [applied, setApplied] = useState<string>()
  const [submitted, setSubmitted] = useState(false)

  const set = <K extends keyof IIntraopEvolution>(
    k: K,
    v: IIntraopEvolution[K],
  ) => setD((o) => ({ ...o, [k]: v }))
  const missing = intraopMissing(d)
  const err = (cond: boolean) => submitted && cond
  const hasSvd = !!d.svd && d.svd !== NA
  const withComplications = d.complications === WITH_COMPLICATIONS

  const applyModel = () => {
    const m = INTRAOP_MODELS.find((x) => x.name === model)
    if (!m) return
    setD((o) => ({ ...o, ...m.patch }))
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
      "evolucao_intraop",
      d,
      sign ? "assinado" : "em_preenchimento",
      d.signer,
    )
    addToast({
      title: sign
        ? "Evolução intraoperatória assinada"
        : "Rascunho salvo · Evolução intraoperatória",
      description: sign
        ? `${nurseLabel(d.signer)} · hoje, ${MOCK_NOW}`
        : "Continue quando quiser e assine depois.",
      color: "success",
    })
    onClose()
  }

  const steps: DocStep[] = [
    {
      title: "Equipe e anestesia",
      sections: ["Equipe", "Anestesia"],
      content: (
        <>
          <DocSection>Identificação e equipe</DocSection>
          <div className="grid grid-cols-4 items-start gap-3">
            <Text label="Médico" value={d.surgeon} readOnly />
            <Text
              label="Circulante *"
              value={d.circulating}
              onChange={(v) => set("circulating", v)}
              invalid={err(!d.circulating.trim())}
            />
            <Text
              label="Instrumentador"
              value={d.scrub}
              onChange={(v) => set("scrub", v)}
            />
            <Text
              label="Auxiliar"
              value={d.assistant}
              onChange={(v) => set("assistant", v)}
            />
          </div>
          <div className="grid grid-cols-[1fr_160px] items-start gap-3">
            <Text
              label="Procedimento realizado"
              value={d.procedure}
              onChange={(v) => set("procedure", v)}
            />
            <Text
              label="CID"
              placeholder="Ex.: S72.0"
              value={d.cid}
              onChange={(v) => set("cid", v)}
            />
          </div>

          <DocSection>Dados da anestesia</DocSection>
          <div className="grid grid-cols-4 items-start gap-3">
            <TimeField
              label="Início *"
              value={d.anesthesiaStart}
              onChange={(v) => set("anesthesiaStart", v)}
              invalid={err(!d.anesthesiaStart)}
            />
            <TimeField
              label="Término *"
              value={d.anesthesiaEnd}
              onChange={(v) => set("anesthesiaEnd", v)}
              invalid={err(!d.anesthesiaEnd)}
            />
            <Sel
              label="Anestesia *"
              options={ANESTHESIAS}
              value={d.anesthesia}
              onChange={(v) => set("anesthesia", v)}
              invalid={err(!d.anesthesia)}
              disabled={readOnly}
            />
            <Text
              label="Anestesia realizada por *"
              value={d.anesthetist}
              onChange={(v) => set("anesthetist", v)}
              invalid={err(!d.anesthetist.trim())}
            />
          </div>
          <div className="grid grid-cols-3 items-start gap-3">
            <Sel
              label="Tubo endotraqueal"
              options={ETT}
              value={d.ett}
              onChange={(v) => set("ett", v)}
              disabled={readOnly}
            />
            <Sel
              label="Máscara laríngea"
              options={LMA}
              value={d.lma}
              onChange={(v) => set("lma", v)}
              disabled={readOnly}
            />
            <Sel
              label="Tubo aramado"
              options={WIRED_TUBE}
              value={d.wiredTube}
              onChange={(v) => set("wiredTube", v)}
              disabled={readOnly}
            />
          </div>
        </>
      ),
    },
    {
      title: "Posicionamento e dispositivos",
      sections: ["Posicionamento", "Antissepsia", "Dispositivos"],
      content: (
        <>
          <DocSection>Posicionamento, antissepsia e dispositivos</DocSection>
          <CheckGroup
            label="Posição"
            required
            columns={4}
            options={POSITIONS}
            value={d.positions}
            onChange={(v) => set("positions", v)}
            invalid={err(!d.positions.length)}
          />
          <CheckGroup
            label="Antissepsia"
            required
            columns={3}
            options={ANTISEPSIS}
            value={d.antisepsis}
            onChange={(v) => set("antisepsis", v)}
            invalid={err(!d.antisepsis.length)}
          />
          <div className="grid grid-cols-5 items-start gap-3">
            <Sel
              label="SVD *"
              options={SVD}
              value={d.svd}
              onChange={(v) => set("svd", v)}
              invalid={err(!d.svd)}
              disabled={readOnly}
            />
            {hasSvd && (
              <>
                <Text
                  label="Nº da SVD *"
                  placeholder="Ex.: 16"
                  value={d.svdNumber}
                  onChange={(v) => set("svdNumber", v)}
                  invalid={err(!d.svdNumber.trim())}
                />
                <Sel
                  label="Vias *"
                  options={SVD_WAYS}
                  value={d.svdWays}
                  onChange={(v) => set("svdWays", v)}
                  invalid={err(!d.svdWays)}
                  disabled={readOnly}
                />
                <Measure
                  label="Balão insuflado com"
                  unit="ml"
                  required
                  value={d.svdBalloon}
                  onChange={(v) => set("svdBalloon", v)}
                  invalid={err(!d.svdBalloon.trim())}
                />
                <Text
                  label="Passado por *"
                  value={d.svdBy}
                  onChange={(v) => set("svdBy", v)}
                  invalid={err(!d.svdBy.trim())}
                />
              </>
            )}
          </div>
          <div className="grid grid-cols-4 items-start gap-3">
            <Sel
              label="Placa de bisturi elétrico *"
              options={CAUTERY}
              value={d.cautery}
              onChange={(v) => set("cautery", v)}
              invalid={err(!d.cautery)}
              disabled={readOnly}
            />
            {d.cautery === CAUTERY_USED ? (
              <Text
                label="Local da placa *"
                placeholder="Ex.: Coxa direita"
                value={d.cauteryPlace}
                onChange={(v) => set("cauteryPlace", v)}
                invalid={err(!d.cauteryPlace.trim())}
              />
            ) : (
              <div />
            )}
            <Sel
              label="Incisão cirúrgica *"
              options={INCISION}
              value={d.incision}
              onChange={(v) => set("incision", v)}
              invalid={err(!d.incision)}
              disabled={readOnly}
            />
            {d.incision === "Sim" && (
              <Text
                label="Local da incisão *"
                value={d.incisionPlace}
                onChange={(v) => set("incisionPlace", v)}
                invalid={err(!d.incisionPlace.trim())}
              />
            )}
          </div>
        </>
      ),
    },
    {
      title: "Admissão e check list",
      sections: ["Admissão em sala", "Check list"],
      content: (
        <>
          <DocSection>Admissão em sala e etapas do check list</DocSection>
          <div className="grid grid-cols-6 items-start gap-3">
            <TimeField
              label="Horário *"
              value={d.roomTime}
              onChange={(v) => set("roomTime", v)}
              invalid={err(!d.roomTime)}
            />
            <Sel
              label="Chegada"
              options={ARRIVAL}
              value={d.arrival}
              onChange={(v) => set("arrival", v)}
              disabled={readOnly}
            />
            <Measure
              label="PAS"
              unit="mmHg"
              required
              value={d.sys}
              onChange={(v) => set("sys", v)}
              invalid={err(!d.sys.trim())}
            />
            <Measure
              label="PAD"
              unit="mmHg"
              required
              value={d.dia}
              onChange={(v) => set("dia", v)}
              invalid={err(!d.dia.trim())}
            />
            <Measure
              label="FC"
              unit="bpm"
              required
              value={d.hr}
              onChange={(v) => set("hr", v)}
              invalid={err(!d.hr.trim())}
            />
            <Measure
              label="SpO₂"
              unit="%"
              required
              value={d.spo2}
              onChange={(v) => set("spo2", v)}
              invalid={err(!d.spo2.trim())}
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-3">
            <TimeField
              label="1ª etapa do check list *"
              value={d.checklist1At}
              onChange={(v) => set("checklist1At", v)}
              invalid={err(!d.checklist1At)}
            />
            <Sel
              label="AVP em"
              options={AVP_SITES}
              value={d.avpSite}
              onChange={(v) => set("avpSite", v)}
              disabled={readOnly}
            />
            <Text
              label="AVP realizado por"
              value={d.avpBy}
              onChange={(v) => set("avpBy", v)}
            />
            <TimeField
              label="2ª etapa e início *"
              value={d.checklist2At}
              onChange={(v) => set("checklist2At", v)}
              invalid={err(!d.checklist2At)}
            />
          </div>
        </>
      ),
    },
    {
      title: "Término",
      sections: ["Término"],
      content: (
        <>
          <DocSection>Término e encaminhamento à SRPA</DocSection>
          <div className="grid grid-cols-4 items-start gap-3">
            <TimeField
              label="Término do procedimento *"
              value={d.procedureEnd}
              onChange={(v) => set("procedureEnd", v)}
              invalid={err(!d.procedureEnd)}
            />
            <Sel
              label="Intercorrências *"
              options={COMPLICATIONS}
              value={d.complications}
              onChange={(v) => set("complications", v)}
              invalid={err(!d.complications)}
              disabled={readOnly}
            />
            <TimeField
              label="Encaminhamento à SRPA *"
              value={d.srpaAt}
              onChange={(v) => set("srpaAt", v)}
              invalid={err(!d.srpaAt)}
            />
            <Sel
              label="Acesso venoso *"
              options={ACCESS_CONDITION}
              value={d.venousAccess}
              onChange={(v) => set("venousAccess", v)}
              invalid={err(!d.venousAccess)}
              disabled={readOnly}
            />
          </div>
          {withComplications && (
            <Textarea
              label="Descreva as intercorrências *"
              labelPlacement="outside"
              variant="bordered"
              minRows={2}
              placeholder="O que aconteceu, horário e conduta"
              value={d.complicationsText}
              onValueChange={(v) => set("complicationsText", v)}
              isInvalid={err(!d.complicationsText.trim())}
            />
          )}
        </>
      ),
    },
    {
      title: "Evolução e assinatura",
      sections: ["Evolução de enfermagem", "Assinatura"],
      content: (
        <>
          <DocSection>Evolução de enfermagem</DocSection>
          <div className="flex items-center justify-between">
            <FieldLabel required>Texto da evolução</FieldLabel>
            {!readOnly && (
              <Button
                size="sm"
                variant="bordered"
                className="font-semibold"
                startContent={<LuSparkles className="h-3.5 w-3.5" />}
                onPress={() => set("text", intraopText(d))}
              >
                Gerar texto a partir das marcações
              </Button>
            )}
          </div>
          <Textarea
            aria-label="Texto da evolução"
            variant="bordered"
            minRows={6}
            classNames={{ input: "font-mono text-[12px] leading-relaxed" }}
            value={d.text}
            onValueChange={(v) => set("text", v)}
            description="Revise e complemente o texto antes de assinar."
            isInvalid={err(!d.text.trim())}
          />

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
      ),
    },
  ]
  const nav = useDocSteps(steps, missing)

  if (!patient) return null

  return (
    <MapModal
      width={960}
      icon={<LuActivity />}
      title="Evolução intraoperatória"
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
          models={INTRAOP_MODELS.map((m) => m.name)}
          selected={model}
          onSelect={setModel}
          onApply={applyModel}
          applied={applied}
        />
      )}
      <StepsBar
        steps={steps}
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
        {nav.content}
      </fieldset>
    </MapModal>
  )
}
