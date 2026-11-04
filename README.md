# Dashboard de Tendências — Meta de conclusão e cards editáveis

Projeto estático (HTML/CSS/JS + Chart.js).

## O que mudou

- Cards de evolução geral, Amarela, Vermelha e ND.
- Adicionar uma medição;
- Editar qualquer data/valor;
- Excluir medições;
- Visualizar o gráfico atualizado;
- Usar os ícones de lápis nos cards para editar a medição mais recente.

## Observação sobre os lápis dos cards

Os percentuais dos cards são calculados, portanto não são editados diretamente. O lápis abre a medição mais recente que gera aquele percentual. Alterando Amarela, Vermelha ou ND, o gráfico e os percentuais são recalculados automaticamente.

## Cadastro, recuperação e acesso administrativo

A tela `login.html` permite **Entrar**, **Criar conta**, **Esqueceu sua senha?**, além do ícone de olho para mostrar e ocultar a senha. Os fluxos utilizam o Supabase Auth. `redefinir-senha.html` permite escolher nova senha a partir do link enviado por e-mail.

### Configuração no Supabase

1. **Authentication > Providers > Email**: habilite o cadastro por e-mail (*Allow new users to sign up*) se desejar permitir criação de contas. Recomenda-se manter **Confirm email** habilitado.
2. **Authentication > URL Configuration**: configure **Site URL** com a URL pública do projeto (por exemplo, `https://USUARIO.github.io/REPOSITORIO/`) e adicione a **Redirect URLs** as URLs completas `https://USUARIO.github.io/REPOSITORIO/login.html` e `https://USUARIO.github.io/REPOSITORIO/redefinir-senha.html`. Para testes locais, adicione as URLs de localhost com a porta utilizada. Não use localhost como URL pública.
3. **Authentication > Email Templates**: mantenha os templates de confirmação de cadastro e recuperação de senha, com os links padrão de confirmação. Se a entrega de e-mails estiver limitada, configure um provedor SMTP para uso em produção.
4. Uma conta criada pelo formulário **não se torna administradora automaticamente**. Depois do cadastro e da confirmação do e-mail, em **Authentication > Users**, copie o UUID e execute no SQL Editor:

```sql
insert into public.admin_users (user_id)
values ('UUID-DO-USUARIO')
on conflict (user_id) do nothing;
```

O banco deste projeto já contém `public.admin_users` e a função `public.is_admin()`, com políticas RLS para restringir a escrita. **Não é necessário executar novamente `supabase/setup.sql`**, nem adicionar tabelas para cadastrar usuários ou recuperar senhas. Se esse SQL nunca foi aplicado ao banco, configure a estrutura administrativa primeiro.

**Observação:** o cadastro depende das opções de autenticação habilitadas no Supabase. Os links precisam abrir no mesmo domínio permitido em Redirect URLs. Teste envio de e-mail e redefinição após publicar os arquivos. Sem SMTP personalizado, o Supabase pode limitar o volume de e-mails enviados.
