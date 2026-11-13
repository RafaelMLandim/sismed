import { TODAY_ISO, addDays } from "./days"
import type { IHospitalization } from "./types"

/**
 * Detalhes clínicos das internações (aba "Resumo", PEP-18). A Maria segue o
 * desenho; os demais foram escritos no mesmo padrão.
 */
export const HOSP_DETAILS: Record<number, Partial<IHospitalization>> = {
  1182: {
    admittedTime: "06:00",
    diagnosis: "Colelitíase",
    cid: "K80.2",
    expectedDischarge: addDays(TODAY_ISO, 2),
    complaint:
      "Dor em hipocôndrio direito há 3 meses, com piora após refeições gordurosas. Internada eletivamente para colecistectomia videolaparoscópica.",
    hypothesis:
      "Colelitíase sintomática. USG com múltiplos cálculos, sem sinais de colecistite aguda.",
    comorbidities: [
      "Hipertensão arterial",
      "Losartana 50 mg/dia",
      "Ex-tabagista",
    ],
  },
  1180: {
    admittedTime: "18:40",
    diagnosis: "Fratura do colo do fêmur",
    cid: "S72.0",
    expectedDischarge: addDays(TODAY_ISO, 3),
    complaint:
      "Queda da própria altura em casa, com dor intensa em quadril esquerdo e incapacidade de apoiar o membro.",
    hypothesis:
      "Fratura de colo de fêmur esquerdo (Garden IV). Indicada artroplastia parcial de quadril.",
    comorbidities: [
      "Diabetes tipo 2",
      "Metformina 850 mg 2x/dia",
      "Alergia a penicilina",
    ],
  },
  1179: {
    admittedTime: "14:00",
    diagnosis: "Pneumonia comunitária",
    cid: "J18.9",
    expectedDischarge: addDays(TODAY_ISO, 2),
    complaint:
      "Tosse produtiva e febre há 4 dias, com dispneia aos esforços. Procurou o pronto-socorro com piora do cansaço.",
    hypothesis:
      "Pneumonia adquirida na comunidade, CURB-65 = 2. RX com consolidação em base direita.",
    comorbidities: ["DPOC leve", "Tiotrópio inalatório", "Ex-tabagista"],
  },
  1175: {
    admittedTime: "09:15",
    diagnosis: "Pós-operatório de revascularização do miocárdio",
    cid: "Z95.1",
    expectedDischarge: TODAY_ISO,
    complaint:
      "Transferida do centro cirúrgico após revascularização do miocárdio eletiva (3 pontes).",
    hypothesis: "Pós-operatório sem intercorrências, em desmame de suporte.",
    comorbidities: [
      "Doença arterial coronariana",
      "Hipertensão arterial",
      "AAS 100 mg/dia",
    ],
  },
  1190: {
    admittedTime: "21:30",
    diagnosis: "Pielonefrite aguda",
    cid: "N10",
    expectedDischarge: addDays(TODAY_ISO, 3),
    complaint:
      "Febre, calafrios e dor lombar à direita há 2 dias, com disúria.",
    hypothesis: "Pielonefrite aguda à direita. Urocultura em andamento.",
    comorbidities: ["Infecção urinária de repetição"],
  },
}
