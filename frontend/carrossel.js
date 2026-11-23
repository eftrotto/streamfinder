// Esteira de pôsteres da home: só imagens, andando sozinha em loop (API_URL vem do config.js)

const secaoPopulares = document.getElementById("populares");
const trilho = document.getElementById("carrossel-trilho");

const SEGUNDOS_POR_POSTER = 4; // quanto maior, mais lenta a esteira

// Cada pôster vira um link pra página do filme (pelo id, pra abrir exatamente esse filme).
// clone = cópia só pra fechar o loop: fica escondida de leitor de tela e fora do Tab.
function criarItem(filme, clone = false) {
    const item = document.createElement("li");
    item.className = clone ? "carrossel-item carrossel-clone" : "carrossel-item";

    const link = document.createElement("a");
    link.href = `filme.html?id=${encodeURIComponent(filme.id)}`;
    link.title = filme.titulo; // nome só no tooltip, não aparece na tela

    const img = document.createElement("img");
    img.src = filme.poster;

    if (clone) {
        item.setAttribute("aria-hidden", "true");
        link.tabIndex = -1;
        img.alt = "";
    } else {
        img.alt = `Pôster de ${filme.titulo}`;
    }

    link.append(img);
    item.append(link);
    return item;
}

async function carregarPopulares() {
    try {
        const response = await fetch(`${API_URL}/populares`);
        if (!response.ok) throw new Error("Erro na requisição");

        const filmes = await response.json();
        if (filmes.length === 0) return;

        // a lista aparece 3 vezes: ao andar 1/3 do trilho, volta exatamente ao começo.
        // 3 cópias cobrem telas de até 2x a largura de uma cópia (monitores ultrawide incluídos).
        trilho.replaceChildren(
            ...filmes.map((f) => criarItem(f)),
            ...filmes.map((f) => criarItem(f, true)),
            ...filmes.map((f) => criarItem(f, true))
        );
        trilho.style.setProperty("--duracao", `${filmes.length * SEGUNDOS_POR_POSTER}s`);
        secaoPopulares.hidden = false;
    } catch (erro) {
        // Falhou? A home continua só com a busca, a esteira simplesmente não aparece.
        console.error("Erro ao carregar populares:", erro);
    }
}

carregarPopulares();
