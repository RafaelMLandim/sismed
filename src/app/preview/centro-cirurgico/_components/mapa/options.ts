/** Opções dos dropdowns de agendamento e alocação (desenho "Dropdowns"). */
import type { ISurgery } from "../../_data/types"

export const SIDE_OPTIONS: {
  key: NonNullable<ISurgery["side"]>
  label: string
}[] = [
  { key: "Não se aplica", label: "Não se aplica" },
  { key: "Direito", label: "Direita" },
  { key: "Esquerdo", label: "Esquerda" },
  { key: "Bilateral", label: "Bilateral" },
]

/** Duração: "" = não informada (usa a média do procedimento). */
export const DURATION_OPTIONS: {
  key: string
  label: string
  description?: string
}[] = [
  {
    key: "",
    label: "Não informada",
    description: "Usa a média do procedimento",
  },
  { key: "30", label: "30 min" },
  { key: "60", label: "1h" },
  { key: "90", label: "1h30" },
  { key: "120", label: "2h" },
  { key: "150", label: "2h30" },
  { key: "180", label: "3h" },
  { key: "240", label: "4h ou mais" },
]

export const ANESTHESIA_OPTIONS = [
  "Geral",
  "Raquianestesia",
  "Peridural",
  "Raqui + sedação",
  "Bloqueio periférico",
  "Sedação",
  "Local",
]

export const ASA_OPTIONS = [
  { key: "ASA I", description: "Saudável" },
  { key: "ASA II", description: "Doença sistêmica leve" },
  { key: "ASA III", description: "Doença sistêmica grave" },
  { key: "ASA IV", description: "Ameaça constante à vida" },
  { key: "ASA V", description: "Moribundo" },
  { key: "ASA VI", description: "Doador de órgãos" },
]

export const SIZE_OPTIONS = [
  "Pequeno porte",
  "Médio porte",
  "Grande porte",
  "Especial",
]

export const BLOOD_OPTIONS = [
  "Não",
  "Tipagem sanguínea",
  "Tipagem e prova cruzada",
  "Sim, reserva de hemocomponentes",
]

export const PERIOD_OPTIONS = ["Manhã", "Tarde", "Qualquer horário"] as const
