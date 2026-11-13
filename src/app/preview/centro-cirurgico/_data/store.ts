"use client"

import { useMemo } from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { TODAY_ISO } from "./days"
import { EXPENSE_SHEETS } from "./expenses"
import { DISCHARGES } from "./discharge"
import { EVOLUTIONS } from "./evolutions"
import { VITALS } from "./vitals"
import {
  DOC_META,
  HD,
  HOSPITALIZATIONS,
  MOCK_NOW,
  PATIENTS,
  ROOMS,
  SURGERIES,
  UNITS,
  docsOfPhase,
} from "./fixtures"
import type {
  DocKey,
  DocStatus,
  IDischarge,
  IDocPart,
  IExpenseItem,
  IExpenseSheet,
  IHospitalization,
  IPatient,
  IRoom,
  ISurgery,
  IUnit,
  IVitalSign,
  IEvolution,
  SurgeryStage,
} from "./types"

/**
 * Estado do mock do Centro cirúrgico. Persiste no localStorage para os testes
 * locais sobreviverem a um reload; "Resetar dados" volta às fixtures.
 */
interface State {
  units: IUnit[]
  /** Unidade escolhida no seletor "Unidade" (vale para todas as telas). */
  unitId: string
  patients: IPatient[]
  rooms: IRoom[]
  surgeries: ISurgery[]
  hospitalizations: IHospitalization[]
  expenseSheets: IExpenseSheet[]
  vitals: IVitalSign[]
  evolutions: IEvolution[]
  discharges: IDischarge[]
}

interface Actions {
  reset: () => void
  setUnit: (unitId: string) => void
  /** Cria uma cirurgia (PEP-M07). Sem sala → vai para a fila "A alocar". */
  addSurgery: (s: Omit<ISurgery, "id">) => number
  /** Aloca na sala/horário (PEP-M11 ou arrastar no mapa). */
  allocate: (
    id: number,
    roomId: string,
    start: string,
    end: string,
    date: string,
  ) => void
  unallocate: (id: number) => void
  /** Bloqueia a sala no dia/período (manutenção etc.); `undefined` desbloqueia. */
  setRoomBlock: (roomId: string, date: string, block: IRoom["block"]) => void
  setDocStatus: (id: number, doc: DocKey, status: DocStatus) => void
  /**
   * Salva uma parte de um documento que tem várias (ex.: admissão da
   * internação = médica + enfermagem). O documento fica "assinado" quando
   * todas as `parts` estão assinadas.
   */
  saveDocPart: (
    id: number,
    doc: DocKey,
    part: string,
    parts: string[],
    data: unknown,
    sign: boolean,
    signedBy?: string,
  ) => void
  /** Salva o conteúdo de um documento completo junto com a situação. */
  saveDoc: (
    id: number,
    doc: DocKey,
    data: unknown,
    status: DocStatus,
    signedBy?: string,
  ) => void
  /** Avança a etapa se os documentos obrigatórios estiverem assinados. */
  advanceStage: (id: number) => { ok: boolean; missing: DocKey[] }
  markArrived: (id: number) => void
  /** Libera o transporte do paciente ao centro cirúrgico. */
  releaseTransport: (id: number) => void
  cancelSurgery: (id: number) => void
  addExpenseItems: (
    surgeryId: number,
    items: Omit<IExpenseItem, "id">[],
  ) => void
  removeExpenseItem: (surgeryId: number, itemId: string) => void
  updateExpenseItem: (
    surgeryId: number,
    itemId: string,
    patch: Partial<IExpenseItem>,
  ) => void
  closeExpenseSheet: (surgeryId: number, by: string) => void
  /** Registra uma aferição de sinais vitais. */
  addVital: (v: Omit<IVitalSign, "id">) => void
  /** Marca que o médico foi comunicado (valor fora do limite). */
  notifyDoctor: (vitalId: string, at: string) => void
  /** Cria (sem `id`) ou atualiza uma evolução. Devolve o id. */
  saveEvolution: (e: Omit<IEvolution, "id"> & { id?: string }) => string
  discardEvolution: (id: string) => void
  reopenExpenseSheet: (surgeryId: number) => void
  /** Atualiza a alta da internação (cria se ainda não existir). */
  updateDischarge: (
    hospitalizationId: number,
    patch: Partial<Omit<IDischarge, "hospitalizationId">>,
  ) => void
  /** PEP-M28: registra a saída e encerra a internação. */
  registerDischarge: (
    hospitalizationId: number,
    registered: NonNullable<IDischarge["registered"]>,
  ) => void
}

const initial = (): State =>
  structuredClone({
    units: UNITS,
    unitId: HD,
    patients: PATIENTS,
    rooms: ROOMS,
    surgeries: SURGERIES,
    hospitalizations: HOSPITALIZATIONS,
    expenseSheets: EXPENSE_SHEETS,
    vitals: VITALS,
    evolutions: EVOLUTIONS,
    discharges: DISCHARGES,
  })

/** Documentos que precisam estar assinados para sair da etapa atual. */
export const requiredDocsToLeave = (stage: SurgeryStage): DocKey[] => {
  if (stage === "agendada") return docsOfPhase("antes")
  if (stage === "em_cirurgia") return docsOfPhase("sala")
  if (stage === "srpa") return docsOfPhase("srpa")
  return []
}

export const nextStage = (stage: SurgeryStage): SurgeryStage | null =>
  (
    ({
      agendada: "em_cirurgia",
      em_cirurgia: "srpa",
      srpa: "finalizada",
    }) as Partial<Record<SurgeryStage, SurgeryStage>>
  )[stage] ?? null

export const missingDocs = (s: ISurgery) =>
  requiredDocsToLeave(s.stage).filter((k) => s.docs[k].status !== "assinado")

let seq = 0
const newId = () => `n${Date.now().toString(36)}${(seq++).toString(36)}`

const mapSurgery = (
  state: State,
  id: number,
  fn: (s: ISurgery) => ISurgery,
): Partial<State> => ({
  surgeries: state.surgeries.map((s) => (s.id === id ? fn(s) : s)),
})

const ensureSheet = (state: State, surgeryId: number): IExpenseSheet[] =>
  state.expenseSheets.some((e) => e.surgeryId === surgeryId)
    ? state.expenseSheets
    : [...state.expenseSheets, { surgeryId, status: "aberta", items: [] }]

export const useCC = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial(),

      reset: () => set(initial()),

      setUnit: (unitId) => set({ unitId }),

      addSurgery: (s) => {
        const id = Math.max(...get().surgeries.map((x) => x.id)) + 1
        set((st) => ({ surgeries: [...st.surgeries, { ...s, id }] }))
        return id
      },

      allocate: (id, roomId, start, end, date) =>
        set((st) =>
          mapSurgery(st, id, (s) => ({
            ...s,
            roomId,
            date,
            start,
            end,
            stage: s.stage === "a_alocar" ? "agendada" : s.stage,
          })),
        ),

      unallocate: (id) =>
        set((st) =>
          mapSurgery(st, id, (s) => ({
            ...s,
            roomId: undefined,
            date: undefined,
            start: undefined,
            end: undefined,
            stage: "a_alocar",
          })),
        ),

      setRoomBlock: (roomId, date, block) =>
        set((st) => ({
          rooms: st.rooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  blocks: [
                    ...r.blocks.filter((b) => b.date !== date),
                    ...(block ? [{ ...block, date }] : []),
                  ],
                }
              : r,
          ),
        })),

      setDocStatus: (id, doc, status) =>
        set((st) =>
          mapSurgery(st, id, (s) => ({
            ...s,
            docs: {
              ...s.docs,
              [doc]: {
                status,
                signedAt: status === "assinado" ? MOCK_NOW : undefined,
              },
            },
          })),
        ),

      saveDoc: (id, doc, data, status, signedBy) =>
        set((st) =>
          mapSurgery(st, id, (s) => ({
            ...s,
            docData: { ...s.docData, [doc]: data },
            docs: {
              ...s.docs,
              [doc]: {
                status,
                signedAt: status === "assinado" ? MOCK_NOW : undefined,
                signedBy: status === "assinado" ? signedBy : undefined,
              },
            },
          })),
        ),

      saveDocPart: (id, doc, part, parts, data, sign, signedBy) =>
        set((st) =>
          mapSurgery(st, id, (s) => {
            const piece: IDocPart = {
              data,
              status: sign ? "assinado" : "em_preenchimento",
              signedAt: sign ? MOCK_NOW : undefined,
              signedBy: sign ? signedBy : undefined,
            }
            const docData = { ...s.docData, [`${doc}:${part}`]: piece }
            const all = parts.map(
              (p) => docData[`${doc}:${p}`] as IDocPart | undefined,
            )
            const done = all.every((p) => p?.status === "assinado")
            return {
              ...s,
              docData,
              docs: {
                ...s.docs,
                [doc]: {
                  status: done ? "assinado" : "em_preenchimento",
                  signedAt: done ? MOCK_NOW : undefined,
                },
              },
            }
          }),
        ),

      advanceStage: (id) => {
        const s = get().surgeries.find((x) => x.id === id)
        if (!s) return { ok: false, missing: [] }
        const missing = missingDocs(s)
        const next = nextStage(s.stage)
        if (missing.length || !next) return { ok: false, missing }
        // Cirurgia de outro dia não entra na sala hoje.
        if (s.stage === "agendada" && s.date && s.date !== TODAY_ISO)
          return { ok: false, missing: [] }
        set((st) =>
          mapSurgery(st, id, (x) => ({
            ...x,
            stage: next,
            arrived: true,
            enteredRoomAt: next === "em_cirurgia" ? MOCK_NOW : x.enteredRoomAt,
            leftRoomAt: next === "srpa" ? MOCK_NOW : x.leftRoomAt,
            srpaBed: next === "srpa" ? "SRPA, leito 1" : x.srpaBed,
            srpaDischargeAt:
              next === "finalizada" ? MOCK_NOW : x.srpaDischargeAt,
          })),
        )
        return { ok: true, missing: [] }
      },

      markArrived: (id) =>
        set((st) => mapSurgery(st, id, (s) => ({ ...s, arrived: true }))),

      releaseTransport: (id) =>
        set((st) =>
          mapSurgery(st, id, (s) => ({ ...s, transportReleasedAt: MOCK_NOW })),
        ),

      cancelSurgery: (id) =>
        set((st) => mapSurgery(st, id, (s) => ({ ...s, stage: "cancelada" }))),

      addExpenseItems: (surgeryId, items) =>
        set((st) => ({
          expenseSheets: ensureSheet(st, surgeryId).map((e) =>
            e.surgeryId === surgeryId
              ? {
                  ...e,
                  items: [
                    ...items.map((i) => ({ ...i, id: newId() })),
                    ...e.items,
                  ],
                }
              : e,
          ),
        })),

      removeExpenseItem: (surgeryId, itemId) =>
        set((st) => ({
          expenseSheets: st.expenseSheets.map((e) =>
            e.surgeryId === surgeryId
              ? { ...e, items: e.items.filter((i) => i.id !== itemId) }
              : e,
          ),
        })),

      updateExpenseItem: (surgeryId, itemId, patch) =>
        set((st) => ({
          expenseSheets: st.expenseSheets.map((e) =>
            e.surgeryId === surgeryId
              ? {
                  ...e,
                  items: e.items.map((i) =>
                    i.id === itemId ? { ...i, ...patch } : i,
                  ),
                }
              : e,
          ),
        })),

      closeExpenseSheet: (surgeryId, by) =>
        set((st) => ({
          expenseSheets: ensureSheet(st, surgeryId).map((e) =>
            e.surgeryId === surgeryId
              ? { ...e, status: "fechada", closedAt: MOCK_NOW, closedBy: by }
              : e,
          ),
        })),

      addVital: (v) =>
        set((st) => ({ vitals: [...st.vitals, { ...v, id: newId() }] })),

      notifyDoctor: (vitalId, at) =>
        set((st) => ({
          vitals: st.vitals.map((v) =>
            v.id === vitalId ? { ...v, doctorNotifiedAt: at } : v,
          ),
        })),

      saveEvolution: (e) => {
        const id = e.id ?? newId()
        set((st) => ({
          evolutions: st.evolutions.some((x) => x.id === id)
            ? st.evolutions.map((x) => (x.id === id ? { ...e, id } : x))
            : [...st.evolutions, { ...e, id }],
        }))
        return id
      },

      discardEvolution: (id) =>
        set((st) => ({
          evolutions: st.evolutions.filter((x) => x.id !== id),
        })),

      updateDischarge: (hospitalizationId, patch) =>
        set((st) => ({
          discharges: st.discharges.some(
            (d) => d.hospitalizationId === hospitalizationId,
          )
            ? st.discharges.map((d) =>
                d.hospitalizationId === hospitalizationId
                  ? { ...d, ...patch }
                  : d,
              )
            : [...st.discharges, { hospitalizationId, ...patch }],
        })),

      registerDischarge: (hospitalizationId, registered) => {
        get().updateDischarge(hospitalizationId, { registered })
        set((st) => ({
          hospitalizations: st.hospitalizations.map((h) =>
            h.id === hospitalizationId
              ? {
                  ...h,
                  dischargeToday: false,
                  discharged: { date: registered.date, time: registered.time },
                }
              : h,
          ),
        }))
      },

      reopenExpenseSheet: (surgeryId) =>
        set((st) => ({
          expenseSheets: st.expenseSheets.map((e) =>
            e.surgeryId === surgeryId
              ? {
                  ...e,
                  status: "aberta",
                  closedAt: undefined,
                  closedBy: undefined,
                }
              : e,
          ),
        })),
    }),
    {
      name: "sismed-preview-centro-cirurgico-v7",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      /**
       * Pacientes, internações e cirurgias novos nas fixtures entram no estado
       * salvo sem apagar os testes em andamento (o salvo sempre prevalece).
       */
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<State>
        const addNew = <T>(
          list: T[] | undefined,
          fixtures: T[],
          key: (x: T) => string | number,
        ) =>
          list
            ? [
                ...list,
                ...fixtures.filter((f) => !list.some((x) => key(x) === key(f))),
              ]
            : fixtures
        return {
          ...current,
          ...saved,
          patients: addNew(saved.patients, current.patients, (x) => x.id),
          hospitalizations: addNew(
            saved.hospitalizations,
            current.hospitalizations,
            (x) => x.id,
          ),
          surgeries: addNew(saved.surgeries, current.surgeries, (x) => x.id),
        }
      },
    },
  ),
)

// ── Seletores ─────────────────────────────────────────────────

export const usePatient = (id?: string) =>
  useCC((s) => s.patients.find((p) => p.id === id))

export const useSurgery = (id: number) =>
  useCC((s) => s.surgeries.find((x) => x.id === id))

export const useExpenseSheet = (surgeryId: number) =>
  useCC((s) => s.expenseSheets.find((e) => e.surgeryId === surgeryId))

export const useDischarge = (hospitalizationId?: number) =>
  useCC((s) =>
    s.discharges.find((d) => d.hospitalizationId === hospitalizationId),
  )

export const docTitle = (k: DocKey) => DOC_META[k].title

// ── Unidade ───────────────────────────────────────────────────

/** Unidade escolhida no seletor. */
export const useCurrentUnit = () =>
  useCC((s) => s.units.find((u) => u.id === s.unitId) ?? s.units[0])

/**
 * Salas, cirurgias e internações só da unidade escolhida. As telas de lista e
 * o mapa partem daqui; a tela de uma cirurgia abre qualquer uma pelo id.
 */
export const useUnitData = () => {
  const unitId = useCC((s) => s.unitId)
  const rooms = useCC((s) => s.rooms)
  const surgeries = useCC((s) => s.surgeries)
  const hospitalizations = useCC((s) => s.hospitalizations)
  return useMemo(
    () => ({
      unitId,
      rooms: rooms.filter((r) => r.unitId === unitId),
      surgeries: surgeries.filter((x) => x.unitId === unitId),
      hospitalizations: hospitalizations.filter((h) => h.unitId === unitId),
    }),
    [unitId, rooms, surgeries, hospitalizations],
  )
}
