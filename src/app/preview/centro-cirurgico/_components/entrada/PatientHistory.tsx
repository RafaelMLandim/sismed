"use client"

import { Button } from "@heroui/react"
import {
  LuCheck,
  LuChevronRight,
  LuFileText,
  LuFolderOpen,
  LuLock,
  LuTriangleAlert,
  LuX,
} from "react-icons/lu"

import { MOCK_TODAY } from "../../_data/fixtures"
import type { IPatient } from "../../_data/types"
import { Avatar, Chip, StepChip } from "../ui"
import type { IPastPassage } from "./history"
import { AttendanceTags, ROW_BUTTON, outOfScope } from "./parts"
import type { IEntryRow } from "./rows"
import { useOpenRow } from "./EntryTable"
import { CARD, OUTLINE_BUTTON } from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

const HEAD = "text-[10.5px] font-bold tracking-[0.6px] text-[#94A3B8] uppercase"

const Count = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="text-lg leading-6 font-bold text-[#1E293B]">{value}</span>
    <span className="text-[11.5px] text-[#94A3B8]">{label}</span>
  </div>
)

/** Documentos já iniciados ou assinados da passagem atual. */
const docCount = (r: IEntryRow) =>
  r.surgery
    ? Object.values(r.surgery.docs).filter((d) => d.status !== "nao_iniciado")
        .length
    : 0

const ROW = "flex items-center gap-3.5 border-b border-[#E2E8F0] px-[18px] py-3"

/**
 * Busca que encontrou um paciente só (PEP-00b): cartão do paciente e todas as
 * passagens, da mais recente para a mais antiga.
 */
export const PatientHistory = ({
  patient,
  allRows,
  rows,
  past,
  allPast,
}: {
  patient: IPatient
  /** Passagens atuais do paciente (sem filtro de situação), para a contagem. */
  allRows: IEntryRow[]
  rows: IEntryRow[]
  past: IPastPassage[]
  allPast: IPastPassage[]
}) => {
  const open = useOpenRow()
  const surgeries =
    allRows.filter((r) => r.surgery).length +
    allPast.filter((p) => p.surgeryId).length
  const hosps =
    allRows.filter((r) => r.hosp).length +
    allPast.filter((p) => p.hospId).length
  const firstSurgery = allRows.find((r) => r.surgery)

  return (
    <>
      <div
        className={cn(
          CARD,
          "flex flex-wrap items-center gap-3.5 px-[18px] py-4",
        )}
      >
        <Avatar initials={patient.initials} size={46} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[17px] font-bold text-[#1E293B]">
              {patient.name}
            </span>
            {patient.allergies.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1 rounded-full bg-[#FEF2F2] px-2 py-0.5 text-[11px] font-semibold text-[#B91C1C]"
              >
                <LuTriangleAlert className="h-[11px] w-[11px]" />
                Alergia: {a}
              </span>
            ))}
          </div>
          <span className="text-[13px] text-[#64748B]">
            {patient.age} anos · {patient.sex} · Pront. {patient.record} ·{" "}
            {patient.insurance}
          </span>
        </div>
        <div className="flex items-center gap-[22px] px-2.5">
          <Count value={allRows.length + allPast.length} label="passagens" />
          <Count value={surgeries} label="cirurgias" />
          <Count value={hosps} label="internações" />
        </div>
        <Button
          className={OUTLINE_BUTTON}
          startContent={<LuFolderOpen />}
          onPress={() =>
            firstSurgery ? open(firstSurgery) : outOfScope("Abrir prontuário")
          }
        >
          Abrir prontuário
        </Button>
      </div>

      <div className={cn(CARD, "flex flex-1 flex-col overflow-hidden")}>
        <div className="flex items-center border-b border-[#E2E8F0] px-[18px] py-3.5">
          <span className="flex-1 text-sm font-bold text-[#1E293B]">
            Passagens de {patient.name}
          </span>
          <span className="text-[12.5px] text-[#94A3B8]">
            da mais recente para a mais antiga
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1120px]">
            <div className="flex gap-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] px-[18px] py-2.5">
              <span className={cn(HEAD, "w-[170px] shrink-0")}>Período</span>
              <span className={cn(HEAD, "w-[150px] shrink-0")}>
                Atendimento
              </span>
              <span className={cn(HEAD, "flex-1")}>Procedimento ou motivo</span>
              <span className={cn(HEAD, "w-[120px] shrink-0")}>Onde</span>
              <span className={cn(HEAD, "w-[150px] shrink-0")}>Médico</span>
              <span className={cn(HEAD, "w-[150px] shrink-0")}>Desfecho</span>
              <span className={cn(HEAD, "w-[100px] shrink-0")}>Documentos</span>
              <span className="w-20 shrink-0" />
            </div>

            {rows.length + past.length === 0 && (
              <p className="px-[18px] py-10 text-center text-[13px] text-[#94A3B8]">
                Nenhuma passagem nesta situação.
              </p>
            )}

            {rows.map((r) => {
              const closed = r.situation === "encerrada"
              const docs = docCount(r)
              return (
                <div key={r.key} className={cn(ROW, "bg-[#F7F9FF]")}>
                  <div className="flex w-[170px] shrink-0 flex-col gap-0.5">
                    <span className="text-[13.5px] font-semibold text-[#1E293B]">
                      {r.startDate}
                    </span>
                    <span className="text-xs text-[#94A3B8]">
                      {closed ? `até ${MOCK_TODAY}` : "até em andamento"}
                    </span>
                  </div>
                  <AttendanceTags
                    hospId={r.hosp?.id}
                    surgeryId={r.surgery?.id}
                  />
                  <span className="min-w-0 flex-1 text-[13px] text-[#1E293B]">
                    {r.procedure}
                  </span>
                  <span className="w-[120px] shrink-0 text-[13px] text-[#64748B]">
                    {r.where}
                  </span>
                  <span className="w-[150px] shrink-0 text-[13px] text-[#64748B]">
                    {r.doctor}
                  </span>
                  <div className="flex w-[150px] shrink-0 flex-col items-start gap-[3px]">
                    <StepChip step={r.step} />
                  </div>
                  <span className="flex w-[100px] shrink-0 items-center gap-[5px] text-[12.5px] text-[#64748B]">
                    {docs ? (
                      <>
                        <LuFileText className="h-[13px] w-[13px] text-[#94A3B8]" />
                        {docs} docs
                      </>
                    ) : (
                      <span className="text-[#94A3B8]">—</span>
                    )}
                  </span>
                  <div className="flex w-20 shrink-0 justify-end">
                    <Button
                      size="sm"
                      endContent={<LuChevronRight />}
                      onPress={() => open(r)}
                      className={cn(ROW_BUTTON, "bg-[#1A56DB] text-white")}
                    >
                      Abrir
                    </Button>
                  </div>
                </div>
              )
            })}

            {past.map((p) => {
              const cancelled = p.outcome === "cancelada"
              return (
                <div key={p.key} className={ROW}>
                  <div className="flex w-[170px] shrink-0 flex-col gap-0.5">
                    <span className="text-[13.5px] font-semibold text-[#1E293B]">
                      {p.date}
                    </span>
                    <span className="text-xs text-[#94A3B8]">{p.period}</span>
                  </div>
                  <AttendanceTags hospId={p.hospId} surgeryId={p.surgeryId} />
                  <span
                    className={cn(
                      "min-w-0 flex-1 text-[13px]",
                      cancelled ? "text-[#94A3B8]" : "text-[#1E293B]",
                    )}
                  >
                    {p.procedure}
                  </span>
                  <span className="w-[120px] shrink-0 text-[13px] text-[#64748B]">
                    {p.where}
                  </span>
                  <span className="w-[150px] shrink-0 text-[13px] text-[#64748B]">
                    {p.doctor}
                  </span>
                  <div className="flex w-[150px] shrink-0 flex-col items-start gap-[3px]">
                    {cancelled ? (
                      <Chip tone="neutral" icon={LuX}>
                        Cancelada
                      </Chip>
                    ) : (
                      <Chip tone="success" icon={LuCheck}>
                        Alta
                      </Chip>
                    )}
                    {p.outcomeSub && (
                      <span className="text-[11.5px] text-[#94A3B8]">
                        {p.outcomeSub}
                      </span>
                    )}
                  </div>
                  <span className="flex w-[100px] shrink-0 items-center gap-[5px] text-[12.5px] text-[#64748B]">
                    {p.docs ? (
                      <>
                        <LuFileText className="h-[13px] w-[13px] text-[#94A3B8]" />
                        {p.docs} docs
                      </>
                    ) : (
                      <span className="text-[#94A3B8]">—</span>
                    )}
                  </span>
                  <div className="flex w-20 shrink-0 justify-end">
                    <Button
                      size="sm"
                      variant="light"
                      endContent={<LuChevronRight />}
                      onPress={() =>
                        outOfScope(`Passagem de ${p.date} (somente leitura)`)
                      }
                      className={cn(
                        ROW_BUTTON,
                        "bg-transparent text-[#1A56DB]",
                      )}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-auto flex items-center gap-1.5 px-[18px] py-3 text-[12.5px] text-[#94A3B8]">
          <LuLock className="h-[13px] w-[13px]" />
          Passagens encerradas abrem só para leitura. Os documentos assinados
          não podem ser alterados.
        </div>
      </div>
    </>
  )
}
