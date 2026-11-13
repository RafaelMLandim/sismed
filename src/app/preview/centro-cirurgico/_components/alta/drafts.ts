import { TODAY_ISO, isoToBR } from "../../_data/days"
import {
  ACTIVITIES,
  EFFORT_ACTIVITY,
  EMERGENCY_DEFAULT,
  GUIDANCE,
} from "../../_data/discharge"
import { MOCK_NOW } from "../../_data/fixtures"
import type { ISurgicalDescription } from "../docs/surgicalDescription"
import type {
  IDischargeGuide,
  IDischargePrescription,
  IDischargeSummary,
  IHospitalization,
  IPatient,
  ISurgery,
} from "../../_data/types"

export const returnLabel = (p?: IDischargePrescription) =>
  p
    ? `${p.returnProfessional} · ${p.returnClinic} · ${isoToBR(p.returnDate)}`
    : ""

/** Rascunho das orientações (D08) a partir da receita (M27). */
export const guideFromPrescription = (
  p: IDischargePrescription,
  surgery: ISurgery,
  prev?: IDischargeGuide,
): IDischargeGuide => ({
  status: "em_preenchimento",
  date: TODAY_ISO,
  time: MOCK_NOW,
  procedure: surgery.procedure,
  diet: prev?.diet ?? [],
  activities: prev?.activities ?? [ACTIVITIES[3]],
  restDays: prev?.restDays,
  catheter: prev?.catheter ?? false,
  catheterCare: prev?.catheterCare ?? [],
  catheterRemoval: prev?.catheterRemoval ?? "",
  expected: prev?.expected ?? [],
  meds: p.items.join("\n"),
  warnings: prev?.warnings ?? [],
  emergency: prev?.emergency ?? EMERGENCY_DEFAULT,
  returnText: returnLabel(p),
  bring: prev?.bring ?? "",
  text: [
    `Curativo: ${p.dressing}`,
    `Atividade: ${p.activity}`,
    `Procure o hospital se tiver: ${p.alerts}`,
  ]
    .filter((l) => !l.endsWith(": "))
    .join("\n\n"),
  doctor: prev?.doctor ?? surgery.surgeon,
})

const bullets = (title: string, list: string[]) =>
  list.length ? [`${title}`, ...list.map((i) => `• ${i}`), ""] : []

/** "Gerar texto a partir das marcações" das orientações. */
export const guideText = (
  g: IDischargeGuide,
  patient: IPatient,
  p?: IDischargePrescription,
) =>
  [
    "ORIENTAÇÕES APÓS O PROCEDIMENTO",
    `Paciente: ${patient.name}`,
    `Procedimento: ${g.procedure} · ${isoToBR(g.date)}`,
    "",
    ...(p?.dressing ? ["Curativo", p.dressing, ""] : []),
    ...(p?.activity ? ["Atividade e restrições", p.activity, ""] : []),
    ...bullets("Alimentação", g.diet),
    ...bullets(
      "Atividades",
      g.activities.map((a) =>
        a === EFFORT_ACTIVITY && g.restDays ? `${a} por ${g.restDays} dias` : a,
      ),
    ),
    ...(g.catheter
      ? bullets("Cuidados com a sonda", [
          ...g.catheterCare,
          ...(g.catheterRemoval
            ? [`Retirada da sonda: ${g.catheterRemoval}`]
            : []),
        ])
      : []),
    ...bullets("Pode acontecer e é esperado", g.expected),
    ...(g.meds.trim()
      ? [
          "Medicações e horários",
          ...g.meds
            .trim()
            .split("\n")
            .map((m) => `• ${m}`),
          "",
        ]
      : []),
    ...bullets("Procure atendimento imediatamente se tiver", g.warnings),
    ...(g.emergency ? [`Em caso de urgência: ${g.emergency}`, ""] : []),
    `Retorno: ${g.returnText}${g.bring ? ` · levar ${g.bring}` : ""}`,
  ].join("\n")

/** Rascunho do sumário (D09) com os dados da internação. */
export const summaryDraft = ({
  hosp,
  surgery,
  prescription,
  guide,
}: {
  hosp: IHospitalization
  surgery: ISurgery
  prescription?: IDischargePrescription
  guide?: IDischargeGuide
}): IDischargeSummary => {
  // A descrição cirúrgica (D05) já traz CID, dreno e anatomopatológico.
  const d05 = surgery.docData?.descricao_cirurgica as
    | Partial<ISurgicalDescription>
    | undefined
  return {
    status: "em_preenchimento",
    date: TODAY_ISO,
    time: MOCK_NOW,
    type: "Melhorada",
    destination: "Domicílio",
    companion: "",
    diagnosis: hosp.diagnosis ?? hosp.reason,
    cid: hosp.cid || d05?.cid || "",
    procedure: surgery.procedure,
    procedureDate: surgery.date ?? TODAY_ISO,
    anesthesia: surgery.anesthesia?.split(" · ")[0] ?? "",
    complications: false,
    complicationsText: "",
    conditions: [],
    catheter: guide?.catheter ?? false,
    catheterRemoval: "",
    drain: d05?.drain ?? false,
    meds: prescription?.items.join("\n") ?? "",
    guidance: [GUIDANCE[4], GUIDANCE[7]],
    followUp: returnLabel(prescription),
    pathology: d05?.pathology ?? false,
    certificate: false,
    text: "",
    doctor: surgery.surgeon,
  }
}

const lowerList = (l: string[]) =>
  l.map((x) => x.charAt(0).toLowerCase() + x.slice(1)).join(", ")

/** "Gerar texto a partir das marcações" do sumário. */
export const summaryText = (s: IDischargeSummary, female?: boolean) => {
  /** Concorda com o sexo do paciente; sem ele, mantém "(a)". */
  const g = (m: string, f: string) =>
    female === undefined ? `${m}(a)` : female ? f : m
  const anesthesia = s.anesthesia.toLowerCase()
  return [
    `Paciente ${g("submetido", "submetida")} a ${s.procedure.toLowerCase()} em ${isoToBR(s.procedureDate)}${anesthesia ? `, sob ${anesthesia.includes("anestesia") ? anesthesia : `anestesia ${anesthesia}`}` : ""}, ${s.complications ? `com intercorrências: ${s.complicationsText || "descrever"}` : "sem intercorrências"}.`,
    s.conditions.length
      ? `Evolui ${lowerList(s.conditions).replace(/\borientado\b/, g("orientado", "orientada"))}.`
      : "",
    `Recebe alta hospitalar ${s.type.toLowerCase()} em ${isoToBR(s.date)} ${s.time}, com destino ${s.destination === "Domicílio" ? "ao domicílio" : `a ${s.destination.toLowerCase()}`}${s.companion ? `, ${g("acompanhado", "acompanhada")} por ${s.companion}` : ""}.`,
    s.catheter
      ? `Alta com sonda vesical${s.catheterRemoval ? `, com retirada prevista para ${isoToBR(s.catheterRemoval)}` : ""}.`
      : "",
    s.drain ? "Alta com dreno." : "",
    s.guidance.length
      ? `Paciente e acompanhante orientados quanto a: ${lowerList(s.guidance)}.`
      : "",
    s.meds.trim() ? "Prescrição de alta entregue." : "",
    s.pathology ? "Aguarda resultado de anatomopatológico." : "",
    s.certificate && s.leaveDays
      ? `Fornecido atestado médico de ${s.leaveDays} dias.`
      : "",
    s.followUp ? `Retorno: ${s.followUp}.` : "",
  ]
    .filter(Boolean)
    .join(" ")
}

/** "o leito 310" / "o leito UTI 3" para frases corridas. */
export const bedPhrase = (bed: string) =>
  bed.startsWith("Leito ") ? `o ${bed.toLowerCase()}` : `o leito ${bed}`
