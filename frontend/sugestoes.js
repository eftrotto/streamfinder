// Sugestões de filmes enquanto o usuário digita na home (API_URL vem do config.js).
// Clicar numa sugestão abre o filme exato (?id=); Enter sem escolher continua buscando pelo texto (?busca=).

const campo = document.getElementById("movie-input");
const lista = document.getElementById("sugestoes");

const ESPERA_MS = 250; // só consulta a API quando o usuário para de digitar por um instante

let temporizador;
let pedidoAtual = 0; // evita que uma resposta antiga sobrescreva uma mais nova
let indiceAtivo = -1;

function fechar() {
    lista.hidden = true;
    lista.replaceChildren();
    campo.setAttribute("aria-expanded", "false");
    campo.removeAttribute("aria-activedescendant");
    indiceAtivo = -1;
}

function criarSugestao(filme, posicao) {
    const item = document.createElement("li");
    item.id = `sugestao-${posicao}`;
    item.setAttribute("role", "option");

    const link = document.createElement("a");
    link.href = `filme.html?id=${encodeURIComponent(filme.id)}`;
    link.tabIndex = -1; // o foco fica no campo; setas e Enter fazem a navegação

    if (filme.poster) {
        const img = document.createElement("img");
        img.src = filme.poster;
        img.alt = "";
        link.append(img);
    } else {
        const vazio = document.createElement("span");
        vazio.className = "sugestao-sem-poster";
        link.append(vazio);
    }

    const titulo = document.createElement("span");
    titulo.className = "sugestao-titulo";
    titulo.textContent = filme.titulo;
    link.append(titulo);

    if (filme.ano) {
        const ano = document.createElement("span");
        ano.className = "sugestao-ano";
        ano.textContent = filme.ano;
        link.append(ano);
    }

    item.append(link);
    return item;
}

function mostrar(filmes) {
    if (filmes.length === 0) {
        fechar();
        return;
    }
    lista.replaceChildren(...filmes.map(criarSugestao));
    lista.hidden = false;
    campo.setAttribute("aria-expanded", "true");
    indiceAtivo = -1;
}

async function buscarSugestoes() {
    const texto = campo.value.trim();
    if (texto.length < 2) {
        fechar();
        return;
    }

    const meuPedido = ++pedidoAtual;
    try {
        const response = await fetch(`${API_URL}/sugestoes?q=${encodeURIComponent(texto)}`);
        if (!response.ok) throw new Error("Erro na requisição");
        const filmes = await response.json();
        if (meuPedido === pedidoAtual) mostrar(filmes); // ignora resposta de uma digitação antiga
    } catch (erro) {
        // Sem sugestões a busca normal continua funcionando
        console.error("Erro ao buscar sugestões:", erro);
        fechar();
    }
}

function marcar(indice) {
    const itens = lista.children;
    if (indiceAtivo >= 0) itens[indiceAtivo].removeAttribute("aria-selected");
    indiceAtivo = indice;
    if (indice >= 0) {
        itens[indice].setAttribute("aria-selected", "true");
        campo.setAttribute("aria-activedescendant", itens[indice].id);
    } else {
        campo.removeAttribute("aria-activedescendant");
    }
}

campo.addEventListener("input", () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(buscarSugestoes, ESPERA_MS);
});

campo.addEventListener("keydown", (e) => {
    if (lista.hidden) return;
    const total = lista.children.length;

    if (e.key === "ArrowDown") {
        e.preventDefault();
        marcar((indiceAtivo + 1) % total);
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        marcar((indiceAtivo - 1 + total) % total);
    } else if (e.key === "Enter" && indiceAtivo >= 0) {
        e.preventDefault(); // abre o filme escolhido em vez de enviar o texto digitado
        lista.children[indiceAtivo].querySelector("a").click();
    } else if (e.key === "Escape") {
        fechar();
    }
});

// Clicou fora da busca: fecha a lista
document.addEventListener("click", (e) => {
    if (!e.target.closest("#busca-wrapper")) fechar();
});
