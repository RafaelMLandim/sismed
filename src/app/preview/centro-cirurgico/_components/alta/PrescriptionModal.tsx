"use client"

import {
  Button,
  Checkbox,
  Select,
  SelectItem,
  Textarea,
  addToast,
} from "@heroui/react"
import { useState } from "react"
import {
  LuCalendarCheck,
  LuCheck,
  LuClipboardPen,
  LuPill,
  LuPlus,
  LuSave,
  LuStethoscope,
  LuX,
} from "react-icons/lu"

import { TODAY_ISO } from "../../_data/days"
import { ANY_PROFESSIONAL, RETURN_CLINICS } from "../../_data/discharge"
import { useCC } from "../../_data/store"
import type {
  IDischarge,
  IDischargePrescription,
  IHospitalization,
  IPatient,
  ISurgery,
} from "../../_data/types"
import { DateField, MapModal } from "../mapa/MapModal"
import { guideFromPrescription } from "./drafts"
import { FieldLabel, firstKey } from "../docs/fields"
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/modules/Surgeries/helpers/ui"

const SectionTitle = ({
  icon: Icon,
  children,
}: {
  icon: typeof LuPill
  children: string
}) => (
  <h3 className="flex items-center gap-2 text-sm font-bold text-[#1E293B]">
    <Icon className="h-4 w-4 text-[#1A56DB]" />
    {children}
  </h3>
)

/** PEP-M27 · Prescrição e orientações de alta. */
export const PrescriptionModal = ({
  hosp,
  surgery,
  patient,
  discharge,
  onClose,
}: {
  hosp: IHospitalization
  surgery: ISurgery
  patient: IPatient
  discharge?: IDischarge
  onClose: () => void
}) => {
  const updateDischarge = useCC((s) => s.updateDischarge)
  const prev = discharge?.prescription
  const firstClinic = Object.keys(RETURN_CLINICS)[0]

  const [items, setItems] = useState<string[]>(prev?.items ?? [""])
  const [dressing, setDressing] = useState(prev?.dressing ?? "")
  const [activity, setActivity] = useState(prev?.activity ?? "")
  const [alerts, setAlerts] = useState(prev?.alerts ?? "")
  const [returnDate, setReturnDate] = useState(prev?.returnDate ?? "")
  const [clinic, setClinic] = useState(prev?.returnClinic ?? firstClinic)
  const [professional, setProfessional] = useState(
    prev?.returnProfessional ?? RETURN_CLINICS[firstClinic][0],
  )
  const [generateGuide, setGenerateGuide] = useState(
    prev?.generateGuide ?? true,
  )
  const [submitted, setSubmitted] = useState(false)

  const cleanItems = items.map((i) => i.trim()).filter(Boolean)
  const errors = [
    !cleanItems.length && "Inclua ao menos um item na receita.",
    !returnDate && "Informe a data do retorno ambulatorial.",
  ].filter(Boolean) as string[]

  const save = (status: IDischargePrescription["status"]) => {
    setSubmitted(true)
    if (status === "salva" && errors.length) return
    const prescription: IDischargePrescription = {
      status,
      items: cleanItems,
      dressing: dressing.trim(),
      activity: activity.trim(),
      alerts: alerts.trim(),
      returnDate: returnDate || TODAY_ISO,
      returnClinic: clinic,
      returnProfessional: professional,
      generateGuide,
    }
    const guide = discharge?.guide
    const fillGuide =
      status === "salva" && generateGuide && guide?.status !== "assinado"
    updateDischarge(hosp.id, {
      prescription,
      ...(fillGuide
        ? { guide: guideFromPrescription(prescription, surgery, guide) }
        : {}),
    })
    addToast({
      title: status === "salva" ? "Prescrição de alta salva" : "Rascunho salvo",
      description:
        status === "rascunho"
          ? "Continue quando quiser."
          : fillGuide
            ? "As orientações ao paciente foram preenchidas. Revise e assine."
            : "Falta assinar as orientações ao paciente.",
      color: "success",
    })
    onClose()
  }

  return (
    <MapModal
      width={720}
      icon={<LuClipboardPen />}
      title="Prescrição e orientações de alta"
      description={`${patient.name} · ${hosp.bed} · ${surgery.procedure}`}
      onClose={onClose}
      dismissable={false}
      footer={
        <>
          <Button className={OUTLINE_BUTTON} onPress={onClose}>
            Cancelar
          </Button>
          <Button
            className={OUTLINE_BUTTON}
            startContent={<LuSave />}
            onPress={() => save("rascunho")}
          >
            Salvar rascunho
          </Button>
          <Button
            className={PRIMARY_BUTTON}
            startContent={<LuCheck />}
            onPress={() => save("salva")}
          >
            Salvar prescrição de alta
          </Button>
        </>
      }
    >
      <SectionTitle icon={LuPill}>Receita</SectionTitle>
      <div className="-mt-1 flex items-center justify-between">
        <FieldLabel>Itens da receita</FieldLabel>
        <span className="text-[11px] text-[#94A3B8]">
          Texto livre · um item por linha
        </span>
      </div>
      <div className="-mt-2 flex flex-col gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white pl-3"
          >
            <span className="text-[13px] text-[#94A3B8]">{i + 1}.</span>
            <input
              aria-label={`Item ${i + 1} da receita`}
              value={item}
              placeholder="Medicamento, dose, via, frequência e duração"
              onChange={(e) =>
                setItems((l) => l.map((x, j) => (j === i ? e.target.value : x)))
              }
              className="h-10 flex-1 bg-transparent text-[13px] text-[#1E293B] outline-none placeholder:text-[#94A3B8]"
            />
            <button
              type="button"
              aria-label="Remover item"
              onClick={() =>
                setItems((l) =>
                  l.length === 1 ? [""] : l.filter((_, j) => j !== i),
                )
              }
              className="px-3 text-[#94A3B8] hover:text-[#EF4444]"
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems((l) => [...l, ""])}
          className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-[#1A56DB]"
        >
          <LuPlus className="h-3.5 w-3.5" />
          Adicionar item
        </button>
      </div>

      <SectionTitle icon={LuStethoscope}>Cuidados e orientações</SectionTitle>
      {(
        [
          ["Curativo", dressing, setDressing],
          ["Atividade e restrições", activity, setActivity],
          ["Sinais de alerta para voltar ao hospital", alerts, setAlerts],
        ] as const
      ).map(([label, value, set]) => (
        <Textarea
          key={label}
          label={label}
          labelPlacement="outside"
          variant="bordered"
          minRows={2}
          value={value}
          onValueChange={set}
        />
      ))}

      <SectionTitle icon={LuCalendarCheck}>Retorno ambulatorial</SectionTitle>
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col">
          <DateField
            label="Data *"
            value={returnDate}
            min={TODAY_ISO}
            onChange={setReturnDate}
          />
          {submitted && !returnDate && (
            <span className="mt-1 text-[11px] text-[#EF4444]">
              Escolha a data
            </span>
          )}
        </div>
        <Select
          label="Ambulatório"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          disallowEmptySelection
          selectedKeys={[clinic]}
          onSelectionChange={(k) => {
            const c = firstKey(k)
            setClinic(c)
            setProfessional(RETURN_CLINICS[c][0])
          }}
        >
          {Object.keys(RETURN_CLINICS).map((c) => (
            <SelectItem key={c}>{c}</SelectItem>
          ))}
        </Select>
        <Select
          label="Profissional"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          disallowEmptySelection
          selectedKeys={[professional]}
          onSelectionChange={(k) => setProfessional(firstKey(k))}
        >
          {[...RETURN_CLINICS[clinic], ANY_PROFESSIONAL].map((p) => (
            <SelectItem key={p}>{p}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="rounded-lg bg-[#F8FAFC] px-3.5 py-3">
        <Checkbox
          size="sm"
          isSelected={generateGuide}
          onValueChange={setGenerateGuide}
          classNames={{ label: "text-[13px] font-semibold text-[#1E293B]" }}
        >
          Gerar folha de orientações ao paciente
        </Checkbox>
        <p className="mt-0.5 pl-7 text-xs text-[#94A3B8]">
          Preenche o documento “Orientações ao paciente” com a receita, os
          cuidados e o retorno, pronto para assinar e imprimir.
        </p>
      </div>

      {submitted && errors.length > 0 && (
        <ul className="text-[12.5px] font-semibold text-[#B91C1C]">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </MapModal>
  )
}
