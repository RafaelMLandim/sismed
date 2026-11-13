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
import {
  LuBedDouble,
  LuCircleAlert,
  LuCircleCheck,
  LuClock3,
  LuPlus,
  LuSparkles,
  LuX,
} from "react-icons/lu"

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
  InfoBox,
  Measure,
  ModelsBar,
  PendingBox,
  exclusive,
  firstKey,
} from "./fields"
import { StepsBar, StepsFooter, useDocSteps, type DocStep } from "./steps"
import { filled } from "./preOpAdmission"
import {
  ACCESS_CONDITIONS,
  ALDRETE,
  ALDRETE_COLUMNS,
  ALDRETE_EXIT,
  ALDRETE_MIN,
  ALLERGIES,
  ANESTHESIAS,
  ANESTHETISTS,
  BREATHING,
  CLOTS,
  COMORBIDITIES,
  CONSCIOUSNESS,
  DESTINATIONS,
  DEVICES,
  DRESSINGS,
  EFFLUENTS,
  ELIMINATIONS,
  EVA,
  FALL_RISKS,
  GENERAL_STATES,
  IRRIGATION,
  IRRIGATION_DEVICE,
  IRRIGATION_ON,
  NEEDS_O2,
  NEGA,
  NO_PAIN,
  NURSES,
  ORIGINS,
  PAIN,
  RESP_PATTERNS,
  SOLUTIONS,
  SRPA_MODELS,
  SRPA_PATIENT_FIELDS,
  SYMPTOMS,
  TECHS,
  TRANSPORTS,
  VENOUS_ACCESS,
  VITALS_STATES,
  aldreteTotal,
  blankSrpa,
  irrigationTotal,
  mapOf,
  newVitalRow,
  personLabel,
  sampleSrpa,
  srpaMissing,
  srpaText,
  type AldreteScore,
  type ISrpa,
  type ISrpaVital,
} from "./srpa"
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

/** Select de opções fixas, com placeholder e marcação de pendência. */
const Sel = ({
  label,
  required,
  options,
  value,
  onChange,
  invalid,
  disabled,
}: {
  label: string
  required?: boolean
  options: string[]
  value: string
  onChange: (v: string) => void
  invalid?: boolean
  disabled?: boolean
}) => (
  <Select
    label={required ? `${label} *` : label}
    labelPlacement="outside"
    variant="bordered"
    placeholder="Selecione"
    disallowEmptySelection
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

const SCORES = ["2", "1", "0"]

const VITAL_COLUMNS = [
  "Horário",
  "PAS (mmHg)",
  "PAD (mmHg)",
  "PAM (mmHg)",
  "FC (bpm)",
  "FR (mrm)",
  "Temp. (°C)",
  "SpO₂ (%)",
  "Suporte",
]
const VITAL_GRID =
  "grid grid-cols-[88px_repeat(7,minmax(0,1fr))_150px_32px] items-center gap-1.5"

/** PEP-D04 · Documento · Admissão e alta da SRPA (fiel ao desenho). */
export const SrpaModal = ({
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
  const doc = surgery.docs.alta_srpa
  const readOnly = doc.status === "assinado"

  const [d, setD] = useState<ISrpa>(() => {
    const saved = surgery.docData?.alta_srpa as ISrpa | undefined
    if (saved) return saved
    if (!patient) return {} as ISrpa
    return doc.status === "nao_iniciado"
      ? blankSrpa(surgery, patient)
      : sampleSrpa(surgery, patient, readOnly)
  })
  const [model, setModel] = useState<string>()
  const [applied, setApplied] = useState<string>()
  const [submitted, setSubmitted] = useState(false)

  const set = <K extends keyof ISrpa>(k: K, v: ISrpa[K]) =>
    setD((o) => ({ ...o, [k]: v }))
  // Sem paciente o estado é vazio ({}): nada é calculado e o modal não abre.
  const missing = patient ? srpaMissing(d) : []
  const err = (cond: boolean) => submitted && cond
  const needsO2 = NEEDS_O2.includes(d.breathing)
  const irrigating = d.irrigation === IRRIGATION_ON
  const exit = patient ? aldreteTotal(d.aldrete, ALDRETE_EXIT) : null

  const applyModel = () => {
    const m = SRPA_MODELS.find((x) => x.name === model)
    if (!m) return
    const keys = Object.keys(m.patch) as (keyof ISrpa)[]
    const kept = keys.filter(
      (k) => SRPA_PATIENT_FIELDS.includes(k) && filled(d[k]),
    )
    const patch = Object.fromEntries(
      keys.filter((k) => !kept.includes(k)).map((k) => [k, m.patch[k]]),
    )
    setD((o) => ({ ...o, ...patch }))
    setApplied(
      `Modelo “${m.name}” aplicado (${keys.length - kept.length} campos).${kept.length ? ` ${kept.length} ${kept.length === 1 ? "campo com dados deste paciente foi mantido" : "campos com dados deste paciente foram mantidos"}.` : ""} Revise antes de assinar.`,
    )
  }

  /** Marcar "Irrigação contínua" nos dispositivos abre o controle. */
  const setDevices = (v: string[]) =>
    setD((o) => {
      const added = v.includes(IRRIGATION_DEVICE)
      const removed =
        o.devices.includes(IRRIGATION_DEVICE) && !v.includes(IRRIGATION_DEVICE)
      return {
        ...o,
        devices: v,
        irrigation:
          added && o.irrigation !== IRRIGATION_ON
            ? IRRIGATION_ON
            : removed && o.irrigation === IRRIGATION_ON
              ? "Suspensa"
              : o.irrigation,
      }
    })

  const setIrrigation = (v: string) =>
    setD((o) => ({
      ...o,
      irrigation: v,
      devices:
        v === IRRIGATION_ON && !o.devices.includes(IRRIGATION_DEVICE)
          ? [...o.devices, IRRIGATION_DEVICE]
          : o.devices,
    }))

  /** "Sem dor" e "Dor" se excluem. */
  const setSymptoms = (v: string[]) => {
    const added = v.find((x) => !d.symptoms.includes(x))
    set(
      "symptoms",
      added === NO_PAIN
        ? v.filter((x) => x !== PAIN)
        : added === PAIN
          ? v.filter((x) => x !== NO_PAIN)
          : v,
    )
  }

  const setScore = (row: number, col: number, v: AldreteScore) =>
    setD((o) => ({
      ...o,
      aldrete: o.aldrete.map((r, i) =>
        i === row ? r.map((x, j) => (j === col ? v : x)) : r,
      ),
    }))

  const setVital = <K extends keyof ISrpaVital>(
    id: string,
    k: K,
    v: ISrpaVital[K],
  ) =>
    setD((o) => ({
      ...o,
      vitals: o.vitals.map((r) => (r.id === id ? { ...r, [k]: v } : r)),
    }))

  const save = (sign: boolean) => {
    setSubmitted(true)
    if (sign && missing.length) {
      nav.goToFirstPending()
      return
    }
    saveDoc(
      surgery.id,
      "alta_srpa",
      d,
      sign ? "assinado" : "em_preenchimento",
      d.nurse,
    )
    addToast({
      title: sign
        ? "Admissão e alta da SRPA assinada"
        : "Rascunho salvo · Admissão e alta da SRPA",
      description: sign
        ? `${personLabel(NURSES, d.nurse)} e ${personLabel(ANESTHETISTS, d.anesthetist)} · hoje, ${MOCK_NOW}`
        : "Continue quando quiser e assine depois.",
      color: "success",
    })
    onClose()
  }

  const buildSteps = (): DocStep[] => [
    {
      title: "Situação e background",
      sections: ["Situação:", "Background:"],
      content: (
        <>
          <DocSection>S · Situação</DocSection>
          <div className="grid grid-cols-4 items-start gap-3">
            <TimeField
              label="Horário de admissão na SRPA *"
              value={d.admittedAt}
              onChange={(v) => set("admittedAt", v)}
              invalid={err(!d.admittedAt)}
            />
            <Sel
              label="Procedência"
              options={ORIGINS}
              value={d.origin}
              onChange={(v) => set("origin", v)}
              disabled={readOnly}
            />
            <Sel
              label="Estado geral"
              required
              options={GENERAL_STATES}
              value={d.generalState}
              onChange={(v) => set("generalState", v)}
              invalid={err(!d.generalState)}
              disabled={readOnly}
            />
            <Sel
              label="Sinais vitais"
              required
              options={VITALS_STATES}
              value={d.vitalsState}
              onChange={(v) => set("vitalsState", v)}
              invalid={err(!d.vitalsState)}
              disabled={readOnly}
            />
          </div>
          {d.vitalsState === "Instáveis" && (
            <span className="-mt-2 text-[11px] font-semibold text-[#B45309]">
              Sinais vitais instáveis: comunique o médico.
            </span>
          )}
          <CheckGroup
            label="Nível de consciência"
            required
            columns={4}
            options={CONSCIOUSNESS}
            value={d.consciousness}
            onChange={(v) => set("consciousness", v)}
            invalid={err(!d.consciousness.length)}
          />
          <div className="grid grid-cols-3 items-start gap-3">
            <Sel
              label="Respiração"
              required
              options={BREATHING}
              value={d.breathing}
              onChange={(v) => set("breathing", v)}
              invalid={err(!d.breathing)}
              disabled={readOnly}
            />
            <div className="flex flex-col gap-1">
              <Measure
                label="O₂"
                unit="L/min"
                required={needsO2}
                value={d.o2Flow}
                onChange={(v) => set("o2Flow", v)}
                invalid={err(needsO2 && !d.o2Flow.trim())}
              />
              {needsO2 && (
                <span className="text-[11px] text-[#94A3B8]">
                  Obrigatório: {d.breathing}
                </span>
              )}
            </div>
            <Sel
              label="Padrão respiratório"
              required
              options={RESP_PATTERNS}
              value={d.respPattern}
              onChange={(v) => set("respPattern", v)}
              invalid={err(!d.respPattern)}
              disabled={readOnly}
            />
          </div>

          <DocSection>B · Background</DocSection>
          <div className="grid grid-cols-4 items-start gap-3">
            <Sel
              label="Alergias"
              required
              options={ALLERGIES}
              value={d.allergies}
              onChange={(v) => set("allergies", v)}
              invalid={err(!d.allergies)}
              disabled={readOnly}
            />
            <Sel
              label="Anestesia"
              required
              options={ANESTHESIAS}
              value={d.anesthesia}
              onChange={(v) => set("anesthesia", v)}
              invalid={err(!d.anesthesia)}
              disabled={readOnly}
            />
            <Sel
              label="Acesso venoso"
              required
              options={VENOUS_ACCESS}
              value={d.venousAccess}
              onChange={(v) => set("venousAccess", v)}
              invalid={err(!d.venousAccess)}
              disabled={readOnly}
            />
            <Sel
              label="Condição do acesso"
              required
              options={ACCESS_CONDITIONS}
              value={d.accessCondition}
              onChange={(v) => set("accessCondition", v)}
              invalid={err(!d.accessCondition)}
              disabled={readOnly}
            />
          </div>
          {d.allergies === "Sim" && (
            <Input
              label="Quais alergias? *"
              labelPlacement="outside"
              variant="bordered"
              value={d.allergiesText}
              onValueChange={(v) => set("allergiesText", v)}
              isInvalid={err(!d.allergiesText.trim())}
            />
          )}
          <CheckGroup
            label="Comorbidades"
            columns={3}
            options={COMORBIDITIES}
            value={d.comorbidities}
            onChange={(v) =>
              set("comorbidities", exclusive(v, d.comorbidities, NEGA))
            }
          />
          <div className="grid grid-cols-2 items-start gap-3">
            <Sel
              label="Solução"
              options={SOLUTIONS}
              value={d.solution}
              onChange={(v) => set("solution", v)}
              disabled={readOnly}
            />
            <Sel
              label="Curativo"
              required
              options={DRESSINGS}
              value={d.dressing}
              onChange={(v) => set("dressing", v)}
              invalid={err(!d.dressing)}
              disabled={readOnly}
            />
          </div>
          <CheckGroup
            label="Dispositivos"
            columns={4}
            options={DEVICES}
            value={d.devices}
            onChange={setDevices}
          />
        </>
      ),
    },
    {
      title: "Avaliação e Aldrete",
      sections: ["Avaliação:", "Aldrete e Kroulik:"],
      content: (
        <>
          <DocSection>A · Avaliação</DocSection>
          <CheckGroup
            label="Sintomas"
            required
            columns={3}
            options={SYMPTOMS}
            value={d.symptoms}
            onChange={setSymptoms}
            invalid={err(!d.symptoms.length)}
          />
          <CheckGroup
            label="Eliminações"
            columns={4}
            options={ELIMINATIONS}
            value={d.eliminations}
            onChange={(v) => set("eliminations", v)}
          />
          <div className="grid grid-cols-2 items-start gap-3">
            <Sel
              label="EVA (de 10)"
              required
              options={EVA}
              value={d.eva}
              onChange={(v) => set("eva", v)}
              invalid={err(!d.eva)}
              disabled={readOnly}
            />
            <Sel
              label="Risco de queda"
              required
              options={FALL_RISKS}
              value={d.fallRisk}
              onChange={(v) => set("fallRisk", v)}
              invalid={err(!d.fallRisk)}
              disabled={readOnly}
            />
          </div>

          <DocSection>Escala de Aldrete e Kroulik</DocSection>
          <div className="overflow-hidden rounded-lg border border-[#E2E8F0]">
            <div className="grid grid-cols-[minmax(0,1fr)_repeat(5,88px)] gap-2 bg-[#F8FAFC] px-3 py-2 text-[11px] font-semibold tracking-wide text-[#94A3B8] uppercase">
              <span>Critério</span>
              {ALDRETE_COLUMNS.map((c) => (
                <span key={c} className="text-center">
                  {c}
                </span>
              ))}
            </div>
            {ALDRETE.map((c, row) => (
              <div
                key={c.label}
                className="grid grid-cols-[minmax(0,1fr)_repeat(5,88px)] items-center gap-2 border-t border-[#E2E8F0] px-3 py-2.5"
              >
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-[#1E293B]">
                    {c.label}
                  </span>
                  {c.levels.map((l) => (
                    <span key={l} className="text-[11px] text-[#94A3B8]">
                      {l}
                    </span>
                  ))}
                </div>
                {ALDRETE_COLUMNS.map((col, j) => {
                  const v = d.aldrete[row]?.[j]
                  return (
                    <Select
                      key={col}
                      aria-label={`${c.label} · ${col}`}
                      size="sm"
                      variant="bordered"
                      placeholder="—"
                      selectedKeys={
                        v === null || v === undefined ? [] : [String(v)]
                      }
                      onSelectionChange={(k) => {
                        const key = firstKey(k)
                        setScore(
                          row,
                          j,
                          key === "" ? null : (Number(key) as AldreteScore),
                        )
                      }}
                      isInvalid={
                        err(v === null || v === undefined) &&
                        (j === 0 || j === ALDRETE_EXIT)
                      }
                      isDisabled={readOnly}
                    >
                      {SCORES.map((s) => (
                        <SelectItem key={s}>{s}</SelectItem>
                      ))}
                    </Select>
                  )
                })}
              </div>
            ))}
            <div className="grid grid-cols-[minmax(0,1fr)_repeat(5,88px)] items-center gap-2 border-t border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5">
              <span className="text-[13px] font-bold text-[#1E293B]">
                Total
              </span>
              {ALDRETE_COLUMNS.map((col, j) => {
                const t = aldreteTotal(d.aldrete, j)
                return (
                  <span
                    key={col}
                    className={cn(
                      "text-center text-[15px] font-bold",
                      t === null
                        ? "text-[#CBD5E1]"
                        : t >= ALDRETE_MIN
                          ? "text-[#047857]"
                          : "text-[#B45309]",
                    )}
                  >
                    {t ?? "—"}
                  </span>
                )
              })}
            </div>
          </div>
          {exit === null ? (
            <InfoBox title="Critério de alta da SRPA">
              Preencha a coluna Saída. A alta exige Aldrete e Kroulik igual ou
              maior que {ALDRETE_MIN}.
            </InfoBox>
          ) : (
            <div
              className={cn(
                "flex flex-col gap-0.5 rounded-lg border-l-4 px-3.5 py-2.5 text-[12.5px]",
                exit >= ALDRETE_MIN
                  ? "border-[#10B981] bg-[#ECFDF5]"
                  : "border-[#EF4444] bg-[#FEF2F2]",
              )}
            >
              <span
                className={cn(
                  "flex items-center gap-1.5 font-bold",
                  exit >= ALDRETE_MIN ? "text-[#047857]" : "text-[#B91C1C]",
                )}
              >
                {exit >= ALDRETE_MIN ? (
                  <LuCircleCheck className="h-3.5 w-3.5" />
                ) : (
                  <LuCircleAlert className="h-3.5 w-3.5" />
                )}
                {exit >= ALDRETE_MIN
                  ? "Critério de alta da SRPA atingido"
                  : "Critério de alta da SRPA não atingido"}
              </span>
              <span className="pl-5 text-[#1E293B]">
                • Aldrete e Kroulik de saída {exit}/10 (critério: igual ou maior
                que {ALDRETE_MIN}).
                {exit < ALDRETE_MIN &&
                  " Mantenha o paciente na SRPA e reavalie antes de assinar."}
              </span>
            </div>
          )}
        </>
      ),
    },
    {
      title: "Sinais vitais e irrigação",
      sections: ["Sinais vitais:", "Irrigação vesical:"],
      content: (
        <>
          <DocSection>Sinais vitais e monitorização geral</DocSection>
          <div className="flex flex-col gap-2">
            <FieldLabel required>Sinais vitais</FieldLabel>
            <div
              className={cn(
                "flex flex-col gap-1.5 rounded-lg border p-2",
                err(
                  !d.vitals.some(
                    (v) =>
                      v.time &&
                      v.sys.trim() &&
                      v.dia.trim() &&
                      v.hr.trim() &&
                      v.spo2.trim(),
                  ),
                )
                  ? "border-[#EF4444]"
                  : "border-[#E2E8F0]",
              )}
            >
              <div
                className={cn(
                  VITAL_GRID,
                  "px-1 text-[10.5px] font-semibold tracking-wide text-[#94A3B8] uppercase",
                )}
              >
                {VITAL_COLUMNS.map((c) => (
                  <span key={c}>{c}</span>
                ))}
                <span />
              </div>
              {d.vitals.map((r) => (
                <div key={r.id} className={VITAL_GRID}>
                  <Input
                    type="time"
                    aria-label="Horário"
                    size="sm"
                    variant="bordered"
                    value={r.time}
                    onValueChange={(v) => setVital(r.id, "time", v)}
                  />
                  {(["sys", "dia"] as const).map((k) => (
                    <Input
                      key={k}
                      aria-label={k === "sys" ? "PAS" : "PAD"}
                      size="sm"
                      variant="bordered"
                      value={r[k]}
                      onValueChange={(v) => setVital(r.id, k, v)}
                    />
                  ))}
                  <Input
                    aria-label="PAM (calculada)"
                    size="sm"
                    variant="bordered"
                    isReadOnly
                    value={mapOf(r.sys, r.dia)}
                    classNames={{ inputWrapper: "bg-[#F8FAFC]" }}
                  />
                  {(["hr", "rr", "temp", "spo2"] as const).map((k) => (
                    <Input
                      key={k}
                      aria-label={
                        {
                          hr: "FC",
                          rr: "FR",
                          temp: "Temperatura",
                          spo2: "SpO₂",
                        }[k]
                      }
                      size="sm"
                      variant="bordered"
                      value={r[k]}
                      onValueChange={(v) => setVital(r.id, k, v)}
                    />
                  ))}
                  <Select
                    aria-label="Suporte"
                    size="sm"
                    variant="bordered"
                    placeholder="—"
                    selectedKeys={r.support ? [r.support] : []}
                    onSelectionChange={(k) =>
                      setVital(r.id, "support", firstKey(k))
                    }
                    isDisabled={readOnly}
                  >
                    {BREATHING.map((o) => (
                      <SelectItem key={o}>{o}</SelectItem>
                    ))}
                  </Select>
                  {!readOnly && d.vitals.length > 1 ? (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      aria-label="Remover linha"
                      onPress={() =>
                        set(
                          "vitals",
                          d.vitals.filter((x) => x.id !== r.id),
                        )
                      }
                    >
                      <LuX className="h-3.5 w-3.5 text-[#94A3B8]" />
                    </Button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
            {!readOnly && (
              <Button
                size="sm"
                variant="bordered"
                className="self-start font-semibold"
                startContent={<LuPlus className="h-3.5 w-3.5" />}
                onPress={() =>
                  set("vitals", [
                    ...d.vitals,
                    newVitalRow(MOCK_NOW, d.vitals.at(-1)?.support ?? ""),
                  ])
                }
              >
                Adicionar linha
              </Button>
            )}
          </div>

          <DocSection>Controle de irrigação vesical contínua</DocSection>
          <div className="grid grid-cols-4 items-start gap-3">
            <Sel
              label="Irrigação vesical contínua"
              options={IRRIGATION}
              value={d.irrigation}
              onChange={setIrrigation}
              disabled={readOnly}
            />
            {irrigating && (
              <>
                <Input
                  label="SVD Foley nº *"
                  labelPlacement="outside"
                  variant="bordered"
                  placeholder="Ex.: 22 · 3 vias"
                  value={d.foley}
                  onValueChange={(v) => set("foley", v)}
                  isInvalid={err(!d.foley.trim())}
                />
                <Sel
                  label="Solução utilizada"
                  required
                  options={SOLUTIONS.filter((s) => s !== "Sem solução")}
                  value={d.irrigSolution}
                  onChange={(v) => set("irrigSolution", v)}
                  invalid={err(!d.irrigSolution)}
                  disabled={readOnly}
                />
                <Measure
                  label="Bolsas instaladas"
                  required
                  value={d.bags}
                  onChange={(v) => set("bags", v)}
                  invalid={err(!d.bags.trim())}
                />
              </>
            )}
          </div>
          {irrigating && (
            <div className="grid grid-cols-4 items-start gap-3">
              <Measure
                label="Volume por bolsa"
                unit="ml"
                required
                value={d.bagVolume}
                onChange={(v) => set("bagVolume", v)}
                invalid={err(!d.bagVolume.trim())}
              />
              <div className="flex flex-col gap-1">
                <Measure
                  label="Volume total infundido"
                  unit="ml"
                  value={irrigationTotal(d.bags, d.bagVolume)}
                  readOnly
                  muted
                />
                <span className="text-[11px] text-[#94A3B8]">
                  Calculado: bolsas × volume
                </span>
              </div>
              <Sel
                label="Aspecto do efluente"
                required
                options={EFFLUENTS}
                value={d.effluent}
                onChange={(v) => set("effluent", v)}
                invalid={err(!d.effluent)}
                disabled={readOnly}
              />
              <Sel
                label="Coágulos"
                required
                options={CLOTS}
                value={d.clots}
                onChange={(v) => set("clots", v)}
                invalid={err(!d.clots)}
                disabled={readOnly}
              />
            </div>
          )}
        </>
      ),
    },
    {
      title: "Alta e assinaturas",
      sections: ["Alta da SRPA:", "Assinaturas:"],
      content: (
        <>
          <DocSection>Alta da SRPA</DocSection>
          <div className="grid grid-cols-4 items-start gap-3">
            <TimeField
              label="Hora da alta *"
              value={d.dischargeAt}
              onChange={(v) => set("dischargeAt", v)}
              invalid={err(!d.dischargeAt)}
            />
            <Sel
              label="Destino"
              required
              options={DESTINATIONS}
              value={d.destination}
              onChange={(v) => set("destination", v)}
              invalid={err(!d.destination)}
              disabled={readOnly}
            />
            <Sel
              label="Transporte"
              required
              options={TRANSPORTS}
              value={d.transport}
              onChange={(v) => set("transport", v)}
              invalid={err(!d.transport)}
              disabled={readOnly}
            />
            <Sel
              label="EVA na alta (de 10)"
              required
              options={EVA}
              value={d.evaDischarge}
              onChange={(v) => set("evaDischarge", v)}
              invalid={err(!d.evaDischarge)}
              disabled={readOnly}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <FieldLabel required>
                Evolução de enfermagem · alta da SRPA
              </FieldLabel>
              {!readOnly && (
                <Button
                  size="sm"
                  variant="bordered"
                  className="font-semibold"
                  startContent={<LuSparkles className="h-3.5 w-3.5" />}
                  onPress={() => patient && set("text", srpaText(d, patient))}
                >
                  Gerar texto a partir das marcações
                </Button>
              )}
            </div>
            <Textarea
              aria-label="Evolução de enfermagem · alta da SRPA"
              variant="bordered"
              minRows={5}
              value={d.text}
              onValueChange={(v) => set("text", v)}
              isInvalid={err(!d.text.trim())}
            />
            <span className="text-[11px] text-[#94A3B8]">
              Revise e complemente o texto antes de assinar.
            </span>
          </div>

          <DocSection>Assinaturas</DocSection>
          <div className="grid grid-cols-3 items-start gap-3">
            <Select
              label="Técnico de enfermagem"
              labelPlacement="outside"
              variant="bordered"
              placeholder="Nome e COREN"
              selectedKeys={d.tech ? [d.tech] : []}
              onSelectionChange={(k) => set("tech", firstKey(k))}
              isDisabled={readOnly}
            >
              {TECHS.map((t) => (
                <SelectItem key={t.name}>
                  {personLabel(TECHS, t.name)}
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
              {NURSES.map((n) => (
                <SelectItem key={n.name}>
                  {personLabel(NURSES, n.name)}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Anestesiologista *"
              labelPlacement="outside"
              variant="bordered"
              placeholder="Nome e CRM"
              selectedKeys={d.anesthetist ? [d.anesthetist] : []}
              onSelectionChange={(k) => set("anesthetist", firstKey(k))}
              isInvalid={err(!d.anesthetist)}
              isDisabled={readOnly}
            >
              {ANESTHETISTS.map((a) => (
                <SelectItem key={a.name}>
                  {personLabel(ANESTHETISTS, a.name)}
                </SelectItem>
              ))}
            </Select>
          </div>
        </>
      ),
    },
  ]
  const steps = patient ? buildSteps() : []
  const nav = useDocSteps(steps, missing)

  if (!patient) return null

  return (
    <MapModal
      width={960}
      icon={<LuBedDouble />}
      title="Admissão e alta da SRPA"
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
          models={SRPA_MODELS.map((m) => m.name)}
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
