"use client"

import { useRouter } from "next/navigation"
import {
  LuCircleCheck,
  LuClipboardCheck,
  LuHeartPulse,
  LuReceiptText,
  LuScissors,
} from "react-icons/lu"

import { DOC_META, docsOfPhase } from "../../_data/fixtures"
import { requiredDocsToLeave, useExpenseSheet } from "../../_data/store"
import type { DocKey, DocPhase, ISurgery } from "../../_data/types"
import { BASE } from "../MockShell"
import { FlowCard, type FlowTone } from "./FlowCard"
import { DOC_UI, docResponsible, plural } from "./helpers"
import type { PhaseSelection } from "./PhaseDocsModal"
import { cn } from "@/shared/utils/cn"

export type Visao = "enfermagem" | "medico"

const GRID: Record<number, string> = {
  1: "md:grid-cols-2",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 xl:grid-cols-4",
}

interface SectionConfig {
  title: string
  subtitle: string
  docs: DocKey[]
  expense: boolean
}

const sectionFor = (s: ISurgery, visao: Visao): SectionConfig | null => {
  switch (s.stage) {
    case "agendada":
      return {
        title: "Documentos antes da sala",
        subtitle:
          "Os dois precisam ser assinados para o paciente entrar na sala.",
        docs: docsOfPhase("antes"),
        expense: false,
      }
    case "em_cirurgia":
      return {
        title: "Documentos da sala",
        subtitle:
          "Os três precisam ser assinados para o paciente ir para a SRPA.",
        docs: docsOfPhase("sala"),
        expense: true,
      }
    case "srpa":
      return visao === "medico"
        ? {
            title: "Documentos médicos",
            subtitle:
              "A descrição cirúrgica precisa estar assinada para a alta da SRPA.",
            docs: [
              "evolucao_internacao",
              "descricao_cirurgica",
              "boletim_anestesico",
            ],
            expense: false,
          }
        : {
            title: "Documentos da recuperação",
            subtitle:
              "A alta da SRPA e a descrição cirúrgica precisam ser assinadas para finalizar.",
            docs: ["alta_srpa", "admissao_internacao"],
            expense: true,
          }
    default:
      return null
  }
}

/** Cartão sugerido como próximo passo (borda azul, botão sólido). */
const pickHighlight = (s: ISurgery, docs: DocKey[]): DocKey | undefined => {
  const required = requiredDocsToLeave(s.stage)
  return (
    docs.find((k) => s.docs[k].status === "em_preenchimento") ??
    docs.find(
      (k) => required.includes(k) && s.docs[k].status === "nao_iniciado",
    )
  )
}

export const DocumentsSection = ({
  surgery: s,
  visao,
  onOpenDoc,
  onOpenPhase,
}: {
  surgery: ISurgery
  visao: Visao
  onOpenDoc: (k: DocKey) => void
  onOpenPhase: (sel: PhaseSelection) => void
}) => {
  if (s.stage === "finalizada")
    return (
      <>
        <FinishedSection surgery={s} onOpenPhase={onOpenPhase} />
        <AfterDischargeSection surgery={s} onOpenDoc={onOpenDoc} />
      </>
    )

  const cfg = sectionFor(s, visao)
  if (!cfg) return null
  const highlight = pickHighlight(s, cfg.docs)
  const count = cfg.docs.length + (cfg.expense ? 1 : 0)

  return (
    <>
      <SectionTitle title={cfg.title} subtitle={cfg.subtitle} />
      <div className={cn("grid gap-4", GRID[count])}>
        {cfg.docs.map((k) => (
          <DocCard
            key={k}
            surgery={s}
            docKey={k}
            highlighted={k === highlight}
            onOpen={() => onOpenDoc(k)}
          />
        ))}
        {cfg.expense && <ExpenseCard surgery={s} />}
      </div>
    </>
  )
}

const SectionTitle = ({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) => (
  <div className="flex flex-col gap-0.5 pt-1.5">
    <h2 className="text-[17px] font-bold text-[#1E293B]">{title}</h2>
    <p className="text-[13.5px] text-[#64748B]">{subtitle}</p>
  </div>
)

const DocCard = ({
  surgery: s,
  docKey: k,
  highlighted,
  onOpen,
}: {
  surgery: ISurgery
  docKey: DocKey
  highlighted: boolean
  onOpen: () => void
}) => {
  const doc = s.docs[k]
  const ui = DOC_UI[k]
  const tag = DOC_META[k].releases ?? ui.releasesLabel
  const waitingDischarge =
    k === "admissao_internacao" &&
    s.stage === "srpa" &&
    doc.status === "nao_iniciado"

  let tone: FlowTone
  let status: string
  let action: string
  if (doc.status === "assinado") {
    tone = "success"
    status = `Assinado às ${doc.signedAt}`
    action = `Ver ${ui.noun}`
  } else if (waitingDischarge) {
    tone = "success"
    status = "Aguardando alta da SRPA"
    action = `Iniciar ${ui.noun}`
  } else if (doc.status === "em_preenchimento") {
    tone = highlighted ? "primary" : "warning"
    status = "Em preenchimento"
    action = `${highlighted ? "Continuar" : "Abrir"} ${ui.noun}`
  } else {
    tone = highlighted ? "primary" : "warning"
    status = "Não iniciada"
    action = `${highlighted ? "Iniciar" : "Abrir"} ${ui.noun}`
  }

  const description =
    k === "boletim_anestesico" && s.anesthesia
      ? `${s.anesthesia.split(" · ")[0]} · ${ui.description.toLowerCase()}`
      : k === "admissao_internacao" && s.bed
        ? `${ui.description} · ${s.bed}`
        : ui.description

  return (
    <FlowCard
      icon={ui.icon}
      tone={tone}
      tag={tag}
      title={DOC_META[k].title}
      status={
        waitingDischarge ? (
          <span className="text-[#64748B]">{status}</span>
        ) : (
          status
        )
      }
      description={description}
      footer={docResponsible(s, k)}
      actionLabel={action}
      onAction={onOpen}
      highlighted={highlighted}
    />
  )
}

const ExpenseCard = ({ surgery: s }: { surgery: ISurgery }) => {
  const router = useRouter()
  const sheet = useExpenseSheet(s.id)
  const n = sheet?.items.length ?? 0
  const items = plural(n, "item", "itens")
  const labelPending = sheet?.items.some((i) => i.trackingLabelPending)
  const go = () => router.push(`${BASE}/cirurgias/${s.id}/gastos`)
  const common = {
    icon: LuReceiptText,
    title: "Ficha de gastos",
    footer: "Equipe da sala",
    onAction: go,
  }

  if (sheet?.status === "fechada")
    return (
      <FlowCard
        {...common}
        tone="success"
        statusIcon={LuCircleCheck}
        status={s.stage === "finalizada" ? "Enviada ao faturamento" : "Fechada"}
        description={`${items} · fechada às ${sheet.closedAt} por ${sheet.closedBy}`}
        footer={undefined}
        actionLabel="Ver ficha"
      />
    )

  if (s.stage === "em_cirurgia")
    return (
      <FlowCard
        {...common}
        tone="neutral"
        tag="Opcional agora"
        status={n ? `${items} lançados` : "Nenhum item lançado"}
        description="Pode ser fechada depois da cirurgia"
        actionLabel="Lançar gastos"
      />
    )

  return (
    <FlowCard
      {...common}
      tone="warning"
      tag="Fechar hoje"
      status={n ? "Pronta para fechar" : "Nenhum item lançado"}
      description={`${items}${labelPending ? " · falta a etiqueta da OPME" : ""}`}
      actionLabel={n ? "Fechar ficha" : "Lançar gastos"}
    />
  )
}

const PHASE_CARDS: {
  phase: DocPhase
  title: string
  icon: typeof LuScissors
  description: string
}[] = [
  {
    phase: "antes",
    title: "Antes da sala",
    icon: LuClipboardCheck,
    description: "Admissão pré-operatória e avaliação pré-anestésica",
  },
  {
    phase: "sala",
    title: "Na sala",
    icon: LuScissors,
    description: "Check list, boletim anestésico e evolução intraoperatória",
  },
  {
    phase: "srpa",
    title: "Recuperação",
    icon: LuHeartPulse,
    description: "Alta da SRPA e descrição cirúrgica",
  },
]

const FinishedSection = ({
  surgery: s,
  onOpenPhase,
}: {
  surgery: ISurgery
  onOpenPhase: (sel: PhaseSelection) => void
}) => (
  <>
    <SectionTitle
      title="Documentos da cirurgia"
      subtitle="Tudo assinado. Os documentos também ficam na aba Documentos do paciente."
    />
    <div className={cn("grid gap-4", GRID[4])}>
      {PHASE_CARDS.map((p) => {
        const keys = docsOfPhase(p.phase)
        const signed = keys.filter((k) => s.docs[k].status === "assinado")
        const done = signed.length === keys.length
        return (
          <FlowCard
            key={p.phase}
            icon={p.icon}
            tone={done ? "success" : "warning"}
            title={p.title}
            statusIcon={done ? LuCircleCheck : undefined}
            status={
              done
                ? plural(signed.length, "assinado", "assinados")
                : `${signed.length} de ${keys.length} assinados`
            }
            description={p.description}
            actionLabel="Ver documentos"
            onAction={() => onOpenPhase({ title: p.title, phases: [p.phase] })}
          />
        )
      })}
      <ExpenseCard surgery={s} />
    </div>
  </>
)

/**
 * Depois da alta da SRPA o paciente volta à unidade: a admissão da
 * internação (médica + enfermagem) e a evolução continuam abertas aqui,
 * sem precisar procurar no "Ver" da etapa Finalizada.
 */
const AfterDischargeSection = ({
  surgery: s,
  onOpenDoc,
}: {
  surgery: ISurgery
  onOpenDoc: (k: DocKey) => void
}) => {
  const keys = docsOfPhase("depois")
  const pending = keys.filter((k) => s.docs[k].status !== "assinado")
  const highlight =
    pending.find((k) => s.docs[k].status === "em_preenchimento") ?? pending[0]
  return (
    <>
      <SectionTitle
        title="Depois da alta da SRPA"
        subtitle={
          pending.length
            ? "Admissão e evolução na unidade de internação. Não bloqueiam a cirurgia."
            : "Admissão e evolução na unidade de internação assinadas."
        }
      />
      <div className={cn("grid gap-4", GRID[keys.length])}>
        {keys.map((k) => (
          <DocCard
            key={k}
            surgery={s}
            docKey={k}
            highlighted={k === highlight}
            onOpen={() => onOpenDoc(k)}
          />
        ))}
      </div>
    </>
  )
}
