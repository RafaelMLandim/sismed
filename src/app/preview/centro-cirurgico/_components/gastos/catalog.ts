import type { ExpenseKind } from "../../_data/types"

/**
 * Estoque local do mock para a busca de "Lançar item" e para "Lançar gás ou
 * taxa". Inclui os itens da ficha semeada (#4227) e alguns extras.
 */
export interface ICatalogItem {
  name: string
  code: string
  barcode: string
  kind: ExpenseKind
  unit: string
  unitPrice: number
  /** Lote disponível no estoque da sala (gases e taxas não têm lote). */
  lot?: string
}

export const STOCK_CATALOG: ICatalogItem[] = [
  {
    name: "Prótese parcial de quadril bipolar 28mm",
    code: "Simpro 98012-4",
    barcode: "7891000980124",
    kind: "OPME",
    unit: "UN",
    unitPrice: 19450,
    lot: "PQ240917",
  },
  {
    name: "Parafuso cortical 4,5mm",
    code: "Simpro 98050-6",
    barcode: "7891000980506",
    kind: "OPME",
    unit: "UN",
    unitPrice: 640,
    lot: "PC250102",
  },
  {
    name: "Cefazolina 1g",
    code: "Brasíndice 1004-2",
    barcode: "7896004710042",
    kind: "Medicamento",
    unit: "FA",
    unitPrice: 18.4,
    lot: "CF2311",
  },
  {
    name: "Ropivacaína 0,75% 20ml",
    code: "Brasíndice 1187-1",
    barcode: "7896004711871",
    kind: "Medicamento",
    unit: "AMP",
    unitPrice: 96.3,
    lot: "RV0912",
  },
  {
    name: "Ondansetrona 4mg",
    code: "Brasíndice 2100-0",
    barcode: "7896004721000",
    kind: "Medicamento",
    unit: "AMP",
    unitPrice: 8,
    lot: "MD880",
  },
  {
    name: "Dexametasona 10mg",
    code: "Brasíndice 2111-1",
    barcode: "7896004721111",
    kind: "Medicamento",
    unit: "AMP",
    unitPrice: 12.5,
    lot: "MD881",
  },
  {
    name: "Soro fisiológico 0,9% 500ml",
    code: "Brasíndice 2122-2",
    barcode: "7896004721222",
    kind: "Medicamento",
    unit: "FR",
    unitPrice: 17,
    lot: "MD882",
  },
  {
    name: "Ácido tranexâmico 250mg",
    code: "Brasíndice 1450-8",
    barcode: "7896004714508",
    kind: "Medicamento",
    unit: "AMP",
    unitPrice: 11.2,
    lot: "AT1203",
  },
  {
    name: "Fio poliglactina 2-0 (Vicryl)",
    code: "Simpro 77231-0",
    barcode: "7891000772310",
    kind: "Material",
    unit: "UN",
    unitPrice: 42.5,
    lot: "VC2210",
  },
  {
    name: "Compressa gaze 7,5x7,5",
    code: "Simpro 10442-8",
    barcode: "7891000104428",
    kind: "Material",
    unit: "PCT",
    unitPrice: 6.9,
    lot: "CG1102",
  },
  {
    name: "Luva cirúrgica estéril 7,5",
    code: "Simpro 20117-3",
    barcode: "7891000201173",
    kind: "Material",
    unit: "PAR",
    unitPrice: 4.2,
    lot: "LV0833",
  },
  {
    name: "Campo cirúrgico descartável",
    code: "Simpro 30219-9",
    barcode: "7891000302199",
    kind: "Material",
    unit: "KIT",
    unitPrice: 128,
    lot: "CP4410",
  },
  {
    name: "Dreno de sucção 4,8mm",
    code: "Simpro 45120-2",
    barcode: "7891000451202",
    kind: "Material",
    unit: "UN",
    unitPrice: 210,
    lot: "DS0207",
  },
  {
    name: "Seringa 10ml",
    code: "Simpro 60100-0",
    barcode: "7891000601000",
    kind: "Material",
    unit: "UN",
    unitPrice: 12.5,
    lot: "LT2400",
  },
  {
    name: "Seringa 20ml",
    code: "Simpro 60107-1",
    barcode: "7891000601071",
    kind: "Material",
    unit: "UN",
    unitPrice: 15.6,
    lot: "LT2401",
  },
  {
    name: "Agulha 40x12",
    code: "Simpro 60114-2",
    barcode: "7891000601142",
    kind: "Material",
    unit: "UN",
    unitPrice: 18.7,
    lot: "LT2402",
  },
  {
    name: "Equipo macrogotas",
    code: "Simpro 60121-3",
    barcode: "7891000601213",
    kind: "Material",
    unit: "UN",
    unitPrice: 21.8,
    lot: "LT2403",
  },
  {
    name: "Lâmina de bisturi nº 23",
    code: "Simpro 60177-2",
    barcode: "7891000601772",
    kind: "Material",
    unit: "UN",
    unitPrice: 46.6,
    lot: "LT2411",
  },
  {
    name: "Cimento ósseo 40g",
    code: "Simpro 98100-3",
    barcode: "7891000981003",
    kind: "Material",
    unit: "UN",
    unitPrice: 310,
    lot: "CO2408",
  },
  {
    name: "Sonda vesical de demora 14Fr",
    code: "Simpro 60150-6",
    barcode: "7891000601506",
    kind: "Material",
    unit: "UN",
    unitPrice: 24.9,
    lot: "SV1907",
  },
]

/** Opções de "Lançar gás ou taxa": quantidade em minutos (gás) ou usos (taxa). */
export const GAS_TAX_CATALOG: ICatalogItem[] = [
  {
    name: "Oxigênio",
    code: "Taxa TUSS 60000589",
    barcode: "",
    kind: "Gás",
    unit: "MIN",
    unitPrice: 1.5,
  },
  {
    name: "Ar comprimido medicinal",
    code: "Taxa TUSS 60000600",
    barcode: "",
    kind: "Gás",
    unit: "MIN",
    unitPrice: 1.2,
  },
  {
    name: "Óxido nitroso",
    code: "Taxa TUSS 60000597",
    barcode: "",
    kind: "Gás",
    unit: "MIN",
    unitPrice: 2.4,
  },
  {
    name: "CO₂ medicinal",
    code: "Taxa TUSS 60000610",
    barcode: "",
    kind: "Gás",
    unit: "MIN",
    unitPrice: 2.1,
  },
  {
    name: "Bisturi elétrico (uso)",
    code: "Taxa TUSS 60023112",
    barcode: "",
    kind: "Taxa",
    unit: "USO",
    unitPrice: 165,
  },
  {
    name: "Aspirador cirúrgico (uso)",
    code: "Taxa TUSS 60023120",
    barcode: "",
    kind: "Taxa",
    unit: "USO",
    unitPrice: 48,
  },
  {
    name: "Monitor multiparamétrico (uso)",
    code: "Taxa TUSS 60023139",
    barcode: "",
    kind: "Taxa",
    unit: "USO",
    unitPrice: 75,
  },
  {
    name: "Taxa de sala cirúrgica (porte 3)",
    code: "Taxa TUSS 60001020",
    barcode: "",
    kind: "Taxa",
    unit: "USO",
    unitPrice: 890,
  },
]

const normalize = (v: string) =>
  v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

/** Busca por nome, código ou código de barras (sem acento, sem caixa). */
export const searchStock = (query: string, limit = 8) => {
  const q = normalize(query.trim())
  if (!q) return []
  return STOCK_CATALOG.filter(
    (i) =>
      normalize(i.name).includes(q) ||
      normalize(i.code).includes(q) ||
      i.barcode.includes(q),
  ).slice(0, limit)
}

/** Lote do estoque da sala para um item (usado ao aplicar kit). */
export const stockLot = (code: string) =>
  STOCK_CATALOG.find((i) => i.code === code)?.lot
