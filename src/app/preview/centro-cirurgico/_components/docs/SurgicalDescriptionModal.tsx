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
import { LuClipboardPen, LuClock3, LuSparkles } from "react-icons/lu"

import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import type { ISurgery } from "../../_data/types"
import { MapModal } from "../mapa/MapModal"
import {
  CheckGroup,
  DocBadge,
  DocPatientLine,
  DocSection,
  FieldLabel,
  ModelsBar,
  PendingBox,
  YesNo,
  firstKey,
} from "./fields"
import type { IIntraopEvolution } from "./intraopEvolution"
import { StepsBar, StepsFooter, useDocSteps, type DocStep } from "./steps"
import {
  ANESTHESIAS,
  ANTISEPSIS,
  BLEEDING,
  BLEEDING_HINT,
  CHARACTER,
  DESCRIPTION_MODELS,
  DESTINATION,
  PATIENT_FIELDS,
  POSITIONS,
  SIDES,
  SURGEONS,
  WOUND,
  blankDescription,
  descriptionMissing,
  descriptionText,
  sampleDescription,
  surgeonLabel,
  type ISurgicalDescription,
} from "./surgicalDescription"
import { cn } from "@/shared/utils/cn"

const filled = (v: unknown) =>
  Array.isArray(v)
    ? v.length > 0
    : typeof v === "string"
      ? !!v.trim()
      : v !== undefined

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

const Text = ({
  label,
  value,
  onChange,
  invalid,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  invalid?: boolean
  placeholder?: string
}) => (
  <Input
    label={label}
    labelPlacement="outside"
    variant="bordered"
    placeholder={placeholder ?? " "}
    value={value}
    onValueChange={onChange}
    isInvalid={invalid}
  />
)

const Sel = ({
  label,
  options,
  value,
  onChange,
  invalid,
  disabled,
  hint,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
  invalid?: boolean
  disabled?: boolean
  hint?: Record<string, string>
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
      <SelectItem key={o} description={hint?.[o]}>
        {o}
      </SelectItem>
    ))}
  </Select>
)

/** PEP-D05 · Documento · Descrição cirúrgica (fiel ao desenho). */
export const SurgicalDescriptionModal = ({
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
  const doc = surgery.docs.descricao_cirurgica
  const female = patient?.sex === "Feminino"
  const readOnly = doc.status === "assinado"

  const [d, setD] = useState<ISurgicalDescription>(() => {
    const saved = surgery.docData?.descricao_cirurgica as
      | ISurgicalDescription
      | undefined
    if (saved) return saved
    const intraop = surgery.docData?.evolucao_intraop as
      | IIntraopEvolution
      | undefined
    return doc.status === "nao_iniciado"
      ? blankDescription(surgery, cid, intraop)
      : sampleDescription(surgery, cid, intraop, readOnly, female)
  })
  const [model, setModel] = useState<string>()
  const [applied, setApplied] = useState<string>()
  const [submitted, setSubmitted] = useState(false)

  const set = <K extends keyof ISurgicalDescription>(
    k: K,
    v: ISurgicalDescription[K],
  ) => setD((o) => ({ ...o, [k]: v }))
  const missing = descriptionMissing(d)
  const err = (cond: boolean) => submitted && cond

  const applyModel = () => {
    const m = DESCRIPTION_MODELS.find((x) => x.name === model)
    if (!m) return
    const keys = Object.keys(m.patch) as (keyof ISurgicalDescription)[]
    const kept = keys.filter((k) => PATIENT_FIELDS.includes(k) && filled(d[k]))
    const patch = Object.fromEntries(
      keys.filter((k) => !kept.includes(k)).map((k) => [k, m.patch[k]]),
    )
    setD((o) => ({ ...o, ...patch }))
    setApplied(
      `Modelo “${m.name.replace(/ \(padrão\)$/, "")}” aplicado (${keys.length - kept.length} campos).${kept.length ? ` ${kept.length} ${kept.length === 1 ? "campo com dados deste paciente foi mantido" : "campos com dados deste paciente foram mantidos"}.` : ""} Revise antes de assinar.`,
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
      "descricao_cirurgica",
      d,
      sign ? "assinado" : "em_preenchimento",
      d.signer,
    )
    addToast({
      title: sign
        ? "Descrição cirúrgica assinada"
        : "Rascunho salvo · Descrição cirúrgica",
      description: sign
        ? `${surgeonLabel(d.signer)} · hoje, ${MOCK_NOW}`
        : "Continue quando quiser e assine depois.",
      color: "success",
    })
    onClose()
  }

  const surgeons = SURGEONS.some((p) => p.name === surgery.surgeon)
    ? SURGEONS
    : [{ name: surgery.surgeon, council: "" }, ...SURGEONS]

  const steps: DocStep[] = [
    {
      title: "Identificação",
      sections: ["Identificação", "Equipe"],
      content: (
        <>
          <DocSection>Identificação do ato cirúrgico</DocSection>
          <div className="grid grid-cols-4 items-start gap-3">
            <Text
              label="Data *"
              placeholder="dd/mm/aaaa hh:mm"
              value={d.date}
              onChange={(v) => set("date", v)}
              invalid={err(!d.date.trim())}
            />
            <TimeField
              label="Início da cirurgia *"
              value={d.start}
              onChange={(v) => set("start", v)}
              invalid={err(!d.start)}
            />
            <TimeField
              label="Término da cirurgia *"
              value={d.end}
              onChange={(v) => set("end", v)}
              invalid={err(!d.end)}
            />
            <Sel
              label="Caráter"
              options={CHARACTER}
              value={d.character}
              onChange={(v) => set("character", v)}
              disabled={readOnly}
            />
          </div>
          <div className="grid grid-cols-[1fr_170px_120px_160px] items-start gap-3">
            <Text
              label="Procedimento realizado *"
              value={d.procedure}
              onChange={(v) => set("procedure", v)}
              invalid={err(!d.procedure.trim())}
            />
            <Text
              label="Código SIGTAP ou TUSS"
              value={d.code}
              onChange={(v) => set("code", v)}
            />
            <Text
              label="CID *"
              placeholder="Ex.: C67.2"
              value={d.cid}
              onChange={(v) => set("cid", v)}
              invalid={err(!d.cid.trim())}
            />
            <Sel
              label="Lateralidade *"
              options={SIDES}
              value={d.side}
              onChange={(v) => set("side", v)}
              invalid={err(!d.side)}
              disabled={readOnly}
            />
          </div>

          <DocSection>Equipe</DocSection>
          <div className="grid grid-cols-4 items-start gap-3">
            <Text
              label="Cirurgião *"
              value={d.surgeon}
              onChange={(v) => set("surgeon", v)}
              invalid={err(!d.surgeon.trim())}
            />
            <Text
              label="Auxiliar"
              placeholder="Nenhum"
              value={d.assistant}
              onChange={(v) => set("assistant", v)}
            />
            <Text
              label="Anestesista"
              value={d.anesthetist}
              onChange={(v) => set("anesthetist", v)}
            />
            <Text
              label="Instrumentador"
              value={d.scrub}
              onChange={(v) => set("scrub", v)}
            />
          </div>
        </>
      ),
    },
    {
      title: "Anestesia e diagnóstico",
      sections: ["Anestesia", "Posicionamento", "Diagnóstico"],
      content: (
        <>
          <DocSection>Anestesia, posicionamento e antissepsia</DocSection>
          <div className="grid grid-cols-4 items-start gap-3">
            <Sel
              label="Anestesia *"
              options={ANESTHESIAS}
              value={d.anesthesia}
              onChange={(v) => set("anesthesia", v)}
              invalid={err(!d.anesthesia)}
              disabled={readOnly}
            />
          </div>
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
            columns={3}
            options={ANTISEPSIS}
            value={d.antisepsis}
            onChange={(v) => set("antisepsis", v)}
          />

          <DocSection>Diagnóstico</DocSection>
          <div className="grid grid-cols-2 items-start gap-3">
            <Text
              label="Diagnóstico pré-operatório *"
              value={d.preDiagnosis}
              onChange={(v) => set("preDiagnosis", v)}
              invalid={err(!d.preDiagnosis.trim())}
            />
            <Text
              label="Diagnóstico pós-operatório *"
              value={d.postDiagnosis}
              onChange={(v) => set("postDiagnosis", v)}
              invalid={err(!d.postDiagnosis.trim())}
            />
          </div>
        </>
      ),
    },
    {
      title: "Achados e drenos",
      sections: ["Achados", "Sondas", "Drenos"],
      content: (
        <>
          <DocSection>Achados, materiais, sondas e drenos</DocSection>
          <Textarea
            label="Achados operatórios *"
            labelPlacement="outside"
            variant="bordered"
            minRows={2}
            placeholder=" "
            value={d.findings}
            onValueChange={(v) => set("findings", v)}
            isInvalid={err(!d.findings.trim())}
          />
          <YesNo
            label="Material enviado para anatomopatológico?"
            required
            value={d.pathology}
            onChange={(v) => set("pathology", v)}
            invalid={err(d.pathology === undefined)}
          />
          {d.pathology && (
            <Text
              label="Qual material? *"
              value={d.pathologyMaterial}
              onChange={(v) => set("pathologyMaterial", v)}
              invalid={err(!d.pathologyMaterial.trim())}
            />
          )}
          <YesNo
            label="Material enviado para cultura?"
            value={d.culture}
            onChange={(v) => set("culture", v)}
          />
          {d.culture && (
            <Text
              label="Qual material? *"
              value={d.cultureMaterial}
              onChange={(v) => set("cultureMaterial", v)}
              invalid={err(!d.cultureMaterial.trim())}
            />
          )}
          <YesNo
            label="Utilizado OPME ou material especial?"
            value={d.opme}
            onChange={(v) => set("opme", v)}
          />
          {d.opme && (
            <Text
              label="Quais? *"
              placeholder="Descrição, fabricante e lote"
              value={d.opmeText}
              onChange={(v) => set("opmeText", v)}
              invalid={err(!d.opmeText.trim())}
            />
          )}
          <YesNo
            label="Sonda vesical ao final do procedimento?"
            required
            value={d.catheter}
            onChange={(v) => set("catheter", v)}
            invalid={err(d.catheter === undefined)}
          />
          {d.catheter && (
            <Text
              label="Tipo, calibre e vias *"
              placeholder="Ex.: Foley 3 vias nº 20, com irrigação"
              value={d.catheterText}
              onChange={(v) => set("catheterText", v)}
              invalid={err(!d.catheterText.trim())}
            />
          )}
          <YesNo
            label="Dreno?"
            required
            value={d.drain}
            onChange={(v) => set("drain", v)}
            invalid={err(d.drain === undefined)}
          />
          {d.drain && (
            <Text
              label="Tipo e local do dreno *"
              value={d.drainText}
              onChange={(v) => set("drainText", v)}
              invalid={err(!d.drainText.trim())}
            />
          )}
        </>
      ),
    },
    {
      title: "Desfecho",
      sections: ["Desfecho"],
      content: (
        <>
          <DocSection>Desfecho</DocSection>
          <div className="grid grid-cols-3 items-start gap-3">
            <Sel
              label="Sangramento *"
              options={BLEEDING}
              hint={BLEEDING_HINT}
              value={d.bleeding}
              onChange={(v) => set("bleeding", v)}
              invalid={err(!d.bleeding)}
              disabled={readOnly}
            />
            <Sel
              label="Classificação da ferida"
              options={WOUND}
              value={d.wound}
              onChange={(v) => set("wound", v)}
              disabled={readOnly}
            />
            <Sel
              label="Destino *"
              options={DESTINATION}
              value={d.destination}
              onChange={(v) => set("destination", v)}
              invalid={err(!d.destination)}
              disabled={readOnly}
            />
          </div>
          <YesNo
            label="Houve intercorrências?"
            required
            warnOn
            value={d.complications}
            onChange={(v) => set("complications", v)}
            invalid={err(d.complications === undefined)}
          />
          {d.complications && (
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
      title: "Descrição",
      sections: ["Descrição do procedimento", "Assinatura"],
      content: (
        <>
          <DocSection>Descrição do procedimento</DocSection>
          <div className="flex items-center justify-between">
            <FieldLabel required>Descrição técnica</FieldLabel>
            {!readOnly && (
              <Button
                size="sm"
                variant="bordered"
                className="font-semibold"
                startContent={<LuSparkles className="h-3.5 w-3.5" />}
                onPress={() => set("text", descriptionText(d, female))}
              >
                Gerar texto a partir das marcações
              </Button>
            )}
          </div>
          <Textarea
            aria-label="Descrição técnica"
            variant="bordered"
            minRows={6}
            value={d.text}
            onValueChange={(v) => set("text", v)}
            description="Revise e complemente o texto antes de assinar."
            isInvalid={err(!d.text.trim())}
          />
          <Textarea
            label="Prescrição e orientações pós-operatórias"
            labelPlacement="outside"
            variant="bordered"
            minRows={2}
            placeholder=" "
            value={d.postOp}
            onValueChange={(v) => set("postOp", v)}
          />

          <DocSection>Assinatura</DocSection>
          <div className="w-96">
            <Select
              label="Cirurgião (CRM-DF) *"
              labelPlacement="outside"
              variant="bordered"
              placeholder="Nome e CRM"
              selectedKeys={d.signer ? [d.signer] : []}
              onSelectionChange={(k) => set("signer", firstKey(k))}
              isInvalid={err(!d.signer)}
              isDisabled={readOnly}
            >
              {surgeons.map((p) => (
                <SelectItem key={p.name}>{surgeonLabel(p.name)}</SelectItem>
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
      icon={<LuClipboardPen />}
      title="Descrição cirúrgica"
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
          models={DESCRIPTION_MODELS.map((m) => m.name)}
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
