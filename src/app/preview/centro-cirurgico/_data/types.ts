/**
 * Tipos do mock do Centro cirúrgico (desenho "Centro cirurgico.pen").
 * Tudo roda no navegador, sem backend: o estado vive no store (zustand + localStorage).
 */

export type SurgeryStage =
  | "a_alocar" // confirmada no acompanhamento, sem sala no mapa
  | "agendada" // com sala e horário; antes de entrar na sala
  | "em_cirurgia"
  | "srpa"
  | "finalizada"
  | "cancelada"

export type DocStatus = "nao_iniciado" | "em_preenchimento" | "assinado"

/** Documentos que liberam cada passo do fluxo. */
export type DocKey =
  // antes da sala → liberam a entrada na sala
  | "pre_anestesica"
  | "admissao_pre_op"
  // na sala → liberam a ida para a SRPA
  | "checklist"
  | "evolucao_intraop"
  | "boletim_anestesico"
  // recuperação → liberam a finalização
  | "alta_srpa"
  | "descricao_cirurgica"
  // depois da alta da SRPA (não bloqueiam)
  | "admissao_internacao"
  | "evolucao_internacao"

/** Uma parte de um documento com várias assinaturas (ver `saveDocPart`). */
export interface IDocPart<T = unknown> {
  data: T
  status: DocStatus
  signedAt?: string
  signedBy?: string
}

export type DocPhase = "antes" | "sala" | "srpa" | "depois"

export interface IDocState {
  status: DocStatus
  /** "HH:mm" de quando foi assinado. */
  signedAt?: string
  signedBy?: string
}

export interface IPatient {
  id: string
  name: string
  initials: string
  age: number
  sex: "Feminino" | "Masculino"
  record: string // nº do prontuário
  insurance: string
  allergies: string[]
  risks: string[]
}

export interface IUnit {
  id: string
  name: string
  /** Texto curto do seletor ("Centro cirúrgico", "Somente procedimentos"). */
  kind: string
}

export interface IRoomBlock {
  /** Dia do bloqueio ("yyyy-MM-dd"). */
  date: string
  start: string
  end: string
  reason: string
  detail: string
}

export interface IRoom {
  id: string
  unitId: string
  name: string
  specialty: string
  /** Bloqueios da sala (manutenção etc.), um por dia no máximo. */
  blocks: IRoomBlock[]
  /**
   * Bloqueio do dia que está sendo visto no mapa. Não é salvo: é preenchido
   * a partir de `blocks` (ver `roomsOn`).
   */
  block?: Omit<IRoomBlock, "date">
}

export interface ICareNote {
  label: string
  value: string
  tone: "danger" | "warning" | "primary" | "default"
}

export type PreferredPeriod = "Manhã" | "Tarde" | "Qualquer horário"

export interface ISurgery {
  id: number
  /** Unidade (hospital) onde a cirurgia acontece. */
  unitId: string
  patientId: string
  hospitalizationId?: number
  procedure: string
  side?: "Direito" | "Esquerdo" | "Bilateral" | "Não se aplica"
  surgeon: string
  anesthetist?: string
  anesthesia?: string
  insurance: string
  /** Minutos previstos; undefined = "Duração não informada". */
  durationMin?: number
  stage: SurgeryStage
  /** Paciente já chegou à unidade (antes disso a etapa é "Aguardando chegada"). */
  arrived: boolean
  roomId?: string
  /** Dia da cirurgia no mapa ("yyyy-MM-dd"); só existe depois de alocada. */
  date?: string
  /** Dia pedido no acompanhamento cirúrgico (fila "A alocar"). */
  requestedDate?: string
  start?: string // "HH:mm"
  end?: string // "HH:mm"
  /** Horários reais do fluxo. */
  enteredRoomAt?: string
  leftRoomAt?: string
  srpaBed?: string
  srpaDischargeAt?: string
  /** Onde o paciente está fora do centro cirúrgico (leito da internação). */
  bed?: string
  urgent?: boolean
  preferredPeriod?: PreferredPeriod
  /** Pendências mostradas na fila de alocação ("Exames pendentes"…). */
  pendencies: string[]
  careNotes: ICareNote[]
  reservations: string
  /** "HH:mm" em que o transporte ao centro cirúrgico foi liberado. */
  transportReleasedAt?: string
  docs: Record<DocKey, IDocState>
  /**
   * Conteúdo preenchido dos documentos completos (D01…D11), pela chave do
   * documento. Documentos com partes (admissão da internação: médica e
   * enfermagem) guardam cada parte em "chave:parte" (ver `saveDocPart`).
   */
  docData?: Partial<Record<string, unknown>>
}

export interface IHospitalization {
  id: number
  unitId: string
  patientId: string
  reason: string
  doctor: string
  bed: string
  admittedOn: string // "dd/MM/yyyy"
  day: number // dia de internação
  dischargeToday?: boolean
  /** Setor (Clínica cirúrgica, UTI…). */
  sector: string
  /** "HH:mm" da admissão. */
  admittedTime?: string
  /** Diagnóstico principal e CID. */
  diagnosis?: string
  cid?: string
  /** "yyyy-MM-dd" da alta prevista. */
  expectedDischarge?: string
  /** Motivo da internação (aba Resumo). */
  complaint?: string
  hypothesis?: string
  /** Comorbidades e medicamentos de uso contínuo. */
  comorbidities?: string[]
  /** Alta registrada (PEP-M28): internação encerrada. */
  discharged?: { date: string; time: string }
}

export type ExpenseKind = "Material" | "Medicamento" | "OPME" | "Gás" | "Taxa"
export type ExpenseOrigin = "Manual" | "Bipado na sala" | "Kit"

export interface IExpenseItem {
  id: string
  name: string
  code: string // "Simpro 98012-4", "Brasíndice 1004-2", "Taxa TUSS 60000589"
  kind: ExpenseKind
  qty: number
  unit: string // UN, FA, AMP, PCT, PAR, KIT, MIN, USO
  lot?: string
  launchedBy: string
  launchedAt: string // "HH:mm"
  origin: ExpenseOrigin
  unitPrice: number
  /** OPME sem etiqueta de rastreio bloqueia o fechamento. */
  trackingLabelPending?: boolean
}

export interface IExpenseSheet {
  surgeryId: number
  status: "aberta" | "fechada"
  closedAt?: string
  closedBy?: string
  items: IExpenseItem[]
}

/** Uma aferição de sinais vitais (aba "Sinais vitais"). */
export interface IVitalSign {
  id: string
  patientId: string
  /** "yyyy-MM-dd" */
  date: string
  /** "HH:mm" */
  time: string
  /** PA sistólica / diastólica (mmHg). */
  sys: number
  dia: number
  /** Frequência cardíaca (bpm). */
  hr: number
  /** Frequência respiratória (irpm). */
  rr: number
  /** Temperatura axilar (°C). */
  temp: number
  /** Saturação de O₂ (%). */
  spo2: number
  /** Dor de 0 a 10. */
  pain: number
  /** Quem registrou. */
  by: string
  /** Contexto da aferição ("Admissão na unidade", "Pós-operatório"…). */
  note?: string
  /** "HH:mm" em que o médico foi comunicado de valor fora do limite. */
  doctorNotifiedAt?: string
}

export type EvolutionKind =
  | "Médica"
  | "Enfermagem"
  | "Anestesia"
  | "Nutrição"
  | "Fisioterapia"
  | "Psicologia"
  | "Serviço social"

/** Evolução da internação (aba "Evoluções"), no formato SOAP. */
export interface IEvolution {
  id: string
  patientId: string
  /** "yyyy-MM-dd" */
  date: string
  /** "HH:mm" */
  time: string
  kind: EvolutionKind
  /** Nome do profissional. */
  author: string
  /** Registro no conselho ("CRM-DF 12345"). */
  council?: string
  s?: string
  o?: string
  a?: string
  p?: string
  status: "rascunho" | "assinada"
  /** "HH:mm" da assinatura. */
  signedAt?: string
}

// ── Alta (PEP-17a/17b, M27, M28, D08, D09) ────────────────────

export type DischargeType =
  | "Melhorada"
  | "Curada"
  | "A pedido"
  | "Transferência"
  | "Evasão"
  | "Óbito"

/** PEP-M27 · Prescrição e orientações de alta. */
export interface IDischargePrescription {
  status: "rascunho" | "salva"
  /** Itens da receita, um por linha. */
  items: string[]
  dressing: string
  activity: string
  alerts: string
  /** "yyyy-MM-dd" do retorno ambulatorial. */
  returnDate: string
  returnClinic: string
  returnProfessional: string
  /** Preenche o documento "Orientações ao paciente" ao salvar. */
  generateGuide: boolean
}

/** PEP-D08 · Orientações ao paciente. */
export interface IDischargeGuide {
  status: DocStatus
  signedAt?: string
  signedBy?: string
  model?: string
  date: string
  time: string
  procedure: string
  diet: string[]
  activities: string[]
  /** Dias evitando esforço (obrigatório se marcou "Evitar esforço"). */
  restDays?: number
  catheter: boolean
  catheterCare: string[]
  catheterRemoval: string
  expected: string[]
  meds: string
  warnings: string[]
  emergency: string
  returnText: string
  bring: string
  text: string
  doctor: string
}

/** PEP-D09 · Sumário de alta. */
export interface IDischargeSummary {
  status: DocStatus
  signedAt?: string
  signedBy?: string
  date: string
  time: string
  type: DischargeType
  destination: string
  companion: string
  diagnosis: string
  cid: string
  procedure: string
  procedureDate: string
  anesthesia: string
  complications: boolean
  complicationsText: string
  conditions: string[]
  catheter: boolean
  catheterRemoval: string
  drain: boolean
  meds: string
  guidance: string[]
  followUp: string
  pathology: boolean
  certificate: boolean
  leaveDays?: number
  text: string
  doctor: string
}

/** Alta de uma internação: pré-requisitos, documentos e o registro. */
export interface IDischarge {
  hospitalizationId: number
  /** "dd/MM" em que a fisioterapia liberou para deambular. */
  physioReleasedOn?: string
  prescription?: IDischargePrescription
  guide?: IDischargeGuide
  summary?: IDischargeSummary
  /** PEP-M28 · dados da saída. */
  registered?: {
    date: string
    time: string
    type: DischargeType
    destination: string
    companion: string
    contact: string
    transport: string
  }
}
