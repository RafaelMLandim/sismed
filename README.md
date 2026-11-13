# Centro cirúrgico · preview (cópia de segurança)

Cópia do protótipo (mock) do Centro cirúrgico feito dentro do `sismed-frontend`.

- `src/app/preview/centro-cirurgico/` — a rota inteira, igual ao original
  (`sismed-frontend/src/app/preview/centro-cirurgico/`).
- `src/modules/Surgeries/helpers/ui.ts` e `src/shared/utils/cn.ts` — os dois
  arquivos de fora da rota que ela importa (`@/modules/...` e `@/shared/...`).
- `design/Centro cirurgico.pen` — o desenho no Pencil usado como referência.

Não roda sozinho: depende do Next.js, HeroUI, zustand e react-icons do
`sismed-frontend`. Para voltar a usar, copie `src/` para dentro do
`sismed-frontend` mantendo os mesmos caminhos e rode `npm run dev` lá
(a página fica em `/preview/centro-cirurgico`).

Os dados são de exemplo (`_data/fixtures.ts`) e ficam no `localStorage` do
navegador; não há backend.
