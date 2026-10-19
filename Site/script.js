let usuario_logado = null;

function render(){
    if (usuario_logado === null){
        tela_login();
    } else if (usuario_logado.cargo === "docente"){
        tela_docente();
    } else if (usuario_logado.cargo === "aluno"){
        tela_aluno();
    }
}

function tela_login(){
    const tela = document.getElementById("tela");

    tela.innerHTML = `
    <h1>Login</h1>
    <div><input type="text" id="campologin" placeholder="Digite seu Login"></div>
    <div><button id="botaoOK">OK</button></div>
    `

    document.getElementById("botaoOK").addEventListener("click", () => {
        const login = document.getElementById("campologin").value;
        const login_existe = usuarios.find(usuario => usuario.id === login);

        if (login_existe){
            usuario_logado = login_existe;
            render();
        } else {
            alert("LOGIN NÃO EXISTE!");
        }
    });
    
}

function tela_aluno(){
    const tela = document.getElementById("tela");

    tela.innerHTML = `
    <h2>Seja bem-vindo(a), ${usuario_logado.nome}</h2>
    <div><button id="botaoSAIR">Sair</button></div>
    <h3>Aqui estão os suas inscrições</h3>
    `

    document.getElementById("botaoSAIR").addEventListener("click", () => {
        usuario_logado = null;
        render();
    })
}

function tela_docente(){
    const tela = document.getElementById("tela");

    tela.innerHTML = 
    `
    <div><button id="botaoSAIR">Sair</button></div>
    <h2>Seja bem-vindo(a), ${usuario_logado.nome}</h2>
    <div><button id ="cadastrartemas">Cadastrar temas</button></div>
    <div><button id ="temasativos">Temas ativos</button></div>
    `

    document.getElementById("botaoSAIR").addEventListener("click", () => {
        usuario_logado = null;
        render();
    })

    document.getElementById("cadastrartemas").addEventListener("click", () => {
        tela_cadastro_temas();
    })

    document.getElementById("temasativos").addEventListener("click", () => {
        tela_docente_temas();
    })
}

function tela_cadastro_temas(){
    const tela = document.getElementById("tela");

    tela.innerHTML =
    `
    <div><button id="botaovoltar">Voltar</button></div>
    <select id="area">
        <option value="Engenharia de Software">Engenharia de Software</option>
        <option value="Inteligência Artificial">Inteligência Artificial</option>
        <option value="Cibersegurança">Cibersegurança</option>
    </select>

    <div class="info">
    <p>Título do Tema</p>
    <input type="text" id="titulo">
    </div>
    <div class="info">
    <p>Descrição</p>
    <textarea id="desc" rows="5" placeholder="Descreva o tema..."></textarea>
    </div>
    <div class="info">
    <p>Quantidade de Vagas</p>
    <input type="number" id="vagas">
    </div>

    <div><button id="botaopublicar">Publicar</button></div>
    `

    document.getElementById("botaopublicar").addEventListener("click", () => {
        const area = document.getElementById("area").value;
        const titulo = document.getElementById("titulo").value;
        const desc = document.getElementById("desc").value;
        const vagas = Number(document.getElementById("vagas").value);

        if ((!area) || (!titulo) || (!desc) || !(vagas > 0)){
            alert("Preencha todos os campos antes de publicar um tema!")
        } else {
            qte_temas++;
            temas.push(
                {id: `t${Date.now()}`, area: area, titulo: titulo, desc: desc, docenteId: usuario_logado.id, vagas: vagas, status: "aberta"}
            )
            salvar();
            alert("Tema publicado com sucesso!")
            console.log(temas);
        }
    })

    document.getElementById("botaovoltar").addEventListener("click", () => {
        render();
    })
}



function tela_docente_temas(){

    const tela = document.getElementById("tela");

    const meus_temas = temas.filter(tema => tema.docenteId === usuario_logado.id);

    const outros_temas = temas.filter(tema => tema.docenteId != usuario_logado.id);

    const html_meus_temas = meus_temas.map(tema => `
        <div class="card">
        <h3>${tema.titulo}</h3>
        <h5>${tema.area}</h5>
        <p>${tema.desc}</p>
        </div>
        `).join("");

    const html_outros_temas = outros_temas.map(tema => `
        <div class="card">
        <h3>${tema.titulo}</h3>
        <h5>${tema.area}</h5>
        <p>${tema.desc}</p>
        </div>
        `).join("");

    tela.innerHTML = 
    `
    <div>
    <button id="botaoSAIR">Sair</button>
    <button id="botaovoltar">Voltar</button>
    </div>
    <h2>Seja bem-vindo(a), ${usuario_logado.nome}</h2>

    <h3>Aqui estão os temas de TCC</h3>
    <h2>Seus temas</h2>
    ${html_meus_temas}

    <h2>Outro temas</h2>
    ${html_outros_temas}
    `

    document.getElementById("botaoSAIR").addEventListener("click", () => {
        usuario_logado = null;
        render();
    })

    document.getElementById("botaovoltar").addEventListener("click", () => {
        render();
    })

}

function salvar(){
    localStorage.setItem("temas", JSON.stringify(temas));
    localStorage.setItem("inscricoes", JSON.stringify(inscricoes));
}

function carregar(){
    const temas_salvos = localStorage.getItem("temas");
    const inscricoes_salvas = localStorage.getItem("inscricoes");

    if (temas_salvos){
        temas = JSON.parse(temas_salvos);
    }
    if (inscricoes_salvas){
        inscricoes = JSON.parse(inscricoes_salvas);
    }

    qte_temas = temas.length;
    qte_inscricoes = inscricoes.length;
}

carregar();
render();