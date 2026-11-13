"use client"

import { Button, Input, Select, SelectItem, addToast } from "@heroui/react"
import { useState } from "react"
import {
  LuCircleCheck,
  LuLock,
  LuLogOut,
  LuPenLine,
  LuSignature,
  LuSprayCan,
} from "react-icons/lu"

import { TODAY_ISO, isoToBR } from "../../_data/days"
import {
  DESTINATIONS,
  DISCHARGE_TYPES,
  TRANSPORTS,
} from "../../_data/discharge"
import { PROFESSIONALS } from "../../_data/evolutions"
import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import type {
  DischargeType,
  IDischarge,
  IHospitalization,
  IPatient,
} from "../../_data/types"
import { firstKey } from "../docs/fields"
import { DateField, MapModal, ReadOnlyField } from "../mapa/MapModal"
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/modules/Surgeries/helpers/ui"

/** PEP-M28 · Registrar alta. Só abre com os 7 pré-requisitos concluídos. */
export const RegisterModal = ({
  hosp,
  patient,
  discharge,
  onClose,
}: {
  hosp: IHospitalization
  patient: IPatient
  discharge: IDischarge
  onClose: () => void
}) => {
  const registerDischarge = useCC((s) => s.registerDischarge)
  const summary = discharge.summary
  const p = discharge.prescription
  const [date, setDate] = useState(summary?.date ?? TODAY_ISO)
  const [time, setTime] = useState(summary?.time ?? MOCK_NOW)
  const [type, setType] = useState<DischargeType>(summary?.type ?? "Melhorada")
  const [destination, setDestination] = useState(
    summary?.destination ?? "Domicílio",
  )
  const [companion, setCompanion] = useState(summary?.companion ?? "")
  const [contact, setContact] = useState("")
  const [transport, setTransport] = useState(TRANSPORTS[0])

  const council = PROFESSIONALS["Médica"].find(
    (d) => d.name === summary?.signedBy,
  )?.council

  const confirm = () => {
    registerDischarge(hosp.id, {
      date,
      time,
      type,
      destination,
      companion: companion.trim(),
      contact: contact.trim(),
      transport,
    })
    addToast({
      title: "Alta registrada",
      description: `Internação encerrada em ${isoToBR(date)} às ${time}. ${hosp.bed} enviado para higienização.`,
      color: "success",
    })
    onClose()
  }

  return (
    <MapModal
      width={560}
      icon={<LuLogOut />}
      title="Registrar alta"
      description={`${patient.name} · ${hosp.bed} · Internação de ${hosp.admittedOn}`}
      onClose={onClose}
      footer={
        <>
          <Button className={OUTLINE_BUTTON} onPress={onClose}>
            Cancelar
          </Button>
          <Button
            className={PRIMARY_BUTTON}
            startContent={<LuPenLine />}
            onPress={confirm}
          >
            Assinar e registrar alta
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-2 rounded-lg bg-[#ECFDF5] px-3.5 py-3 text-[13px] font-semibold text-[#047857]">
        <LuCircleCheck className="h-4 w-4" />
        Os 7 pré-requisitos estão concluídos. Confirme os dados da saída.
      </div>

      <div className="flex items-start gap-3">
        <div className="flex flex-1 gap-2">
          <DateField
            label="Data da saída *"
            value={date}
            min={TODAY_ISO}
            onChange={setDate}
          />
          <Input
            type="time"
            label="Hora"
            labelPlacement="outside"
            variant="bordered"
            className="w-28"
            value={time}
            onValueChange={setTime}
          />
        </div>
        <Select
          label="Tipo de alta *"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          disallowEmptySelection
          selectedKeys={[type]}
          onSelectionChange={(k) => setType(firstKey(k) as DischargeType)}
        >
          {DISCHARGE_TYPES.map((t) => (
            <SelectItem key={t}>{t}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="flex items-start gap-3">
        <Select
          label="Destino *"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          disallowEmptySelection
          selectedKeys={[destination]}
          onSelectionChange={(k) => setDestination(firstKey(k))}
        >
          {DESTINATIONS.map((d) => (
            <SelectItem key={d}>{d}</SelectItem>
          ))}
        </Select>
        <ReadOnlyField label="Retorno" muted>
          {p
            ? `${isoToBR(p.returnDate).slice(0, 5)} · ${p.returnClinic}`
            : "Sem retorno"}
        </ReadOnlyField>
      </div>

      <div className="flex items-start gap-3">
        <Input
          label="Acompanhante"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          placeholder="Nome (parentesco)"
          value={companion}
          onValueChange={setCompanion}
        />
        <Input
          label="Contato"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          placeholder="(61) 99999-9999"
          value={contact}
          onValueChange={setContact}
        />
      </div>
      <Select
        label="Transporte"
        labelPlacement="outside"
        variant="bordered"
        disallowEmptySelection
        selectedKeys={[transport]}
        onSelectionChange={(k) => setTransport(firstKey(k))}
      >
        {TRANSPORTS.map((t) => (
          <SelectItem key={t}>{t}</SelectItem>
        ))}
      </Select>

      <div className="flex flex-col gap-2 rounded-lg border border-[#E2E8F0] px-3.5 py-3 text-[12.5px] text-[#64748B]">
        <span className="text-[10.5px] font-bold tracking-[0.9px] text-[#94A3B8] uppercase">
          Ao confirmar
        </span>
        <span className="flex items-center gap-2">
          <LuSignature className="h-3.5 w-3.5" />
          Sumário de alta assinado por {summary?.signedBy}
          {council ? ` · ${council}` : ""}
        </span>
        <span className="flex items-center gap-2">
          <LuLock className="h-3.5 w-3.5" />
          Internação encerrada — prontuário fica somente leitura
        </span>
        <span className="flex items-center gap-2">
          <LuSprayCan className="h-3.5 w-3.5" />
          {hosp.bed} enviado para higienização
        </span>
      </div>
    </MapModal>
  )
}
