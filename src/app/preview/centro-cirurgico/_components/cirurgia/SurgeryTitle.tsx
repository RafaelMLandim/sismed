"use client"

import { Button, Tab, Tabs, addToast } from "@heroui/react"
import Link from "next/link"
import { LuArrowLeft, LuArrowUpRight, LuScissors } from "react-icons/lu"

import type { ISurgery } from "../../_data/types"
import { BASE } from "../MockShell"
import { Eyebrow, StepChip, surgeryStep } from "../ui"
import type { Visao } from "./DocumentsSection"
import { procedureTitle } from "./helpers"
import { OUTLINE_BUTTON } from "@/modules/Surgeries/helpers/ui"

export const SurgeryTitle = ({
  surgery: s,
  visao,
  onVisaoChange,
}: {
  surgery: ISurgery
  visao?: Visao
  onVisaoChange?: (v: Visao) => void
}) => (
  <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
    <div className="flex items-start gap-3">
      <Button
        as={Link}
        href={BASE}
        isIconOnly
        size="sm"
        variant="light"
        aria-label="Voltar para internações e cirurgias"
        className="mt-4 text-[#64748B]"
      >
        <LuArrowLeft className="h-[18px] w-[18px]" />
      </Button>
      <div className="flex flex-col gap-[5px]">
        <Eyebrow icon={LuScissors}>Cirurgia #{s.id}</Eyebrow>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[28px] leading-tight font-bold text-[#1E293B]">
            {procedureTitle(s)}
          </h1>
          <StepChip
            step={surgeryStep(s)}
            label={s.stage === "srpa" ? "Na SRPA" : undefined}
          />
        </div>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2.5">
      {visao && onVisaoChange && (
        <Tabs
          size="sm"
          aria-label="Visão"
          selectedKey={visao}
          onSelectionChange={(k) => onVisaoChange(k as Visao)}
        >
          <Tab key="enfermagem" title="Visão: Enfermagem" />
          <Tab key="medico" title="Visão: Médico" />
        </Tabs>
      )}
      <Button
        className={OUTLINE_BUTTON}
        startContent={<LuArrowUpRight />}
        onPress={() =>
          addToast({
            title: "Acompanhamento cirúrgico fora do escopo do mock",
            description: "Este preview cobre só o fluxo do centro cirúrgico.",
          })
        }
      >
        Abrir no acompanhamento cirúrgico
      </Button>
    </div>
  </div>
)
