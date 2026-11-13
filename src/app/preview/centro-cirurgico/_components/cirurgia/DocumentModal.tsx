"use client"

import {
  Button,
  Checkbox,
  CheckboxGroup,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Textarea,
  addToast,
} from "@heroui/react"
import { useState } from "react"
import { LuCircleCheck, LuPenLine, LuSave } from "react-icons/lu"

import { DOC_META, MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import type { DocKey, ISurgery } from "../../_data/types"
import { PreAnesthesiaModal } from "../docs/PreAnesthesiaModal"
import { PreOpAdmissionModal } from "../docs/PreOpAdmissionModal"
import { IntraopEvolutionModal } from "../docs/IntraopEvolutionModal"
import { SafetyChecklistModal } from "../docs/SafetyChecklistModal"
import { AnesthesiaRecordModal } from "../docs/AnesthesiaRecordModal"
import { SrpaModal } from "../docs/SrpaModal"
import { SurgicalDescriptionModal } from "../docs/SurgicalDescriptionModal"
import { HospitalAdmissionModal } from "../docs/HospitalAdmissionModal"
import { Chip } from "../ui"
import { docFields, type DocField } from "./docFields"
import { DOC_UI, docResponsible } from "./helpers"
import { FIELD_STYLES } from "@/modules/Surgeries/helpers/ui"

type Values = Record<string, string | string[]>

const initialValues = (fields: DocField[], filled: boolean): Values =>
  Object.fromEntries(
    fields.map((f) => {
      if (f.kind === "checks") return [f.label, filled ? (f.sample ?? []) : []]
      return [f.label, filled ? (f.sample ?? "") : ""]
    }),
  )

/**
 * Abre o documento: os que já têm o formulário completo do desenho usam
 * o modal próprio (D01 a D07, D10 e D11); os demais, o modal genérico simplificado.
 */
export const DocumentModal = ({
  surgery,
  docKey,
  onClose,
}: {
  surgery: ISurgery
  docKey: DocKey | null
  onClose: () => void
}) =>
  docKey === "pre_anestesica" ? (
    <PreAnesthesiaModal surgery={surgery} onClose={onClose} />
  ) : docKey === "admissao_pre_op" ? (
    <PreOpAdmissionModal surgery={surgery} onClose={onClose} />
  ) : docKey === "evolucao_intraop" ? (
    <IntraopEvolutionModal surgery={surgery} onClose={onClose} />
  ) : docKey === "checklist" ? (
    <SafetyChecklistModal surgery={surgery} onClose={onClose} />
  ) : docKey === "boletim_anestesico" ? (
    <AnesthesiaRecordModal surgery={surgery} onClose={onClose} />
  ) : docKey === "alta_srpa" ? (
    <SrpaModal surgery={surgery} onClose={onClose} />
  ) : docKey === "descricao_cirurgica" ? (
    <SurgicalDescriptionModal surgery={surgery} onClose={onClose} />
  ) : docKey === "admissao_internacao" ? (
    <HospitalAdmissionModal surgery={surgery} onClose={onClose} />
  ) : (
    <GenericDocumentModal surgery={surgery} docKey={docKey} onClose={onClose} />
  )

/** Modal genérico de documento (mock): rascunho e assinatura vão para o store. */
const GenericDocumentModal = ({
  surgery,
  docKey,
  onClose,
}: {
  surgery: ISurgery
  docKey: DocKey | null
  onClose: () => void
}) => (
  <Modal
    isOpen={!!docKey}
    onClose={onClose}
    size="2xl"
    scrollBehavior="inside"
    className={FIELD_STYLES}
  >
    <ModalContent>
      {docKey && (
        <DocumentForm
          key={docKey}
          surgery={surgery}
          docKey={docKey}
          onClose={onClose}
        />
      )}
    </ModalContent>
  </Modal>
)

const DocumentForm = ({
  surgery,
  docKey,
  onClose,
}: {
  surgery: ISurgery
  docKey: DocKey
  onClose: () => void
}) => {
  const setDocStatus = useCC((st) => st.setDocStatus)
  const doc = surgery.docs[docKey]
  const meta = DOC_META[docKey]
  const Icon = DOC_UI[docKey].icon
  const readOnly = doc.status === "assinado"
  const fields = docFields(docKey, surgery)
  const [values, setValues] = useState<Values>(() =>
    initialValues(fields, doc.status !== "nao_iniciado"),
  )
  const set = (label: string, v: string | string[]) =>
    setValues((prev) => ({ ...prev, [label]: v }))

  const saveDraft = () => {
    setDocStatus(surgery.id, docKey, "em_preenchimento")
    addToast({
      title: "Rascunho salvo",
      description: meta.title,
      color: "primary",
    })
    onClose()
  }

  const sign = () => {
    setDocStatus(surgery.id, docKey, "assinado")
    addToast({
      title: `${meta.title}: documento assinado`,
      description: `Assinado às ${MOCK_NOW} · ${docResponsible(surgery, docKey)}`,
      color: "success",
    })
    onClose()
  }

  return (
    <>
      <ModalHeader className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#EBF0FE] text-[#1A56DB]">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-base font-bold text-[#1E293B]">
            {meta.title}
          </span>
          <span className="text-xs font-normal text-[#64748B]">
            {docResponsible(surgery, docKey)} · Cirurgia #{surgery.id}
          </span>
        </div>
        {readOnly ? (
          <Chip tone="success" icon={LuCircleCheck}>
            Assinado às {doc.signedAt}
          </Chip>
        ) : (
          <Chip
            tone={doc.status === "em_preenchimento" ? "primary" : "warning"}
          >
            {doc.status === "em_preenchimento" ? "Rascunho" : "Não iniciado"}
          </Chip>
        )}
      </ModalHeader>
      <ModalBody className="flex flex-col gap-4">
        <p className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs text-[#64748B]">
          Versão simplificada do documento para o preview. O preenchimento
          completo fica na tela do próprio documento.
        </p>
        {fields.map((f) => (
          <FieldInput
            key={f.label}
            field={f}
            value={values[f.label]}
            onChange={(v) => set(f.label, v)}
            readOnly={readOnly}
          />
        ))}
      </ModalBody>
      <ModalFooter>
        {readOnly ? (
          <Button variant="bordered" onPress={onClose}>
            Fechar
          </Button>
        ) : (
          <>
            <Button variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button
              variant="bordered"
              startContent={<LuSave className="h-4 w-4" />}
              onPress={saveDraft}
            >
              Salvar rascunho
            </Button>
            <Button
              color="primary"
              startContent={<LuPenLine className="h-4 w-4" />}
              onPress={sign}
            >
              Assinar e finalizar
            </Button>
          </>
        )}
      </ModalFooter>
    </>
  )
}

const FieldInput = ({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: DocField
  value: string | string[] | undefined
  onChange: (v: string | string[]) => void
  readOnly: boolean
}) => {
  const str = typeof value === "string" ? value : ""
  switch (field.kind) {
    case "text":
      return (
        <Input
          label={field.label}
          labelPlacement="outside"
          placeholder=" "
          variant="bordered"
          value={str}
          onValueChange={onChange}
          isReadOnly={readOnly}
        />
      )
    case "textarea":
      return (
        <Textarea
          label={field.label}
          labelPlacement="outside"
          placeholder={readOnly ? "—" : "Descreva…"}
          variant="bordered"
          minRows={2}
          value={str}
          onValueChange={onChange}
          isReadOnly={readOnly}
        />
      )
    case "checks":
      return (
        <CheckboxGroup
          label={field.label}
          value={Array.isArray(value) ? value : []}
          onValueChange={onChange}
          isReadOnly={readOnly}
          classNames={{ label: "text-xs font-medium text-[#64748B]" }}
        >
          {field.options.map((o) => (
            <Checkbox key={o} value={o} size="sm">
              <span className="text-[13px]">{o}</span>
            </Checkbox>
          ))}
        </CheckboxGroup>
      )
    case "radio":
      return (
        <RadioGroup
          label={field.label}
          orientation="horizontal"
          value={str}
          onValueChange={onChange}
          isReadOnly={readOnly}
          classNames={{ label: "text-xs font-medium text-[#64748B]" }}
        >
          {field.options.map((o) => (
            <Radio key={o} value={o} size="sm">
              <span className="text-[13px]">{o}</span>
            </Radio>
          ))}
        </RadioGroup>
      )
  }
}
