import type { DocKey, ISurgery } from "../../_data/types"

/**
 * Campos ilustrativos de cada documento no modal genérico. Não são as telas
 * completas dos documentos (PEP-D01…D11), só o suficiente para o fluxo do mock.
 */
export type DocField =
  | { kind: "text"; label: string; sample?: string }
  | { kind: "textarea"; label: string; sample?: string }
  | { kind: "checks"; label: string; options: string[]; sample?: string[] }
  | { kind: "radio"; label: string; options: string[]; sample?: string }

export const docFields = (k: DocKey, s: ISurgery): DocField[] => {
  switch (k) {
    case "pre_anestesica":
      return [
        {
          kind: "radio",
          label: "Classificação ASA",
          options: ["I", "II", "III", "IV"],
          sample: s.anesthesia?.match(/ASA (\w+)/)?.[1] ?? "II",
        },
        {
          kind: "textarea",
          label: "Comorbidades e medicamentos em uso",
          sample: "Hipertensão em uso de losartana 50 mg/dia.",
        },
        {
          kind: "text",
          label: "Plano anestésico",
          sample: s.anesthesia?.split(" · ")[0] ?? "Geral balanceada",
        },
        {
          kind: "checks",
          label: "Cuidados planejados",
          options: [
            "Jejum orientado",
            "Profilaxia de náuseas e vômitos",
            "Reserva de vaga em UTI",
          ],
          sample: ["Jejum orientado"],
        },
        {
          kind: "radio",
          label: "Parecer",
          options: ["Apto", "Apto com ressalvas", "Inapto"],
          sample: "Apto",
        },
      ]
    case "admissao_pre_op":
      return [
        { kind: "text", label: "Jejum: hora (líquidos)", sample: "22:00" },
        { kind: "text", label: "Acesso venoso", sample: "AVP 18G em MSE" },
        {
          kind: "checks",
          label: "Preparo",
          options: [
            "Paciente orientado(a) à retirada de adornos",
            "Preparo da pele realizado",
            "Exames com o paciente na admissão",
          ],
          sample: ["Paciente orientado(a) à retirada de adornos"],
        },
        { kind: "textarea", label: "Observações" },
      ]
    case "checklist":
      return [
        {
          kind: "checks",
          label: "Fase 1 · Antes da indução",
          options: [
            "Identificação do paciente confirmada",
            "Local e lateralidade marcados",
            "Carrinho de anestesia checado",
            "Oxímetro de pulso funcionando",
          ],
          sample: [
            "Identificação do paciente confirmada",
            "Local e lateralidade marcados",
            "Carrinho de anestesia checado",
            "Oxímetro de pulso funcionando",
          ],
        },
        {
          kind: "checks",
          label: "Fase 2 · Antes da incisão",
          options: [
            "Equipe se apresentou",
            "Antibiótico profilático nos últimos 60 min",
            "Exames de imagem disponíveis",
          ],
          sample: [
            "Equipe se apresentou",
            "Antibiótico profilático nos últimos 60 min",
            "Exames de imagem disponíveis",
          ],
        },
        {
          kind: "checks",
          label: "Fase 3 · Antes de sair da sala",
          options: [
            "Contagem de compressas, gazes e agulhas conferida",
            "Peças identificadas",
            "Problemas com equipamentos registrados",
          ],
        },
      ]
    case "evolucao_intraop":
      return [
        {
          kind: "radio",
          label: "Posição",
          options: ["Dorsal", "Lateral", "Litotomia"],
          sample: "Dorsal",
        },
        {
          kind: "radio",
          label: "Antissepsia",
          options: [
            "Clorexidina degermante",
            "Clorexidina alcoólica",
            "Clorexidina aquosa",
          ],
          sample: "Clorexidina alcoólica",
        },
        {
          kind: "checks",
          label: "Dispositivos",
          options: ["Placa de bisturi elétrico", "Sonda vesical (SVD)"],
          sample: ["Placa de bisturi elétrico"],
        },
        {
          kind: "textarea",
          label: "Intercorrências",
          sample: "Sem intercorrências.",
        },
        { kind: "textarea", label: "Evolução de enfermagem" },
      ]
    case "boletim_anestesico":
      return [
        { kind: "text", label: "Anestesia", sample: s.anesthesia },
        {
          kind: "textarea",
          label: "Fármacos administrados",
          sample: "Midazolam 2 mg EV · Bupivacaína 0,5% pesada 15 mg",
        },
        { kind: "textarea", label: "Intercorrências" },
        { kind: "text", label: "Aldrete na saída" },
        { kind: "text", label: "Condição na saída" },
      ]
    case "alta_srpa":
      return [
        { kind: "text", label: "Aldrete na admissão", sample: "7" },
        { kind: "text", label: "Aldrete agora", sample: "8" },
        {
          kind: "textarea",
          label: "Dor e sinais vitais",
          sample: "EVA 2, PA 124/76, FC 78, SpO₂ 97%.",
        },
        {
          kind: "checks",
          label: "Alta",
          options: ["Critério de alta da SRPA atingido"],
        },
        {
          kind: "radio",
          label: "Destino",
          options: ["Enfermaria", "UTI", "Domicílio"],
          sample: s.bed ? "Enfermaria" : "Domicílio",
        },
      ]
    case "descricao_cirurgica":
      return [
        { kind: "text", label: "Procedimento realizado", sample: s.procedure },
        { kind: "text", label: "Diagnóstico pós-operatório" },
        { kind: "textarea", label: "Achados operatórios" },
        { kind: "textarea", label: "Descrição técnica" },
        {
          kind: "radio",
          label: "Houve intercorrências?",
          options: ["Não", "Sim"],
          sample: "Não",
        },
        {
          kind: "checks",
          label: "Material",
          options: ["Material enviado para anatomopatológico"],
        },
      ]
    case "admissao_internacao":
      return [
        { kind: "text", label: "Leito", sample: s.bed },
        { kind: "textarea", label: "Admissão médica" },
        { kind: "textarea", label: "Admissão de enfermagem" },
      ]
    case "evolucao_internacao":
      return [
        {
          kind: "textarea",
          label: "Subjetivo",
          sample: "Refere dor leve no local da incisão.",
        },
        {
          kind: "textarea",
          label: "Objetivo",
          sample: "PA 124/76, FC 78, afebril.",
        },
        { kind: "textarea", label: "Avaliação" },
        { kind: "textarea", label: "Plano" },
      ]
  }
}
