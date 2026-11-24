// Script da página filme.html: lê a URL (?busca=título ou ?id=número), consulta a API e mostra o card.
// (API_URL vem do config.js)

const resultsSection = document.getElementById("results");

// Nome de cada tipo de provedor, na ordem em que aparecem na tela
const ROTULOS = {
    flatrate: "Assinatura",
    rent: "Aluguel",
    buy: "Compra",
};

async function carregarFilme() {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    const busca = (params.get("busca") || "").trim();

    // ?id= (vem do carrossel) acha o filme exato; ?busca= (vem da barra) pega o 1º resultado
    let endereco;
    if (id) {
        endereco = `${API_URL}/filme/${encodeURIComponent(id)}`;
    } else if (busca) {
        endereco = `${API_URL}/busca/${encodeURIComponent(busca)}`;
    } else {
        mostrarTexto("Nenhum filme informado. Volte e faça uma busca.");
        return;
    }

    mostrarCarregando();

    try {
        const response = await fetch(endereco);

        // 404 = a API não achou o filme; a mensagem vem pronta em "detail"
        if (response.status === 404) {
            const erro = await response.json();
            mostrarTexto(erro.detail);
            return;
        }

        if (!response.ok) {
            throw new Error("Erro na requisição");
        }

        const data = await response.json();
        document.title = `${data.titulo} - StreamFinder`;
        renderizarResultado(data);

    } catch (erro) {
        console.error("Erro ao buscar filme:", erro);
        mostrarTexto("Algo deu errado. Tenta de novo.");
    }
}

// textContent (e não innerHTML) pra nunca interpretar o texto como HTML
function criarParagrafo(texto) {
    const p = document.createElement("p");
    p.textContent = texto;
    return p;
}

function mostrarTexto(texto) {
    resultsSection.replaceChildren(criarParagrafo(texto));
}

// Cria um elemento com classe e texto (sempre via textContent)
function criarElemento(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto) el.textContent = texto;
    return el;
}

// Card "fantasma" com o mesmo formato do card real, pra página não pular quando o filme chegar
function mostrarCarregando() {
    const info = criarElemento("div", "card-info");
    info.append(
        criarElemento("span", "so-leitor", "Buscando..."),
        criarElemento("div", "esqueleto esqueleto-titulo"),
        criarElemento("div", "esqueleto esqueleto-linha esqueleto-data"),
        criarElemento("div", "esqueleto esqueleto-linha"),
        criarElemento("div", "esqueleto esqueleto-linha"),
        criarElemento("div", "esqueleto esqueleto-linha esqueleto-curta"),
        criarElemento("div", "esqueleto esqueleto-logos")
    );

    const card = criarElemento("article", "card");
    card.append(criarElemento("div", "card-poster esqueleto"), info);
    resultsSection.replaceChildren(card);
}

// "2010-07-15" -> "15/07/2010"
function formatarData(iso) {
    if (!iso) return "Data de lançamento indisponível";
    const [ano, mes, dia] = iso.split("-");
    return `${dia}/${mes}/${ano}`;
}

function criarPoster(data) {
    if (!data.poster) {
        return criarElemento("div", "card-poster card-poster-vazio", "Sem pôster");
    }
    const img = document.createElement("img");
    img.className = "card-poster";
    img.src = data.poster;
    img.alt = `Pôster de ${data.titulo}`;
    return img;
}

// Logo do streaming (nome no tooltip). Sem logo, cai de volta pro nome em texto.
function criarLogoProvedor(provedor) {
    if (!provedor.logo) {
        return criarElemento("span", "chip", provedor.nome);
    }
    const img = document.createElement("img");
    img.className = "logo-provedor";
    img.src = provedor.logo;
    img.alt = provedor.nome;
    img.title = provedor.nome;
    img.loading = "lazy";
    return img;
}

function criarProvedores(provedores) {
    const bloco = criarElemento("div", "card-provedores");

    const tiposDisponiveis = Object.keys(ROTULOS).filter(
        (tipo) => provedores[tipo].length > 0
    );

    if (tiposDisponiveis.length === 0) {
        bloco.append(criarElemento("p", "card-aviso", "Não disponível em nenhum serviço no Brasil no momento."));
        return bloco;
    }

    for (const tipo of tiposDisponiveis) {
        const grupo = criarElemento("div", "card-grupo");
        grupo.append(criarElemento("span", "card-grupo-titulo", ROTULOS[tipo]));

        const chips = criarElemento("div", "chips");
        for (const provedor of provedores[tipo]) {
            chips.append(criarLogoProvedor(provedor));
        }
        grupo.append(chips);
        bloco.append(grupo);
    }
    return bloco;
}

// Nota média (0 a 10) em destaque + a nota de cada fonte (TMDB, IMDb, Rotten Tomatoes, Metacritic)
function criarNotas(notas) {
    const bloco = criarElemento("div", "notas");
    if (!notas || notas.fontes.length === 0) return bloco; // sem nota nenhuma: não mostra nada

    const media = criarElemento("div", "nota-media");
    media.append(
        criarElemento("span", "nota-media-valor", notas.media.toFixed(1)),
        criarElemento("span", "nota-media-legenda", notas.fontes.length > 1 ? `média de ${notas.fontes.length} fontes` : "nota")
    );
    bloco.append(media);

    const fontes = criarElemento("ul", "notas-fontes");
    for (const fonte of notas.fontes) {
        const item = criarElemento("li", "nota-fonte");
        item.append(criarElemento("span", "nota-fonte-nome", fonte.nome), criarElemento("span", "nota-fonte-valor", fonte.texto));
        fontes.append(item);
    }
    bloco.append(fontes);
    return bloco;
}

// Fileira de pôsteres de filmes parecidos (aparece embaixo do card, se a API devolver algum)
async function carregarParecidos(idFilme) {
    try {
        const response = await fetch(`${API_URL}/filme/${encodeURIComponent(idFilme)}/parecidos`);
        if (!response.ok) return;
        const filmes = await response.json();
        if (filmes.length === 0) return;

        const secao = criarElemento("section", "parecidos");
        secao.append(criarElemento("h3", "parecidos-titulo", "Filmes parecidos"));

        const lista = criarElemento("ul", "parecidos-lista");
        for (const filme of filmes) {
            const item = criarElemento("li", "parecidos-item");
            const link = document.createElement("a");
            link.href = `filme.html?id=${encodeURIComponent(filme.id)}`;
            link.title = filme.titulo;

            const img = document.createElement("img");
            img.src = filme.poster;
            img.alt = `Pôster de ${filme.titulo}`;
            img.loading = "lazy";

            link.append(img);
            item.append(link);
            lista.append(item);
        }
        secao.append(lista);
        resultsSection.append(secao);
    } catch (erro) {
        console.error("Erro ao carregar filmes parecidos:", erro); // sem parecidos a página continua completa
    }
}

function renderizarResultado(data) {
    const info = criarElemento("div", "card-info");
    info.append(
        criarElemento("h2", "card-titulo", data.titulo),
        criarElemento("p", "card-data", formatarData(data.data_lancamento)),
        criarNotas(data.notas),
        criarElemento("p", "card-sinopse", data.sinopse || "Sinopse indisponível."),
        criarProvedores(data.provedores)
    );

    const card = criarElemento("article", "card");
    card.append(criarPoster(data), info);

    resultsSection.replaceChildren(card);
    carregarParecidos(data.id);
}

carregarFilme();
