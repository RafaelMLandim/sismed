"use client"

import { Button, addToast } from "@heroui/react"
import { useMemo, useState } from "react"
import {
  LuBedDouble,
  LuDownload,
  LuFileText,
  LuPencil,
  LuPlus,
  LuPrinter,
  LuSearch,
  LuTriangleAlert,
  LuX,
} from "react-icons/lu"

import { TODAY_ISO, addDays, isoToBR, longBR } from "../../_data/days"
import { EVOLUTION_KINDS, kindLabel, roleLabel } from "../../_data/evolutions"
import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import { toMin } from "../../_data/time"
import type { EvolutionKind, IEvolution, ISurgery } from "../../_data/types"
import { CURRENT_USER } from "../gastos/meta"
import { EvolutionModal } from "./EvolutionModal"
import {
  CARD,
  OUTLINE_BUTTON,
  PRIMARY_BUTTON,
} from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

/** Cor do tipo (avatar e etiqueta), como no desenho PEP-15. */
const KIND_TONE: Record<EvolutionKind, string> = {
  Médica: "bg-[#EBF0FE] text-[#1A56DB]",
  Enfermagem: "bg-[#F3EEFF] text-[#5B21B6]",
  Anestesia: "bg-[#ECFDF5] text-[#047857]",
  Nutrição: "bg-[#F8FAFC] text-[#64748B]",
  Fisioterapia: "bg-[#ECFEFF] text-[#0E7490]",
  Psicologia: "bg-[#FFFBEB] text-[#B45309]",
  "Serviço social": "bg-[#FEF2F2] text-[#B91C1C]",
}

type Period = "hoje" | "24h" | "internacao"
type Situation = "todas" | "assinada" | "rascunho"

const PERIODS: { key: Period; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "24h", label: "24 h" },
  { key: "internacao", label: "Internação" },
]
const SITUATIONS: { key: Situation; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "assinada", label: "Assinadas" },
  { key: "rascunho", label: "Rascunhos" },
]

const SOAP_LABEL = { s: "S", o: "O", a: "A", p: "P" } as const
const SOAP_KEYS = ["s", "o", "a", "p"] as const

const initialsOf = (name: string) =>
  name
    .replace(/^(Dr|Dra)\.\s*/, "")
    .split(" ")
    .filter((w) => w.length > 2)
    .reduce(
      (acc, w, i, arr) => (i === 0 || i === arr.length - 1 ? acc + w[0] : acc),
      "",
    )

const inPeriod = (e: IEvolution, p: Period) => {
  if (p === "internacao") return true
  if (p === "hoje") return e.date === TODAY_ISO
  return (
    e.date === TODAY_ISO ||
    (e.date === addDays(TODAY_ISO, -1) && toMin(e.time) >= toMin(MOCK_NOW))
  )
}

const byNewest = (a: IEvolution, b: IEvolution) =>
  a.date === b.date ? toMin(b.time) - toMin(a.time) : a.date < b.date ? 1 : -1

const dayTitle = (iso: string) => {
  if (iso === TODAY_ISO) return `Hoje · ${isoToBR(iso)}`
  if (iso === addDays(TODAY_ISO, -1)) return `Ontem · ${isoToBR(iso)}`
  return longBR(iso)
}

/**
 * Aba "Evoluções" (PEP-15): filtros à esquerda (busca, profissional, período,
 * situação e aviso de rascunho) e a lista do dia mais recente para o mais
 * antigo. Nova evolução e rascunhos abrem o modal SOAP (PEP-M04).
 */
export const EvolutionsScreen = ({ surgery }: { surgery: ISurgery }) => {
  const all = useCC((s) => s.evolutions)
  const discardEvolution = useCC((s) => s.discardEvolution)
  const hasHosp = Boolean(surgery.hospitalizationId)

  const [search, setSearch] = useState("")
  const [kind, setKind] = useState<EvolutionKind | "todas">("todas")
  const [period, setPeriod] = useState<Period>("hoje")
  const [situation, setSituation] = useState<Situation>("todas")
  const [modal, setModal] = useState<{ draft?: IEvolution } | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState<string>()

  const mine = useMemo(
    () => all.filter((e) => e.patientId === surgery.patientId).sort(byNewest),
    [all, surgery.patientId],
  )
  const drafts = mine.filter((e) => e.status === "rascunho")

  const q = search.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
  const matchesSearch = (e: IEvolution) =>
    !q ||
    [e.author, e.kind, e.s, e.o, e.a, e.p]
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .includes(q)

  // A contagem por profissional respeita busca, período e situação.
  const base = mine.filter(
    (e) =>
      matchesSearch(e) &&
      inPeriod(e, period) &&
      (situation === "todas" || e.status === situation),
  )
  const list = base.filter((e) => kind === "todas" || e.kind === kind)
  const kindsPresent = EVOLUTION_KINDS.filter((k) =>
    mine.some((e) => e.kind === k),
  )

  const days = [...new Set(list.map((e) => e.date))]

  return (
    <div className="flex flex-col gap-5">
      {/* Título */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.9px] text-[#1A56DB] uppercase">
            <LuBedDouble className="h-[13px] w-[13px]" />
            {hasHosp ? "Internação" : "Atendimento"}
          </span>
          <h1 className="text-[28px] leading-tight font-bold text-[#1E293B]">
            Evoluções
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            className={OUTLINE_BUTTON}
            startContent={<LuPrinter />}
            onPress={() => window.print()}
          >
            Imprimir
          </Button>
          <Button
            className={OUTLINE_BUTTON}
            startContent={<LuDownload />}
            onPress={() => {
              addToast({
                title: "Escolha “Salvar como PDF” na janela de impressão",
              })
              window.print()
            }}
          >
            Exportar PDF
          </Button>
          <Button
            className={PRIMARY_BUTTON}
            startContent={<LuPlus />}
            onPress={() => setModal({})}
          >
            Nova evolução
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* Filtros */}
        <aside
          className={cn(
            CARD,
            "flex w-full shrink-0 flex-col gap-[26px] self-start p-5 lg:w-[300px] print:hidden",
          )}
        >
          <label className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-[9px]">
            <LuSearch className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar no texto das evoluções"
              className="min-w-0 flex-1 bg-transparent text-[12.5px] text-[#1E293B] outline-none placeholder:text-[#94A3B8]"
            />
            {search && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setSearch("")}
                className="text-[#94A3B8] hover:text-[#64748B]"
              >
                <LuX className="h-3.5 w-3.5" />
              </button>
            )}
          </label>

          <div className="flex flex-col gap-1.5">
            <SideTitle>Profissional</SideTitle>
            {(["todas", ...kindsPresent] as const).map((k) => {
              const n =
                k === "todas"
                  ? base.length
                  : base.filter((e) => e.kind === k).length
              const active = kind === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-[9px] text-left text-[13px]",
                    active
                      ? "bg-[#EBF0FE] font-semibold text-[#1A56DB]"
                      : "text-[#1E293B] hover:bg-[#F8FAFC]",
                  )}
                >
                  {k === "todas" ? "Todas" : kindLabel(k)}
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      active ? "text-[#1A56DB]" : "text-[#64748B]",
                    )}
                  >
                    {n}
                  </span>
                </button>
              )
            })}
          </div>

          <ChipGroup
            title="Período"
            options={PERIODS}
            value={period}
            onChange={setPeriod}
          />
          <ChipGroup
            title="Situação"
            options={SITUATIONS}
            value={situation}
            onChange={setSituation}
          />

          {drafts.length > 0 && (
            <div className="flex gap-2 rounded-lg bg-[#FFFBEB] p-3.5">
              <LuTriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B45309]" />
              <div className="flex flex-col gap-[3px]">
                <span className="text-[12.5px] font-bold text-[#B45309]">
                  {drafts.length}{" "}
                  {drafts.length === 1
                    ? "rascunho não assinado"
                    : "rascunhos não assinados"}
                </span>
                <span className="text-xs leading-[1.55] text-[#B45309]">
                  {kindLabel(drafts[0].kind) === drafts[0].kind
                    ? `Evolução de ${drafts[0].kind}`
                    : kindLabel(drafts[0].kind)}{" "}
                  iniciada{" "}
                  {drafts[0].date === TODAY_ISO
                    ? `às ${drafts[0].time}`
                    : `em ${isoToBR(drafts[0].date)}`}{" "}
                  por{" "}
                  {drafts[0].author === CURRENT_USER
                    ? "você"
                    : drafts[0].author}
                  .
                </span>
                <button
                  type="button"
                  onClick={() => setModal({ draft: drafts[0] })}
                  className="mt-1 self-start text-xs font-semibold text-[#B45309] underline"
                >
                  Continuar edição
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Lista */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {list.length === 0 && (
            <div
              className={cn(
                CARD,
                "flex flex-col items-center gap-2 px-6 py-10 text-center",
              )}
            >
              <LuFileText className="h-6 w-6 text-[#94A3B8]" />
              <span className="text-[14px] font-semibold text-[#1E293B]">
                {mine.length
                  ? "Nenhuma evolução com esses filtros"
                  : "Nenhuma evolução registrada"}
              </span>
              <span className="text-[13px] text-[#64748B]">
                {mine.length
                  ? "Troque o período ou a situação, ou limpe a busca."
                  : "Use “Nova evolução” para registrar a primeira."}
              </span>
            </div>
          )}

          {days.map((d) => {
            const ofDay = list.filter((e) => e.date === d)
            return (
              <div key={d} className="flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-[13px] font-bold text-[#1E293B]">
                    {dayTitle(d)}
                  </span>
                  <span className="text-xs text-[#64748B]">
                    {ofDay.length}{" "}
                    {ofDay.length === 1 ? "evolução" : "evoluções"}
                  </span>
                </div>
                {ofDay.map((e) => (
                  <EvolutionCard
                    key={e.id}
                    e={e}
                    confirming={confirmDiscard === e.id}
                    onContinue={() => setModal({ draft: e })}
                    onDiscard={() => {
                      if (confirmDiscard !== e.id) {
                        setConfirmDiscard(e.id)
                        return
                      }
                      discardEvolution(e.id)
                      setConfirmDiscard(undefined)
                      addToast({ title: "Rascunho descartado" })
                    }}
                    onCancelDiscard={() => setConfirmDiscard(undefined)}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {modal && (
        <EvolutionModal
          patientId={surgery.patientId}
          draft={modal.draft}
          defaultAuthor={surgery.surgeon}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

const SideTitle = ({ children }: { children: string }) => (
  <span className="text-[10.5px] font-bold tracking-[0.8px] text-[#94A3B8] uppercase">
    {children}
  </span>
)

const ChipGroup = <T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string
  options: { key: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) => (
  <div className="flex flex-col gap-2.5">
    <SideTitle>{title}</SideTitle>
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded-full border px-3 py-[5px] text-xs font-semibold",
            value === o.key
              ? "border-[#1A56DB] bg-[#1A56DB] text-white"
              : "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  </div>
)

const EvolutionCard = ({
  e,
  confirming,
  onContinue,
  onDiscard,
  onCancelDiscard,
}: {
  e: IEvolution
  confirming: boolean
  onContinue: () => void
  onDiscard: () => void
  onCancelDiscard: () => void
}) => {
  const filled = SOAP_KEYS.filter((k) => e[k])
  const draft = e.status === "rascunho"
  return (
    <article
      className={cn(
        CARD,
        "flex break-inside-avoid flex-col gap-3.5 px-6 py-5",
        draft && "border-[#FDE68A]",
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-[10.5px] font-bold",
              KIND_TONE[e.kind],
            )}
          >
            {initialsOf(e.author)}
          </span>
          <span className="text-[13.5px] font-bold text-[#1E293B]">
            {e.author}
          </span>
          <span
            className={cn(
              "rounded px-2 py-[3px] text-[11px] font-semibold",
              KIND_TONE[e.kind],
            )}
          >
            {roleLabel(e.kind, e.author)}
          </span>
          {e.council && (
            <span className="text-[11.5px] text-[#94A3B8]">{e.council}</span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "rounded px-2 py-[3px] text-[11px] font-semibold",
              draft
                ? "bg-[#FFFBEB] text-[#B45309]"
                : "bg-[#ECFDF5] text-[#047857]",
            )}
          >
            {draft ? "Rascunho" : "Assinada"}
          </span>
          <span className="text-[12.5px] font-semibold text-[#64748B]">
            {e.time}
          </span>
        </div>
      </header>

      {filled.length === 1 ? (
        <p className="text-[13px] leading-[1.6] whitespace-pre-line text-[#1E293B]">
          {e[filled[0]]}
        </p>
      ) : (
        <dl className="flex flex-col gap-1.5 text-[13px] leading-[1.6]">
          {filled.map((k) => (
            <div key={k} className="flex gap-2.5">
              <dt className="w-4 shrink-0 font-bold text-[#1A56DB]">
                {SOAP_LABEL[k]}
              </dt>
              <dd className="whitespace-pre-line text-[#1E293B]">{e[k]}</dd>
            </div>
          ))}
        </dl>
      )}

      {draft && (
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button
            size="sm"
            color="primary"
            startContent={<LuPencil className="h-3 w-3" />}
            onPress={onContinue}
          >
            Continuar edição
          </Button>
          <Button
            size="sm"
            variant="bordered"
            color={confirming ? "danger" : "default"}
            className={cn(!confirming && "border-1 text-[#64748B]")}
            onPress={onDiscard}
          >
            {confirming ? "Confirmar descarte" : "Descartar"}
          </Button>
          {confirming && (
            <Button size="sm" variant="light" onPress={onCancelDiscard}>
              Manter rascunho
            </Button>
          )}
        </div>
      )}
    </article>
  )
}
