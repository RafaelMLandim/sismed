"use client"

import {
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  addToast,
} from "@heroui/react"
import { useState } from "react"
import { LuCheck, LuNotebookPen, LuSave } from "react-icons/lu"

import { TODAY_ISO, isoToBR } from "../../_data/days"
import {
  EVOLUTION_KINDS,
  PROFESSIONALS,
  councilOf,
  kindLabel,
} from "../../_data/evolutions"
import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import { toMin } from "../../_data/time"
import type { EvolutionKind, IEvolution } from "../../_data/types"
import { DateField, MapModal } from "../mapa/MapModal"
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/modules/Surgeries/helpers/ui"

const SOAP = [
  { key: "s", label: "S · Subjetivo", hint: "O que o paciente relata" },
  {
    key: "o",
    label: "O · Objetivo",
    hint: "Exame físico, sinais vitais, exames",
  },
  { key: "a", label: "A · Avaliação", hint: "Impressão e diagnóstico" },
  { key: "p", label: "P · Plano", hint: "Condutas e próximos passos" },
] as const

type SoapKey = (typeof SOAP)[number]["key"]

/**
 * PEP-M04 · Nova evolução (SOAP). Também abre um rascunho para continuar a
 * edição. "Salvar rascunho" guarda sem assinar; "Salvar evolução" assina.
 */
export const EvolutionModal = ({
  patientId,
  draft,
  defaultAuthor,
  onClose,
}: {
  patientId: string
  /** Rascunho a continuar (senão é uma evolução nova). */
  draft?: IEvolution
  /** Profissional sugerido numa evolução nova (o cirurgião da cirurgia). */
  defaultAuthor?: string
  onClose: () => void
}) => {
  const saveEvolution = useCC((s) => s.saveEvolution)

  const initialKind: EvolutionKind = draft?.kind ?? "Médica"
  const [date, setDate] = useState(draft?.date ?? TODAY_ISO)
  const [time, setTime] = useState(draft?.time ?? MOCK_NOW)
  const [kind, setKind] = useState<EvolutionKind>(initialKind)
  const [author, setAuthor] = useState(
    draft?.author ??
      (PROFESSIONALS[initialKind].some((p) => p.name === defaultAuthor)
        ? defaultAuthor!
        : PROFESSIONALS[initialKind][0].name),
  )
  const [soap, setSoap] = useState<Record<SoapKey, string>>({
    s: draft?.s ?? "",
    o: draft?.o ?? "",
    a: draft?.a ?? "",
    p: draft?.p ?? "",
  })
  const [submitted, setSubmitted] = useState(false)

  const empty = SOAP.every(({ key }) => !soap[key].trim())
  const future =
    date > TODAY_ISO || (date === TODAY_ISO && toMin(time) > toMin(MOCK_NOW))
  const invalid = empty || future

  const save = (status: IEvolution["status"]) => {
    setSubmitted(true)
    if (invalid) return
    const clean = (v: string) => v.trim() || undefined
    saveEvolution({
      id: draft?.id,
      patientId,
      date,
      time,
      kind,
      author,
      council: councilOf(kind, author),
      s: clean(soap.s),
      o: clean(soap.o),
      a: clean(soap.a),
      p: clean(soap.p),
      status,
      signedAt: status === "assinada" ? MOCK_NOW : undefined,
    })
    addToast({
      title:
        status === "assinada"
          ? `Evolução assinada · ${kindLabel(kind)}`
          : "Rascunho salvo",
      description:
        status === "assinada"
          ? `${author} · ${date === TODAY_ISO ? "hoje" : isoToBR(date)}, ${time}`
          : "Continue a edição quando quiser e assine depois.",
      color: "success",
    })
    onClose()
  }

  return (
    <MapModal
      width={720}
      icon={<LuNotebookPen />}
      title={draft ? "Continuar evolução" : "Nova evolução"}
      description="Preencha ao menos um campo do SOAP."
      onClose={onClose}
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
            onPress={() => save("assinada")}
          >
            Salvar evolução
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <DateField
          label="Data *"
          value={date}
          max={TODAY_ISO}
          onChange={setDate}
        />
        <Input
          type="time"
          label="Hora"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          value={time}
          onValueChange={setTime}
          isInvalid={submitted && future}
          errorMessage="Não pode ser depois de agora"
        />
        <Select
          label="Tipo"
          labelPlacement="outside"
          variant="bordered"
          className="flex-1"
          disallowEmptySelection
          selectedKeys={[kind]}
          onSelectionChange={(k) => {
            const next = String([...k][0]) as EvolutionKind
            setKind(next)
            setAuthor(PROFESSIONALS[next][0].name)
          }}
        >
          {EVOLUTION_KINDS.map((k) => (
            <SelectItem key={k}>{kindLabel(k)}</SelectItem>
          ))}
        </Select>
      </div>

      <Select
        label="Profissional *"
        labelPlacement="outside"
        variant="bordered"
        disallowEmptySelection
        selectedKeys={[author]}
        onSelectionChange={(k) => setAuthor(String([...k][0]))}
      >
        {PROFESSIONALS[kind].map((p) => (
          <SelectItem key={p.name} textValue={`${p.name} · ${p.council}`}>
            {p.name} · {p.council}
          </SelectItem>
        ))}
      </Select>

      {SOAP.map(({ key, label, hint }) => (
        <Textarea
          key={key}
          label={label}
          labelPlacement="outside"
          variant="bordered"
          placeholder={hint}
          minRows={2}
          value={soap[key]}
          onValueChange={(v) => setSoap((o) => ({ ...o, [key]: v }))}
        />
      ))}

      {submitted && empty && (
        <p className="text-[12.5px] font-semibold text-[#B91C1C]">
          Preencha ao menos um campo do SOAP.
        </p>
      )}
    </MapModal>
  )
}
