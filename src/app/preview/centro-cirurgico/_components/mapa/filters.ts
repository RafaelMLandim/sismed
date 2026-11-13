import type { ISurgery } from "../../_data/types"

export type MapFilter =
  | "todas"
  | "agendadas"
  | "andamento"
  | "finalizadas"
  | "canceladas"
  | "sobreposicoes"
  | "a_alocar"

export type MapView = "lista" | "slots" | "timeline"

/** A cirurgia alocada entra no filtro? (A fila "A alocar" é tratada à parte.) */
export const matchesFilter = (
  s: ISurgery,
  filter: MapFilter,
  conflicts: Set<number>,
) => {
  switch (filter) {
    case "todas":
      return s.stage !== "a_alocar"
    case "agendadas":
      return s.stage === "agendada"
    case "andamento":
      return s.stage === "em_cirurgia" || s.stage === "srpa"
    case "finalizadas":
      return s.stage === "finalizada"
    case "canceladas":
      return s.stage === "cancelada"
    case "sobreposicoes":
      return conflicts.has(s.id)
    case "a_alocar":
      return s.stage === "a_alocar"
  }
}

export const FILTERS: { key: MapFilter; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "agendadas", label: "Agendadas" },
  { key: "andamento", label: "Em andamento" },
  { key: "finalizadas", label: "Finalizadas" },
  { key: "canceladas", label: "Canceladas" },
  { key: "sobreposicoes", label: "Sobreposições" },
  { key: "a_alocar", label: "A alocar" },
]
