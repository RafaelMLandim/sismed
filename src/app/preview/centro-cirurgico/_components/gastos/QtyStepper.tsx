"use client"

import { LuMinus, LuPlus } from "react-icons/lu"

import { cn } from "@/shared/utils/cn"

/** Campo de quantidade com − e + (desenho: 120×42 na barra, 110×34 no modal). */
export const QtyStepper = ({
  value,
  onChange,
  min = 1,
  size = "md",
  disabled,
  highlight,
  label = "Quantidade",
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  size?: "sm" | "md"
  disabled?: boolean
  /** Valor diferente do padrão (texto em azul). */
  highlight?: boolean
  label?: string
}) => {
  const btn = cn(
    "flex items-center justify-center bg-[#F8FAFC] text-[#64748B] hover:bg-[#EEF2F7] disabled:cursor-not-allowed disabled:opacity-50",
    size === "md"
      ? "h-[30px] w-[30px] rounded-md"
      : "h-[26px] w-[26px] rounded-[5px]",
  )
  const icon = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between border border-[#E2E8F0] bg-white",
        size === "md"
          ? "h-[42px] w-[120px] rounded-lg px-1.5"
          : "h-[34px] w-[110px] rounded-[7px] px-1",
        disabled && "opacity-45",
      )}
    >
      <button
        type="button"
        aria-label="Diminuir"
        className={btn}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <LuMinus className={icon} />
      </button>
      <input
        aria-label={label}
        inputMode="numeric"
        disabled={disabled}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/\D/g, ""))
          onChange(Number.isFinite(n) ? Math.max(min, n) : min)
        }}
        className={cn(
          "w-10 bg-transparent text-center text-[13.5px] font-semibold outline-none",
          highlight ? "text-[#1A56DB]" : "text-[#1E293B]",
        )}
      />
      <button
        type="button"
        aria-label="Aumentar"
        className={btn}
        disabled={disabled}
        onClick={() => onChange(value + 1)}
      >
        <LuPlus className={icon} />
      </button>
    </div>
  )
}
