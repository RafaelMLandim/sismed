"use client"

import { Button } from "@heroui/react"
import Link from "next/link"
import {
  LuBedDouble,
  LuCalendarRange,
  LuHospital,
  LuPlus,
} from "react-icons/lu"

import { MOCK_NOW, MOCK_TODAY_LONG } from "../../_data/fixtures"
import { UnitPicker } from "../UnitPicker"
import { BASE } from "../MockShell"
import { outOfScope } from "./parts"
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/modules/Surgeries/helpers/ui"

export const EntradaHeader = () => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="flex flex-col gap-[5px]">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.5px] text-[#1A56DB]">
        <LuHospital className="h-[13px] w-[13px]" />
        ATENDIMENTOS › INTERNAÇÕES E CIRURGIAS
      </div>
      <h1 className="text-2xl font-bold text-[#1E293B]">
        Internações e cirurgias
      </h1>
      <p className="text-[13px] text-[#64748B]">
        Todas as passagens dos pacientes: em andamento, agendadas e encerradas ·{" "}
        {MOCK_TODAY_LONG} · agora {MOCK_NOW}
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-2.5">
      <UnitPicker />

      <Button
        as={Link}
        href={`${BASE}/mapa`}
        className={OUTLINE_BUTTON}
        startContent={<LuCalendarRange />}
      >
        Mapa cirúrgico
      </Button>
      <Button
        className={OUTLINE_BUTTON}
        startContent={<LuBedDouble />}
        onPress={() => outOfScope("Mapa de leitos")}
      >
        Mapa de leitos
      </Button>
      <Button
        className={PRIMARY_BUTTON}
        startContent={<LuPlus />}
        onPress={() => outOfScope("Registrar internação")}
      >
        Registrar internação
      </Button>
    </div>
  </div>
)
