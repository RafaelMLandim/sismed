/**
 * Passagens antigas (encerradas) mostradas na busca por paciente (PEP-00b).
 * Não fazem parte do fluxo do mock: são só leitura, por isso ficam estáticas aqui.
 */
export interface IPastPassage {
  key: string
  date: string
  period: string
  hospId?: string
  surgeryId?: string
  procedure: string
  where: string
  doctor: string
  outcome: "alta" | "cancelada"
  outcomeSub?: string
  docs?: number
}

export const PAST_PASSAGES: Record<string, IPastPassage[]> = {
  jose: [
    {
      key: "3110",
      date: "12/03/2025",
      period: "até 12/03/2025 · 1 dia",
      surgeryId: "3110",
      procedure: "Facectomia com lente intraocular · OD",
      where: "Hospital dia · Sala 2",
      doctor: "Dra. Lúcia Ramos",
      outcome: "alta",
      docs: 8,
    },
    {
      key: "2988",
      date: "14/01/2025",
      period: "não aconteceu",
      surgeryId: "2988",
      procedure: "Facectomia com lente intraocular · OD",
      where: "—",
      doctor: "Dra. Lúcia Ramos",
      outcome: "cancelada",
      outcomeSub: "Pressão alta no pré-operatório",
    },
    {
      key: "0874",
      date: "08/08/2024",
      period: "até 15/08/2024 · 7 dias",
      hospId: "0874",
      procedure: "Pneumonia comunitária",
      where: "Leito 206-B",
      doctor: "Dr. Igor Lima",
      outcome: "alta",
      docs: 14,
    },
    {
      key: "0512",
      date: "21/02/2023",
      period: "até 22/02/2023 · 1 dia",
      hospId: "0512",
      surgeryId: "1988",
      procedure: "Hernioplastia inguinal · D",
      where: "Leito 102 · Sala 3",
      doctor: "Dr. Renato Alves",
      outcome: "alta",
      docs: 11,
    },
    {
      key: "1420",
      date: "03/10/2022",
      period: "até 03/10/2022 · 1 dia",
      surgeryId: "1420",
      procedure: "Colonoscopia diagnóstica",
      where: "Hospital dia · Sala 3",
      doctor: "Dr. Fábio Mendes",
      outcome: "alta",
      docs: 5,
    },
  ],
}
