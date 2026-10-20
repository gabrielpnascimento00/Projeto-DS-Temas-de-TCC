const CHAVE_TEMAS = "portalTcc.temas.v1";
const CHAVE_INSCRICOES = "portalTcc.inscricoes.v1";
let usuario_logado = null;
let temas = [];
let inscricoes = [];
let telaAnteriorDocente = "inicio";

const tela = () => document.getElementById("tela");
const agoraISO = () => new Date().toISOString();
const novoId = (prefixo) => `${prefixo}${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
const textoSeguro = (valor = "") => String(valor).replace(/[&<>"']/g, caractere => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[caractere]);
const usuarioPorId = id => usuarios.find(usuario => usuario.id === id);
const temaPorId = id => temas.find(tema => tema.id === id);
const nomeUsuario = id => usuarioPorId(id)?.nome || "Usuário não encontrado";
const dataFormatada = data => data ? new Date(data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Data não informada";
const inscricoesDoTema = temaId => inscricoes.filter(i => i.temaId === temaId);
const vagasOcupadas = temaId => inscricoes.filter(i => i.temaId === temaId && i.status === "aceita").length;
const vagasRestantes = tema => Math.max(0, Number(tema.vagas) - vagasOcupadas(tema.id));
const inscricaoAtivaDoAluno = (temaId, alunoId) => inscricoes.find(i => i.temaId === temaId && i.alunoId === alunoId && ["pendente", "aceita"].includes(i.status));

function lerArray(chave, fallback) {
    try {
        const valor = localStorage.getItem(chave);
        if (!valor) return fallback;
        const parseado = JSON.parse(valor);
        return Array.isArray(parseado) ? parseado : fallback;
    } catch (erro) {
        console.error(`Não foi possível ler ${chave}:`, erro);
        return fallback;
    }
}

function salvar() {
    try {
        localStorage.setItem(CHAVE_TEMAS, JSON.stringify(temas));
        localStorage.setItem(CHAVE_INSCRICOES, JSON.stringify(inscricoes));
        return true;
    } catch (erro) {
        console.error("Erro ao salvar os dados:", erro);
        alert("Não foi possível salvar os dados neste navegador. Verifique o espaço disponível e as permissões.");
        return false;
    }
}

function carregar() {
    // Migra os dados das versões antigas, que usavam as chaves "temas" e "inscricoes".
    const temasGuardados = localStorage.getItem(CHAVE_TEMAS) ?? localStorage.getItem("temas");
    const inscricoesGuardadas = localStorage.getItem(CHAVE_INSCRICOES) ?? localStorage.getItem("inscricoes");
    temas = lerArray(CHAVE_TEMAS, temasGuardados ? lerArray("temas", temasIniciais) : temasIniciais).map(tema => ({
        status: "aberta", criadoEm: agoraISO(), ...tema,
        vagas: Math.max(0, Number(tema.vagas) || 0)
    }));
    inscricoes = lerArray(CHAVE_INSCRICOES, inscricoesGuardadas ? lerArray("inscricoes", []) : []).map(inscricao => ({
        solicitadoEm: inscricao.solicitadoEm || agoraISO(), atualizadoEm: inscricao.atualizadoEm || inscricao.solicitadoEm || agoraISO(),
        ...inscricao
    }));
    salvar();
}

function mudarTela(conteudo) { tela().innerHTML = conteudo; }
function cabecalho(titulo, subtitulo, botoes = "") {
    return `<div class="page-heading"><div><p class="eyebrow">Portal acadêmico</p><h1>${textoSeguro(titulo)}</h1><p class="subtitle">${textoSeguro(subtitulo)}</p></div><div class="actions">${botoes}</div></div>`;
}
function botaoSair() { return `<button class="btn btn-secondary" id="botaoSAIR" type="button">Sair</button>`; }
function ligarSair() {
    document.getElementById("botaoSAIR")?.addEventListener("click", () => { usuario_logado = null; render(); });
}
function ligarVoltar(acao = render) { document.getElementById("botaoVoltar")?.addEventListener("click", acao); }
function statusPill(status) {
    const labels = { aberta: "Inscrições abertas", pendente: "Pendente", aceita: "Aceita", rejeitada: "Não aceita", cancelada: "Cancelada", encerrada: "Encerrado" };
    const classe = { aberta: "open", pendente: "pending", aceita: "accepted", rejeitada: "rejected", cancelada: "canceled", encerrada: "closed" };
    return `<span class="pill ${classe[status] || ""}">${labels[status] || textoSeguro(status)}</span>`;
}
function cardTema(tema, opcoes = {}) {
    const docente = nomeUsuario(tema.docenteId);
    const ocupadas = vagasOcupadas(tema.id);
    const restantes = vagasRestantes(tema);
    let botoes = "";
    if (opcoes.inscrever) {
        const inscricao = inscricaoAtivaDoAluno(tema.id, usuario_logado.id);
        botoes = inscricao
            ? `<p class="helper">Você já possui uma inscrição ${inscricao.status === "pendente" ? "pendente" : "aceita"} para este tema.</p>`
            : `<button class="btn btn-primary btn-small" data-action="inscrever" data-id="${textoSeguro(tema.id)}" ${restantes <= 0 || tema.status !== "aberta" ? "disabled" : ""}>Solicitar inscrição</button>`;
    }
    if (opcoes.gerenciar && tema.docenteId === usuario_logado.id) {
        botoes = `<button class="btn btn-secondary btn-small" data-action="editar-tema" data-id="${textoSeguro(tema.id)}">Editar</button>
            <button class="btn btn-danger btn-small" data-action="excluir-tema" data-id="${textoSeguro(tema.id)}">Excluir</button>`;
    }
    return `<article class="card"><div class="card-top"><h3>${textoSeguro(tema.titulo)}</h3>${statusPill(tema.status)}</div>
        <div class="card-meta"><span class="pill">${textoSeguro(tema.area)}</span><span class="pill">${restantes} de ${Number(tema.vagas)} vagas livres</span></div>
        <p>${textoSeguro(tema.desc)}</p><p class="helper">Orientador(a): ${textoSeguro(docente)} · ${ocupadas} vaga(s) ocupada(s)</p>
        ${botoes ? `<div class="actions">${botoes}</div>` : ""}</article>`;
}
function estadoVazio(mensagem) { return `<div class="empty-state">${textoSeguro(mensagem)}</div>`; }

function render() {
    if (!usuario_logado) return tela_login();
    if (usuario_logado.cargo === "docente") return tela_docente();
    return tela_aluno();
}

function tela_login() {
    mudarTela(`<div class="login-wrap"><section class="login-card"><div class="login-icon" aria-hidden="true">TCC</div><p class="eyebrow">Acesso ao sistema</p><h1>Bem-vindo(a)</h1><p class="subtitle">Entre com seu identificador de demonstração para acessar o portal de temas de TCC.</p>
        <form id="formLogin"><div class="field"><label for="campologin">Identificador do usuário</label><input id="campologin" name="login" autocomplete="username" placeholder="Ex.: apa" required autofocus></div>
        <button class="btn btn-primary" type="submit">Entrar no portal</button></form>
        <p class="helper">Demonstração: docentes ped e ppr · alunos agp, apa, aps, ajv e awl.</p></section></div>`);
    document.getElementById("formLogin").addEventListener("submit", evento => {
        evento.preventDefault();
        const login = document.getElementById("campologin").value.trim().toLowerCase();
        const encontrado = usuarios.find(usuario => usuario.id === login);
        if (!encontrado) return alert("Identificador não encontrado. Confira e tente novamente.");
        usuario_logado = encontrado;
        render();
    });
}

function tela_aluno() {
    const minhas = inscricoes.filter(i => i.alunoId === usuario_logado.id).sort((a, b) => new Date(b.solicitadoEm) - new Date(a.solicitadoEm));
    const aceitas = minhas.filter(i => i.status === "aceita").length;
    const pendentes = minhas.filter(i => i.status === "pendente").length;
    mudarTela(`${cabecalho(`Olá, ${usuario_logado.nome}`, "Acompanhe suas solicitações e encontre temas para seu TCC.", botaoSair())}
        <div class="stats"><div class="stat-card"><span>Minhas inscrições</span><strong>${minhas.length}</strong></div><div class="stat-card"><span>Aguardando análise</span><strong>${pendentes}</strong></div><div class="stat-card"><span>Temas aceitos</span><strong>${aceitas}</strong></div></div>
        <section class="panel"><div class="section-title"><h2>Encontrar um tema</h2></div><div class="filters"><div class="field"><label for="buscaTema">Pesquisar tema</label><input id="buscaTema" type="search" placeholder="Digite título ou palavra-chave"></div><div class="field"><label for="filtroArea">Área</label><select id="filtroArea"><option value="">Todas as áreas</option>${opcoesAreas()}</select></div><button class="btn btn-secondary" id="limparFiltros" type="button">Limpar filtros</button></div><div id="listaTemas" class="card-grid"></div></section>
        <section class="panel"><div class="section-title"><h2>Minhas inscrições e histórico</h2></div><div id="historicoAluno">${historicoAlunoHTML(minhas)}</div></section>`);
    ligarSair();
    const atualizar = () => {
        const termo = document.getElementById("buscaTema").value.trim().toLocaleLowerCase("pt-BR");
        const area = document.getElementById("filtroArea").value;
        const disponiveis = temas.filter(t => t.status === "aberta" && vagasRestantes(t) > 0 && !inscricaoAtivaDoAluno(t.id, usuario_logado.id))
            .filter(t => !area || t.area === area)
            .filter(t => !termo || `${t.titulo} ${t.desc} ${t.area} ${nomeUsuario(t.docenteId)}`.toLocaleLowerCase("pt-BR").includes(termo));
        document.getElementById("listaTemas").innerHTML = disponiveis.length ? disponiveis.map(t => cardTema(t, { inscrever: true })).join("") : estadoVazio("Nenhum tema disponível corresponde aos filtros. Você também pode consultar seu histórico abaixo.");
        ligarAcoesTemas();
    };
    document.getElementById("buscaTema").addEventListener("input", atualizar);
    document.getElementById("filtroArea").addEventListener("change", atualizar);
    document.getElementById("limparFiltros").addEventListener("click", () => { document.getElementById("buscaTema").value = ""; document.getElementById("filtroArea").value = ""; atualizar(); });
    atualizar();
    ligarAcoesHistorico();
}

function historicoAlunoHTML(lista) {
    if (!lista.length) return estadoVazio("Você ainda não realizou inscrições. Os pedidos e seus resultados aparecerão aqui.");
    return lista.map(i => {
        const tema = temaPorId(i.temaId);
        const titulo = tema?.titulo || "Tema removido";
        const podeCancelar = i.status === "pendente";
        return `<div class="history-item"><div><h3>${textoSeguro(titulo)}</h3><div class="card-meta">${statusPill(i.status)}<span class="pill">Solicitado em ${dataFormatada(i.solicitadoEm)}</span></div>${i.atualizadoEm && i.atualizadoEm !== i.solicitadoEm ? `<p class="helper">Última atualização: ${dataFormatada(i.atualizadoEm)}</p>` : ""}${i.observacao ? `<p>${textoSeguro(i.observacao)}</p>` : ""}</div><div class="actions">${podeCancelar ? `<button class="btn btn-danger btn-small" data-action="cancelar-inscricao" data-id="${textoSeguro(i.id)}">Cancelar solicitação</button>` : ""}</div></div>`;
    }).join("");
}
function ligarAcoesHistorico() {
    document.querySelectorAll('[data-action="cancelar-inscricao"]').forEach(botao => botao.addEventListener("click", () => {
        const inscricao = inscricoes.find(i => i.id === botao.dataset.id && i.alunoId === usuario_logado.id);
        if (!inscricao || inscricao.status !== "pendente") return;
        if (!confirm("Cancelar esta solicitação? Ela continuará registrada no histórico como cancelada.")) return;
        inscricao.status = "cancelada"; inscricao.atualizadoEm = agoraISO();
        if (salvar()) tela_aluno();
    }));
}
function ligarAcoesTemas() {
    document.querySelectorAll('[data-action="inscrever"]').forEach(botao => botao.addEventListener("click", () => {
        const tema = temaPorId(botao.dataset.id);
        if (!tema || tema.status !== "aberta" || vagasRestantes(tema) <= 0) return alert("Este tema não possui vagas disponíveis no momento.");
        if (inscricaoAtivaDoAluno(tema.id, usuario_logado.id)) return alert("Você já possui uma inscrição pendente ou aceita para este tema.");
        inscricoes.push({ id: novoId("insc-"), temaId: tema.id, alunoId: usuario_logado.id, status: "pendente", solicitadoEm: agoraISO(), atualizadoEm: agoraISO(), observacao: "" });
        if (salvar()) tela_aluno();
    }));
    document.querySelectorAll('[data-action="editar-tema"]').forEach(botao => botao.addEventListener("click", () => tela_form_tema(botao.dataset.id)));
    document.querySelectorAll('[data-action="excluir-tema"]').forEach(botao => botao.addEventListener("click", () => excluirTema(botao.dataset.id)));
}

function tela_docente() {
    const meusTemas = temas.filter(t => t.docenteId === usuario_logado.id);
    const minhasPendentes = inscricoes.filter(i => i.status === "pendente" && temaPorId(i.temaId)?.docenteId === usuario_logado.id).length;
    const vagas = meusTemas.reduce((total, t) => total + vagasRestantes(t), 0);
    mudarTela(`${cabecalho(`Olá, ${usuario_logado.nome}`, "Gerencie seus temas, acompanhe solicitações e mantenha as vagas atualizadas.", botaoSair())}
        <div class="stats"><div class="stat-card"><span>Temas cadastrados</span><strong>${meusTemas.length}</strong></div><div class="stat-card"><span>Solicitações pendentes</span><strong>${minhasPendentes}</strong></div><div class="stat-card"><span>Vagas disponíveis</span><strong>${vagas}</strong></div></div>
        <div class="actions" style="margin:0 0 22px"><button class="btn btn-primary" id="novoTema">+ Cadastrar tema</button><button class="btn btn-secondary" id="verInscricoes">Ver solicitações</button><button class="btn btn-secondary" id="verTemas">Gerenciar meus temas</button></div>
        <section class="panel"><div class="section-title"><h2>Visão geral dos seus temas</h2></div><div class="card-grid">${meusTemas.length ? meusTemas.map(t => cardTema(t, { gerenciar: true })).join("") : estadoVazio("Você ainda não cadastrou temas.")}</div></section>
        <section class="panel"><div class="section-title"><h2>Solicitações recentes</h2></div>${htmlSolicitacoesDocente(true)}</section>`);
    ligarSair();
    document.getElementById("novoTema").addEventListener("click", () => tela_form_tema());
    document.getElementById("verInscricoes").addEventListener("click", tela_docente_inscricoes);
    document.getElementById("verTemas").addEventListener("click", tela_docente_temas);
    ligarAcoesTemas(); ligarAcoesInscricoes();
}

function opcoesAreas(areaAtual = "") {
    const areas = [...new Set([...temas.map(t => t.area), "Engenharia de Software", "Inteligência Artificial", "Cibersegurança"])].sort((a, b) => a.localeCompare(b, "pt-BR"));
    return areas.map(area => `<option value="${textoSeguro(area)}" ${area === areaAtual ? "selected" : ""}>${textoSeguro(area)}</option>`).join("");
}
function tela_form_tema(id = null) {
    const tema = id ? temaPorId(id) : null;
    if (tema && tema.docenteId !== usuario_logado.id) return alert("Você só pode editar seus próprios temas.");
    mudarTela(`${cabecalho(tema ? "Editar tema" : "Cadastrar novo tema", "Preencha as informações do tema de TCC.", `<button class="btn btn-secondary" id="botaoVoltar" type="button">Voltar</button>${botaoSair()}`)}
        <section class="panel"><form id="formTema"><div class="inline-form">
        <div class="field"><label for="area">Área de conhecimento</label><input id="area" name="area" list="listaAreas" value="${textoSeguro(tema?.area || "")}" required placeholder="Ex.: Inteligência Artificial"><datalist id="listaAreas">${opcoesAreas()}</datalist></div>
        <div class="field"><label for="vagas">Quantidade de vagas</label><input id="vagas" name="vagas" type="number" min="1" step="1" value="${tema ? Number(tema.vagas) : 1}" required></div>
        <div class="field full"><label for="titulo">Título do tema</label><input id="titulo" name="titulo" maxlength="160" value="${textoSeguro(tema?.titulo || "")}" required></div>
        <div class="field full"><label for="desc">Descrição</label><textarea id="desc" name="desc" maxlength="3000" required placeholder="Descreva a proposta, os objetivos e o escopo do tema...">${textoSeguro(tema?.desc || "")}</textarea></div>
        </div><p class="helper">Vagas já ocupadas: ${tema ? vagasOcupadas(tema.id) : 0}. Não é possível definir menos vagas do que o número de inscrições aceitas.</p><div class="actions"><button class="btn btn-primary" type="submit">${tema ? "Salvar alterações" : "Publicar tema"}</button><button class="btn btn-secondary" id="cancelarFormulario" type="button">Cancelar</button></div></form></section>`);
    ligarSair();
    const voltar = () => usuario_logado.cargo === "docente" ? tela_docente_temas() : render();
    document.getElementById("botaoVoltar").addEventListener("click", voltar);
    document.getElementById("cancelarFormulario").addEventListener("click", voltar);
    document.getElementById("formTema").addEventListener("submit", evento => {
        evento.preventDefault();
        const area = document.getElementById("area").value.trim();
        const titulo = document.getElementById("titulo").value.trim();
        const desc = document.getElementById("desc").value.trim();
        const vagas = Number(document.getElementById("vagas").value);
        if (!area || !titulo || !desc || !Number.isInteger(vagas) || vagas < 1) return alert("Preencha todos os campos e informe pelo menos uma vaga inteira.");
        if (tema && vagas < vagasOcupadas(tema.id)) return alert(`Este tema já possui ${vagasOcupadas(tema.id)} inscrição(ões) aceita(s). A quantidade de vagas não pode ser menor que esse número.`);
        if (tema) {
            Object.assign(tema, { area, titulo, desc, vagas, status: vagasOcupadas(tema.id) >= vagas ? "encerrada" : "aberta" });
        } else {
            temas.push({ id: novoId("tema-"), area, titulo, desc, docenteId: usuario_logado.id, vagas, status: "aberta", criadoEm: agoraISO() });
        }
        if (salvar()) tela_docente_temas();
    });
}

function excluirTema(id) {
    const tema = temaPorId(id);
    if (!tema || tema.docenteId !== usuario_logado.id) return;
    const historico = inscricoesDoTema(id);
    if (historico.length) return alert("Este tema possui solicitações registradas. Para preservar o histórico acadêmico, não é possível excluí-lo. Você pode continuar editando suas informações; o histórico das solicitações será mantido.");
    if (!confirm(`Excluir o tema “${tema.titulo}”? Esta ação não pode ser desfeita.`)) return;
    temas = temas.filter(t => t.id !== id);
    if (salvar()) tela_docente_temas();
}

function tela_docente_temas() {
    telaAnteriorDocente = "temas";
    const meus = temas.filter(t => t.docenteId === usuario_logado.id);
    mudarTela(`${cabecalho("Gerenciar meus temas", "Pesquise, filtre, edite ou exclua temas sem inscrições associadas.", `<button class="btn btn-secondary" id="botaoVoltar" type="button">Voltar</button>${botaoSair()}`)}
        <section class="panel"><div class="filters"><div class="field"><label for="buscaTema">Pesquisar</label><input id="buscaTema" type="search" placeholder="Título ou descrição"></div><div class="field"><label for="filtroArea">Área</label><select id="filtroArea"><option value="">Todas as áreas</option>${opcoesAreas()}</select></div><button class="btn btn-primary" id="novoTema" type="button">+ Novo tema</button></div><div id="listaTemas" class="card-grid"></div></section>`);
    ligarSair(); ligarVoltar(render);
    document.getElementById("novoTema").addEventListener("click", () => tela_form_tema());
    const atualizar = () => {
        const termo = document.getElementById("buscaTema").value.trim().toLocaleLowerCase("pt-BR");
        const area = document.getElementById("filtroArea").value;
        const filtrados = meus.filter(t => (!area || t.area === area) && (!termo || `${t.titulo} ${t.desc} ${t.area}`.toLocaleLowerCase("pt-BR").includes(termo)));
        document.getElementById("listaTemas").innerHTML = filtrados.length ? filtrados.map(t => cardTema(t, { gerenciar: true })).join("") : estadoVazio("Nenhum tema encontrado.");
        ligarAcoesTemas();
    };
    document.getElementById("buscaTema").addEventListener("input", atualizar);
    document.getElementById("filtroArea").addEventListener("change", atualizar);
    atualizar();
}

function htmlSolicitacoesDocente(apenasRecentes = false) {
    let lista = inscricoes.filter(i => i.status === "pendente" && temaPorId(i.temaId)?.docenteId === usuario_logado.id).sort((a, b) => new Date(b.solicitadoEm) - new Date(a.solicitadoEm));
    if (apenasRecentes) lista = lista.slice(0, 4);
    if (!lista.length) return estadoVazio("Não há solicitações pendentes para seus temas.");
    return `<div class="card-grid">${lista.map(i => {
        const tema = temaPorId(i.temaId);
        return `<article class="card"><div class="card-top"><h3>${textoSeguro(tema?.titulo || "Tema não encontrado")}</h3>${statusPill(i.status)}</div><p><strong>Aluno(a):</strong> ${textoSeguro(nomeUsuario(i.alunoId))}</p><p class="helper">Solicitado em ${dataFormatada(i.solicitadoEm)} · ${tema ? vagasRestantes(tema) : 0} vaga(s) restante(s)</p><div class="actions"><button class="btn btn-success btn-small" data-action="aceitar-inscricao" data-id="${textoSeguro(i.id)}">Aceitar</button><button class="btn btn-danger btn-small" data-action="rejeitar-inscricao" data-id="${textoSeguro(i.id)}">Recusar</button></div></article>`;
    }).join("")}</div>`;
}
function tela_docente_inscricoes() {
    mudarTela(`${cabecalho("Solicitações de inscrição", "Analise os pedidos dos alunos para os temas sob sua orientação.", `<button class="btn btn-secondary" id="botaoVoltar" type="button">Voltar</button>${botaoSair()}`)}<section class="panel"><div id="listaSolicitacoes">${htmlSolicitacoesDocente()}</div></section>
        <section class="panel"><h2>Histórico das inscrições dos seus temas</h2><div id="historicoDocente">${historicoDocenteHTML()}</div></section>`);
    ligarSair(); ligarVoltar(render); ligarAcoesInscricoes();
}
function historicoDocenteHTML() {
    const lista = inscricoes.filter(i => temaPorId(i.temaId)?.docenteId === usuario_logado.id && i.status !== "pendente").sort((a, b) => new Date(b.atualizadoEm || b.solicitadoEm) - new Date(a.atualizadoEm || a.solicitadoEm));
    if (!lista.length) return estadoVazio("Ainda não há decisões registradas.");
    return lista.map(i => `<div class="history-item"><div><h3>${textoSeguro(temaPorId(i.temaId)?.titulo || "Tema removido")}</h3><p>${textoSeguro(nomeUsuario(i.alunoId))}</p><div class="card-meta">${statusPill(i.status)}<span class="pill">Pedido em ${dataFormatada(i.solicitadoEm)}</span><span class="pill">Atualizado em ${dataFormatada(i.atualizadoEm)}</span></div></div></div>`).join("");
}
function ligarAcoesInscricoes() {
    document.querySelectorAll('[data-action="aceitar-inscricao"]').forEach(botao => botao.addEventListener("click", () => {
        const i = inscricoes.find(item => item.id === botao.dataset.id);
        const tema = i && temaPorId(i.temaId);
        if (!i || !tema || i.status !== "pendente" || tema.docenteId !== usuario_logado.id) return;
        if (vagasRestantes(tema) <= 0) return alert("Não há vagas disponíveis para aceitar esta inscrição.");
        const duplicada = inscricoes.some(item => item.id !== i.id && item.temaId === i.temaId && item.alunoId === i.alunoId && item.status === "aceita");
        if (duplicada) return alert("Este aluno já possui uma inscrição aceita para esse tema.");
        i.status = "aceita"; i.atualizadoEm = agoraISO();
        if (vagasRestantes(tema) === 0) tema.status = "encerrada";
        if (salvar()) tela_docente_inscricoes();
    }));
    document.querySelectorAll('[data-action="rejeitar-inscricao"]').forEach(botao => botao.addEventListener("click", () => {
        const i = inscricoes.find(item => item.id === botao.dataset.id);
        const tema = i && temaPorId(i.temaId);
        if (!i || i.status !== "pendente" || tema?.docenteId !== usuario_logado.id) return;
        if (!confirm("Recusar esta solicitação? A decisão ficará registrada no histórico.")) return;
        i.status = "rejeitada"; i.atualizadoEm = agoraISO();
        if (salvar()) tela_docente_inscricoes();
    }));
}

document.getElementById("linkInicio")?.addEventListener("click", evento => { evento.preventDefault(); if (usuario_logado) render(); });
carregar();
render();
