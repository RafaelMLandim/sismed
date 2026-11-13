import { TODAY_ISO, addDays } from "./days"
import type { DischargeType, IDischarge } from "./types"

/** Opções do frame "Dropdowns · Alta" do desenho. */
export const DISCHARGE_TYPES: DischargeType[] = [
  "Melhorada",
  "Curada",
  "A pedido",
  "Transferência",
  "Evasão",
  "Óbito",
]

export const DESTINATIONS = [
  "Domicílio",
  "Transferência para outro hospital",
  "Home care",
  "Instituição de longa permanência",
]

/** Ambulatório do retorno → profissionais (PEP-M27). */
export const RETURN_CLINICS: Record<string, string[]> = {
  "Cirurgia cardíaca": ["Dr. Rafael Duarte"],
  Ortopedia: ["Dr. Henrique Sato", "Dra. Renata Alves"],
  "Cirurgia geral": ["Dr. Paulo Mendes", "Dra. Camila Nogueira"],
  Urologia: ["Dr. Igor Lima"],
  "Clínica médica": ["Dr. Igor Lima", "Dr. Fábio Mendes"],
}
export const ANY_PROFESSIONAL = "Qualquer profissional da especialidade"

export const TRANSPORTS = [
  "Carro particular",
  "Táxi ou aplicativo",
  "Ambulância",
  "Transporte público",
]

// ── D08 · Orientações ao paciente ─────────────────────────────

export const DIET = [
  "Dieta habitual a partir de hoje",
  "Dieta leve nas primeiras 24 horas",
  "Beber bastante líquido (2 a 3 litros por dia)",
  "Evitar bebidas alcoólicas",
  "Evitar alimentos gordurosos e muito condimentados",
]

export const ACTIVITIES = [
  "Repouso relativo nas primeiras 24 horas",
  "Não dirigir nem operar máquinas nas 24 horas após a anestesia",
  "Evitar esforço físico e carregar peso",
  "Caminhadas leves estão liberadas",
]
/** A atividade que exige "Evitar esforço por N dias". */
export const EFFORT_ACTIVITY = ACTIVITIES[2]

export const CATHETER_CARE = [
  "Manter a bolsa coletora abaixo do nível da bexiga",
  "Esvaziar a bolsa quando estiver com dois terços do volume",
  "Lavar a região com água e sabão duas vezes ao dia",
  "Não puxar nem dobrar a sonda",
]

export const EXPECTED = [
  "Dor leve no local da cirurgia, que melhora com a medicação",
  "Pequeno inchaço ou roxo perto do corte",
  "Cansaço nos primeiros dias",
  "Urina avermelhada ou com pouco sangue por alguns dias",
  "Ardência ao urinar nas primeiras 48 horas",
]

export const WARNINGS = [
  "Febre acima de 38 °C",
  "Sangramento intenso ou com coágulos",
  "Vermelhidão ou secreção na ferida",
  "Dor forte que não melhora com a medicação",
  "Falta de ar ou dor no peito",
  "Vômitos que não param",
  "Dificuldade ou impossibilidade de urinar",
]

export const EMERGENCY_DEFAULT = "Pronto-socorro do CEUTA · (61) 3333-4400"

/** Modelos de "Meus modelos" para as orientações (PEP-07). */
export const GUIDE_MODELS: {
  name: string
  diet: string[]
  activities: string[]
  restDays?: number
  catheter: boolean
  catheterCare: string[]
  expected: string[]
  warnings: string[]
}[] = [
  {
    name: "Pós-operatório (padrão)",
    diet: [DIET[1], DIET[2], DIET[3]],
    activities: [ACTIVITIES[0], ACTIVITIES[1], ACTIVITIES[2], ACTIVITIES[3]],
    restDays: 15,
    catheter: false,
    catheterCare: [],
    expected: [EXPECTED[0], EXPECTED[1]],
    warnings: [WARNINGS[0], WARNINGS[1], WARNINGS[2], WARNINGS[3]],
  },
  {
    name: "Pós-operatório com sonda",
    diet: [DIET[1], DIET[2], DIET[3]],
    activities: [ACTIVITIES[0], ACTIVITIES[1], ACTIVITIES[2], ACTIVITIES[3]],
    restDays: 15,
    catheter: true,
    catheterCare: [...CATHETER_CARE],
    expected: [EXPECTED[3], EXPECTED[4]],
    warnings: [
      WARNINGS[0],
      WARNINGS[1],
      WARNINGS[6],
      WARNINGS[3],
      WARNINGS[4],
      WARNINGS[5],
    ],
  },
  {
    name: "Cirurgia cardíaca",
    diet: [DIET[0], DIET[4]],
    activities: [ACTIVITIES[2], ACTIVITIES[3]],
    restDays: 60,
    catheter: false,
    catheterCare: [],
    expected: [EXPECTED[0], EXPECTED[2]],
    warnings: [WARNINGS[0], WARNINGS[2], WARNINGS[3], WARNINGS[4]],
  },
]

// ── D09 · Sumário de alta ─────────────────────────────────────

export const CONDITIONS = [
  "Consciente e orientado",
  "Hemodinamicamente estável",
  "Deambulando",
  "Diurese espontânea",
  "Dor controlada",
  "Aceitando dieta",
  "Curativo limpo e seco",
  "Sem sangramento",
]

export const GUIDANCE = [
  "Dieta habitual",
  "Hidratação oral abundante",
  "Repouso relativo",
  "Evitar esforço físico",
  "Cuidados com a ferida operatória",
  "Cuidados com a sonda vesical",
  "Não dirigir nas próximas 24 horas",
  "Procurar atendimento se febre, sangramento, falta de ar ou dor intensa",
]

/**
 * Altas em andamento. A Francisca segue o desenho PEP-17a: 5 de 7
 * pré-requisitos, receita em rascunho e sumário aguardando assinatura.
 */
export const DISCHARGES: IDischarge[] = [
  {
    hospitalizationId: 1175,
    physioReleasedOn: "04/11",
    prescription: {
      status: "rascunho",
      items: [
        "AAS 100 mg — 1 comprimido via oral após o almoço, uso contínuo",
        "Clopidogrel 75 mg — 1 comprimido via oral ao dia, por 12 meses",
        "Atorvastatina 40 mg — 1 comprimido via oral à noite, uso contínuo",
        "Paracetamol 750 mg — 1 comprimido via oral de 6/6 h, se dor, por 7 dias",
      ],
      dressing:
        "Manter o curativo do esterno e da perna limpo e seco. Lavar com água e sabão no banho e secar bem. Retirada dos pontos no retorno.",
      activity:
        "Caminhar dentro de casa várias vezes ao dia. Não carregar peso acima de 5 kg nem dirigir por 60 dias. Abraçar um travesseiro ao tossir.",
      alerts:
        "Febre acima de 38 °C, vermelhidão ou secreção na ferida, dor no peito, falta de ar ou inchaço nas pernas.",
      returnDate: addDays(TODAY_ISO, 7),
      returnClinic: "Cirurgia cardíaca",
      returnProfessional: "Dr. Rafael Duarte",
      generateGuide: true,
    },
  },
]
