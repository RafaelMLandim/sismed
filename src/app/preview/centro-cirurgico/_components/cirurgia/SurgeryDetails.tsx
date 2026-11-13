import { LuTriangleAlert } from "react-icons/lu"

import { TODAY_ISO, isoToBR } from "../../_data/days"
import { fmtDuration } from "../../_data/time"
import type { ICareNote, ISurgery } from "../../_data/types"
import { surgeonLabel } from "./helpers"
import { cn } from "@/shared/utils/cn"

const NOTE_TONE: Record<ICareNote["tone"], string> = {
  danger: "text-[#B91C1C]",
  warning: "text-[#B45309]",
  primary: "text-[#64748B]",
  default: "text-[#64748B]",
}

/** "Dados da cirurgia" + "Cuidados nesta cirurgia" (rodapé do PEP-03*). */
export const SurgeryDetails = ({
  surgery: s,
  roomName,
}: {
  surgery: ISurgery
  roomName?: string
}) => {
  const cells = [
    {
      label: "Horário",
      value:
        s.start && s.end
          ? `${s.date && s.date !== TODAY_ISO ? `${isoToBR(s.date)} · ` : ""}${s.start} às ${s.end}`
          : `A definir · ${fmtDuration(s.durationMin)}`,
    },
    { label: "Sala", value: roomName ?? "A definir" },
    { label: "Lado", value: s.side ?? "Não se aplica" },
    { label: surgeonLabel(s), value: s.surgeon },
    { label: "Anestesista", value: s.anesthetist ?? "A definir" },
    { label: "Anestesia", value: s.anesthesia ?? "A definir" },
  ]

  return (
    <div className="flex flex-col gap-4 xl:flex-row">
      <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-[#E2E8F0] bg-white">
        <h2 className="border-b border-[#E2E8F0] px-5 py-3.5 text-[15px] font-bold text-[#1E293B]">
          Dados da cirurgia
        </h2>
        <dl className="grid grid-cols-2 md:grid-cols-3">
          {cells.map((c, i) => (
            <div
              key={c.label}
              className={cn(
                "flex flex-col gap-[3px] border-[#E2E8F0] px-5 py-3",
                i < 3 && "md:border-b",
                i % 3 !== 2 && "md:border-r",
                "max-md:border-b max-md:odd:border-r",
              )}
            >
              <dt className="text-xs text-[#94A3B8]">{c.label}</dt>
              <dd className="text-sm font-semibold text-[#1E293B]">
                {c.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col rounded-xl border border-[#E2E8F0] bg-white xl:w-[520px] xl:shrink-0">
        <h2 className="flex items-center gap-2 border-b border-[#E2E8F0] px-5 py-3.5 text-[15px] font-bold text-[#1E293B]">
          <LuTriangleAlert className="h-4 w-4 text-[#B45309]" />
          Cuidados nesta cirurgia
        </h2>
        <ul className="flex flex-col px-5 py-1.5">
          {s.careNotes.map((n) => (
            <CareRow
              key={`${n.label}-${n.value}`}
              label={n.label}
              value={n.value}
              labelClass={NOTE_TONE[n.tone]}
            />
          ))}
          <CareRow
            label="Reservas"
            value={s.reservations}
            labelClass="text-[#64748B]"
          />
        </ul>
      </section>
    </div>
  )
}

const CareRow = ({
  label,
  value,
  labelClass,
}: {
  label: string
  value: string
  labelClass: string
}) => (
  <li className="flex gap-3 border-b border-[#E2E8F0] py-[9px] last:border-b-0">
    <span
      className={cn("w-[100px] shrink-0 text-[13px] font-semibold", labelClass)}
    >
      {label}
    </span>
    <span className="flex-1 text-[13.5px] text-[#1E293B]">{value}</span>
  </li>
)
