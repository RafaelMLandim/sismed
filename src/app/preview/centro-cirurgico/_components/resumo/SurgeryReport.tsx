"use client"

import { Button } from "@heroui/react"
import Link from "next/link"
import { useEffect, type ReactNode } from "react"
import { LuArrowLeft, LuPrinter } from "react-icons/lu"

import {
  DOC_META,
  MOCK_TODAY,
  UNIT_NAME,
  docsOfPhase,
} from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import { fmtBRL } from "../../_data/time"
import type { DocPhase, ISurgery } from "../../_data/types"
import {
  docResponsible,
  procedureTitle,
  surgeonLabel,
} from "../cirurgia/helpers"
import { summarize } from "../gastos/meta"
import { BASE } from "../MockShell"
import { STEP_META, surgeryStep } from "../ui"

const PHASES: { phase: DocPhase; label: string }[] = [
  { phase: "antes", label: "Antes da sala" },
  { phase: "sala", label: "Na sala" },
  { phase: "srpa", label: "Recuperação (SRPA)" },
  { phase: "depois", label: "Após a alta da SRPA" },
]

const STATUS_LABEL = {
  nao_iniciado: "Não iniciado",
  em_preenchimento: "Em preenchimento",
  assinado: "Assinado",
} as const

/**
 * Resumo da cirurgia para impressão (botão "Imprimir resumo" da cirurgia
 * finalizada). Abre o diálogo de impressão do navegador, onde dá para
 * "Salvar como PDF". `?auto=0` desliga a abertura automática.
 */
export const SurgeryReport = ({
  surgery: s,
  autoPrint,
}: {
  surgery: ISurgery
  autoPrint: boolean
}) => {
  const patient = useCC((st) => st.patients.find((p) => p.id === s.patientId))
  const room = useCC((st) => st.rooms.find((r) => r.id === s.roomId))
  const unit = useCC((st) => st.units.find((u) => u.id === s.unitId))
  const hosp = useCC((st) =>
    st.hospitalizations.find((h) => h.id === s.hospitalizationId),
  )
  const sheet = useCC((st) =>
    st.expenseSheets.find((e) => e.surgeryId === s.id),
  )

  useEffect(() => {
    if (!autoPrint) return
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [autoPrint])

  if (!patient) return null
  const expenses = summarize(sheet?.items ?? [])
  const step = STEP_META[surgeryStep(s)]

  return (
    <div className="mx-auto max-w-[860px] px-6 py-8 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`${BASE}/cirurgias/${s.id}`}
          className="flex items-center gap-2 text-[13px] font-semibold text-[#1A56DB]"
        >
          <LuArrowLeft className="h-4 w-4" /> Voltar para a cirurgia
        </Link>
        <Button
          color="primary"
          startContent={<LuPrinter className="h-4 w-4" />}
          onPress={() => window.print()}
        >
          Imprimir / Salvar PDF
        </Button>
      </div>

      <article className="rounded-[10px] border border-[#E2E8F0] bg-white p-10 text-[13px] text-[#1E293B] print:rounded-none print:border-0 print:p-0">
        <header className="flex items-start justify-between border-b-2 border-[#1A56DB] pb-4">
          <div>
            <p className="text-[10.5px] font-bold tracking-[0.9px] text-[#1A56DB] uppercase">
              {unit?.name ?? UNIT_NAME} · Centro cirúrgico
            </p>
            <h1 className="mt-1 text-[22px] font-bold">Resumo da cirurgia</h1>
            <p className="text-[#64748B]">
              Cirurgia #{s.id} · emitido em {MOCK_TODAY}
            </p>
          </div>
          <span className="rounded-full border border-[#E2E8F0] px-3 py-1 text-xs font-semibold">
            {step.label}
          </span>
        </header>

        <Section title="Paciente">
          <Grid
            items={[
              ["Nome", patient.name],
              ["Idade / sexo", `${patient.age} anos · ${patient.sex}`],
              ["Prontuário", patient.record],
              ["Convênio", s.insurance],
              [
                "Internação",
                hosp ? `#${hosp.id} · ${hosp.bed}` : "Ambulatorial",
              ],
              ["Alergias", patient.allergies.join(", ") || "Nenhuma informada"],
            ]}
          />
        </Section>

        <Section title="Cirurgia">
          <Grid
            items={[
              ["Procedimento", procedureTitle(s)],
              ["Sala", room?.name ?? "—"],
              ["Horário previsto", s.start ? `${s.start} às ${s.end}` : "—"],
              [surgeonLabel(s), s.surgeon],
              ["Anestesista", s.anesthetist ?? "—"],
              ["Anestesia", s.anesthesia ?? "—"],
              ["Reservas", s.reservations],
            ]}
          />
        </Section>

        <Section title="Linha do tempo">
          <Grid
            items={[
              ["Entrada na sala", s.enteredRoomAt ?? "—"],
              ["Saída da sala", s.leftRoomAt ?? "—"],
              ["Leito na SRPA", s.srpaBed ?? "—"],
              ["Alta da SRPA", s.srpaDischargeAt ?? "—"],
            ]}
          />
        </Section>

        {s.careNotes.length > 0 && (
          <Section title="Cuidados nesta cirurgia">
            <ul className="space-y-1">
              {s.careNotes.map((n) => (
                <li key={n.label}>
                  <span className="font-semibold">{n.label}:</span> {n.value}
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Documentos">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[10.5px] tracking-[0.4px] text-[#94A3B8] uppercase">
                <th className="py-1.5">Etapa</th>
                <th>Documento</th>
                <th>Responsável</th>
                <th className="text-right">Situação</th>
              </tr>
            </thead>
            <tbody>
              {PHASES.flatMap(({ phase, label }) =>
                docsOfPhase(phase).map((k) => {
                  const d = s.docs[k]
                  return (
                    <tr key={k} className="border-t border-[#E2E8F0]">
                      <td className="py-1.5 text-[#64748B]">{label}</td>
                      <td>{DOC_META[k].title}</td>
                      <td className="text-[#64748B]">{docResponsible(s, k)}</td>
                      <td className="text-right">
                        {STATUS_LABEL[d.status]}
                        {d.signedAt ? ` às ${d.signedAt}` : ""}
                      </td>
                    </tr>
                  )
                }),
              )}
            </tbody>
          </table>
        </Section>

        <Section title="Ficha de gastos">
          <p className="mb-2 text-[#64748B]">
            {sheet?.status === "fechada"
              ? `Fechada às ${sheet.closedAt} por ${sheet.closedBy}`
              : "Em aberto"}{" "}
            · {expenses.count} itens
          </p>
          <table className="w-full border-collapse">
            <tbody>
              {expenses.groups.map((g) => (
                <tr key={g.key} className="border-t border-[#E2E8F0]">
                  <td className="py-1.5">{g.label}</td>
                  <td className="text-right text-[#64748B]">{g.count} itens</td>
                  <td className="w-32 text-right">{fmtBRL(g.value)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#1E293B] font-bold">
                <td className="py-1.5">Total estimado</td>
                <td className="text-right">{expenses.count} itens</td>
                <td className="text-right">{fmtBRL(expenses.value)}</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="Medicamentos, materiais e gases utilizados">
          {sheet?.items.length ? (
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="text-left text-[10.5px] tracking-[0.4px] text-[#94A3B8] uppercase">
                  <th className="py-1.5">Item</th>
                  <th>Tipo</th>
                  <th className="text-right">Qtd</th>
                  <th className="pl-3">Lote</th>
                  <th>Lançado por</th>
                  <th className="text-right">Hora</th>
                </tr>
              </thead>
              <tbody>
                {[...sheet.items]
                  .sort((a, b) => a.launchedAt.localeCompare(b.launchedAt))
                  .map((i) => (
                    <tr key={i.id} className="border-t border-[#E2E8F0]">
                      <td className="py-1.5 pr-2">
                        {i.name}
                        <span className="block text-[10.5px] text-[#94A3B8]">
                          {i.code}
                        </span>
                      </td>
                      <td>{i.kind}</td>
                      <td className="text-right whitespace-nowrap">
                        {i.qty} {i.unit}
                      </td>
                      <td className="pl-3">{i.lot ?? "—"}</td>
                      <td>{i.launchedBy}</td>
                      <td className="text-right">{i.launchedAt}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p className="text-[#64748B]">Nenhum item lançado.</p>
          )}
        </Section>

        <footer className="mt-12 grid grid-cols-2 gap-10 text-center text-xs text-[#64748B]">
          <div className="border-t border-[#94A3B8] pt-2">
            {s.surgeon} · {surgeonLabel(s).toLowerCase()}
          </div>
          <div className="border-t border-[#94A3B8] pt-2">
            {s.anesthetist ?? "Anestesista"} · anestesista
          </div>
        </footer>
      </article>
    </div>
  )
}

const Section = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <section className="mt-6 break-inside-avoid">
    <h2 className="mb-2 text-[11px] font-bold tracking-[0.6px] text-[#1A56DB] uppercase">
      {title}
    </h2>
    {children}
  </section>
)

const Grid = ({ items }: { items: [string, string][] }) => (
  <dl className="grid grid-cols-3 gap-x-6 gap-y-2">
    {items.map(([k, v]) => (
      <div key={k}>
        <dt className="text-[11px] text-[#64748B]">{k}</dt>
        <dd className="font-medium">{v}</dd>
      </div>
    ))}
  </dl>
)
