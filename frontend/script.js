const form = document.getElementById("search-form");
const input = document.getElementById("movie-input");
const resultsSection = document.getElementById("results");

form.addEventListener("submit", async (event) => {
    event.preventDefault(); // impede o form de recarregar a página (comportamento padrão do HTML)

    const filme = input.value.trim();
    if (!filme) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/busca/${encodeURIComponent(filme)}`);
        
        if (!response.ok) {
            throw new Error("Erro na requisição");
        }

        const data = await response.json();
        renderizarResultado(data);

    } catch (erro) {
        console.error("Erro ao buscar filme:", erro);
        resultsSection.innerHTML = `<p>Algo deu errado. Tenta de novo.</p>`;
    }
});

function renderizarResultado(data) {
    resultsSection.innerHTML = `<p>${data.message}</p>`;
}