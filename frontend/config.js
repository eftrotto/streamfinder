// Endereço da API, usado por todas as páginas.
// No seu computador (localhost) usa o backend local; no site publicado, a API fica em "/api" (mesmo endereço do site).
const API_URL = ["localhost", "127.0.0.1"].includes(location.hostname)
    ? "http://127.0.0.1:8000"
    : "/api";
