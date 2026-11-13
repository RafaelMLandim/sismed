"use client"

import { Input, Select, SelectItem, Textarea, addToast } from "@heroui/react"
import { useState, type ReactNode } from "react"
import { LuCheck, LuClipboardCheck, LuClock3 } from "react-icons/lu"

import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import type { ISurgery } from "../../_data/types"
import { MapModal } from "../mapa/MapModal"
import { Chip } from "../ui"
import {
  DocBadge,
  DocPatientLine,
  FieldLabel,
  ModelsBar,
  PendingBox,
  Pills,
  firstKey,
} from "./fields"
import { filled } from "./preOpAdmission"
import { StepsFooter, useDocSteps, type DocStep } from "./steps"
import {
  ANS_LABEL,
  CHECKLIST_MODELS,
  COUNT_ITEMS,
  NURSES,
  PATIENT_FIELDS,
  PHASES,
  QUESTIONS,
  SIDES,
  SN,
  SNNA,
  airwayRisk,
  anesthetistsFor,
  blankChecklist,
  checklistMissing,
  countState,
  divergentItems,
  phaseItems,
  proLabel,
  sampleChecklist,
  surgeonsFor,
  type CountItem,
  type ICount,
  type ISafetyChecklist,
  type QuestionKey,
} from "./safetyChecklist"
import { cn } from "@/shared/utils/cn"

/** Título de fase com a situação à direita ("Completa" / "Faltam N"). */
const PhaseHead = ({
  children,
  left,
}: {
  children: ReactNode
  left: number
}) => (
  <h3 className="mt-2 flex items-center justify-between border-b border-[#E2E8F0] pb-2 text-[13px] font-bold text-[#1A56DB]">
    {children}
    {left ? (
      <Chip tone="warning" icon={LuClock3}>
        Faltam {left}
      </Chip>
    ) : (
      <Chip tone="success" icon={LuCheck}>
        Completa
      </Chip>
    )}
  </h3>
)

/** Cartão de fase no topo, com contador e barra de progresso. */
const PhaseTab = ({
  label,
  done,
  total,
  onPress,
  active,
  pending,
}: {
  label: string
  done: number
  total: number
  onPress: () => void
  /** Etapa aberta agora. */
  active?: boolean
  /** Pendências desta etapa depois de tentar assinar (borda vermelha). */
  pending?: boolean
}) => {
  const complete = done === total
  return (
    <button
      type="button"
      onClick={onPress}
      aria-current={active ? "step" : undefined}
      className={cn(
        "pointer-events-auto flex flex-col gap-2 rounded-lg border px-3 py-2.5 text-left",
        complete
          ? "border-[#10B981] bg-[#ECFDF5]"
          : pending
            ? "border-[#FCA5A5] bg-[#FEF2F2]"
            : "border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]",
        active && "ring-2 ring-[#1A56DB] ring-offset-1",
      )}
    >
      <span
        className={cn(
          "flex items-center justify-between text-xs font-semibold",
          complete ? "text-[#047857]" : "text-[#1E293B]",
        )}
      >
        {label}
        <span>
          {done}/{total}
        </span>
      </span>
      <span className="h-1 overflow-hidden rounded-full bg-[#E2E8F0]">
        <span
          className={cn(
            "block h-full rounded-full",
            complete ? "bg-[#10B981]" : "bg-[#1A56DB]",
          )}
          style={{ width: `${(done / total) * 100}%` }}
        />
      </span>
    </button>
  )
}

/** Campo de texto condicional/obrigatório. */
const TextField = ({
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
    label={`${label} *`}
    labelPlacement="outside"
    variant="bordered"
    placeholder={placeholder ?? " "}
    value={value}
    onValueChange={onChange}
    isInvalid={invalid}
    isReadOnly={readOnly}
    classNames={readOnly ? { inputWrapper: "bg-[#F8FAFC]" } : undefined}
  />
)

const CELL =
  "flex h-9 items-center rounded-md border border-[#E2E8F0] px-2.5 text-[12.5px]"

/** PEP-D02 · Documento · Check list de cirurgia segura (fiel ao desenho). */
export const SafetyChecklistModal = ({
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
  const doc = surgery.docs.checklist
  const readOnly = doc.status === "assinado"

  const [d, setD] = useState<ISafetyChecklist>(() => {
    const saved = surgery.docData?.checklist as ISafetyChecklist | undefined
    if (saved) return saved
    if (!patient) return {} as ISafetyChecklist
    return doc.status === "nao_iniciado"
      ? blankChecklist(surgery, patient)
      : sampleChecklist(surgery, patient, readOnly)
  })
  const [model, setModel] = useState<string>()
  const [applied, setApplied] = useState<string>()
  const [submitted, setSubmitted] = useState(false)
  const surgeons = surgeonsFor(surgery)
  const anesthetists = anesthetistsFor(surgery)
  const set = <K extends keyof ISafetyChecklist>(
    k: K,
    v: ISafetyChecklist[K],
  ) => setD((o) => ({ ...o, [k]: v }))
  const setCount = (item: CountItem, patch: Partial<ICount>) =>
    setD((o) => ({
      ...o,
      counts: { ...o.counts, [item]: { ...o.counts[item], ...patch } },
    }))
  const missing = checklistMissing(d)
  const phases = phaseItems(d)
  const err = (cond: boolean) => submitted && cond
  const divergent = divergentItems(d)

  const question = (k: keyof typeof QUESTIONS) => {
    const q = QUESTIONS[k]
    return (
      <Pills
        label={q.label}
        required
        options={q.na ? SNNA : SN}
        value={d[k]}
        onChange={(v) => set(k as QuestionKey, v)}
        labelOf={(v) => ANS_LABEL[v]}
        toneOf={(v) => (q.warn.includes(v) ? "warning" : "primary")}
        invalid={submitted}
      />
    )
  }

  const applyModel = () => {
    const m = CHECKLIST_MODELS.find((x) => x.name === model)
    if (!m) return
    const keys = Object.keys(m.patch) as (keyof ISafetyChecklist)[]
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
      "checklist",
      d,
      sign ? "assinado" : "em_preenchimento",
      d.nurse,
    )
    addToast({
      title: sign
        ? "Check list de cirurgia segura assinado"
        : "Rascunho salvo · Check list de cirurgia segura",
      description: sign
        ? `${proLabel(NURSES, d.nurse)} · hoje, ${MOCK_NOW}`
        : "Continue quando quiser e assine depois.",
      color: "success",
    })
    onClose()
  }

  const head = (i: number) => (
    <PhaseHead left={phases[i].filter((x) => !x.ok).length}>
      {PHASES[i].title}
    </PhaseHead>
  )

  const signer = (
    label: string,
    key: "nurse" | "surgeon" | "anesthetist",
    list: { name: string; council: string }[],
  ) => (
    <Select
      label={`${label} *`}
      labelPlacement="outside"
      variant="bordered"
      placeholder="Nome e registro"
      selectedKeys={d[key] ? [d[key]] : []}
      onSelectionChange={(k) => set(key, firstKey(k))}
      isInvalid={err(!d[key])}
      isDisabled={readOnly}
    >
      {list.map((p) => (
        <SelectItem key={p.name}>{proLabel(list, p.name)}</SelectItem>
      ))}
    </Select>
  )

  const steps: DocStep[] = [
    {
      title: PHASES[0].tab,
      sections: [PHASES[0].title],
      content: (
        <>
          {/* ── Fase 1 ── */}
          {head(0)}
          {question("askedPatient")}
          {question("confirmed")}
          {question("consent")}
          {question("imaging")}
          {question("limitation")}
          {d.limitation === "sim" && (
            <TextField
              label="Qual limitação?"
              placeholder="Limitação e cuidado no posicionamento"
              value={d.limitationText}
              onChange={(v) => set("limitationText", v)}
              invalid={err(!d.limitationText.trim())}
            />
          )}
          {question("anesthesiaCart")}
          {question("oximeter")}
          {question("allergy")}
          {d.allergy === "sim" && (
            <TextField
              label="Qual alergia?"
              value={d.allergyText}
              onChange={(v) => set("allergyText", v)}
              invalid={err(!d.allergyText.trim())}
            />
          )}
          {question("difficultAirway")}
          {question("aspiration")}
          {question("airwayKit")}
          {airwayRisk(d) && d.airwayKit === "na" && (
            <span className="-mt-2 text-[11px] text-[#B91C1C]">
              Risco de via aérea marcado: confirme se há kit (Sim ou Não).
            </span>
          )}
          {question("bloodLoss")}
        </>
      ),
    },
    {
      title: PHASES[1].tab,
      sections: [PHASES[1].title],
      content: (
        <>
          {/* ── Fase 2 ── */}
          {head(1)}
          {question("teamIntro")}
          {question("teamConfirmed")}
          <div className="grid grid-cols-2 items-start gap-3">
            <TextField
              label="Identificação do paciente"
              value={d.patientId}
              readOnly
            />
            <TextField
              label="Local e marcação"
              placeholder="Ex.: Quadril esquerdo, demarcado"
              value={d.site}
              onChange={(v) => set("site", v)}
              invalid={err(!d.site.trim())}
            />
          </div>
          <div className="grid grid-cols-3 items-start gap-3">
            <Select
              label="Lateralidade *"
              labelPlacement="outside"
              variant="bordered"
              placeholder="Selecione"
              disallowEmptySelection
              selectedKeys={d.side ? [d.side] : []}
              onSelectionChange={(k) => set("side", firstKey(k))}
              isInvalid={err(!d.side)}
              isDisabled={readOnly}
            >
              {SIDES.map((o) => (
                <SelectItem key={o}>{o}</SelectItem>
              ))}
            </Select>
            <TextField
              label="Procedimento"
              value={d.procedure}
              onChange={(v) => set("procedure", v)}
              invalid={err(!d.procedure.trim())}
            />
            <TextField
              label="Duração estimada"
              placeholder="Ex.: 2 h"
              value={d.duration}
              onChange={(v) => set("duration", v)}
              invalid={err(!d.duration.trim())}
            />
          </div>
          {question("criticalSteps")}
          {question("antibiotic")}
          {d.antibiotic === "sim" && (
            <TextField
              label="Qual antibiótico?"
              placeholder="Nome, dose, via e horário"
              value={d.antibioticText}
              onChange={(v) => set("antibioticText", v)}
              invalid={err(!d.antibioticText.trim())}
            />
          )}
          {question("sterility")}
          {question("equipmentConcern")}
        </>
      ),
    },
    {
      title: PHASES[2].tab,
      sections: [PHASES[2].title, "Assinaturas"],
      content: (
        <>
          {/* ── Fase 3 ── */}
          {head(2)}
          {question("procedureMatches")}
          {question("differentCode")}
          {question("patientConcern")}

          <div className="flex flex-col gap-2">
            <FieldLabel required>
              Revisão da enfermagem (instrumentador): contagem
            </FieldLabel>
            <div className="flex flex-col gap-1.5 rounded-lg border border-[#E2E8F0] p-2">
              <div className="grid grid-cols-[1fr_1.5fr_1.5fr_1.5fr] gap-1.5 px-1 text-[10.5px] font-semibold tracking-wide text-[#94A3B8] uppercase">
                <span>Item</span>
                <span>Oferecidos</span>
                <span>Devolvidos</span>
                <span>Nº oferecido igual ao devolvido?</span>
              </div>
              {COUNT_ITEMS.map((item) => {
                const c = d.counts[item]
                const state = countState(c)
                return (
                  <div
                    key={item}
                    className="grid grid-cols-[1fr_1.5fr_1.5fr_1.5fr] gap-1.5"
                  >
                    <span className={cn(CELL, "font-semibold text-[#1E293B]")}>
                      {item}
                    </span>
                    {(["offered", "returned"] as const).map((f) => (
                      <Input
                        key={f}
                        aria-label={`${item}: ${f === "offered" ? "oferecidos" : "devolvidos"}`}
                        size="sm"
                        variant="bordered"
                        inputMode="numeric"
                        value={c[f]}
                        onValueChange={(v) =>
                          setCount(item, { [f]: v.replace(/\D/g, "") })
                        }
                        isInvalid={err(!c[f].trim())}
                        classNames={{ inputWrapper: "bg-[#F8FAFC]" }}
                      />
                    ))}
                    <span
                      className={cn(
                        CELL,
                        "font-semibold",
                        state === "igual" && "text-[#047857]",
                        state === "divergente" && "text-[#B91C1C]",
                        state === "incompleta" && "font-normal text-[#94A3B8]",
                      )}
                    >
                      {state === "igual"
                        ? "Sim"
                        : state === "divergente"
                          ? "Não, divergente"
                          : "—"}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Textarea
              label={`Justificativa e conduta em caso de divergência na contagem${divergent.length ? " *" : ""}`}
              labelPlacement="outside"
              variant="bordered"
              placeholder={divergent.length ? " " : "Sem divergência"}
              minRows={2}
              value={d.countNote}
              onValueChange={(v) => set("countNote", v)}
              isInvalid={divergent.length > 0 && !d.countNote.trim()}
            />
            {divergent.length > 0 && (
              <span className="text-[11px] text-[#B91C1C]">
                Obrigatória: contagem de{" "}
                {divergent.map((x) => x.toLowerCase()).join(" e ")}{" "}
                {divergent.length > 1 ? "divergentes" : "divergente"}.
              </span>
            )}
          </div>
          {question("equipmentProblem")}
          {question("specimen")}
          {question("recoveryReview")}

          <h3 className="mt-2 border-b border-[#E2E8F0] pb-2 text-[13px] font-bold text-[#1A56DB]">
            Assinaturas
          </h3>
          <div className="grid grid-cols-3 items-start gap-3">
            {signer("Enfermagem (COREN-DF)", "nurse", NURSES)}
            {signer("Cirurgião", "surgeon", surgeons)}
            {signer("Anestesista", "anesthetist", anesthetists)}
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
      icon={<LuClipboardCheck />}
      title="Check list de cirurgia segura"
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
          models={CHECKLIST_MODELS.map((m) => m.name)}
          selected={model}
          onSelect={setModel}
          onApply={applyModel}
          applied={applied}
        />
      )}
      {submitted && <PendingBox items={missing} />}

      {nav.isFirst && (
        <p className="text-xs text-[#64748B]">
          <span className="font-semibold text-[#EF4444]">*</span> Obrigatório
          para assinar. Campos condicionais passam a ser exigidos conforme as
          respostas.
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {PHASES.map((p, i) => (
          <PhaseTab
            key={p.tab}
            label={p.tab}
            done={phases[i].filter((x) => x.ok).length}
            total={phases[i].length}
            onPress={() => nav.setStep(i)}
            active={nav.step === i}
            pending={submitted && nav.pendingOf(i) > 0}
          />
        ))}
      </div>

      <fieldset
        disabled={readOnly}
        className={cn("flex flex-col gap-4", readOnly && "pointer-events-none")}
      >
        {nav.content}
      </fieldset>
    </MapModal>
  )
}
