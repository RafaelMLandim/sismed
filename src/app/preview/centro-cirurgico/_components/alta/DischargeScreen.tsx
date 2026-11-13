"use client"

import { Button } from "@heroui/react"
import { useRouter } from "next/navigation"
import { useMemo, useState, type ReactNode } from "react"
import {
  LuArrowRight,
  LuBedDouble,
  LuCalendarCheck,
  LuCheck,
  LuCircleCheck,
  LuClock3,
  LuFileText,
  LuFolderOpen,
  LuInfo,
  LuListChecks,
  LuLock,
  LuLogOut,
  LuPencil,
  LuPrinter,
  LuUsers,
} from "react-icons/lu"

import { isoToBR } from "../../_data/days"
import { MOCK_TODAY } from "../../_data/fixtures"
import { useCC, useDischarge } from "../../_data/store"
import type { ISurgery } from "../../_data/types"
import { BASE } from "../MockShell"
import { Chip, Eyebrow } from "../ui"
import { bedPhrase, returnLabel } from "./drafts"
import { GuideModal } from "./GuideModal"
import { PrescriptionModal } from "./PrescriptionModal"
import { RegisterModal } from "./RegisterModal"
import { type IRequirement, type ReqKey, requirementsOf } from "./rules"
import { SummaryDocModal } from "./SummaryDocModal"
import {
  OUTLINE_BUTTON,
  PRIMARY_BUTTON,
  SMALL_OUTLINE_BUTTON,
  SMALL_PRIMARY_BUTTON,
} from "@/modules/Surgeries/helpers/ui"
import { cn } from "@/shared/utils/cn"

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

type ModalKey = "prescricao" | "orientacoes" | "sumario" | "registrar"

const STATE_CHIP = {
  concluido: <Chip tone="success">Concluído</Chip>,
  andamento: <Chip tone="primary">Em andamento</Chip>,
  pendente: <Chip tone="warning">Pendente</Chip>,
}

const STATE_ICON = {
  concluido: (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ECFDF5] text-[#10B981]">
      <LuCheck className="h-3.5 w-3.5" />
    </span>
  ),
  andamento: (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EBF0FE] text-[#1A56DB]">
      <LuPencil className="h-3.5 w-3.5" />
    </span>
  ),
  pendente: (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFFBEB] text-[#F59E0B]">
      <LuClock3 className="h-3.5 w-3.5" />
    </span>
  ),
}

const Card = ({
  icon: Icon,
  title,
  right,
  children,
  className,
}: {
  icon: typeof LuUsers
  title: string
  right?: ReactNode
  children: ReactNode
  className?: string
}) => (
  <section
    className={cn(
      "flex flex-col gap-4 rounded-xl border border-[#E2E8F0] bg-white p-6",
      className,
    )}
  >
    <header className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#1E293B]">
        <Icon className="h-4 w-4 text-[#1A56DB]" />
        {title}
      </h2>
      {right}
    </header>
    {children}
  </section>
)

const Line = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4 text-[13px]">
    <span className="text-[#64748B]">{label}</span>
    <span className="text-right font-semibold text-[#1E293B]">
      {value || "—"}
    </span>
  </div>
)

const FieldBox = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xs font-medium text-[#64748B]">{label}</span>
    <span className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-[13px] text-[#1E293B]">
      {value || "—"}
    </span>
  </div>
)

/** Aba "Alta" (PEP-17a em preparação · PEP-17b registrada). */
export const DischargeScreen = ({ surgery }: { surgery: ISurgery }) => {
  const router = useRouter()
  const patient = useCC((s) =>
    s.patients.find((p) => p.id === surgery.patientId),
  )
  const hosp = useCC((s) =>
    s.hospitalizations.find((h) => h.id === surgery.hospitalizationId),
  )
  const allSurgeries = useCC((s) => s.surgeries)
  const sheets = useCC((s) => s.expenseSheets)
  const allVitals = useCC((s) => s.vitals)
  const updateDischarge = useCC((s) => s.updateDischarge)
  const discharge = useDischarge(hosp?.id)
  const [modal, setModal] = useState<ModalKey>()

  const surgeries = useMemo(
    () =>
      allSurgeries.filter(
        (s) => s.hospitalizationId === hosp?.id && s.stage !== "cancelada",
      ),
    [allSurgeries, hosp?.id],
  )
  const vitals = useMemo(
    () => allVitals.filter((v) => v.patientId === surgery.patientId),
    [allVitals, surgery.patientId],
  )

  if (!patient) return null

  if (!hosp)
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <Eyebrow icon={LuBedDouble}>Atendimento</Eyebrow>
          <h1 className="text-[28px] font-bold text-[#1E293B]">
            Alta hospitalar
          </h1>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-white p-6 text-[13px] text-[#64748B]">
          <LuInfo className="mt-0.5 h-4 w-4 shrink-0 text-[#1A56DB]" />
          <span>
            Esta cirurgia não tem internação. O paciente vai para casa com a{" "}
            <b className="text-[#1E293B]">alta da SRPA</b>, registrada na aba
            Cirurgia.
          </span>
        </div>
      </div>
    )

  const reqs = requirementsOf({ hosp, surgeries, sheets, vitals, discharge })
  const done = reqs.filter((r) => r.state === "concluido").length
  const allDone = done === reqs.length
  const registered = discharge?.registered
  const surgeryPath = `${BASE}/cirurgias/${surgery.id}`
  const go = (path: string) => router.push(`${surgeryPath}${path}`)

  const actionOf = (r: IRequirement): ReactNode => {
    if (registered) return null
    const small = (label: string, onPress: () => void, primary?: boolean) => (
      <Button
        className={primary ? SMALL_PRIMARY_BUTTON : SMALL_OUTLINE_BUTTON}
        endContent={<LuArrowRight />}
        onPress={onPress}
      >
        {label}
      </Button>
    )
    const byKey: Record<ReqKey, ReactNode> = {
      cirurgia: r.state !== "concluido" && small("Ver cirurgia", () => go("")),
      documentos:
        r.state !== "concluido" && small("Ver documentos", () => go("")),
      gastos:
        r.state !== "concluido" && small("Abrir ficha", () => go("/gastos")),
      sinais:
        r.state !== "concluido" &&
        small("Ver sinais vitais", () => go("/sinais-vitais")),
      fisio:
        r.state !== "concluido" &&
        small("Registrar liberação", () =>
          updateDischarge(hosp.id, {
            physioReleasedOn: MOCK_TODAY.slice(0, 5),
          }),
        ),
      prescricao:
        r.state === "concluido"
          ? null
          : discharge?.prescription?.status === "salva"
            ? small("Assinar orientações", () => setModal("orientacoes"), true)
            : small(discharge?.prescription ? "Continuar" : "Preencher", () =>
                setModal("prescricao"),
              ),
      sumario:
        r.state !== "concluido" &&
        small("Assinar sumário", () => setModal("sumario"), true),
    }
    return byKey[r.key]
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Eyebrow icon={LuBedDouble}>Internação</Eyebrow>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold text-[#1E293B]">
              Alta hospitalar
            </h1>
            {registered ? (
              <Chip tone="success">Alta registrada</Chip>
            ) : (
              <Chip tone="warning">Em preparação</Chip>
            )}
          </div>
        </div>
        {registered ? (
          <div className="flex gap-2.5 print:hidden">
            <Button
              className={OUTLINE_BUTTON}
              startContent={<LuFileText />}
              onPress={() => setModal("sumario")}
            >
              Ver sumário de alta
            </Button>
            <Button
              className={PRIMARY_BUTTON}
              startContent={<LuPrinter />}
              onPress={() => window.print()}
            >
              Imprimir documentos de alta
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {!allDone && (
              <span className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <LuLock className="h-3.5 w-3.5" />
                Libera com {reqs.length} de {reqs.length}
              </span>
            )}
            <Button
              className={PRIMARY_BUTTON}
              startContent={<LuLogOut />}
              isDisabled={!allDone}
              onPress={() => setModal("registrar")}
            >
              Registrar alta
            </Button>
          </div>
        )}
      </div>

      <div
        className={cn(
          "grid items-start gap-5",
          registered && "lg:grid-cols-[minmax(0,1fr)_400px]",
        )}
      >
        <div className="flex flex-col gap-5">
          <Card
            icon={LuListChecks}
            title="Pré-requisitos para a alta"
            right={
              <span
                className={cn(
                  "text-[13px] font-semibold",
                  allDone ? "text-[#047857]" : "text-[#1A56DB]",
                )}
              >
                {done} de {reqs.length} concluídos
              </span>
            }
          >
            <div className="h-1.5 overflow-hidden rounded-full bg-[#F1F5F9]">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  allDone ? "bg-[#10B981]" : "bg-[#1A56DB]",
                )}
                style={{ width: `${(done / reqs.length) * 100}%` }}
              />
            </div>
            <ul className="flex flex-col">
              {reqs.map((r) => (
                <li
                  key={r.key}
                  className={cn(
                    "flex items-center gap-3 border-b border-[#F1F5F9] px-1 py-3.5 last:border-0",
                    r.state !== "concluido" && "bg-[#F8FAFC]",
                  )}
                >
                  {STATE_ICON[r.state]}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-[#1E293B]">
                      {r.title}
                    </span>
                    <span className="text-xs text-[#64748B]">{r.detail}</span>
                  </div>
                  {STATE_CHIP[r.state]}
                  {actionOf(r)}
                  {registered || r.state !== "concluido" ? null : r.key ===
                    "prescricao" ? (
                    <button
                      type="button"
                      onClick={() => setModal("orientacoes")}
                      className="text-xs font-semibold text-[#1A56DB]"
                    >
                      Ver
                    </button>
                  ) : r.key === "sumario" ? (
                    <button
                      type="button"
                      onClick={() => setModal("sumario")}
                      className="text-xs font-semibold text-[#1A56DB]"
                    >
                      Ver
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>

          {registered ? (
            <div className="flex items-center gap-2.5 rounded-xl bg-[#ECFDF5] px-5 py-4 text-[13px] text-[#047857]">
              <LuCircleCheck className="h-4 w-4 shrink-0" />
              Internação encerrada em {isoToBR(registered.date)} às{" "}
              {registered.time}. {cap(bedPhrase(hosp.bed))} foi enviado para
              higienização e o prontuário desta internação agora é somente
              leitura.
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl bg-[#EBF0FE] px-5 py-4 text-[13px] text-[#1A56DB]">
              <LuInfo className="h-4 w-4 shrink-0" />
              Ao registrar a alta, a internação é encerrada, o prontuário fica
              somente leitura e {bedPhrase(hosp.bed)} vai para higienização.
            </div>
          )}
        </div>

        {registered && (
          <div className="flex flex-col gap-5">
            <Card icon={LuCalendarCheck} title="Saída e destino">
              <FieldBox
                label="Data e hora da alta"
                value={`${isoToBR(registered.date)} · ${registered.time}`}
              />
              <FieldBox label="Tipo de alta" value={registered.type} />
              <FieldBox label="Destino" value={registered.destination} />
              <FieldBox
                label="Retorno ambulatorial"
                value={returnLabel(discharge?.prescription)}
              />
            </Card>
            <Card icon={LuUsers} title="Acompanhante e transporte">
              <Line label="Responsável" value={registered.companion} />
              <Line label="Contato" value={registered.contact} />
              <Line label="Transporte" value={registered.transport} />
            </Card>
            <Card icon={LuFolderOpen} title="Documentos de alta">
              {(
                [
                  ["Orientações ao paciente", "orientacoes"],
                  ["Sumário de alta", "sumario"],
                ] as const
              ).map(([label, key]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setModal(key)}
                  className="flex items-center justify-between gap-2 text-left text-[13px] text-[#1E293B] hover:text-[#1A56DB]"
                >
                  <span className="flex items-center gap-2">
                    <LuFileText className="h-3.5 w-3.5 text-[#94A3B8]" />
                    {label}
                  </span>
                  <Chip tone="success">Assinado</Chip>
                </button>
              ))}
            </Card>
          </div>
        )}
      </div>

      {modal === "prescricao" && (
        <PrescriptionModal
          hosp={hosp}
          surgery={surgery}
          patient={patient}
          discharge={discharge}
          onClose={() => setModal(undefined)}
        />
      )}
      {modal === "orientacoes" && (
        <GuideModal
          hosp={hosp}
          surgery={surgery}
          patient={patient}
          discharge={discharge}
          onClose={() => setModal(undefined)}
        />
      )}
      {modal === "sumario" && (
        <SummaryDocModal
          hosp={hosp}
          surgery={surgery}
          patient={patient}
          discharge={discharge}
          onClose={() => setModal(undefined)}
        />
      )}
      {modal === "registrar" && discharge && (
        <RegisterModal
          hosp={hosp}
          patient={patient}
          discharge={discharge}
          onClose={() => setModal(undefined)}
        />
      )}
    </div>
  )
}
