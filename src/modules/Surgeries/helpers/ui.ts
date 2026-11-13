/**
 * Classes do desenho do Centro cirúrgico, com os valores do Cirurgias.pen.
 * Seguem a paleta do Pencil, como a tela de Pacientes (referência do layout novo).
 */

/** Cartão branco com borda fina (raio 10). */
export const CARD = "rounded-[10px] border border-[#E2E8F0] bg-white"

/** Medidas dos botões do cabeçalho: padding 10×16, 13px/600, ícone 15, raio 8. */
const BUTTON_BASE =
  "h-9 min-w-0 gap-2 rounded-lg px-4 text-[13px] font-semibold [&>svg]:h-[15px] [&>svg]:w-[15px]"

/** Botão azul principal (Nova cirurgia, Salvar). */
export const PRIMARY_BUTTON = `${BUTTON_BASE} bg-[#1A56DB] text-white`

/** Botão com contorno fino e fundo branco (Editar, Cancelar, Remarcar…). */
export const OUTLINE_BUTTON = `${BUTTON_BASE} border-1 border-[#E2E8F0] bg-white text-[#1E293B] data-[hover=true]:bg-[#F8FAFC] [&>svg]:text-[#64748B]`

/** Botões pequenos dentro dos cartões: padding 6×11, 12px/600, ícone 13. */
const SMALL_BASE =
  "h-[30px] min-w-0 gap-1.5 rounded-lg px-[11px] text-xs font-semibold [&>svg]:h-[13px] [&>svg]:w-[13px]"
export const SMALL_PRIMARY_BUTTON = `${SMALL_BASE} bg-[#1A56DB] text-white`
export const SMALL_OUTLINE_BUTTON = `${SMALL_BASE} border-1 border-[#E2E8F0] bg-white text-[#1E293B] data-[hover=true]:bg-[#F8FAFC] [&>svg]:text-[#64748B]`

/** Rótulo de coluna/campo em caixa alta: 10.5px/600, cinza, espaçado. */
export const COLUMN_LABEL =
  "text-[10.5px] leading-[13px] font-semibold tracking-[0.4px] text-[#94A3B8] uppercase"

/**
 * Campos do HeroUI (Input, Select, Autocomplete, Textarea) no desenho: rótulo
 * 12px cinza, borda de 1px, raio 8 e texto de 13px. Aplicado na raiz da página
 * e nos modais/drawers, que ficam em portal. O seletor pega só o `<label>` dos
 * campos; o rótulo do Checkbox é um `<span>` e não muda.
 */
export const FIELD_STYLES = [
  "[&_label[data-slot=label]]:text-xs [&_label[data-slot=label]]:font-medium [&_label[data-slot=label]]:text-[#64748B]",
  "[&_[data-slot=input-wrapper]]:border-1 [&_[data-slot=input-wrapper]]:rounded-lg [&_[data-slot=input-wrapper]]:shadow-none",
  "[&_[data-slot=trigger]]:border-1 [&_[data-slot=trigger]]:rounded-lg [&_[data-slot=trigger]]:shadow-none",
  "[&_[data-slot=input]]:text-[13px] [&_[data-slot=value]]:text-[13px]",
].join(" ")
