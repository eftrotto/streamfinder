// Página resultados.html: lê ?busca=, mostra todos os filmes que combinam numa grade de pôsteres
// (20 por vez, com "Ver mais"). API_URL vem do config.js.

const titulo = document.getElementById("resultados-titulo");
const grade = document.getElementById("grade");
const aviso = document.getElementById("resultados-aviso");
const botaoVerMais = document.getElementById("ver-mais");

const busca = (new URLSearchParams(location.search).get("busca") || "").trim();
let paginaAtual = 0;

function criarCartao(filme) {
    const item = document.createElement("li");
    item.className = "grade-item";

    const link = document.createElement("a");
    link.href = `filme.html?id=${encodeURIComponent(filme.id)}`;

    if (filme.poster) {
        const img = document.createElement("img");
        img.src = filme.poster;
        img.alt = `Pôster de ${filme.titulo}`;
        img.loading = "lazy";
        link.append(img);
    } else {
        const vazio = document.createElement("div");
        vazio.className = "grade-sem-poster";
        vazio.textContent = "Sem pôster";
        link.append(vazio);
    }

    const nome = document.createElement("span");
    nome.className = "grade-titulo";
    nome.textContent = filme.titulo;

    const ano = document.createElement("span");
    ano.className = "grade-ano";
    ano.textContent = filme.ano;

    link.append(nome, ano);
    item.append(link);
    return item;
}

function criarEsqueleto() {
    const item = document.createElement("li");
    item.className = "grade-item grade-esqueleto";
    const bloco = document.createElement("div");
    bloco.className = "esqueleto grade-esqueleto-poster";
    item.append(bloco);
    return item;
}

function mostrarAviso(texto) {
    aviso.textContent = texto;
    aviso.hidden = false;
}

async function carregarPagina() {
    const pagina = paginaAtual + 1;
    botaoVerMais.hidden = true;
    aviso.hidden = true;

    // pôsteres fantasma ocupam o lugar até a resposta chegar
    const fantasmas = Array.from({ length: 8 }, criarEsqueleto);
    grade.append(...fantasmas);

    try {
        const response = await fetch(`${API_URL}/pesquisa?q=${encodeURIComponent(busca)}&pagina=${pagina}`);
        if (!response.ok) throw new Error("Erro na requisição");
        const dados = await response.json();

        fantasmas.forEach((f) => f.remove());
        grade.append(...dados.resultados.map(criarCartao));
        paginaAtual = dados.pagina;

        if (dados.total === 0) {
            mostrarAviso(`Não encontramos nenhum filme para "${busca}".`);
        } else {
            titulo.textContent = `${dados.total} ${dados.total === 1 ? "resultado" : "resultados"} para “${busca}”`;
            botaoVerMais.hidden = paginaAtual >= dados.total_paginas;
        }
    } catch (erro) {
        console.error("Erro ao buscar resultados:", erro);
        fantasmas.forEach((f) => f.remove());
        mostrarAviso("Algo deu errado. Tenta de novo.");
        botaoVerMais.hidden = paginaAtual === 0; // depois da 1ª página, o botão permite tentar de novo
    }
}

if (!busca) {
    titulo.textContent = "Nenhum filme informado";
    mostrarAviso("Volte e faça uma busca.");
} else {
    document.title = `${busca} - StreamFinder`;
    titulo.textContent = `Resultados para “${busca}”`;
    botaoVerMais.addEventListener("click", carregarPagina);
    carregarPagina();
}
