"use client"

import { useMemo, useState } from "react"

import { useCC, useUnitData } from "../../_data/store"
import { EntradaHeader } from "./EntradaHeader"
import { EntryTable, PAGE_SIZE } from "./EntryTable"
import { FiltersBar } from "./FiltersBar"
import { PAST_PASSAGES, type IPastPassage } from "./history"
import { Metrics } from "./Metrics"
import { PatientHistory } from "./PatientHistory"
import {
  DEFAULT_FILTERS,
  buildRows,
  matchesFilters,
  matchesSearch,
  matchesSituation,
  type IFilters,
  type Situation,
} from "./rows"

const FOOTER_LABEL: Record<Situation, string> = {
  andamento: "em andamento",
  agendadas: "agendadas",
  encerradas: "encerradas",
  todas: "no total",
}

const pastMatches = (p: IPastPassage, s: Situation, f: IFilters) => {
  if (s === "andamento" || s === "agendadas") return false
  if (f.type === "internacao" && !p.hospId) return false
  if (f.type === "cirurgia" && !p.surgeryId) return false
  if (f.doctor !== "todos" && p.doctor !== f.doctor) return false
  return true
}

/** PEP-00 · Internações e cirurgias (entrada) e PEP-00b (busca por paciente). */
export const EntradaScreen = () => {
  const patients = useCC((s) => s.patients)
  const { surgeries, hospitalizations, rooms } = useUnitData()

  const [query, setQuery] = useState("")
  const [situation, setSituation] = useState<Situation>("andamento")
  const [filters, setFilters] = useState<IFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  const rows = useMemo(
    () => buildRows(patients, surgeries, hospitalizations, rooms),
    [patients, surgeries, hospitalizations, rooms],
  )

  const searched = useMemo(
    () => rows.filter((r) => matchesSearch(r, query)),
    [rows, query],
  )
  const filtered = useMemo(
    () => searched.filter((r) => matchesFilters(r, filters)),
    [searched, filters],
  )

  const counts = useMemo(
    () =>
      ({
        andamento: filtered.filter((r) => matchesSituation(r, "andamento"))
          .length,
        agendadas: filtered.filter((r) => matchesSituation(r, "agendadas"))
          .length,
        encerradas: filtered.filter((r) => matchesSituation(r, "encerradas"))
          .length,
        todas: filtered.length,
      }) satisfies Record<Situation, number>,
    [filtered],
  )

  const visible = filtered.filter((r) => matchesSituation(r, situation))
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const pageRows = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  // Busca que encontrou um paciente só → histórico do paciente (PEP-00b).
  const searchedPatientIds = new Set(searched.map((r) => r.patient.id))
  const historyPatient =
    query.trim() && searchedPatientIds.size === 1
      ? searched[0].patient
      : undefined
  const allPast = historyPatient ? (PAST_PASSAGES[historyPatient.id] ?? []) : []

  const doctors = useMemo(
    () => [...new Set(rows.map((r) => r.doctor))].sort(),
    [rows],
  )
  const sectors = useMemo(
    () => [...new Set(rows.map((r) => r.sector))].sort(),
    [rows],
  )

  const resetPage = () => setPage(1)
  const clearAll = () => {
    setQuery("")
    setFilters(DEFAULT_FILTERS)
    setSituation("andamento")
    resetPage()
  }
  /** Busca por paciente olha o histórico todo (PEP-00b abre em "Todas"). */
  const onQuery = (q: string) => {
    if (!query.trim() && q.trim()) setSituation("todas")
    if (query.trim() && !q.trim()) setSituation("andamento")
    setQuery(q)
    resetPage()
  }

  return (
    <div className="flex min-h-screen flex-col gap-4 px-8 py-6">
      <EntradaHeader />
      {!historyPatient && <Metrics />}
      <FiltersBar
        query={query}
        onQuery={onQuery}
        situation={situation}
        onSituation={(s) => {
          setSituation(s)
          resetPage()
        }}
        counts={counts}
        filters={filters}
        onFilters={(patch) => {
          setFilters((f) => ({ ...f, ...patch }))
          resetPage()
        }}
        doctors={doctors}
        sectors={sectors}
        onClear={clearAll}
      />
      {historyPatient ? (
        <PatientHistory
          patient={historyPatient}
          allRows={searched}
          rows={visible}
          past={allPast.filter((p) => pastMatches(p, situation, filters))}
          allPast={allPast}
        />
      ) : (
        <EntryTable
          rows={pageRows}
          total={visible.length}
          page={current}
          onPage={setPage}
          footerLabel={FOOTER_LABEL[situation]}
          onClear={clearAll}
        />
      )}
    </div>
  )
}
