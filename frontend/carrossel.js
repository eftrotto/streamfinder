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

// Retângulo cinza com brilho que ocupa o lugar do pôster enquanto a API responde
function criarEsqueleto() {
    const item = document.createElement("li");
    item.className = "carrossel-item";
    const bloco = document.createElement("div");
    bloco.className = "carrossel-esqueleto esqueleto";
    item.append(bloco);
    return item;
}

function esconderCarrossel() {
    trilho.replaceChildren();
    secaoPopulares.hidden = true;
}

async function carregarPopulares() {
    // Já mostra a seção com pôsteres "fantasma" (parados, sem a esteira) pra página não ficar com um buraco
    trilho.classList.add("carregando");
    trilho.replaceChildren(...Array.from({ length: 12 }, criarEsqueleto));
    secaoPopulares.setAttribute("aria-busy", "true");
    secaoPopulares.hidden = false;

    try {
        const response = await fetch(`${API_URL}/populares`);
        if (!response.ok) throw new Error("Erro na requisição");

        const filmes = await response.json();
        if (filmes.length === 0) {
            esconderCarrossel();
            return;
        }

        // a lista aparece 3 vezes: ao andar 1/3 do trilho, volta exatamente ao começo.
        // 3 cópias cobrem telas de até 2x a largura de uma cópia (monitores ultrawide incluídos).
        trilho.replaceChildren(
            ...filmes.map((f) => criarItem(f)),
            ...filmes.map((f) => criarItem(f, true)),
            ...filmes.map((f) => criarItem(f, true))
        );
        trilho.style.setProperty("--duracao", `${filmes.length * SEGUNDOS_POR_POSTER}s`);
        trilho.classList.remove("carregando");
    } catch (erro) {
        // Falhou? A home continua só com a busca, a esteira simplesmente some.
        console.error("Erro ao carregar populares:", erro);
        esconderCarrossel();
    } finally {
        secaoPopulares.removeAttribute("aria-busy");
    }
}

// No celular não existe "passar o mouse": segurar o dedo na esteira pausa, soltar volta a andar.
// (pointercancel acontece quando o dedo vira rolagem da página, então também retoma.)
const janela = trilho.parentElement;
janela.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") janela.classList.add("pausado");
});
for (const evento of ["pointerup", "pointercancel"]) {
    janela.addEventListener(evento, () => janela.classList.remove("pausado"));
}

carregarPopulares();
