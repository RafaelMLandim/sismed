"use client"

import { Button } from "@heroui/react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, type ReactNode } from "react"
import { LuCircleX, LuInbox, LuMap, LuSearchX } from "react-icons/lu"

import { useCC, useSurgery } from "../../_data/store"
import type { DocKey, ISurgery } from "../../_data/types"
import { BASE } from "../MockShell"
import { PatientShell } from "../PatientShell"
import { Chip } from "../ui"
import { DocumentModal } from "./DocumentModal"
import { DocumentsSection, type Visao } from "./DocumentsSection"
import { PhaseDocsModal, type PhaseSelection } from "./PhaseDocsModal"
import { StatusHero } from "./StatusHero"
import { SurgeryDetails } from "./SurgeryDetails"
import { SurgeryTitle } from "./SurgeryTitle"
import { PRIMARY_BUTTON } from "@/modules/Surgeries/helpers/ui"

/** Aba "Cirurgia" do paciente (PEP-03, 03b, 03d, 03e), guiada pela etapa. */
export const SurgeryTab = ({ id }: { id: number }) => {
  const surgery = useSurgery(id)
  if (!surgery) return <NotFound id={id} />
  return <SurgeryTabContent surgery={surgery} />
}

const SurgeryTabContent = ({ surgery: s }: { surgery: ISurgery }) => {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const visao: Visao =
    params.get("visao") === "medico" ? "medico" : "enfermagem"
  const roomName = useCC((st) => st.rooms.find((r) => r.id === s.roomId)?.name)
  const [openDoc, setOpenDoc] = useState<DocKey | null>(null)
  const [phase, setPhase] = useState<PhaseSelection | null>(null)

  const setVisao = (v: Visao) =>
    router.replace(v === "medico" ? `${pathname}?visao=medico` : pathname, {
      scroll: false,
    })

  const inFlow = ["agendada", "em_cirurgia", "srpa", "finalizada"].includes(
    s.stage,
  )

  return (
    <PatientShell surgery={s}>
      <SurgeryTitle
        surgery={s}
        visao={inFlow ? visao : undefined}
        onVisaoChange={setVisao}
      />
      {inFlow ? (
        <>
          <StatusHero surgery={s} roomName={roomName} onOpenPhase={setPhase} />
          <DocumentsSection
            surgery={s}
            visao={visao}
            onOpenDoc={setOpenDoc}
            onOpenPhase={setPhase}
          />
        </>
      ) : s.stage === "a_alocar" ? (
        <WaitingAllocation surgery={s} />
      ) : (
        <Cancelled surgery={s} />
      )}
      <SurgeryDetails surgery={s} roomName={roomName} />

      <PhaseDocsModal
        surgery={s}
        selection={phase}
        onClose={() => setPhase(null)}
        onOpenDoc={(k) => {
          setPhase(null)
          setOpenDoc(k)
        }}
      />
      <DocumentModal
        surgery={s}
        docKey={openDoc}
        onClose={() => setOpenDoc(null)}
      />
    </PatientShell>
  )
}

const StateCard = ({
  icon: Icon,
  iconBg,
  title,
  subtitle,
  children,
}: {
  icon: typeof LuInbox
  iconBg: string
  title: string
  subtitle: string
  children?: ReactNode
}) => (
  <section className="flex flex-wrap items-center gap-[18px] rounded-xl border border-[#E2E8F0] bg-white px-6 py-5">
    <span
      className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-white ${iconBg}`}
    >
      <Icon className="h-6 w-6" />
    </span>
    <div className="flex min-w-[220px] flex-1 flex-col gap-1">
      <span className="text-[22px] font-bold text-[#1E293B]">{title}</span>
      <span className="text-sm text-[#64748B]">{subtitle}</span>
    </div>
    {children}
  </section>
)

const WaitingAllocation = ({ surgery: s }: { surgery: ISurgery }) => (
  <StateCard
    icon={LuInbox}
    iconBg="bg-[#F59E0B]"
    title="Aguardando alocação no mapa cirúrgico"
    subtitle={[
      "Confirmada no acompanhamento cirúrgico, ainda sem sala e horário",
      s.preferredPeriod && `preferência: ${s.preferredPeriod.toLowerCase()}`,
    ]
      .filter(Boolean)
      .join(" · ")}
  >
    <div className="flex flex-col items-end gap-2">
      <Button
        as={Link}
        href={`${BASE}/mapa`}
        className={PRIMARY_BUTTON}
        startContent={<LuMap />}
      >
        Alocar no mapa cirúrgico
      </Button>
      {s.pendencies.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1.5">
          {s.pendencies.map((p) => (
            <Chip key={p} tone="warning">
              {p}
            </Chip>
          ))}
        </div>
      )}
    </div>
  </StateCard>
)

const Cancelled = ({ surgery: s }: { surgery: ISurgery }) => (
  <StateCard
    icon={LuCircleX}
    iconBg="bg-[#EF4444]"
    title="Cirurgia cancelada"
    subtitle={
      s.pendencies[0] ??
      "Os documentos e a ficha de gastos desta cirurgia não seguem adiante."
    }
  />
)

const NotFound = ({ id }: { id: number }) => (
  <main className="flex min-h-screen items-center justify-center px-6 py-6">
    <div className="flex max-w-md flex-col items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-8 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F8FAFC] text-[#94A3B8]">
        <LuSearchX className="h-6 w-6" />
      </span>
      <h1 className="text-lg font-bold text-[#1E293B]">
        Cirurgia {Number.isFinite(id) ? `#${id} ` : ""}não encontrada
      </h1>
      <p className="text-sm text-[#64748B]">
        Ela pode ter sido removida ao resetar os dados do mock.
      </p>
      <Button as={Link} href={BASE} className={PRIMARY_BUTTON}>
        Voltar para internações e cirurgias
      </Button>
    </div>
  </main>
)
