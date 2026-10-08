# Dashboard de Tendência com Administração

Projeto estático (HTML/CSS/JS + Chart.js) integrado ao Supabase.

## O que já está implementado

- `index.html`: gráfico público, carregado dinamicamente do banco.
- Cards de evolução geral, Amarela, Vermelha e ND.
- `login.html`: login por e-mail e senha usando Supabase Auth.
- `admin.html`: área protegida para:
  - adicionar uma medição;
  - editar qualquer data/valor;
  - excluir medições;
  - visualizar o gráfico atualizado;
  - usar os ícones de lápis nos cards para editar a medição mais recente.
- Segurança via RLS: público só lê; apenas usuários cadastrados como admin alteram.

## 1. Configure o banco

No Supabase, abra **SQL Editor**, cole e execute o conteúdo de:

`supabase/setup.sql`

Isso cria as tabelas, políticas RLS e os dois registros de exemplo do HTML original.

## 2. Crie o usuário administrador

No Supabase:

1. Vá em **Authentication > Users**.
2. Crie um usuário com e-mail e senha (ou use um usuário já existente).
3. Copie o UUID desse usuário.
4. No SQL Editor execute:

```sql
insert into public.admin_users (user_id)
values ('UUID-DO-USUARIO');
```

Apenas usuários presentes em `admin_users` conseguem inserir, editar ou excluir dados.

## 3. Configure o front-end

Abra `js/config.js` e informe:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "SUA-ANON-KEY"
};
```

Você encontra esses valores no Supabase em **Project Settings / API** (ou na área de API Keys da interface atual).

> A chave `anon` foi feita para uso no navegador. Não coloque `service_role` no HTML/JavaScript. A proteção de escrita está nas políticas RLS.

## 4. Logo

Coloque sua logo em:

`img/logo.png`

Se o arquivo não existir, a página apenas oculta a imagem.

## 5. Publicação

Pode publicar esta pasta em GitHub Pages, Netlify, Vercel ou outro host estático.

- Página pública: `index.html`
- Login: `login.html`
- Administração: `admin.html`

Mesmo que alguém descubra o endereço de `admin.html`, sem uma sessão válida e sem estar em `admin_users` a pessoa não consegue editar o banco.

## Observação sobre os lápis dos cards

Os percentuais dos cards são calculados, portanto não são editados diretamente. O lápis abre a medição mais recente que gera aquele percentual. Alterando Amarela, Vermelha ou ND, o gráfico e os percentuais são recalculados automaticamente.
