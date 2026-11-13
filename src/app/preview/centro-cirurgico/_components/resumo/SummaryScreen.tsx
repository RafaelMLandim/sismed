"use client"

import { Button, addToast } from "@heroui/react"
import Link from "next/link"
import { useMemo, useState, type ReactNode } from "react"
import type { IconType } from "react-icons"
import {
  LuArrowRight,
  LuBedDouble,
  LuBellRing,
  LuCheck,
  LuFileText,
  LuFolderOpen,
  LuHeartPulse,
  LuListChecks,
  LuPill,
  LuPlus,
  LuPrinter,
  LuScissors,
  LuStethoscope,
  LuTimer,
} from "react-icons/lu"

import { TODAY_ISO, dayLabel, isoToBR } from "../../_data/days"
import { DOC_META, MOCK_NOW, docsOfPhase } from "../../_data/fixtures"
import { roleLabel } from "../../_data/evolutions"
import { missingDocs, useCC } from "../../_data/store"
import { fromMin, toMin } from "../../_data/time"
import type { DocPhase, IEvolution, ISurgery } from "../../_data/types"
import { EvolutionModal } from "../evolucoes/EvolutionModal"
import { BASE } from "../MockShell"
import { RegisterVitalsModal } from "../sinais/RegisterVitalsModal"
import {
  VITAL_META,
  alertsOf,
  byTime,
  joinLabels,
  nextReading,
  statusOf,
  valueOf,
  type VitalKey,
} from "../sinais/rules"
import {
  CARD,
  OUTLINE_BUTTON,
  PRIMARY_BUTTON,
} from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

const LABEL =
  "text-[10.5px] font-bold tracking-[0.8px] text-[#94A3B8] uppercase"

/** Fase do fluxo em que a cirurgia está (documentos que importam agora). */
const PHASE_OF: Partial<Record<ISurgery["stage"], DocPhase>> = {
  agendada: "antes",
  em_cirurgia: "sala",
  srpa: "srpa",
}

const STAGE_BADGE: Record<
  ISurgery["stage"],
  { label: (s: ISurgery) => string; tone: string }
> = {
  a_alocar: {
    label: () => "Cirurgia aguardando sala",
    tone: "bg-[#F8FAFC] text-[#64748B]",
  },
  agendada: {
    label: (s) =>
      s.date === TODAY_ISO
        ? `Pré-operatório · cirurgia hoje às ${s.start}`
        : `Cirurgia ${s.date ? dayLabel(s.date) : ""} às ${s.start}`,
    tone: "bg-[#FFFBEB] text-[#B45309]",
  },
  em_cirurgia: {
    label: () => "Em cirurgia",
    tone: "bg-[#EBF0FE] text-[#1A56DB]",
  },
  srpa: {
    label: () => "Na recuperação (SRPA)",
    tone: "bg-[#F3EEFF] text-[#5B21B6]",
  },
  finalizada: {
    label: () => "Pós-operatório",
    tone: "bg-[#ECFDF5] text-[#047857]",
  },
  cancelada: {
    label: () => "Cirurgia cancelada",
    tone: "bg-[#FEF2F2] text-[#B91C1C]",
  },
}

/** Texto corrido de uma evolução (para o cartão compacto). */
const plainText = (e: IEvolution) =>
  [e.s, e.o, e.a, e.p].filter(Boolean).join(" ")

/**
 * Aba "Resumo" (PEP-18): o painel da internação. Junta dados da internação,
 * motivo, cirurgia, últimos sinais vitais, evoluções de hoje, pendências,
 * prescrição e documentos.
 */
export const SummaryScreen = ({ surgery: s }: { surgery: ISurgery }) => {
  const hosp = useCC((st) =>
    st.hospitalizations.find((h) => h.id === s.hospitalizationId),
  )
  const room = useCC((st) => st.rooms.find((r) => r.id === s.roomId))
  const allVitals = useCC((st) => st.vitals)
  const allEvolutions = useCC((st) => st.evolutions)
  const releaseTransport = useCC((st) => st.releaseTransport)

  const [vitalsOpen, setVitalsOpen] = useState(false)
  const [evolution, setEvolution] = useState<{ draft?: IEvolution } | null>(
    null,
  )

  const vitals = useMemo(
    () => allVitals.filter((v) => v.patientId === s.patientId).sort(byTime),
    [allVitals, s.patientId],
  )
  const last = vitals[vitals.length - 1]
  const lastAlerts = last ? alertsOf(last) : []
  const next = nextReading(last)

  const evolutions = allEvolutions
    .filter((e) => e.patientId === s.patientId)
    .sort((a, b) =>
      a.date === b.date
        ? toMin(b.time) - toMin(a.time)
        : a.date < b.date
          ? 1
          : -1,
    )
  const today = evolutions.filter((e) => e.date === TODAY_ISO)
  const drafts = evolutions.filter((e) => e.status === "rascunho")

  const surgeryToday = s.date === TODAY_ISO
  const beforeOR = s.stage === "agendada"
  const diabetic = s.careNotes.some((n) => /diab/i.test(n.label))
  const transportAt =
    beforeOR && surgeryToday && s.start
      ? fromMin(Math.max(toMin(s.start) - 30, toMin(MOCK_NOW)))
      : null
  const phase = PHASE_OF[s.stage]
  const pendingDocs = missingDocs(s)

  const surgeryHref = `${BASE}/cirurgias/${s.id}`
  const badge = STAGE_BADGE[s.stage]

  // ── Pendências ──
  type Pend = {
    key: string
    title: string
    sub: string
    tone: "danger" | "warning" | "neutral"
    action: string
    onPress?: () => void
    href?: string
  }
  const pend: Pend[] = []
  if (last && lastAlerts.length)
    pend.push({
      key: "vitals",
      title: `Reaferir ${joinLabels(lastAlerts)}`,
      sub: next
        ? `Prevista para ${next}${beforeOR && surgeryToday ? " · antes do transporte" : ""}`
        : "Valor fora do limite na última aferição",
      tone: "danger",
      action: "Registrar",
      onPress: () => setVitalsOpen(true),
    })
  for (const d of drafts)
    pend.push({
      key: `draft-${d.id}`,
      title: `Assinar evolução de ${d.kind === "Médica" ? "médica" : d.kind}`,
      sub: `Rascunho de ${d.author} desde ${d.date === TODAY_ISO ? d.time : isoToBR(d.date)}`,
      tone: "warning",
      action: "Abrir",
      onPress: () => setEvolution({ draft: d }),
    })
  for (const k of pendingDocs)
    pend.push({
      key: `doc-${k}`,
      title: `Assinar ${DOC_META[k].title.toLowerCase()}`,
      sub: `${DOC_META[k].role} · ${DOC_META[k].releases?.toLowerCase() ?? "documento da cirurgia"}`,
      tone: "warning",
      action: "Abrir",
      href: surgeryHref,
    })
  if (diabetic && beforeOR)
    pend.push({
      key: "glicemia",
      title: "Registrar glicemia capilar",
      sub: "Paciente diabético · antes do centro cirúrgico",
      tone: "warning",
      action: "Registrar",
      onPress: () =>
        addToast({
          title: "Glicemia capilar ainda não existe no mock",
          description: "Ela entra junto com a aba Prescrição.",
        }),
    })
  if (transportAt && !s.transportReleasedAt)
    pend.push({
      key: "transport",
      title: "Liberar transporte ao centro cirúrgico",
      sub: `Previsto para ${transportAt} · ${room?.name.toLowerCase() ?? "sala a definir"}`,
      tone: "neutral",
      action: "Liberar",
      onPress: () => {
        releaseTransport(s.id)
        addToast({
          title: `Transporte liberado às ${MOCK_NOW}`,
          description: `${room?.name ?? "Centro cirúrgico"} · cirurgia às ${s.start}`,
          color: "success",
        })
      },
    })

  // ── Checklist "Pronto para o centro cirúrgico" ──
  const checklist: { label: string; done: boolean; badge?: string }[] = beforeOR
    ? [
        {
          label: s.arrived
            ? "Paciente na unidade"
            : "Aguardando chegada do paciente",
          done: s.arrived,
        },
        {
          label: `Avaliação pré-anestésica${s.anesthesia ? ` · ${s.anesthesia.split(" · ").pop()}` : ""}`,
          done: s.docs.pre_anestesica.status === "assinado",
        },
        {
          label: "Admissão pré-operatória (jejum, acesso e preparo da pele)",
          done: s.docs.admissao_pre_op.status === "assinado",
        },
        {
          label: last
            ? lastAlerts.length
              ? `Reaferir ${joinLabels(lastAlerts)}${next ? ` às ${next}` : ""}`
              : `Sinais vitais dentro do limite (${last.time})`
            : "Aferir sinais vitais",
          done: Boolean(last) && !lastAlerts.length,
          badge:
            last && lastAlerts.length
              ? `${VITAL_META[lastAlerts[0]].short === "temperatura" ? "Temp." : VITAL_META[lastAlerts[0]].short} ${valueOf(last, lastAlerts[0])} às ${last.time}`
              : undefined,
        },
        ...(surgeryToday
          ? [
              {
                label: s.transportReleasedAt
                  ? `Transporte liberado às ${s.transportReleasedAt}`
                  : `Liberar transporte${transportAt ? ` às ${transportAt}` : ""}`,
                done: Boolean(s.transportReleasedAt),
              },
            ]
          : []),
      ]
    : []
  const ready = checklist.filter((c) => c.done).length

  // ── Documentos (até a fase atual) ──
  const phases: DocPhase[] =
    s.stage === "finalizada"
      ? ["antes", "sala", "srpa"]
      : s.stage === "srpa"
        ? ["antes", "sala", "srpa"]
        : s.stage === "em_cirurgia"
          ? ["antes", "sala"]
          : ["antes"]
  const docs = phases.flatMap((p) => docsOfPhase(p))

  const stay = hosp
    ? `${hosp.day}º dia${hosp.expectedDischarge ? ` · alta prevista ${isoToBR(hosp.expectedDischarge).slice(0, 5)}` : ""}`
    : "—"
  const strip: [string, string][] = hosp
    ? [
        [
          "Admissão",
          `${hosp.admittedOn}${hosp.admittedTime ? ` · ${hosp.admittedTime}` : ""}`,
        ],
        ["Leito", `${hosp.bed.replace(/^Leito /, "")} · ${hosp.sector}`],
        ["Médico responsável", hosp.doctor],
        [
          "Diagnóstico",
          hosp.diagnosis
            ? `${hosp.diagnosis}${hosp.cid ? ` · CID ${hosp.cid}` : ""}`
            : hosp.reason,
        ],
        ["Convênio", s.insurance],
        ["Permanência", stay],
      ]
    : [
        ["Atendimento", s.date ? isoToBR(s.date) : "—"],
        ["Regime", "Cirurgia ambulatorial"],
        ["Cirurgião", s.surgeon],
        ["Procedimento", s.procedure],
        ["Convênio", s.insurance],
      ]

  return (
    <div className="flex flex-col gap-5">
      {/* Título */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.9px] text-[#1A56DB] uppercase">
            <LuBedDouble className="h-[13px] w-[13px]" />
            {hosp ? "Internação" : "Atendimento"}
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[28px] leading-tight font-bold text-[#1E293B]">
              {hosp ? "Resumo da internação" : "Resumo do atendimento"}
            </h1>
            <span
              className={cn(
                "flex items-center gap-[5px] rounded px-[9px] py-1 text-[11.5px] font-semibold",
                badge.tone,
              )}
            >
              <LuTimer className="h-3 w-3" />
              {badge.label(s)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            className={OUTLINE_BUTTON}
            startContent={<LuPrinter />}
            onPress={() => window.print()}
          >
            Imprimir resumo
          </Button>
          <Button
            className={PRIMARY_BUTTON}
            startContent={<LuPlus />}
            onPress={() => setEvolution({})}
          >
            Nova evolução
          </Button>
        </div>
      </div>

      {/* Faixa da internação */}
      <div
        className={cn(
          CARD,
          "grid grid-cols-2 gap-y-4 py-[18px] md:grid-cols-3 xl:flex",
        )}
      >
        {strip.map(([k, v], i) => (
          <div
            key={k}
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-1.5 px-6",
              i < strip.length - 1 && "xl:border-r xl:border-[#E2E8F0]",
            )}
          >
            <span className={LABEL}>{k}</span>
            <span className="text-[14px] font-semibold text-[#1E293B]">
              {v}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1fr_380px]">
        {/* Coluna clínica */}
        <div className="flex min-w-0 flex-col gap-5">
          {hosp && (
            <Card icon={LuStethoscope} title="Motivo da internação">
              <Block label="Queixa e história">
                {hosp.complaint ?? hosp.reason}
              </Block>
              {hosp.hypothesis && (
                <Block label="Hipótese diagnóstica">{hosp.hypothesis}</Block>
              )}
              {hosp.comorbidities?.length ? (
                <div className="flex flex-col gap-2">
                  <span className={LABEL}>Comorbidades e uso contínuo</span>
                  <div className="flex flex-wrap gap-2">
                    {hosp.comorbidities.map((c) => (
                      <span
                        key={c}
                        className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-[5px] text-xs font-medium text-[#64748B]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>
          )}

          <Card
            icon={LuScissors}
            title={
              surgeryToday && s.stage !== "finalizada"
                ? "Cirurgia de hoje"
                : s.stage === "finalizada"
                  ? "Cirurgia"
                  : "Próxima cirurgia"
            }
            link={{ label: "Ver cirurgia", href: surgeryHref }}
            grow
          >
            <div className="flex items-center gap-4 rounded-lg bg-[#EBF0FE] px-[18px] py-4">
              <div className="flex flex-col items-center gap-0.5 border-r border-[#1A56DB33] pr-4">
                <span className="text-2xl font-bold text-[#142D6B]">
                  {s.start ?? "--:--"}
                </span>
                <span className="text-xs font-semibold text-[#1A56DB]">
                  {room?.name ?? "Sala a definir"}
                </span>
                {s.date && s.date !== TODAY_ISO && (
                  <span className="text-[11px] text-[#1A56DB]">
                    {isoToBR(s.date).slice(0, 5)}
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[15px] font-bold text-[#142D6B]">
                  {s.procedure}
                </span>
                <span className="text-[12.5px] text-[#1A56DB]">
                  Cirurgião {s.surgeon}
                  {s.anesthetist
                    ? ` · Anestesia ${s.anesthetist}${s.anesthesia ? ` (${s.anesthesia.split(" · ")[0].toLowerCase()})` : ""}`
                    : ""}
                </span>
              </div>
            </div>

            {beforeOR ? (
              <div className="flex flex-col gap-3">
                <span className={LABEL}>
                  Pronto para o centro cirúrgico · {ready} de {checklist.length}
                </span>
                {checklist.map((c) => (
                  <div key={c.label} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        c.done
                          ? "bg-[#ECFDF5] text-[#047857]"
                          : "bg-[#FFFBEB] text-[#B45309]",
                      )}
                    >
                      {c.done ? (
                        <LuCheck className="h-3 w-3" />
                      ) : (
                        <LuTimer className="h-3 w-3" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-[13px] text-[#1E293B]",
                        !c.done && "font-semibold",
                      )}
                    >
                      {c.label}
                    </span>
                    {c.badge && (
                      <span className="rounded bg-[#FEF2F2] px-2 py-[3px] text-[11px] font-semibold text-[#B91C1C]">
                        {c.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#64748B]">
                {s.stage === "em_cirurgia" &&
                  `Em cirurgia desde ${s.enteredRoomAt ?? "--:--"} · término previsto às ${s.end}.`}
                {s.stage === "srpa" &&
                  `Na SRPA desde ${s.leftRoomAt ?? "--:--"} · ${s.srpaBed ?? ""}.`}
                {s.stage === "finalizada" &&
                  `Finalizada · alta da SRPA às ${s.srpaDischargeAt ?? "--:--"}.`}
                {s.stage === "a_alocar" &&
                  "Aguardando sala e horário no mapa cirúrgico."}
                {s.stage === "cancelada" && "Cirurgia cancelada."}
              </p>
            )}
          </Card>
        </div>

        {/* Coluna monitoramento */}
        <div className="flex min-w-0 flex-col gap-5">
          <Card
            icon={LuHeartPulse}
            title={
              last
                ? `Sinais vitais · ${last.date === TODAY_ISO ? last.time : `${isoToBR(last.date).slice(0, 5)} ${last.time}`}`
                : "Sinais vitais"
            }
            link={{
              label: "Ver sinais vitais",
              href: `${surgeryHref}/sinais-vitais`,
            }}
          >
            {last ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    ["pa", "temp", "hr", "spo2", "rr", "pain"] as VitalKey[]
                  ).map((k) => {
                    const alert = statusOf(last, k).tone === "alert"
                    return (
                      <div
                        key={k}
                        className={cn(
                          "flex flex-col gap-1 rounded-lg px-3.5 py-3",
                          alert ? "bg-[#FEF2F2]" : "bg-[#F8FAFC]",
                        )}
                      >
                        <span
                          className={cn(
                            "text-xs font-medium",
                            alert ? "text-[#B91C1C]" : "text-[#64748B]",
                          )}
                        >
                          {k === "rr"
                            ? "Freq. respiratória"
                            : k === "pain"
                              ? "Dor"
                              : VITAL_META[k].label}
                        </span>
                        <span className="flex items-end gap-1">
                          <span
                            className={cn(
                              "text-[22px] leading-none font-bold",
                              alert ? "text-[#B91C1C]" : "text-[#1E293B]",
                            )}
                          >
                            {valueOf(last, k)}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-medium",
                              alert ? "text-[#B91C1C]" : "text-[#94A3B8]",
                            )}
                          >
                            {VITAL_META[k].unit}
                          </span>
                        </span>
                      </div>
                    )
                  })}
                </div>
                {(lastAlerts.length > 0 || next) && (
                  <span
                    className={cn(
                      "flex items-center gap-2 text-[12.5px] font-medium",
                      lastAlerts.length ? "text-[#B45309]" : "text-[#64748B]",
                    )}
                  >
                    <LuBellRing className="h-3.5 w-3.5 shrink-0" />
                    {[
                      lastAlerts.length
                        ? last.doctorNotifiedAt
                          ? `Médico comunicado às ${last.doctorNotifiedAt}`
                          : "Médico ainda não comunicado"
                        : null,
                      next ? `próxima aferição às ${next}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                      .replace(/^./, (c) => c.toUpperCase())}
                  </span>
                )}
              </>
            ) : (
              <Empty
                text="Nenhuma aferição registrada."
                action="Registrar sinais vitais"
                onPress={() => setVitalsOpen(true)}
              />
            )}
          </Card>

          <Card
            icon={LuFileText}
            title="Evoluções de hoje"
            link={{
              label: `Ver todas (${evolutions.length})`,
              href: `${surgeryHref}/evolucoes`,
            }}
            grow
          >
            {today.length ? (
              today.slice(0, 4).map((e, i) => (
                <div
                  key={e.id}
                  className={cn(
                    "flex gap-3",
                    i > 0 && "border-t border-[#E2E8F0] pt-4",
                  )}
                >
                  <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#F8FAFC] text-[10.5px] font-bold text-[#64748B]">
                    {e.author
                      .replace(/^(Dr|Dra)\.\s*/, "")
                      .split(" ")
                      .filter((w) => w.length > 2)
                      .reduce(
                        (acc, w, j, arr) =>
                          j === 0 || j === arr.length - 1 ? acc + w[0] : acc,
                        "",
                      )}
                  </span>
                  <div className="flex min-w-0 flex-col gap-[5px]">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-bold text-[#1E293B]">
                        {e.author}
                      </span>
                      <span className="text-xs text-[#94A3B8]">
                        {roleLabel(e.kind, e.author)} · {e.time}
                      </span>
                      {e.status === "rascunho" && (
                        <span className="rounded bg-[#FFFBEB] px-[7px] py-0.5 text-[10.5px] font-semibold text-[#B45309]">
                          Rascunho
                        </span>
                      )}
                    </span>
                    <span className="line-clamp-2 text-[12.5px] text-[#64748B]">
                      {e.status === "rascunho"
                        ? "Rascunho não assinado — "
                        : ""}
                      {plainText(e)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <Empty
                text="Nenhuma evolução hoje."
                action="Nova evolução"
                onPress={() => setEvolution({})}
              />
            )}
          </Card>
        </div>

        {/* Coluna pendências */}
        <div className="flex min-w-0 flex-col gap-5">
          <Card
            icon={LuListChecks}
            title="Pendências"
            right={
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11.5px] font-bold",
                  pend.length
                    ? "bg-[#FFFBEB] text-[#B45309]"
                    : "bg-[#ECFDF5] text-[#047857]",
                )}
              >
                {pend.length}
              </span>
            }
          >
            {pend.length ? (
              pend.map((p) => (
                <div
                  key={p.key}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3.5 py-3",
                    p.tone === "danger" && "bg-[#FEF2F2]",
                    p.tone === "warning" && "bg-[#FFFBEB]",
                    p.tone === "neutral" && "bg-[#F8FAFC]",
                  )}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span
                      className={cn(
                        "text-[13px] font-semibold",
                        p.tone === "danger"
                          ? "text-[#B91C1C]"
                          : "text-[#1E293B]",
                      )}
                    >
                      {p.title}
                    </span>
                    <span className="text-xs text-[#64748B]">{p.sub}</span>
                  </div>
                  {p.href ? (
                    <Link
                      href={p.href}
                      className="shrink-0 rounded-md border border-[#E2E8F0] bg-white px-[11px] py-1.5 text-xs font-semibold text-[#1A56DB] hover:bg-[#F8FAFC]"
                    >
                      {p.action}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={p.onPress}
                      className="shrink-0 rounded-md border border-[#E2E8F0] bg-white px-[11px] py-1.5 text-xs font-semibold text-[#1A56DB] hover:bg-[#F8FAFC]"
                    >
                      {p.action}
                    </button>
                  )}
                </div>
              ))
            ) : (
              <span className="flex items-center gap-2 text-[13px] text-[#047857]">
                <LuCheck className="h-4 w-4" />
                Nenhuma pendência agora.
              </span>
            )}
          </Card>

          <Card
            icon={LuPill}
            title="Prescrição de hoje"
            link={{ label: "Abrir", soon: true }}
          >
            <KV
              k="Antibiótico"
              v={
                s.careNotes.find((n) => n.label === "Antibiótico")?.value ??
                "Não prescrito"
              }
            />
            <KV
              k="Suspensos"
              v={beforeOR ? "Dieta oral (jejum)" : "Nenhum"}
              warn={beforeOR}
            />
            <span className="text-xs text-[#94A3B8]">
              A aba Prescrição ainda não existe no mock: itens ativos e
              checagens entram junto com ela.
            </span>
          </Card>

          <Card
            icon={LuFolderOpen}
            title="Documentos"
            link={{ label: "Abrir", href: surgeryHref }}
          >
            {docs.map((k) => {
              const st = s.docs[k].status
              return (
                <div key={k} className="flex items-center gap-2.5">
                  <LuFileText className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />
                  <span className="flex-1 text-[12.5px] text-[#1E293B]">
                    {DOC_META[k].title}
                  </span>
                  <span
                    className={cn(
                      "rounded px-2 py-[3px] text-[11px] font-semibold",
                      st === "assinado"
                        ? "bg-[#ECFDF5] text-[#047857]"
                        : st === "em_preenchimento"
                          ? "bg-[#EBF0FE] text-[#1A56DB]"
                          : "bg-[#FFFBEB] text-[#B45309]",
                    )}
                  >
                    {st === "assinado"
                      ? "Assinado"
                      : st === "em_preenchimento"
                        ? "Em preenchimento"
                        : "Pendente"}
                  </span>
                </div>
              )
            })}
            {phase === undefined && s.stage !== "finalizada" && (
              <span className="text-xs text-[#94A3B8]">
                Sem documentos nesta etapa.
              </span>
            )}
          </Card>
        </div>
      </div>

      {vitalsOpen && (
        <RegisterVitalsModal
          patientId={s.patientId}
          onClose={() => setVitalsOpen(false)}
        />
      )}
      {evolution && (
        <EvolutionModal
          patientId={s.patientId}
          draft={evolution.draft}
          defaultAuthor={s.surgeon}
          onClose={() => setEvolution(null)}
        />
      )}
    </div>
  )
}

const Card = ({
  icon: Icon,
  title,
  link,
  right,
  grow,
  children,
}: {
  icon: IconType
  title: string
  link?: { label: string; href?: string; soon?: boolean }
  right?: ReactNode
  grow?: boolean
  children: ReactNode
}) => (
  <section
    className={cn(
      CARD,
      "flex break-inside-avoid flex-col gap-[18px] px-6 py-5",
      grow && "flex-1",
    )}
  >
    <header className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-[14.5px] font-bold text-[#1E293B]">
        <Icon className="h-4 w-4 text-[#1A56DB]" />
        {title}
      </span>
      {right}
      {link &&
        (link.href ? (
          <Link
            href={link.href}
            className="flex items-center gap-1 text-[12.5px] font-semibold text-[#1A56DB] hover:underline print:hidden"
          >
            {link.label}
            <LuArrowRight className="h-[13px] w-[13px]" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() =>
              addToast({ title: "Aba Prescrição ainda não existe no mock" })
            }
            className="flex items-center gap-1 text-[12.5px] font-semibold text-[#94A3B8] print:hidden"
          >
            {link.label}
            <LuArrowRight className="h-[13px] w-[13px]" />
          </button>
        ))}
    </header>
    {children}
  </section>
)

const Block = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <span className={LABEL}>{label}</span>
    <p className="text-[13.5px] leading-[1.55] text-[#1E293B]">{children}</p>
  </div>
)

const KV = ({ k, v, warn }: { k: string; v: string; warn?: boolean }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-[12.5px] text-[#64748B]">{k}</span>
    <span
      className={cn(
        "text-right text-[13px] font-semibold",
        warn ? "text-[#B45309]" : "text-[#1E293B]",
      )}
    >
      {v}
    </span>
  </div>
)

const Empty = ({
  text,
  action,
  onPress,
}: {
  text: string
  action: string
  onPress: () => void
}) => (
  <div className="flex flex-col items-start gap-2">
    <span className="text-[13px] text-[#64748B]">{text}</span>
    <Button size="sm" variant="bordered" className="border-1" onPress={onPress}>
      {action}
    </Button>
  </div>
)
