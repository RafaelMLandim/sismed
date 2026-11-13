import { PROFESSIONALS } from "../../_data/evolutions"
import type { IPatient, ISurgery } from "../../_data/types"

/** Resposta das perguntas do check list. */
export type Ans = "sim" | "nao" | "na"

export const ANS_LABEL: Record<Ans, string> = {
  sim: "Sim",
  nao: "Não",
  na: "Não se aplica",
}
export const SN = ["sim", "nao"] as const satisfies readonly Ans[]
export const SNNA = ["sim", "nao", "na"] as const satisfies readonly Ans[]

export const COUNT_ITEMS = ["Compressas", "Gazes", "Agulhas"] as const
export type CountItem = (typeof COUNT_ITEMS)[number]
export interface ICount {
  offered: string
  returned: string
}

/** Conteúdo do D02 · Check list de cirurgia segura. */
export interface ISafetyChecklist {
  // Fase 1 · Antes da indução anestésica
  askedPatient?: Ans
  confirmed?: Ans
  consent?: Ans
  imaging?: Ans
  limitation?: Ans
  limitationText: string
  anesthesiaCart?: Ans
  oximeter?: Ans
  allergy?: Ans
  allergyText: string
  difficultAirway?: Ans
  aspiration?: Ans
  airwayKit?: Ans
  bloodLoss?: Ans
  // Fase 2 · Antes de iniciar a cirurgia
  teamIntro?: Ans
  teamConfirmed?: Ans
  patientId: string
  site: string
  side: string
  procedure: string
  duration: string
  criticalSteps?: Ans
  antibiotic?: Ans
  antibioticText: string
  sterility?: Ans
  equipmentConcern?: Ans
  // Fase 3 · Antes do paciente sair da sala
  procedureMatches?: Ans
  differentCode?: Ans
  patientConcern?: Ans
  counts: Record<CountItem, ICount>
  countNote: string
  equipmentProblem?: Ans
  specimen?: Ans
  recoveryReview?: Ans
  // Assinaturas
  nurse: string
  surgeon: string
  anesthetist: string
}

export type QuestionKey = {
  [K in keyof ISafetyChecklist]-?: ISafetyChecklist[K] extends Ans | undefined
    ? K
    : never
}[keyof ISafetyChecklist]

/**
 * Perguntas do desenho (PEP-D02). `na` = tem "Não se aplica"; `warn` =
 * respostas que indicam risco (pintadas de âmbar).
 */
export const QUESTIONS: Record<
  QuestionKey,
  { label: string; na: boolean; warn: Ans[] }
> = {
  askedPatient: {
    label:
      "Perguntar ao paciente: identificação, procedimento, local e lateralidade da cirurgia a ser feita",
    na: false,
    warn: ["nao"],
  },
  confirmed: {
    label: "O paciente confirmou todas as informações acima?",
    na: false,
    warn: ["nao"],
  },
  consent: {
    label:
      "Termos de consentimento informado anestésico e cirúrgico estão no prontuário?",
    na: false,
    warn: ["nao"],
  },
  imaging: {
    label: "Os exames de imagem estão disponíveis?",
    na: true,
    warn: ["nao"],
  },
  limitation: {
    label:
      "Paciente apresenta alguma limitação física que impacte no posicionamento cirúrgico?",
    na: false,
    warn: ["sim"],
  },
  anesthesiaCart: {
    label: "Carrinho de anestesia checado e funcionando?",
    na: true,
    warn: ["nao"],
  },
  oximeter: {
    label: "Oxímetro de pulso instalado e funcionando?",
    na: true,
    warn: ["nao"],
  },
  allergy: {
    label: "O paciente possui alergia conhecida?",
    na: false,
    warn: ["sim"],
  },
  difficultAirway: {
    label: "Previsão de via aérea difícil?",
    na: false,
    warn: ["sim"],
  },
  aspiration: {
    label: "Risco de broncoaspiração?",
    na: false,
    warn: ["sim"],
  },
  airwayKit: {
    label: "Se sim, há kit para intubação difícil e assistência disponível?",
    na: true,
    warn: ["nao"],
  },
  bloodLoss: {
    label: "Há risco de perda sanguínea acima de 500 ml (7 ml/kg em crianças)?",
    na: false,
    warn: ["sim"],
  },
  teamIntro: {
    label: "Todos os profissionais confirmam seus nomes e profissões?",
    na: true,
    warn: ["nao"],
  },
  teamConfirmed: {
    label:
      "O cirurgião, o anestesista e a enfermagem confirmaram os itens abaixo?",
    na: true,
    warn: ["nao"],
  },
  criticalSteps: {
    label: "Há passos críticos na cirurgia?",
    na: false,
    warn: [],
  },
  antibiotic: {
    label: "O antibiótico profilático foi administrado nos últimos 60 minutos?",
    na: true,
    warn: ["nao"],
  },
  sterility: {
    label:
      "Revisão da enfermagem (instrumentador): materiais necessários presentes e dentro do prazo de esterilização?",
    na: true,
    warn: ["nao"],
  },
  equipmentConcern: {
    label: "Há alguma preocupação em relação aos equipamentos?",
    na: true,
    warn: ["sim"],
  },
  procedureMatches: {
    label:
      "Confirmar com o cirurgião: o procedimento realizado foi o mesmo proposto?",
    na: true,
    warn: ["nao"],
  },
  differentCode: {
    label: "Houve realização de algum código diferente?",
    na: true,
    warn: ["sim"],
  },
  patientConcern: {
    label: "Alguma preocupação em relação ao paciente?",
    na: true,
    warn: ["sim"],
  },
  equipmentProblem: {
    label: "Houve algum problema com equipamento que deve ser resolvido?",
    na: true,
    warn: ["sim"],
  },
  specimen: {
    label:
      "Amostra para anatomia patológica identificada corretamente (nome completo, DN, nome da mãe)?",
    na: true,
    warn: ["nao"],
  },
  recoveryReview: {
    label:
      "O cirurgião, o anestesista e a enfermagem analisaram os pontos mais importantes para a recuperação pós-anestésica e o pós-operatório?",
    na: true,
    warn: ["nao"],
  },
}

export const SIDES = ["Direita", "Esquerda", "Bilateral", "Não se aplica"]
const SIDE_OF: Record<string, string> = {
  Direito: "Direita",
  Esquerdo: "Esquerda",
  Bilateral: "Bilateral",
  "Não se aplica": "Não se aplica",
}

// Profissionais das assinaturas (+ o da cirurgia, se não estiver na lista).
type Pro = { name: string; council: string }
const withPerson = (list: Pro[], name?: string): Pro[] =>
  name && !list.some((p) => p.name === name)
    ? [{ name, council: "CRM-DF" }, ...list]
    : list
export const NURSES = PROFESSIONALS.Enfermagem
export const surgeonsFor = (s: ISurgery) =>
  withPerson(PROFESSIONALS.Médica, s.surgeon)
export const anesthetistsFor = (s: ISurgery) =>
  withPerson(PROFESSIONALS.Anestesia, s.anesthetist)
export const proLabel = (list: Pro[], name: string) =>
  `${name} · ${list.find((p) => p.name === name)?.council ?? ""}`

export const formatDuration = (min?: number) => {
  if (!min) return ""
  const h = Math.floor(min / 60)
  const m = min % 60
  return [h && `${h} h`, m && `${m} min`].filter(Boolean).join(" ")
}

/** Situação da contagem de um item. */
export const countState = (c: ICount) =>
  !c.offered.trim() || !c.returned.trim()
    ? "incompleta"
    : Number(c.offered) === Number(c.returned)
      ? "igual"
      : "divergente"

export const divergentItems = (d: ISafetyChecklist) =>
  COUNT_ITEMS.filter((i) => countState(d.counts[i]) === "divergente")

/** Algum risco de via aérea marcado (exige o kit). */
export const airwayRisk = (d: ISafetyChecklist) =>
  d.difficultAirway === "sim" || d.aspiration === "sim"

/**
 * Campos que trazem dado do próprio paciente ou da cirurgia: um modelo não
 * sobrescreve quando já estão preenchidos.
 */
export const PATIENT_FIELDS: (keyof ISafetyChecklist)[] = [
  "allergy",
  "allergyText",
  "patientId",
  "site",
  "side",
  "procedure",
  "duration",
]

const STANDARD: Partial<ISafetyChecklist> = {
  askedPatient: "sim",
  confirmed: "sim",
  consent: "sim",
  imaging: "sim",
  limitation: "nao",
  anesthesiaCart: "sim",
  oximeter: "sim",
  difficultAirway: "nao",
  aspiration: "nao",
  airwayKit: "na",
  bloodLoss: "nao",
  teamIntro: "sim",
  teamConfirmed: "sim",
  criticalSteps: "nao",
  sterility: "sim",
  equipmentConcern: "nao",
}

export const CHECKLIST_MODELS: {
  name: string
  patch: Partial<ISafetyChecklist>
}[] = [
  { name: "Check list padrão (eletiva)", patch: STANDARD },
  {
    name: "Check list ortopedia (prótese)",
    patch: {
      ...STANDARD,
      limitation: "sim",
      limitationText: "Posicionar com coxim e apoio lateral",
      bloodLoss: "sim",
      criticalSteps: "sim",
      antibiotic: "sim",
      antibioticText: "Cefazolina 2 g EV",
    },
  },
  {
    name: "Check list videolaparoscopia",
    patch: {
      ...STANDARD,
      imaging: "na",
      criticalSteps: "sim",
      antibiotic: "sim",
      antibioticText: "Cefazolina 2 g EV",
    },
  },
]

const emptyCounts = (): Record<CountItem, ICount> => ({
  Compressas: { offered: "", returned: "" },
  Gazes: { offered: "", returned: "" },
  Agulhas: { offered: "", returned: "" },
})

/** Check list em branco, com o que o sistema já sabe do paciente e da cirurgia. */
export const blankChecklist = (s: ISurgery, p: IPatient): ISafetyChecklist => ({
  limitationText: "",
  allergy: p.allergies.length ? "sim" : undefined,
  allergyText: p.allergies.join(", "),
  patientId: `${p.name} · Pront. ${p.record} · ${p.age} anos`,
  site: "",
  side: SIDE_OF[s.side ?? ""] ?? "",
  procedure: s.procedure,
  duration: formatDuration(s.durationMin),
  antibioticText: "",
  counts: emptyCounts(),
  countNote: "",
  nurse: "",
  surgeon: s.surgeon,
  anesthetist: s.anesthetist ?? "",
})

/**
 * Check list começado (rascunho: fases 1 e 2 completas, fase 3 no início) ou
 * completo (assinado).
 */
export const sampleChecklist = (
  s: ISurgery,
  p: IPatient,
  complete: boolean,
): ISafetyChecklist => {
  const b = blankChecklist(s, p)
  return {
    ...b,
    ...STANDARD,
    allergy: p.allergies.length ? "sim" : "nao",
    antibiotic: "sim",
    antibioticText: "Cefazolina 2 g EV às 07:45",
    site: b.side && b.side !== "Não se aplica" ? "Sítio demarcado" : "—",
    duration: b.duration || "2 h",
    procedureMatches: "sim",
    differentCode: "nao",
    patientConcern: complete ? "nao" : undefined,
    counts: complete
      ? {
          Compressas: { offered: "10", returned: "10" },
          Gazes: { offered: "20", returned: "20" },
          Agulhas: { offered: "4", returned: "4" },
        }
      : {
          Compressas: { offered: "10", returned: "10" },
          Gazes: { offered: "20", returned: "" },
          Agulhas: { offered: "4", returned: "" },
        },
    equipmentProblem: complete ? "nao" : undefined,
    specimen: complete ? "na" : undefined,
    recoveryReview: complete ? "sim" : undefined,
    nurse: complete ? NURSES[2].name : "",
    anesthetist: b.anesthetist || PROFESSIONALS.Anestesia[0].name,
  }
}

export const PHASES = [
  {
    tab: "Fase 1 · Antes da indução",
    title: "Antes da indução anestésica",
  },
  { tab: "Fase 2 · Antes da incisão", title: "Antes de iniciar a cirurgia" },
  {
    tab: "Fase 3 · Antes de sair da sala",
    title: "Antes do paciente sair da sala",
  },
] as const

type Item = { label: string; ok: boolean }

/** Itens obrigatórios de cada fase (os condicionais só quando se aplicam). */
export const phaseItems = (d: ISafetyChecklist): Item[][] => {
  const q = (k: QuestionKey): Item => ({
    label: QUESTIONS[k].label,
    ok: d[k] !== undefined,
  })
  const txt = (label: string, v: string): Item => ({ label, ok: !!v.trim() })
  const divergent = divergentItems(d)
  return [
    [
      q("askedPatient"),
      q("confirmed"),
      q("consent"),
      q("imaging"),
      q("limitation"),
      ...(d.limitation === "sim"
        ? [txt("Qual limitação?", d.limitationText)]
        : []),
      q("anesthesiaCart"),
      q("oximeter"),
      q("allergy"),
      ...(d.allergy === "sim" ? [txt("Qual alergia?", d.allergyText)] : []),
      q("difficultAirway"),
      q("aspiration"),
      airwayRisk(d) && d.airwayKit === "na"
        ? {
            label:
              "Kit para intubação difícil (risco de via aérea marcado; “Não se aplica” não vale)",
            ok: false,
          }
        : q("airwayKit"),
      q("bloodLoss"),
    ],
    [
      q("teamIntro"),
      q("teamConfirmed"),
      txt("Identificação do paciente", d.patientId),
      txt("Local e marcação", d.site),
      txt("Lateralidade", d.side),
      txt("Procedimento", d.procedure),
      txt("Duração estimada", d.duration),
      q("criticalSteps"),
      q("antibiotic"),
      ...(d.antibiotic === "sim"
        ? [txt("Qual antibiótico?", d.antibioticText)]
        : []),
      q("sterility"),
      q("equipmentConcern"),
    ],
    [
      q("procedureMatches"),
      q("differentCode"),
      q("patientConcern"),
      {
        label: "Contagem (oferecidos e devolvidos)",
        ok: COUNT_ITEMS.every((i) => countState(d.counts[i]) !== "incompleta"),
      },
      ...(divergent.length
        ? [txt("Justificativa e conduta (contagem divergente)", d.countNote)]
        : []),
      q("equipmentProblem"),
      q("specimen"),
      q("recoveryReview"),
    ],
  ]
}

/** Pendências no formato do desenho: "Seção: campo". */
export const checklistMissing = (d: ISafetyChecklist) => [
  ...phaseItems(d).flatMap((items, i) =>
    items.filter((x) => !x.ok).map((x) => `${PHASES[i].title}: ${x.label}`),
  ),
  ...[
    !d.nurse && "Assinaturas: Enfermagem (COREN-DF)",
    !d.surgeon && "Assinaturas: Cirurgião",
    !d.anesthetist && "Assinaturas: Anestesista",
  ].filter((x): x is string => !!x),
]
