import type { IconType } from "react-icons"
import {
  LuActivity,
  LuBedDouble,
  LuClipboardCheck,
  LuFilePenLine,
  LuFileText,
  LuHeartPulse,
  LuNotebookPen,
  LuShieldCheck,
  LuStethoscope,
} from "react-icons/lu"

import { MOCK_NOW } from "../../_data/fixtures"
import { diffMin, fmtDuration } from "../../_data/time"
import type { DocKey, DocPhase, ISurgery } from "../../_data/types"

/** Ícone, descrição e substantivo do botão ("Abrir avaliação") de cada documento. */
export const DOC_UI: Record<
  DocKey,
  { icon: IconType; description: string; noun: string; releasesLabel?: string }
> = {
  pre_anestesica: {
    icon: LuStethoscope,
    description: "Avaliação anestésica antes da sala",
    noun: "avaliação",
  },
  admissao_pre_op: {
    icon: LuClipboardCheck,
    description: "Jejum, acesso venoso e preparo da pele",
    noun: "admissão",
  },
  checklist: {
    icon: LuShieldCheck,
    description: "Entrada, pausa cirúrgica e saída da sala",
    noun: "checklist",
  },
  evolucao_intraop: {
    icon: LuFileText,
    description: "Admissão em sala, posicionamento e intercorrências",
    noun: "evolução",
  },
  boletim_anestesico: {
    icon: LuActivity,
    description: "Drogas, sinais vitais e intercorrências",
    noun: "boletim",
  },
  alta_srpa: {
    icon: LuHeartPulse,
    description: "Escala de Aldrete · alta a partir de 9",
    noun: "SRPA",
  },
  descricao_cirurgica: {
    icon: LuFilePenLine,
    description: "Achados, técnica e materiais usados",
    noun: "descrição",
  },
  admissao_internacao: {
    icon: LuBedDouble,
    description: "Admissão médica e de enfermagem na unidade",
    noun: "admissão",
    releasesLabel: "Após alta da SRPA",
  },
  evolucao_internacao: {
    icon: LuNotebookPen,
    description: "Pós-operatório imediato",
    noun: "evolução",
    releasesLabel: "Diária",
  },
}

const NURSES: Record<DocPhase, string> = {
  antes: "Carla Souza",
  sala: "Ana Lima",
  srpa: "Júlia Reis",
  depois: "Fernanda Lopes",
}

const surgeonRole = (name: string) =>
  name.startsWith("Dra.") ? "cirurgiã" : "cirurgião"

/** Quem preenche o documento nesta cirurgia (nomes da equipe do mock). */
export const docResponsible = (s: ISurgery, k: DocKey): string => {
  const anest = s.anesthetist ?? "Anestesista a definir"
  switch (k) {
    case "pre_anestesica":
    case "boletim_anestesico":
      return `${anest} · anestesista`
    case "descricao_cirurgica":
    case "evolucao_internacao":
      return `${s.surgeon} · ${surgeonRole(s.surgeon)}`
    case "admissao_pre_op":
      return `Enfermagem · ${NURSES.antes}`
    case "checklist":
    case "evolucao_intraop":
      return `Enfermagem · ${NURSES.sala}`
    case "alta_srpa":
      return `Enfermagem SRPA · ${NURSES.srpa}`
    case "admissao_internacao":
      return s.bed ? `Unidade de internação · ${s.bed}` : "Médico e enfermagem"
  }
}

export const surgeonLabel = (s: ISurgery) =>
  s.surgeon.startsWith("Dra.") ? "Cirurgiã" : "Cirurgião"

/** Minutos de `from` até agora (relógio fixo do mock). */
export const minutesSince = (from: string) =>
  Math.max(0, diffMin(from, MOCK_NOW))

/** "há 35 min" / "há 1h20" / "agora mesmo". */
export const agoText = (from: string) => {
  const m = minutesSince(from)
  return m < 1 ? "agora mesmo" : `há ${fmtDuration(m)}`
}

/** "faltam 5h20" (ou "atrasada 20 min" se o horário já passou). */
export const untilText = (to: string) => {
  const m = diffMin(MOCK_NOW, to)
  if (m > 0) return `faltam ${fmtDuration(m)}`
  if (m === 0) return "começa agora"
  return `atrasada ${fmtDuration(-m)}`
}

export const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`

export const procedureTitle = (s: ISurgery) =>
  s.side && s.side !== "Não se aplica"
    ? `${s.procedure} · ${s.side}`
    : s.procedure
