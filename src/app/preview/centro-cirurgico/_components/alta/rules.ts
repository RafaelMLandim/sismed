import { isoToBR } from "../../_data/days"
import { DOC_KEYS, DOC_META } from "../../_data/fixtures"
import type {
  IDischarge,
  IExpenseSheet,
  IHospitalization,
  ISurgery,
  IVitalSign,
} from "../../_data/types"
import { alertsOf, byTime } from "../sinais/rules"

export type ReqKey =
  | "cirurgia"
  | "documentos"
  | "gastos"
  | "sinais"
  | "fisio"
  | "prescricao"
  | "sumario"

export type ReqState = "concluido" | "andamento" | "pendente"

export interface IRequirement {
  key: ReqKey
  title: string
  detail: string
  state: ReqState
}

/** Documentos da cirurgia que contam para a alta (antes, sala e SRPA). */
const SURGERY_DOCS = DOC_KEYS.filter((k) => DOC_META[k].phase !== "depois")

const STAGE_TEXT: Record<ISurgery["stage"], string> = {
  a_alocar: "aguardando sala no mapa",
  agendada: "agendada",
  em_cirurgia: "em cirurgia",
  srpa: "na recuperação (SRPA)",
  finalizada: "finalizada",
  cancelada: "cancelada",
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`

/**
 * Os 7 pré-requisitos da alta (PEP-17a). "Registrar alta" só libera com todos
 * concluídos.
 */
export const requirementsOf = ({
  surgeries,
  sheets,
  vitals,
  discharge,
}: {
  hosp: IHospitalization
  /** Cirurgias da internação (sem as canceladas). */
  surgeries: ISurgery[]
  sheets: IExpenseSheet[]
  vitals: IVitalSign[]
  discharge?: IDischarge
}): IRequirement[] => {
  const pendingSurgery = surgeries.find((s) => s.stage !== "finalizada")
  const last = [...vitals].sort(byTime).at(-1)
  const lastAlerts = last ? alertsOf(last) : []
  const signedDocs = surgeries.flatMap((s) =>
    SURGERY_DOCS.filter((k) => s.docs[k].status === "assinado"),
  ).length
  const totalDocs = surgeries.length * SURGERY_DOCS.length
  const surgerySheets = surgeries.map((s) =>
    sheets.find((e) => e.surgeryId === s.id),
  )
  const openSheet = surgerySheets.some((e) => e?.status !== "fechada")
  const items = surgerySheets.reduce((n, e) => n + (e?.items.length ?? 0), 0)
  const p = discharge?.prescription
  const guide = discharge?.guide
  const summary = discharge?.summary

  const prescState: ReqState =
    p?.status === "salva" && guide?.status === "assinado"
      ? "concluido"
      : p
        ? "andamento"
        : "pendente"

  return [
    {
      key: "cirurgia",
      title: "Cirurgia finalizada",
      state: surgeries.length && !pendingSurgery ? "concluido" : "pendente",
      detail: !surgeries.length
        ? "Nenhuma cirurgia nesta internação"
        : pendingSurgery
          ? `${pendingSurgery.procedure} · ${STAGE_TEXT[pendingSurgery.stage]}`
          : surgeries
              .map(
                (s) =>
                  `${s.procedure}${s.srpaDischargeAt ? ` · alta da SRPA às ${s.srpaDischargeAt}` : ""}`,
              )
              .join(" · "),
    },
    {
      key: "documentos",
      title: "Documentos da cirurgia assinados",
      state:
        totalDocs && signedDocs === totalDocs
          ? "concluido"
          : signedDocs
            ? "andamento"
            : "pendente",
      detail:
        totalDocs && signedDocs === totalDocs
          ? `${plural(signedDocs, "documento assinado", "documentos assinados")}`
          : `${signedDocs} de ${totalDocs} documentos assinados`,
    },
    {
      key: "gastos",
      title: "Ficha de gastos enviada ao faturamento",
      state: surgeries.length && !openSheet ? "concluido" : "pendente",
      detail:
        surgeries.length && !openSheet
          ? `${plural(items, "item", "itens")} · fechada às ${surgerySheets[0]?.closedAt ?? "—"}`
          : `Ficha aberta · ${plural(items, "item lançado", "itens lançados")}`,
    },
    {
      key: "sinais",
      title: "Controle de dor e sinais vitais estáveis",
      state: last && !lastAlerts.length ? "concluido" : "pendente",
      detail: !last
        ? "Nenhuma aferição registrada"
        : `Última aferição ${isoToBR(last.date).slice(0, 5)} às ${last.time} · dor ${last.pain}/10 · PA ${last.sys}/${last.dia}${lastAlerts.length ? " · fora do limite" : ""}`,
    },
    {
      key: "fisio",
      title: "Liberação da fisioterapia para deambular",
      state: discharge?.physioReleasedOn ? "concluido" : "pendente",
      detail: discharge?.physioReleasedOn
        ? `Liberado para deambular com andador em ${discharge.physioReleasedOn}`
        : "Aguardando avaliação da fisioterapia",
    },
    {
      key: "prescricao",
      title: "Prescrição e orientações de alta",
      state: prescState,
      detail:
        prescState === "concluido"
          ? `${plural(p!.items.length, "item", "itens")} na receita · retorno ${isoToBR(p!.returnDate).slice(0, 5)} na ${p!.returnClinic.toLowerCase()}`
          : !p
            ? "Receita, cuidados e retorno ainda não preenchidos"
            : p.status === "rascunho"
              ? `Receita com ${plural(p.items.length, "item", "itens")} em rascunho · faltam as orientações ao paciente`
              : "Receita salva · faltam assinar as orientações ao paciente",
    },
    {
      key: "sumario",
      title: "Sumário de alta assinado",
      state:
        summary?.status === "assinado"
          ? "concluido"
          : summary?.status === "em_preenchimento"
            ? "andamento"
            : "pendente",
      detail:
        summary?.status === "assinado"
          ? `Assinado por ${summary.signedBy} às ${summary.signedAt}`
          : "Rascunho gerado com os dados da internação · aguarda assinatura do médico",
    },
  ]
}
