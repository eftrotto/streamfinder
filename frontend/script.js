// Endereço da API. Ao publicar o backend, troque só esta linha.
const API_URL = "http://127.0.0.1:8000";

const form = document.getElementById("search-form");
const input = document.getElementById("movie-input");
const resultsSection = document.getElementById("results");

// Nome de cada tipo de provedor, na ordem em que aparecem na tela
const ROTULOS = {
    flatrate: "Assinatura",
    rent: "Aluguel",
    buy: "Compra",
};

form.addEventListener("submit", async (event) => {
    event.preventDefault(); // impede o form de recarregar a página (comportamento padrão do HTML)

    const filme = input.value.trim();
    if (!filme) return;

    try {
        const response = await fetch(`${API_URL}/busca/${encodeURIComponent(filme)}`);

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
        renderizarResultado(data);

    } catch (erro) {
        console.error("Erro ao buscar filme:", erro);
        mostrarTexto("Algo deu errado. Tenta de novo.");
    }
});

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

function renderizarResultado(data) {
    const info = criarElemento("div", "card-info");
    info.append(
        criarElemento("h2", "card-titulo", data.titulo),
        criarElemento("p", "card-data", formatarData(data.data_lancamento)),
        criarElemento("p", "card-sinopse", data.sinopse || "Sinopse indisponível."),
        criarProvedores(data.provedores)
    );

    const card = criarElemento("article", "card");
    card.append(criarPoster(data), info);

    resultsSection.replaceChildren(card);
}
