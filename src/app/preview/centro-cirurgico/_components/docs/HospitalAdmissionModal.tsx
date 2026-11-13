"use client"

import { addToast } from "@heroui/react"
import { useState } from "react"
import { LuBedDouble, LuCircleCheck } from "react-icons/lu"

import { MOCK_NOW } from "../../_data/fixtures"
import { useCC } from "../../_data/store"
import type { DocStatus, ISurgery } from "../../_data/types"
import { MapModal } from "../mapa/MapModal"
import { Chip } from "../ui"
import { DocBadge, DocPatientLine } from "./fields"
import {
  DOC,
  DOCTORS,
  NURSES,
  PARTS,
  blankMedical,
  blankNursing,
  fromSrpa,
  medicalMissing,
  nursingMissing,
  partState,
  personLabel,
  sampleMedical,
  sampleNursing,
  type AdmissionPart,
  type IMedicalAdmission,
  type INursingAdmission,
} from "./hospitalAdmission"
import { MEDICAL_STEPS, MedicalAdmissionForm } from "./MedicalAdmissionForm"
import { NURSING_STEPS, NursingAdmissionForm } from "./NursingAdmissionForm"
import { StepsBar, StepsFooter, useDocSteps } from "./steps"
import { cn } from "@/shared/utils/cn"

const PART_LABEL: Record<AdmissionPart, string> = {
  medica: "Médica",
  enfermagem: "Enfermagem",
}

const PartChip = ({
  status,
  signedAt,
}: {
  status: DocStatus
  signedAt?: string
}) =>
  status === "assinado" ? (
    <Chip tone="success" icon={LuCircleCheck}>
      Assinada{signedAt ? ` às ${signedAt}` : ""}
    </Chip>
  ) : status === "em_preenchimento" ? (
    <Chip tone="warning">Rascunho</Chip>
  ) : (
    <Chip tone="neutral">Não iniciada</Chip>
  )

/**
 * PEP-D06 + PEP-D07 · Admissão da internação. Um documento com duas partes
 * (médica e enfermagem), cada uma com sua assinatura; o documento só fica
 * assinado quando as duas estiverem.
 */
export const HospitalAdmissionModal = ({
  surgery,
  onClose,
}: {
  surgery: ISurgery
  onClose: () => void
}) => {
  const saveDocPart = useCC((s) => s.saveDocPart)
  const patient = useCC((s) =>
    s.patients.find((p) => p.id === surgery.patientId),
  )
  const hospitalization = useCC((s) =>
    s.hospitalizations.find((h) =>
      surgery.hospitalizationId
        ? h.id === surgery.hospitalizationId
        : h.patientId === surgery.patientId && !h.discharged,
    ),
  )
  const doc = surgery.docs[DOC]
  const med = partState<IMedicalAdmission>(surgery, "medica")
  const nur = partState<INursingAdmission>(surgery, "enfermagem")
  const srpaSigned = surgery.docs.alta_srpa.status === "assinado"
  const [srpa] = useState(() =>
    srpaSigned ? fromSrpa(surgery.docData?.alta_srpa) : undefined,
  )

  const [part, setPart] = useState<AdmissionPart>(() =>
    med.status === "assinado" && nur.status !== "assinado"
      ? "enfermagem"
      : "medica",
  )
  const [d06, setD06] = useState<IMedicalAdmission>(() => {
    if (med.saved) return med.saved.data
    if (!patient) return {} as IMedicalAdmission
    return doc.status === "nao_iniciado"
      ? blankMedical(surgery, patient, hospitalization)
      : sampleMedical(
          surgery,
          patient,
          hospitalization,
          med.status === "assinado",
        )
  })
  const [d07, setD07] = useState<INursingAdmission>(() => {
    if (nur.saved) return nur.saved.data
    if (!patient) return {} as INursingAdmission
    return doc.status === "nao_iniciado"
      ? blankNursing(surgery, patient, srpa?.patch)
      : sampleNursing(surgery, patient, srpa?.patch, nur.status === "assinado")
  })
  const [submitted, setSubmitted] = useState<Record<AdmissionPart, boolean>>({
    medica: false,
    enfermagem: false,
  })

  // Cada parte tem as próprias etapas (hooks antes do retorno antecipado).
  const medNav = useDocSteps(
    MEDICAL_STEPS,
    patient ? medicalMissing(d06, patient) : [],
  )
  const nurNav = useDocSteps(
    NURSING_STEPS,
    patient ? nursingMissing(d07, patient) : [],
  )

  if (!patient) return null

  const states = { medica: med, enfermagem: nur }
  const readOnly = states[part].status === "assinado"
  const isMedPart = part === "medica"
  const nav = isMedPart ? medNav : nurNav
  const steps = isMedPart ? MEDICAL_STEPS : NURSING_STEPS

  const choosePart = (p: AdmissionPart) => {
    setPart(p)
    ;(p === "medica" ? medNav : nurNav).setStep(0)
  }

  const save = (sign: boolean) => {
    setSubmitted((o) => ({ ...o, [part]: true }))
    const isMed = part === "medica"
    const missing = isMed
      ? medicalMissing(d06, patient)
      : nursingMissing(d07, patient)
    if (sign && missing.length) {
      nav.goToFirstPending()
      return
    }
    const signer = isMed ? d06.doctor : d07.nurse
    saveDocPart(
      surgery.id,
      DOC,
      part,
      [...PARTS],
      isMed ? d06 : d07,
      sign,
      signer,
    )
    const other = isMed ? nur : med
    const title = isMed ? "Admissão médica" : "Admissão de enfermagem"
    addToast({
      title: sign ? `${title} assinada` : `Rascunho salvo · ${title}`,
      description: sign
        ? `${personLabel(isMed ? DOCTORS : NURSES, signer)} · hoje, ${MOCK_NOW}${
            other.status === "assinado"
              ? ". Admissão da internação completa."
              : `. Falta a parte ${isMed ? "da enfermagem" : "médica"}.`
          }`
        : "Continue quando quiser e assine depois.",
      color: "success",
    })
    onClose()
  }

  const bed = surgery.bed ?? hospitalization?.bed
  const place = [hospitalization?.sector, bed].filter(Boolean).join(" · ")

  return (
    <MapModal
      width={960}
      icon={<LuBedDouble />}
      title={
        part === "medica"
          ? "Admissão da internação · médica"
          : "Admissão na unidade de internação"
      }
      description={
        <DocPatientLine patient={patient} surgery={surgery} withRoom={place} />
      }
      badge={<DocBadge doc={doc} />}
      onClose={onClose}
      dismissable={false}
      footer={
        <StepsFooter
          readOnly={readOnly}
          isFirst={nav.isFirst}
          isLast={nav.isLast}
          onBack={nav.back}
          onNext={nav.next}
          onCancel={onClose}
          onSaveDraft={() => save(false)}
          onSign={() => save(true)}
        />
      }
    >
      <div
        role="tablist"
        aria-label="Parte da admissão"
        className="flex flex-wrap gap-1 self-start rounded-lg bg-[#F1F5F9] p-1"
      >
        {PARTS.map((p) => {
          const on = p === part
          return (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => choosePart(p)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-[13px]",
                on
                  ? "bg-white font-bold text-[#1A56DB] shadow-sm"
                  : "font-medium text-[#64748B] hover:text-[#1E293B]",
              )}
            >
              {PART_LABEL[p]}
              <PartChip
                status={states[p].status}
                signedAt={states[p].signedAt}
              />
            </button>
          )
        })}
      </div>
      {readOnly && states[part].signedBy && (
        <p className="text-xs text-[#64748B]">
          Assinada por{" "}
          {personLabel(
            part === "medica" ? DOCTORS : NURSES,
            states[part].signedBy ?? "",
          )}
          . Cada parte é assinada separadamente; o documento fica completo
          quando as duas estiverem assinadas.
        </p>
      )}

      <StepsBar
        key={`steps-${part}`}
        steps={steps}
        current={nav.step}
        onSelect={nav.setStep}
        pendingOf={nav.pendingOf}
        showPending={submitted[part]}
      />

      {part === "medica" ? (
        <MedicalAdmissionForm
          key="medica"
          step={medNav.step}
          d={d06}
          setD={setD06}
          patient={patient}
          readOnly={readOnly}
          submitted={submitted.medica}
        />
      ) : (
        <NursingAdmissionForm
          key="enfermagem"
          step={nurNav.step}
          d={d07}
          setD={setD07}
          patient={patient}
          readOnly={readOnly}
          submitted={submitted.enfermagem}
          srpa={
            srpa ? { at: surgery.docs.alta_srpa.signedAt, ...srpa } : undefined
          }
        />
      )}
    </MapModal>
  )
}
