import logging
import os

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

URL_TMDB = "https://api.themoviedb.org/3"
URL_IMAGEM = "https://image.tmdb.org/t/p/w500"  # poster_path do TMDB é só o final da URL
URL_LOGO = "https://image.tmdb.org/t/p/w92"  # logo_path dos provedores (imagem pequena basta)
REGIAO = "BR"
TIMEOUT = 10  # segundos de espera por resposta do TMDB

logger = logging.getLogger(__name__)

headers = {
    "accept": "application/json",
    "Authorization": f"Bearer {os.getenv('TMDB_TOKEN', '')}"
}

app = FastAPI()

#Enable CORS - para conseguir requisições de ambas as portas
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # em produção, troque "*" pela URL real do seu frontend
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Testando api"}

# O ":path" deixa o título conter "/" (ex: "Face/Off") sem quebrar a rota
# Rota "def" (e não "async def"): o FastAPI roda em thread separada e o requests bloqueante não trava o servidor
@app.get("/busca/{user_busca:path}")
def read_item(user_busca: str):
    filme = busca_filme_tmdb(user_busca)

    if not filme:
        raise HTTPException(status_code=404, detail=f"Não encontramos o filme '{user_busca}'.")

    poster = filme.get("poster_path")

    return {
        "titulo": filme["title"],
        "ano": (filme.get("release_date") or "")[:4],
        "data_lancamento": filme.get("release_date") or "",  # "AAAA-MM-DD" (ou vazio)
        "sinopse": filme.get("overview") or "", # or = fallback
        "poster": f"{URL_IMAGEM}{poster}" if poster else None,
        "provedores": provider_pelo_id(filme["id"]),
    }

# Faz um GET no TMDB. Qualquer falha (token inválido, timeout, TMDB fora do ar) vira erro 502
def tmdb_get(caminho, **params):
    try:
        resposta = requests.get(f"{URL_TMDB}{caminho}", headers=headers, params=params, timeout=TIMEOUT)
        resposta.raise_for_status()
        return resposta.json()
    except requests.RequestException as erro:
        logger.error("Falha ao consultar o TMDB em %s: %s", caminho, erro)
        raise HTTPException(status_code=502, detail="Não foi possível consultar o TMDB agora.")

# Pegar oq o usuario digitou e buscar no TMDB (devolve o primeiro resultado, ou None)
def busca_filme_tmdb(filme_procurado):
    # params= cuida de codificar o título (&, #, ? etc.) na URL
    resposta = tmdb_get("/search/movie", query=filme_procurado, include_adult="false", language="pt-BR", page=1)
    resultados = resposta.get("results")

    if not resultados:
        return None

    return resultados[0]

# Devolve os provedores separados por tipo: assinatura (flatrate), aluguel (rent) e compra (buy)
def provider_pelo_id(id_filme):
    resposta = tmdb_get(f"/movie/{id_filme}/watch/providers")
    regiao = resposta.get("results", {}).get(REGIAO, {})

    provedores = {}
    for tipo in ("flatrate", "rent", "buy"):
        # ordena pela prioridade do TMDB (menor = mais relevante), sem descartar ninguém
        lista = sorted(regiao.get(tipo, []), key=lambda p: p.get("display_priority", 999))
        provedores[tipo] = [
            {
                "nome": p["provider_name"],
                "logo": f"{URL_LOGO}{p['logo_path']}" if p.get("logo_path") else None,
            }
            for p in lista
        ]

    return provedores
