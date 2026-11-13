import { PROFESSIONALS } from "../../_data/evolutions"
import { MOCK_NOW } from "../../_data/fixtures"
import { fromMin, toMin } from "../../_data/time"
import type { IPatient, ISurgery } from "../../_data/types"

/** Uma aferição da tabela "Sinais vitais e monitorização geral". */
export interface ISrpaVital {
  id: string
  time: string
  sys: string
  dia: string
  hr: string
  rr: string
  temp: string
  spo2: string
  support: string
}

/** Nota de um critério de Aldrete (null = não avaliado). */
export type AldreteScore = 0 | 1 | 2 | null

/** Conteúdo do D04 · Admissão e alta da SRPA (formato SBAR). */
export interface ISrpa {
  // S · Situação
  admittedAt: string
  origin: string
  generalState: string
  vitalsState: string
  consciousness: string[]
  breathing: string
  o2Flow: string
  respPattern: string
  // B · Background
  allergies: string
  allergiesText: string
  anesthesia: string
  venousAccess: string
  accessCondition: string
  comorbidities: string[]
  solution: string
  dressing: string
  devices: string[]
  // A · Avaliação
  symptoms: string[]
  eliminations: string[]
  eva: string
  fallRisk: string
  /** [critério][coluna] · colunas: Admissão, 15', 30', 60', Saída. */
  aldrete: AldreteScore[][]
  vitals: ISrpaVital[]
  // Irrigação vesical contínua
  irrigation: string
  foley: string
  irrigSolution: string
  bags: string
  bagVolume: string
  effluent: string
  clots: string
  // Alta da SRPA
  dischargeAt: string
  destination: string
  transport: string
  evaDischarge: string
  text: string
  // Assinaturas
  tech: string
  nurse: string
  anesthetist: string
}

// Opções do frame "Dropdowns · SRPA e enfermagem".
export const ORIGINS = [
  "Sala operatória",
  "SRPA",
  "Pronto-socorro",
  "UTI",
  "Domicílio",
]
export const GENERAL_STATES = ["BEG", "REG", "MEG"]
const GENERAL_LONG: Record<string, string> = {
  BEG: "bom estado geral",
  REG: "regular estado geral",
  MEG: "mau estado geral",
}
export const VITALS_STATES = ["Estáveis", "Instáveis"]
export const CONSCIOUSNESS = [
  "Consciente",
  "Orientado(a)",
  "Sonolento(a)",
  "Responsivo(a)",
]
export const BREATHING = [
  "Ar ambiente",
  "O₂ suplementar",
  "Cateter nasal",
  "Máscara de Venturi",
  "Ventilação mecânica",
]
/** Respirações em que o fluxo de O₂ passa a ser obrigatório. */
export const NEEDS_O2 = ["O₂ suplementar", "Cateter nasal", "Máscara de Venturi"]
export const RESP_PATTERNS = ["Eupneico", "Taquipneico", "Bradipneico", "Dispneico"]
export const ALLERGIES = ["Nega", "Sim"]
export const ANESTHESIAS = [
  "Geral",
  "Raqui",
  "Peridural",
  "Sedação",
  "Bloqueio periférico",
  "Local",
]
// Opções do frame "Dropdowns · Centro cirúrgico e anestesia".
export const VENOUS_ACCESS = ["MSD", "MSE", "MID", "MIE", "Jugular externa"]
const ACCESS_LONG: Record<string, string> = {
  MSD: "membro superior direito",
  MSE: "membro superior esquerdo",
  MID: "membro inferior direito",
  MIE: "membro inferior esquerdo",
  "Jugular externa": "jugular externa",
}
export const ACCESS_CONDITIONS = ["Pérvio", "Infiltrado", "Obstruído", "Retirado"]
export const NEGA = "Nega"
export const COMORBIDITIES = [
  "HAS",
  "DM",
  "Cardiopatia",
  "Asma/DPOC",
  "Obesidade",
  NEGA,
]
export const SOLUTIONS = ["SF 0,9%", "Ringer lactato", "SG 5%", "Sem solução"]
export const DRESSINGS = [
  "Não se aplica",
  "Limpo e seco",
  "Com sangramento leve",
  "Com secreção",
]
export const IRRIGATION_DEVICE = "Irrigação contínua"
export const DEVICES = [
  "Jelco",
  "SVD",
  "Dreno",
  "Cistostomia",
  "Nefrostomia",
  IRRIGATION_DEVICE,
  "Cateter de O₂",
]
export const NO_PAIN = "Sem dor"
export const PAIN = "Dor"
export const SYMPTOMS = [
  NO_PAIN,
  PAIN,
  "Náuseas",
  "Vômitos",
  "Tontura",
  "Sonolência",
]
export const ELIMINATIONS = [
  "Diurese espontânea",
  "SVD",
  "Diurese clara",
  "Hematúria",
]
export const EVA = Array.from({ length: 11 }, (_, i) => String(i))
export const FALL_RISKS = ["Baixo", "Moderado", "Alto"]
export const IRRIGATION = ["Em uso", "Suspensa", "Não se aplica"]
export const IRRIGATION_ON = IRRIGATION[0]
export const EFFLUENTS = [
  "Límpido",
  "Hematúria leve",
  "Hematúria moderada",
  "Hematúria intensa",
]
export const CLOTS = ["Sem coágulos", "Pequenos coágulos", "Grandes coágulos"]
/** "SRPA" fica de fora: aqui o paciente está saindo da SRPA. */
export const DESTINATIONS = [
  "UTI",
  "Internação (enfermaria)",
  "Internação (apartamento)",
  "Alta para domicílio",
]
const DESTINATION_PHRASE: Record<string, string> = {
  UTI: "à UTI",
  "Internação (enfermaria)": "à enfermaria",
  "Internação (apartamento)": "ao apartamento",
  "Alta para domicílio": "ao domicílio",
}
export const TRANSPORTS = [
  "Maca",
  "Cadeira de rodas",
  "Deambulando",
  "No próprio leito",
]

/** Escala de Aldrete e Kroulik (critérios e colunas do desenho). */
export const ALDRETE = [
  {
    label: "Atividade muscular",
    levels: [
      "2 · Movimenta os 4 membros",
      "1 · Movimenta 2 membros",
      "0 · É incapaz de movimentar os membros",
    ],
  },
  {
    label: "Respiração",
    levels: [
      "2 · Respira profundamente ou tosse",
      "1 · Apresenta dispneia ou limitação",
      "0 · Tem apneia",
    ],
  },
  {
    label: "Circulação",
    levels: [
      "2 · PA com variação de até 20% do pré-anestésico",
      "1 · Variação de 20 a 49%",
      "0 · Variação de 50% ou mais",
    ],
  },
  {
    label: "Consciência",
    levels: [
      "2 · Lúcido e orientado em tempo e espaço",
      "1 · Desperta se solicitado",
      "0 · Não responde",
    ],
  },
  {
    label: "Saturação de O₂",
    levels: [
      "2 · SpO₂ maior que 92% em ar ambiente",
      "1 · Necessita de O₂ para manter SpO₂ maior que 90%",
      "0 · SpO₂ menor que 90% mesmo com auxílio",
    ],
  },
]
export const ALDRETE_COLUMNS = ["Admissão", "15’", "30’", "60’", "Saída"]
export const ALDRETE_EXIT = ALDRETE_COLUMNS.length - 1
/** Nota mínima de saída para a alta da SRPA. */
export const ALDRETE_MIN = 9

export const NURSES = PROFESSIONALS.Enfermagem
export const ANESTHETISTS = PROFESSIONALS.Anestesia
/** Técnicos de enfermagem do mock (não há lista no cadastro de profissionais). */
export const TECHS = [
  { name: "Bruno Teles", council: "COREN-DF 50117" },
  { name: "Rita Campos", council: "COREN-DF 48302" },
  { name: "Lucas Prado", council: "COREN-DF 51876" },
]
export const personLabel = (
  list: { name: string; council: string }[],
  name: string,
) => {
  const c = list.find((p) => p.name === name)?.council
  return c ? `${name} · ${c}` : name
}

/** Campos que trazem dado do próprio paciente (o modelo não sobrescreve). */
export const SRPA_PATIENT_FIELDS: (keyof ISrpa)[] = [
  "allergies",
  "allergiesText",
  "anesthesia",
  "comorbidities",
]

export const SRPA_MODELS: { name: string; patch: Partial<ISrpa> }[] = [
  {
    name: "SRPA · raqui sem intercorrências",
    patch: {
      origin: "Sala operatória",
      generalState: "BEG",
      vitalsState: "Estáveis",
      consciousness: ["Consciente", "Orientado(a)"],
      breathing: "Ar ambiente",
      respPattern: "Eupneico",
      anesthesia: "Raqui",
      venousAccess: "MSD",
      accessCondition: "Pérvio",
      solution: "SF 0,9%",
      dressing: "Limpo e seco",
      devices: ["Jelco"],
      symptoms: [NO_PAIN],
      fallRisk: "Moderado",
      irrigation: "Não se aplica",
      transport: "Maca",
    },
  },
  {
    name: "SRPA · RTU com irrigação vesical",
    patch: {
      origin: "Sala operatória",
      generalState: "BEG",
      vitalsState: "Estáveis",
      consciousness: ["Consciente", "Orientado(a)"],
      breathing: "O₂ suplementar",
      o2Flow: "2",
      respPattern: "Eupneico",
      anesthesia: "Raqui",
      venousAccess: "MSD",
      accessCondition: "Pérvio",
      solution: "SF 0,9%",
      dressing: "Não se aplica",
      devices: ["Jelco", "SVD", IRRIGATION_DEVICE, "Cateter de O₂"],
      symptoms: [NO_PAIN],
      eliminations: ["SVD", "Hematúria"],
      fallRisk: "Alto",
      irrigation: IRRIGATION_ON,
      foley: "22 · 3 vias",
      irrigSolution: "SF 0,9%",
      bagVolume: "3000",
      transport: "Maca",
    },
  },
  {
    name: "SRPA · anestesia geral",
    patch: {
      origin: "Sala operatória",
      generalState: "BEG",
      vitalsState: "Estáveis",
      consciousness: ["Sonolento(a)", "Responsivo(a)"],
      breathing: "Cateter nasal",
      o2Flow: "3",
      respPattern: "Eupneico",
      anesthesia: "Geral",
      venousAccess: "MSE",
      accessCondition: "Pérvio",
      solution: "Ringer lactato",
      dressing: "Limpo e seco",
      devices: ["Jelco", "Cateter de O₂"],
      symptoms: [NO_PAIN, "Sonolência"],
      fallRisk: "Alto",
      irrigation: "Não se aplica",
      transport: "Maca",
    },
  },
]

let rowSeq = 0
export const newVitalRow = (time = "", support = ""): ISrpaVital => ({
  id: `v${Date.now()}-${rowSeq++}`,
  time,
  sys: "",
  dia: "",
  hr: "",
  rr: "",
  temp: "",
  spo2: "",
  support,
})

const num = (v: string) => Number(v.replace(",", "."))

/** PAM = (PAS + 2 × PAD) / 3, arredondada; "" sem PAS/PAD. */
export const mapOf = (sys: string, dia: string) => {
  const s = num(sys)
  const d = num(dia)
  return s && d ? String(Math.round((s + 2 * d) / 3)) : ""
}

/** Soma de uma coluna da escala; null se algum critério estiver vazio. */
export const aldreteTotal = (a: AldreteScore[][], col: number) => {
  const vals = a.map((row) => row[col])
  return vals.some((v) => v === null || v === undefined)
    ? null
    : vals.reduce<number>((t, v) => t + (v ?? 0), 0)
}

/** Volume total infundido (bolsas × volume por bolsa), ou "". */
export const irrigationTotal = (bags: string, volume: string) => {
  const b = num(bags)
  const v = num(volume)
  return b && v ? String(b * v) : ""
}

const anesthesiaOf = (s: ISurgery) => {
  const a = s.anesthesia?.split(" · ")[0].toLowerCase() ?? ""
  if (a.startsWith("raqui")) return "Raqui"
  if (a.startsWith("geral")) return "Geral"
  if (a.startsWith("sedação")) return "Sedação"
  if (a.startsWith("bloqueio")) return "Bloqueio periférico"
  if (a.startsWith("peridural")) return "Peridural"
  if (a.startsWith("local")) return "Local"
  return ""
}

/** Procedimentos urológicos baixos: sonda vesical e irrigação contínua. */
const isBladder = (s: ISurgery) =>
  /próstata|prostat|bexiga|vesical|rtu|ressecção transuretral/i.test(
    s.procedure,
  )

const emptyAldrete = (): AldreteScore[][] =>
  ALDRETE.map(() => ALDRETE_COLUMNS.map(() => null))

const plus = (hhmm: string, min: number) => fromMin(toMin(hhmm) + min)

/** Documento em branco, com o que o sistema já sabe. */
export const blankSrpa = (s: ISurgery, p: IPatient): ISrpa => {
  const admittedAt = s.leftRoomAt ?? s.end ?? MOCK_NOW
  return {
    admittedAt,
    origin: "Sala operatória",
    generalState: "",
    vitalsState: "",
    consciousness: [],
    breathing: "",
    o2Flow: "",
    respPattern: "",
    allergies: p.allergies.length ? "Sim" : "",
    allergiesText: p.allergies.join(", "),
    anesthesia: anesthesiaOf(s),
    venousAccess: "",
    accessCondition: "",
    comorbidities: [],
    solution: "",
    dressing: "",
    devices: [],
    symptoms: [],
    eliminations: [],
    eva: "",
    fallRisk: "",
    aldrete: emptyAldrete(),
    vitals: [newVitalRow(admittedAt)],
    irrigation: "Não se aplica",
    foley: "",
    irrigSolution: "",
    bags: "",
    bagVolume: "",
    effluent: "",
    clots: "",
    dischargeAt: "",
    destination: "",
    transport: "",
    evaDischarge: "",
    text: "",
    tech: "",
    nurse: "",
    anesthetist: s.anesthetist ?? "",
  }
}

/** Escala do exemplo do desenho (7 → 9). */
const SAMPLE_ALDRETE: AldreteScore[][] = [
  [1, 1, 2, 2, 2],
  [2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2],
  [1, 1, 1, 2, 2],
  [1, 1, 1, 1, 1],
]

/**
 * Documento começado (rascunho: admissão e primeiras reavaliações) ou
 * completo (assinado), com os horários e a equipe da própria cirurgia.
 */
export const sampleSrpa = (
  s: ISurgery,
  p: IPatient,
  complete: boolean,
): ISrpa => {
  const base = blankSrpa(s, p)
  const t0 = base.admittedAt
  const bladder = isBladder(s)
  const dischargeAt = s.srpaDischargeAt ?? plus(t0, 63)
  const row = (
    min: number,
    v: Omit<ISrpaVital, "id" | "time" | "support">,
    support: string,
  ): ISrpaVital => ({ ...newVitalRow(plus(t0, min), support), ...v })
  const vitals = [
    row(
      0,
      { sys: "128", dia: "78", hr: "74", rr: "16", temp: "36,2", spo2: "95" },
      "O₂ suplementar",
    ),
    row(
      18,
      { sys: "124", dia: "76", hr: "70", rr: "15", temp: "36,3", spo2: "96" },
      "O₂ suplementar",
    ),
  ]
  if (complete)
    vitals.push(
      row(
        48,
        { sys: "122", dia: "74", hr: "68", rr: "14", temp: "36,4", spo2: "97" },
        "Ar ambiente",
      ),
    )
  const d: ISrpa = {
    ...base,
    generalState: "BEG",
    vitalsState: "Estáveis",
    consciousness: ["Consciente", "Orientado(a)"],
    breathing: "O₂ suplementar",
    o2Flow: "2",
    respPattern: "Eupneico",
    allergies: p.allergies.length ? "Sim" : "Nega",
    anesthesia: base.anesthesia || "Raqui",
    venousAccess: "MSD",
    accessCondition: "Pérvio",
    comorbidities: ["HAS"],
    solution: "SF 0,9%",
    dressing: bladder ? "Não se aplica" : "Limpo e seco",
    devices: bladder
      ? ["Jelco", "SVD", IRRIGATION_DEVICE, "Cateter de O₂"]
      : ["Jelco", "Cateter de O₂"],
    symptoms: [NO_PAIN],
    eliminations: bladder ? ["SVD", "Hematúria"] : ["Diurese espontânea"],
    eva: "0",
    fallRisk: "Alto",
    aldrete: SAMPLE_ALDRETE.map((r) =>
      r.map((v, i) => (complete || i < 3 ? v : null)),
    ),
    vitals,
    irrigation: bladder ? IRRIGATION_ON : "Não se aplica",
    foley: bladder ? "22 · 3 vias" : "",
    irrigSolution: bladder ? "SF 0,9%" : "",
    bags: bladder ? (complete ? "2" : "1") : "",
    bagVolume: bladder ? "3000" : "",
    effluent: bladder ? "Hematúria leve" : "",
    clots: bladder ? "Sem coágulos" : "",
  }
  if (!complete) return d
  const done: ISrpa = {
    ...d,
    dischargeAt,
    destination: s.hospitalizationId
      ? "Internação (apartamento)"
      : "Alta para domicílio",
    transport: "Maca",
    evaDischarge: "0",
    tech: TECHS[0].name,
    nurse: NURSES[2].name,
    anesthetist: s.anesthetist ?? ANESTHETISTS[0].name,
  }
  return { ...done, text: srpaText(done, p) }
}

const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1)
const joinE = (xs: string[]) =>
  xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} e ${xs.at(-1)}`

/** Evolução de enfermagem montada a partir das marcações (texto do desenho). */
export const srpaText = (d: ISrpa, p: IPatient) => {
  const o = p.sex === "Feminino" ? "a" : "o"
  const parts: string[] = []

  const cons = d.consciousness.map((c) =>
    c === "Consciente"
      ? "consciente"
      : c === "Orientado(a)"
        ? `lúcid${o} e orientad${o} em tempo, espaço e pessoa`
        : c === "Sonolento(a)"
          ? `sonolent${o}`
          : `responsiv${o} a estímulos`,
  )
  const support = d.vitals.at(-1)?.support || d.breathing
  const flow = d.o2Flow ? ` a ${d.o2Flow} L/min` : ""
  const breath =
    support === "Ar ambiente"
      ? "respirando espontaneamente em ar ambiente"
      : support === "Ventilação mecânica"
        ? "em ventilação mecânica"
        : support === "Cateter nasal"
          ? `respirando com cateter nasal de O₂${flow}`
          : support === "Máscara de Venturi"
            ? `respirando com máscara de Venturi${flow}`
            : support
              ? `respirando com O₂ suplementar${flow}`
              : ""
  const pattern =
    d.respPattern === "Eupneico"
      ? "sem desconforto respiratório"
      : d.respPattern
        ? `${lowerFirst(d.respPattern).replace(/o$/, o)}`
        : ""
  const pain = d.symptoms.includes(PAIN)
    ? "com queixa álgica"
    : d.symptoms.includes(NO_PAIN)
      ? "sem queixas álgicas"
      : ""
  const nv = ["Náuseas", "Vômitos"].filter((x) => d.symptoms.includes(x))
  const nvText = nv.length
    ? `com ${joinE(nv.map(lowerFirst))}`
    : d.symptoms.length
      ? "sem náuseas ou vômitos"
      : ""
  const others = [
    d.symptoms.includes("Tontura") && "com tontura",
    d.symptoms.includes("Sonolência") &&
      !d.consciousness.includes("Sonolento(a)") &&
      `sonolent${o}`,
  ].filter(Boolean) as string[]
  const first = [...cons, breath, pattern, pain, nvText, ...others].filter(
    Boolean,
  )
  parts.push(
    `Paciente evolui com recuperação anestésica satisfatória${first.length ? `, ${first.join(", ")}` : ""}.`,
  )

  if (d.vitalsState)
    parts.push(
      d.vitalsState === "Estáveis"
        ? "Sinais vitais estáveis."
        : "Sinais vitais instáveis, médico comunicado.",
    )
  if (d.venousAccess) {
    const sol =
      d.solution && d.solution !== "Sem solução"
        ? `, mantendo infusão de ${d.solution} conforme prescrição médica`
        : ""
    parts.push(
      `Acesso venoso periférico em ${ACCESS_LONG[d.venousAccess] ?? d.venousAccess}${d.accessCondition ? ` ${lowerFirst(d.accessCondition)}` : ""}${sol}.`,
    )
  }
  const devices = d.devices
    .map((x) =>
      x === "SVD"
        ? "sonda vesical de demora"
        : x === IRRIGATION_DEVICE
          ? "irrigação vesical contínua"
          : x === "Jelco" || x === "Cateter de O₂"
            ? ""
            : lowerFirst(x),
    )
    .filter(Boolean)
  if (devices.length) parts.push(`Em uso de ${joinE(devices)}.`)
  if (d.dressing && d.dressing !== "Não se aplica")
    parts.push(`Curativo ${lowerFirst(d.dressing)}.`)
  if (d.irrigation === IRRIGATION_ON) {
    const total = irrigationTotal(d.bags, d.bagVolume)
    const eff =
      d.effluent === "Límpido"
        ? "efluente límpido"
        : d.effluent
          ? `efluente com ${lowerFirst(d.effluent)}`
          : ""
    parts.push(
      `Mantida irrigação vesical contínua${d.irrigSolution ? ` com ${d.irrigSolution}` : ""}${d.foley ? ` por SVD Foley nº ${d.foley}` : ""}${total ? `, volume total infundido de ${total} ml` : ""}${eff ? `, ${eff}` : ""}${d.clots ? ` ${lowerFirst(d.clots)}` : ""}.`,
    )
  }
  if (d.dischargeAt) {
    const dest = DESTINATION_PHRASE[d.destination]
    const transport =
      d.transport === "Deambulando" || d.transport === "No próprio leito"
        ? lowerFirst(d.transport)
        : d.transport
          ? `em ${lowerFirst(d.transport)}`
          : ""
    const state = GENERAL_LONG[d.generalState]
    parts.push(
      `${d.dischargeAt} – Recebe alta da Sala de Recuperação Pós-Anestésica${dest ? `, sendo encaminhad${o} ${dest}` : ""}${transport ? ` ${transport}` : ""}${state ? `, em ${state}` : ""}.`,
    )
  }
  const exit = aldreteTotal(d.aldrete, ALDRETE_EXIT)
  const tail = [
    exit !== null && `Aldrete e Kroulik: ${exit}/10.`,
    (d.evaDischarge || d.eva) && `EVA: ${d.evaDischarge || d.eva}/10.`,
  ].filter(Boolean)
  return [...parts, ...tail].join(" ")
}

/** Pendências no formato do desenho: "Seção: campo". */
export const srpaMissing = (d: ISrpa) => {
  const exit = aldreteTotal(d.aldrete, ALDRETE_EXIT)
  const vitalOk = d.vitals.some(
    (v) =>
      v.time && v.sys.trim() && v.dia.trim() && v.hr.trim() && v.spo2.trim(),
  )
  const irrigating = d.irrigation === IRRIGATION_ON
  return [
    !d.admittedAt && "Situação: Horário de admissão na SRPA",
    !d.generalState && "Situação: Estado geral",
    !d.vitalsState && "Situação: Sinais vitais",
    !d.consciousness.length && "Situação: Nível de consciência",
    !d.breathing && "Situação: Respiração",
    NEEDS_O2.includes(d.breathing) &&
      !d.o2Flow.trim() &&
      `Situação: O₂ (L/min) · obrigatório com ${d.breathing}`,
    !d.respPattern && "Situação: Padrão respiratório",
    !d.allergies && "Background: Alergias",
    d.allergies === "Sim" &&
      !d.allergiesText.trim() &&
      "Background: Quais alergias?",
    !d.anesthesia && "Background: Anestesia",
    !d.venousAccess && "Background: Acesso venoso",
    !d.accessCondition && "Background: Condição do acesso",
    !d.dressing && "Background: Curativo",
    !d.symptoms.length && "Avaliação: Sintomas",
    !d.eva && "Avaliação: EVA",
    !d.fallRisk && "Avaliação: Risco de queda",
    aldreteTotal(d.aldrete, 0) === null &&
      "Aldrete e Kroulik: preencha a coluna Admissão",
    exit === null && "Aldrete e Kroulik: preencha a coluna Saída",
    exit !== null &&
      exit < ALDRETE_MIN &&
      `Aldrete e Kroulik: saída ${exit}/10, abaixo do critério de alta (${ALDRETE_MIN})`,
    !vitalOk &&
      "Sinais vitais: registre ao menos uma aferição (horário, PAS, PAD, FC e SpO₂)",
    irrigating && !d.foley.trim() && "Irrigação vesical: SVD Foley nº",
    irrigating && !d.irrigSolution && "Irrigação vesical: Solução utilizada",
    irrigating && !d.bags.trim() && "Irrigação vesical: Bolsas instaladas",
    irrigating && !d.bagVolume.trim() && "Irrigação vesical: Volume por bolsa",
    irrigating && !d.effluent && "Irrigação vesical: Aspecto do efluente",
    irrigating && !d.clots && "Irrigação vesical: Coágulos",
    !d.dischargeAt && "Alta da SRPA: Hora da alta",
    !d.destination && "Alta da SRPA: Destino",
    !d.transport && "Alta da SRPA: Transporte",
    !d.evaDischarge && "Alta da SRPA: EVA na alta",
    !d.text.trim() && "Alta da SRPA: Evolução de enfermagem",
    !d.nurse && "Assinaturas: Enfermeiro(a)",
    !d.anesthetist && "Assinaturas: Anestesiologista",
  ].filter(Boolean) as string[]
}
