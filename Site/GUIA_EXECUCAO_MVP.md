# Guia de instalação e execução — MVP do Portal de Temas de TCC

Este documento explica como executar **localmente** o protótipo do Portal de Temas de TCC para desenvolvimento, testes e demonstração na disciplina de Desenvolvimento de Software.

> **Importante:** este é um MVP demonstrativo. Ele não se conecta ao sistema ou ao banco de dados oficial da instituição. Os dados de demonstração e as permissões são gerenciados no navegador, portanto não devem ser tratados como registros acadêmicos oficiais.

## 1. Tecnologias utilizadas

O protótipo é uma aplicação web estática, composta por:

- **HTML** — estrutura inicial da página (`Site/index.html`).
- **CSS** — estilos e layout (`Site/style.css`).
- **JavaScript** — comportamento da interface e regras do protótipo (`Site/script.js`).
- **`localStorage`** — armazenamento local dos temas e das solicitações no navegador.
- **`Site/db.js`** — dados iniciais de demonstração, incluindo usuários e temas.

Não é necessário instalar um banco de dados, configurar um servidor backend ou executar `npm install`. Um navegador moderno é suficiente. Para evitar problemas ao carregar os arquivos e armazenar dados, recomenda-se abrir o site por meio de um servidor HTTP local, em vez de abrir o arquivo HTML diretamente.

## 2. Estrutura dos arquivos

```text
Projeto-DS-Temas-de-TCC/
├── README.md
└── Site/
    ├── index.html
    ├── style.css
    ├── db.js
    └── script.js
```

- `index.html` carrega a estrutura da página, o CSS e os arquivos JavaScript.
- `style.css` define a aparência da interface.
- `db.js` declara os usuários e os temas iniciais da demonstração.
- `script.js` controla o login demonstrativo, as telas, os formulários, as inscrições e o salvamento local.


## 3. Entrar no protótipo

O login é apenas demonstrativo: o formulário pede o identificador do usuário, sem senha. Digite um dos identificadores abaixo.

### Professores

| Identificador | Usuário de demonstração |
|---|---|
| `ped` | Prof. Edna Dias |
| `ppr` | Prof. Paola Rodrigues |

### Alunos

| Identificador | Usuário de demonstração |
|---|---|
| `agp` | Gabriel Pereira |
| `apa` | Pedro Alves |
| `aps` | Pedro Sabino |
| `ajv` | José Vinícius |
| `awl` | Wenderson Lopes |

Não existem senhas reais para essas contas. Qualquer pessoa com acesso à página pode selecionar um identificador de demonstração.

## 4. O que testar

### Como aluno

1. Entre com `apa`, `aps` ou outro identificador de aluno.
2. Veja os temas disponíveis e use a busca ou o filtro por área.
3. Solicite inscrição em um tema que tenha vagas disponíveis.
4. Confira o pedido no histórico; inicialmente, o status será **Pendente**.
5. Enquanto o pedido estiver pendente, teste a opção de cancelamento.

### Como professor

1. Saia da conta atual e entre com `ped` ou `ppr`.
2. Consulte os temas sob sua orientação.
3. Use **Cadastrar tema** para registrar um tema de demonstração.
4. Acesse **Ver solicitações** para analisar pedidos feitos para os seus temas.
5. Aceite ou recuse uma solicitação pendente e confira o histórico.
6. Teste a edição dos seus temas. A exclusão é bloqueada quando já existem solicitações associadas, para preservar o histórico.

Para verificar o fluxo completo, faça uma solicitação usando uma conta de aluno e depois entre com o professor responsável pelo tema para analisá-la. Lembre-se de que os dados são locais: essa demonstração funciona no mesmo navegador e na mesma origem.

> **Limite funcional atual:** o fluxo de aluno implementado solicita inscrição em temas já cadastrados. Ele não oferece, no momento, um formulário para sugerir um tema inteiramente novo ao professor.

## 5. Onde os dados ficam guardados?

O protótipo salva os dados no `localStorage` do navegador, sob as chaves:

- `portalTcc.temas.v1`
- `portalTcc.inscricoes.v1`

Assim, alterações normalmente permanecem depois de atualizar ou reabrir a página, desde que você use o mesmo navegador, perfil e origem (protocolo, host e porta). Os dados não são sincronizados entre computadores ou navegadores diferentes.

O arquivo `db.js` fornece os dados iniciais. Na primeira execução, o código carrega esses valores e os persiste no armazenamento local. Depois disso, os dados locais existentes podem prevalecer sobre os dados iniciais do arquivo.

## 6. Como reiniciar os dados de demonstração

> Faça isso apenas se aceitar perder os temas e as inscrições que foram criados ou modificados localmente.

1. Abra o protótipo no navegador.
2. Abra as ferramentas de desenvolvedor (`F12` ou `Ctrl+Shift+I`; no macOS, o atalho pode variar).
3. Procure a aba **Application** (Chrome/Edge) ou **Storage** (Firefox).
4. Localize **Local Storage** e selecione a origem usada pelo protótipo, por exemplo `http://localhost:8000`.
5. Exclua as chaves `portalTcc.temas.v1` e `portalTcc.inscricoes.v1`.
6. Atualize a página.

O aplicativo voltará a inicializar os dados a partir de `db.js`. Se estiver utilizando uma origem diferente, confirme que está limpando o armazenamento da origem correta.


## 7. Limitações e cuidados

Este MVP é destinado a desenvolvimento e demonstração local. Antes de utilizá-lo com usuários ou dados institucionais reais, seria necessário, entre outros pontos:

- implementar autenticação adequada;
- validar as permissões no servidor, não apenas na interface JavaScript;
- criar uma API/backend e uma camada centralizada de persistência;
- integrar um banco de dados aprovado pela instituição (cincoders), após autorização;
- validar e testar os fluxos de negócio e tratar erros de forma consistente;
- considerar privacidade, segurança, cópias de segurança e controle de acesso.

## 8. Referências do código

- [Repositório do projeto](https://github.com/gabrielpnascimento00/Projeto-DS-Temas-de-TCC)
- [`Site/index.html`](https://github.com/gabrielpnascimento00/Projeto-DS-Temas-de-TCC/blob/main/Site/index.html)
- [`Site/style.css`](https://github.com/gabrielpnascimento00/Projeto-DS-Temas-de-TCC/blob/main/Site/style.css)
- [`Site/db.js`](https://github.com/gabrielpnascimento00/Projeto-DS-Temas-de-TCC/blob/main/Site/db.js)
- [`Site/script.js`](https://github.com/gabrielpnascimento00/Projeto-DS-Temas-de-TCC/blob/main/Site/script.js)
