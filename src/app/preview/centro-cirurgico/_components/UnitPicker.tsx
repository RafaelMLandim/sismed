"use client"

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react"
import { LuBuilding2, LuChevronDown } from "react-icons/lu"

import { useCC, useCurrentUnit } from "../_data/store"

/** Seletor de unidade: padding 10×12, 13px, ícone 15, raio 8. */
const UNIT_BUTTON =
  "h-9 min-w-0 gap-2 rounded-lg border-1 border-[#E2E8F0] bg-white px-3 text-[13px] text-[#64748B] data-[hover=true]:bg-[#F8FAFC] [&>svg]:h-[15px] [&>svg]:w-[15px]"

/**
 * "Unidade: …" do cabeçalho. Trocar aqui troca a agenda e a lista de todas as
 * telas (a unidade fica salva no store).
 */
export const UnitPicker = () => {
  const units = useCC((s) => s.units)
  const rooms = useCC((s) => s.rooms)
  const setUnit = useCC((s) => s.setUnit)
  const current = useCurrentUnit()

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button className={UNIT_BUTTON} startContent={<LuBuilding2 />}>
          Unidade:
          <span className="font-semibold text-[#1E293B]">{current.name}</span>
          <span className="flex text-[#94A3B8]">
            <LuChevronDown className="h-[13px] w-[13px]" />
          </span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Unidade"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={new Set([current.id])}
        onAction={(key) => setUnit(String(key))}
        itemClasses={{
          base: "data-[selected=true]:bg-[#EBF0FE] data-[selected=true]:text-[#1A56DB]",
        }}
      >
        {units.map((u) => {
          const n = rooms.filter((r) => r.unitId === u.id).length
          return (
            <DropdownItem
              key={u.id}
              description={`${u.kind} · ${n} ${n === 1 ? "sala" : "salas"}`}
            >
              {u.name}
            </DropdownItem>
          )
        })}
      </DropdownMenu>
    </Dropdown>
  )
}
