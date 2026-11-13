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
import { LuPlus, LuSyringe, LuX } from "react-icons/lu"

import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import type { ISurgery } from "../../_data/types"
import { MapModal } from "../mapa/MapModal"
import {
  ALDRETE,
  AIRWAYS,
  ANESTHESIA_RECORD_MODELS,
  ANESTHETISTS,
  ASA,
  DESTINATIONS,
  INTUBATION,
  MONITORING,
  NOT_APPLICABLE,
  PAIN,
  POSITIONS,
  ROUTES,
  SENSORY_LEVELS,
  SPACES,
  TECHNIQUES,
  TUBES,
  anesthesiaRecordMissing,
  anesthetistLabel,
  balanceOf,
  blankAnesthesiaRecord,
  durationsOf,
  fmtMl,
  isHypotension,
  mlOf,
  newDrugRow,
  sampleAnesthesiaRecord,
  techniqueKind,
  timelineLabel,
  type IAnesthesiaRecord,
  type IDrugRow,
  type IIntraopVital,
} from "./anesthesiaRecord"
import {
  CheckGroup,
  DocBadge,
  DocPatientLine,
  DocSection,
  FieldLabel,
  InfoBox,
  Measure,
  ModelsBar,
  PendingBox,
  Pick,
  YesNo,
  firstKey,
} from "./fields"
import { StepsBar, StepsFooter, useDocSteps, type DocStep } from "./steps"
import type { IPreAnesthesia } from "./preAnesthesia"
import { cn } from "@/shared/utils/cn"

const fmtTemp = (t: number) =>
  t.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

const VITAL_ROWS: {
  label: string
  value: (v: IIntraopVital) => string
}[] = [
  { label: "PA (mmHg)", value: (v) => `${v.sys}/${v.dia}` },
  { label: "FC (bpm)", value: (v) => String(v.hr) },
  { label: "SpO₂ (%)", value: (v) => String(v.spo2) },
  {
    label: "EtCO₂ (mmHg)",
    value: (v) => (v.etco2 === undefined ? "—" : String(v.etco2)),
  },
  { label: "Temp. (°C)", value: (v) => fmtTemp(v.temp) },
]

/** Linha de entrada/saída do balanço hídrico (valor em ml editável). */
const FluidLine = ({
  label,
  value,
  onChange,
  empty,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  empty: string
}) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-[12.5px] text-[#64748B]">{label}</span>
    <Input
      aria-label={label}
      size="sm"
      variant="underlined"
      placeholder={empty}
      className="w-28"
      classNames={{ input: "text-right font-semibold" }}
      value={value}
      onValueChange={onChange}
      endContent={
        value.trim() ? (
          <span className="text-xs text-[#94A3B8]">ml</span>
        ) : undefined
      }
    />
  </div>
)

/** PEP-D11 · Documento · Boletim anestésico (fiel ao desenho). */
export const AnesthesiaRecordModal = ({
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
  const doc = surgery.docs.boletim_anestesico
  const readOnly = doc.status === "assinado"

  const [d, setD] = useState<IAnesthesiaRecord>(() => {
    const saved = surgery.docData?.boletim_anestesico as
      | IAnesthesiaRecord
      | undefined
    if (saved) return saved
    const pre = surgery.docData?.pre_anestesica as IPreAnesthesia | undefined
    return doc.status === "nao_iniciado"
      ? blankAnesthesiaRecord(surgery, pre)
      : sampleAnesthesiaRecord(surgery, pre, doc.status === "assinado")
  })
  const [model, setModel] = useState<string>()
  const [applied, setApplied] = useState<string>()
  const [submitted, setSubmitted] = useState(false)

  const set = <K extends keyof IAnesthesiaRecord>(
    k: K,
    v: IAnesthesiaRecord[K],
  ) => setD((o) => ({ ...o, [k]: v }))
  const setRow = (id: string, patch: Partial<IDrugRow>) =>
    setD((o) => ({
      ...o,
      drugs: o.drugs.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))

  const missing = anesthesiaRecordMissing(d)
  const err = (cond: boolean) => submitted && cond
  const kind = techniqueKind(d.technique)
  const neuraxial = kind === "neuraxial"
  const needsNeedle = neuraxial || kind === "bloqueio"
  const durations = durationsOf(d)
  const balance = balanceOf(d)
  const firstVital = d.vitals[0]
  const banner = `Dados de monitorização, fármacos e eventos vieram em tempo real do tablet da sala${room ? ` (${room.name})` : ""}. Revise e assine.`

  /** Técnica geral pede intubação; as demais começam em "Não se aplica". */
  const setTechnique = (v: string) =>
    setD((o) => {
      const general = techniqueKind(v) === "geral"
      return {
        ...o,
        technique: v,
        airway: general ? "Intubação orotraqueal" : o.airway,
        intubation: general
          ? o.intubation === NOT_APPLICABLE
            ? ""
            : o.intubation
          : NOT_APPLICABLE,
        tube: general ? o.tube : NOT_APPLICABLE,
      }
    })

  const applyModel = () => {
    const m = ANESTHESIA_RECORD_MODELS.find((x) => x.name === model)
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
      "boletim_anestesico",
      d,
      sign ? "assinado" : "em_preenchimento",
      d.signer,
    )
    addToast({
      title: sign
        ? "Boletim anestésico assinado"
        : "Rascunho salvo · Boletim anestésico",
      description: sign
        ? `${anesthetistLabel(d.signer)} · hoje, ${MOCK_NOW}`
        : "Continue quando quiser e assine depois.",
      color: "success",
    })
    onClose()
  }

  const steps: DocStep[] = [
    {
      title: "Técnica anestésica",
      sections: [
        "Escolha a técnica",
        "Escolha a classificação",
        "Informe o acesso",
        "Informe a agulha",
        "Escolha o espaço",
        "Informe o anestésico",
        "Escolha o nível",
        "Informe como foi",
        "Marque a monitorização",
      ],
      content: (
        <>
          <DocSection>Linha do tempo</DocSection>
          <div className="relative px-2">
            <div className="absolute top-[7px] right-[7%] left-[7%] h-0.5 bg-[#1A56DB]" />
            <div className="relative grid grid-cols-7">
              {d.timeline.map((e) => (
                <div
                  key={e.kind}
                  className="flex flex-col items-center gap-1 text-center"
                >
                  <span
                    className={cn(
                      "h-4 w-4 rounded-full border-2 border-white",
                      e.time
                        ? "bg-[#1A56DB]"
                        : "bg-[#CBD5E1] ring-1 ring-[#CBD5E1]",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[13px] font-bold",
                      e.time ? "text-[#1E293B]" : "text-[#94A3B8]",
                    )}
                  >
                    {e.time || "—"}
                  </span>
                  <span className="text-[11.5px] text-[#64748B]">
                    {timelineLabel(e, d)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Tempo de anestesia", durations.anesthesia],
              ["Tempo cirúrgico", durations.surgery],
              ["Tempo em sala", durations.room],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex flex-col rounded-lg bg-[#F8FAFC] px-3 py-2"
              >
                <span className="text-xs text-[#64748B]">{label}</span>
                <span className="text-lg font-bold text-[#1E293B]">
                  {value}
                </span>
              </div>
            ))}
          </div>

          <DocSection>Técnica anestésica</DocSection>
          <div className="grid grid-cols-4 items-start gap-3">
            <Pick
              label="Técnica"
              required
              options={TECHNIQUES}
              value={d.technique}
              onChange={setTechnique}
              disabled={readOnly}
            />
            <Select
              label="ASA *"
              labelPlacement="outside"
              variant="bordered"
              disallowEmptySelection
              placeholder="Escolha"
              selectedKeys={d.asa ? [d.asa] : []}
              onSelectionChange={(k) => set("asa", firstKey(k))}
              isDisabled={readOnly}
              isInvalid={err(!d.asa)}
            >
              {ASA.map((a) => (
                <SelectItem key={a}>{a}</SelectItem>
              ))}
            </Select>
            <Pick
              label="Posição"
              options={POSITIONS}
              value={d.position}
              onChange={(v) => set("position", v)}
              disabled={readOnly}
            />
            <Measure
              label="Acesso venoso"
              required
              value={d.venousAccess}
              onChange={(v) => set("venousAccess", v)}
              invalid={err(!d.venousAccess.trim())}
            />
          </div>
          {needsNeedle && (
            <div
              className={cn(
                "grid items-start gap-3",
                neuraxial ? "grid-cols-5" : "grid-cols-2",
              )}
            >
              <Measure
                label="Agulha"
                required
                value={d.needle}
                onChange={(v) => set("needle", v)}
                invalid={err(!d.needle.trim())}
              />
              {neuraxial && (
                <Select
                  label="Espaço *"
                  labelPlacement="outside"
                  variant="bordered"
                  disallowEmptySelection
                  placeholder="Escolha"
                  selectedKeys={d.space ? [d.space] : []}
                  onSelectionChange={(k) => set("space", firstKey(k))}
                  isDisabled={readOnly}
                  isInvalid={err(!d.space)}
                >
                  {SPACES.map((o) => (
                    <SelectItem key={o}>{o}</SelectItem>
                  ))}
                </Select>
              )}
              {neuraxial && (
                <Measure
                  label="Punções"
                  value={d.punctures}
                  onChange={(v) => set("punctures", v.replace(/\D/g, ""))}
                />
              )}
              <Measure
                label="Anestésico local"
                required
                value={d.localAnesthetic}
                onChange={(v) => set("localAnesthetic", v)}
                invalid={err(!d.localAnesthetic.trim())}
              />
              {neuraxial && (
                <Select
                  label="Nível sensitivo *"
                  labelPlacement="outside"
                  variant="bordered"
                  disallowEmptySelection
                  placeholder="Escolha"
                  selectedKeys={d.sensoryLevel ? [d.sensoryLevel] : []}
                  onSelectionChange={(k) => set("sensoryLevel", firstKey(k))}
                  isDisabled={readOnly}
                  isInvalid={err(!d.sensoryLevel)}
                >
                  {SENSORY_LEVELS.map((o) => (
                    <SelectItem key={o}>{o}</SelectItem>
                  ))}
                </Select>
              )}
            </div>
          )}
          <CheckGroup
            label="Monitorização"
            required
            columns={4}
            options={MONITORING}
            value={d.monitoring}
            onChange={(v) => set("monitoring", v)}
            invalid={err(!d.monitoring.length)}
          />
          <div
            className={cn(
              "grid items-start gap-3",
              kind === "geral" ? "grid-cols-3" : "grid-cols-2",
            )}
          >
            <Select
              label="Via aérea"
              labelPlacement="outside"
              variant="bordered"
              disallowEmptySelection
              placeholder="Escolha"
              selectedKeys={d.airway ? [d.airway] : []}
              onSelectionChange={(k) => set("airway", firstKey(k))}
              isDisabled={readOnly}
            >
              {AIRWAYS.map((o) => (
                <SelectItem key={o}>{o}</SelectItem>
              ))}
            </Select>
            <Select
              label={kind === "geral" ? "Intubação *" : "Intubação"}
              labelPlacement="outside"
              variant="bordered"
              disallowEmptySelection
              placeholder="Escolha"
              selectedKeys={d.intubation ? [d.intubation] : []}
              onSelectionChange={(k) => set("intubation", firstKey(k))}
              isDisabled={readOnly}
              isInvalid={err(
                kind === "geral" &&
                  (!d.intubation || d.intubation === NOT_APPLICABLE),
              )}
            >
              {INTUBATION.map((o) => (
                <SelectItem key={o}>{o}</SelectItem>
              ))}
            </Select>
            {kind === "geral" && (
              <Pick
                label="Tubo endotraqueal"
                options={TUBES}
                value={d.tube}
                onChange={(v) => set("tube", v)}
                disabled={readOnly}
              />
            )}
          </div>
        </>
      ),
    },
    {
      title: "Sinais vitais e fármacos",
      sections: ["Complete horário"],
      content: (
        <>
          <DocSection>Sinais vitais intraoperatórios</DocSection>
          {d.vitals.length ? (
            <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-[#F8FAFC] text-left text-[11px] font-semibold tracking-wide text-[#94A3B8] uppercase">
                    <th className="px-3 py-2.5">Parâmetro</th>
                    {d.vitals.map((v) => (
                      <th key={v.time} className="px-3 py-2.5">
                        {v.time}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {VITAL_ROWS.map((row, i) => (
                    <tr key={row.label} className="border-t border-[#E2E8F0]">
                      <td className="px-3 py-2.5 font-semibold whitespace-nowrap text-[#1E293B]">
                        {row.label}
                      </td>
                      {d.vitals.map((v) => (
                        <td
                          key={v.time}
                          className={cn(
                            "px-3 py-2.5 text-[#1E293B]",
                            i === 0 &&
                              isHypotension(v, firstVital) &&
                              "font-bold text-[#B91C1C]",
                          )}
                        >
                          {row.value(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[12.5px] text-[#64748B]">
              Nenhuma aferição recebida do tablet da sala ainda.
            </p>
          )}

          <DocSection>Fármacos administrados</DocSection>
          <div className="flex flex-col gap-2">
            <FieldLabel>Fármacos</FieldLabel>
            <div className="rounded-lg border border-[#E2E8F0]">
              <div className="grid grid-cols-[84px_1fr_100px_96px_1.2fr_32px] gap-2 bg-[#F8FAFC] px-2 py-2 text-[11px] font-semibold tracking-wide text-[#94A3B8] uppercase">
                <span>Horário</span>
                <span>Fármaco</span>
                <span>Dose</span>
                <span>Via</span>
                <span>Observação</span>
                <span />
              </div>
              {d.drugs.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[84px_1fr_100px_96px_1.2fr_32px] items-center gap-2 border-t border-[#E2E8F0] px-2 py-1.5"
                >
                  <Input
                    aria-label="Horário"
                    type="time"
                    size="sm"
                    variant="bordered"
                    value={r.time}
                    onValueChange={(v) => setRow(r.id, { time: v })}
                    isInvalid={err(
                      !!(r.drug.trim() || r.dose.trim()) && !r.time,
                    )}
                  />
                  <Input
                    aria-label="Fármaco"
                    size="sm"
                    variant="bordered"
                    value={r.drug}
                    onValueChange={(v) => setRow(r.id, { drug: v })}
                    isInvalid={err(!!r.dose.trim() && !r.drug.trim())}
                  />
                  <Input
                    aria-label="Dose"
                    size="sm"
                    variant="bordered"
                    value={r.dose}
                    onValueChange={(v) => setRow(r.id, { dose: v })}
                    isInvalid={err(!!r.drug.trim() && !r.dose.trim())}
                  />
                  <Select
                    aria-label="Via"
                    size="sm"
                    variant="bordered"
                    disallowEmptySelection
                    selectedKeys={r.route ? [r.route] : []}
                    onSelectionChange={(k) =>
                      setRow(r.id, { route: firstKey(k) })
                    }
                    isDisabled={readOnly}
                  >
                    {ROUTES.map((o) => (
                      <SelectItem key={o}>{o}</SelectItem>
                    ))}
                  </Select>
                  <Input
                    aria-label="Observação"
                    size="sm"
                    variant="bordered"
                    value={r.note}
                    onValueChange={(v) => setRow(r.id, { note: v })}
                  />
                  {!readOnly && (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="bordered"
                      aria-label="Remover linha"
                      className="h-7 w-7 min-w-7"
                      onPress={() =>
                        set(
                          "drugs",
                          d.drugs.filter((x) => x.id !== r.id),
                        )
                      }
                    >
                      <LuX className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {!d.drugs.length && (
                <p className="border-t border-[#E2E8F0] px-3 py-3 text-[12.5px] text-[#64748B]">
                  Nenhum fármaco registrado.
                </p>
              )}
            </div>
            {!readOnly && (
              <Button
                size="sm"
                variant="bordered"
                className="w-fit bg-white font-semibold"
                startContent={<LuPlus className="h-3.5 w-3.5" />}
                onPress={() =>
                  set("drugs", [...d.drugs, newDrugRow({ time: MOCK_NOW })])
                }
              >
                Adicionar linha
              </Button>
            )}
          </div>
        </>
      ),
    },
    {
      title: "Balanço hídrico",
      sections: [],
      content: (
        <>
          <DocSection>Balanço hídrico</DocSection>
          <div className="grid grid-cols-[1fr_1fr_200px] items-start gap-3">
            <div className="flex flex-col gap-1 rounded-lg border border-[#E2E8F0] px-3 py-2.5">
              <span className="text-[12.5px] font-bold text-[#047857]">
                Entradas
              </span>
              <FluidLine
                label="Ringer lactato"
                value={d.ringer}
                onChange={(v) => set("ringer", v)}
                empty="—"
              />
              <FluidLine
                label="SF 0,9%"
                value={d.saline}
                onChange={(v) => set("saline", v)}
                empty="—"
              />
              <FluidLine
                label="Hemoderivados"
                value={d.blood}
                onChange={(v) => set("blood", v)}
                empty="Nenhum"
              />
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-[#E2E8F0] px-3 py-2.5">
              <span className="text-[12.5px] font-bold text-[#B91C1C]">
                Saídas
              </span>
              <FluidLine
                label="Diurese (SVD)"
                value={d.diuresis}
                onChange={(v) => set("diuresis", v)}
                empty="—"
              />
              <FluidLine
                label="Sangramento estimado"
                value={d.bleeding}
                onChange={(v) => set("bleeding", v)}
                empty="—"
              />
              <FluidLine
                label="Irrigação (líquido absorvido estimado)"
                value={d.irrigation}
                onChange={(v) => set("irrigation", v)}
                empty="—"
              />
            </div>
            <div className="flex flex-col rounded-lg bg-[#EBF0FE] px-3 py-2.5">
              <span className="text-xs text-[#1A56DB]">Balanço</span>
              <span className="text-xl font-bold text-[#1A56DB]">
                {fmtMl(balance)}
              </span>
              {mlOf(d.diuresis) === 0 && (
                <span className="text-[11px] text-[#64748B]">
                  Sem diurese registrada
                </span>
              )}
            </div>
          </div>
        </>
      ),
    },
    {
      title: "Saída e assinatura",
      sections: [
        "Responda se houve",
        "Descreva as intercorrências",
        "Escolha o destino",
        "Informe a condição",
      ],
      content: (
        <>
          <DocSection>Intercorrências e saída de sala</DocSection>
          <YesNo
            label="Houve intercorrências?"
            required
            value={d.incidents}
            onChange={(v) => set("incidents", v)}
            warnOn
            invalid={submitted}
          />
          {d.incidents && (
            <Textarea
              label="Descrição *"
              labelPlacement="outside"
              variant="bordered"
              minRows={2}
              placeholder="Horário, o que aconteceu e a conduta"
              value={d.incidentsText}
              onValueChange={(v) => set("incidentsText", v)}
              isInvalid={err(!d.incidentsText.trim())}
            />
          )}
          <div className="grid grid-cols-4 items-start gap-3">
            <Select
              label="Destino *"
              labelPlacement="outside"
              variant="bordered"
              disallowEmptySelection
              placeholder="Escolha"
              selectedKeys={d.destination ? [d.destination] : []}
              onSelectionChange={(k) => set("destination", firstKey(k))}
              isDisabled={readOnly}
              isInvalid={err(!d.destination)}
            >
              {DESTINATIONS.map((o) => (
                <SelectItem key={o}>{o}</SelectItem>
              ))}
            </Select>
            <Textarea
              label="Condição na saída *"
              labelPlacement="outside"
              variant="bordered"
              minRows={1}
              value={d.exitCondition}
              onValueChange={(v) => set("exitCondition", v)}
              isInvalid={err(!d.exitCondition.trim())}
            />
            <Select
              label="Aldrete na saída"
              labelPlacement="outside"
              variant="bordered"
              disallowEmptySelection
              placeholder="Escolha"
              selectedKeys={d.aldrete ? [d.aldrete] : []}
              onSelectionChange={(k) => set("aldrete", firstKey(k))}
              isDisabled={readOnly}
            >
              {ALDRETE.map((o) => (
                <SelectItem key={o}>{o}</SelectItem>
              ))}
            </Select>
            <Select
              label="Dor (EVA)"
              labelPlacement="outside"
              variant="bordered"
              disallowEmptySelection
              placeholder="Escolha"
              selectedKeys={d.pain ? [d.pain] : []}
              onSelectionChange={(k) => set("pain", firstKey(k))}
              isDisabled={readOnly}
            >
              {PAIN.map((o) => (
                <SelectItem key={o}>{o}</SelectItem>
              ))}
            </Select>
          </div>
          <Textarea
            label="Prescrição pós-anestésica"
            labelPlacement="outside"
            variant="bordered"
            minRows={2}
            value={d.postOpPrescription}
            onValueChange={(v) => set("postOpPrescription", v)}
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
                <SelectItem key={a.name}>{anesthetistLabel(a.name)}</SelectItem>
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
      icon={<LuSyringe />}
      title="Boletim anestésico"
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
      {!nav.isFirst ? null : readOnly ? (
        <InfoBox title="Dados do tablet da sala">{banner}</InfoBox>
      ) : (
        <ModelsBar
          models={ANESTHESIA_RECORD_MODELS.map((m) => m.name)}
          selected={model}
          onSelect={setModel}
          onApply={applyModel}
          applied={applied ? `${applied} ${banner}` : banner}
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
