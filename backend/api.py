import logging
import os
import re

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

    return montar_filme(filme)

# Página do filme aberta a partir de um id exato (ex: clique no carrossel de populares)
@app.get("/filme/{id_filme}")
def filme_por_id(id_filme: int):
    return montar_filme(tmdb_get(f"/movie/{id_filme}", language="pt-BR"))

# Os 10 filmes mais populares da semana (para o carrossel da home)
@app.get("/populares")
def populares():
    resposta = tmdb_get("/trending/movie/week", language="pt-BR")
    filmes = [f for f in resposta.get("results", []) if f.get("poster_path")]  # carrossel precisa de pôster

    return [
        {
            "id": f["id"],
            "titulo": f["title"],
            "ano": (f.get("release_date") or "")[:4],
            "poster": f"{URL_IMAGEM}{f['poster_path']}",
        }
        for f in filmes[:10]
    ]

# Sugestões enquanto o usuário digita (dropdown da home): até 6 filmes, com miniatura
@app.get("/sugestoes")
def sugestoes(q: str = ""):
    q = q.strip()
    if len(q) < 2:
        return []

    resposta = tmdb_get("/search/movie", query=q, include_adult="false", language="pt-BR", page=1)

    return [
        {
            "id": f["id"],
            "titulo": f["title"],
            "ano": (f.get("release_date") or "")[:4],
            "poster": f"{URL_LOGO}{f['poster_path']}" if f.get("poster_path") else None,
        }
        for f in resposta.get("results", [])[:6]
    ]

# Transforma um filme do TMDB no JSON que o front usa (a mesma forma em /busca e /filme)
def montar_filme(filme):
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
        # ordena pela prioridade do TMDB (menor = mais relevante)
        lista = sorted(regiao.get(tipo, []), key=lambda p: p.get("display_priority", 999))

        # variantes do mesmo serviço ("Netflix" e "Netflix Standard with Ads") viram um só:
        # fica a primeira, que é a de maior prioridade
        vistos = {}
        for p in lista:
            nome = nome_do_servico(p["provider_name"])
            if nome.lower() not in vistos:
                vistos[nome.lower()] = {
                    "nome": nome,
                    "logo": f"{URL_LOGO}{p['logo_path']}" if p.get("logo_path") else None,
                }
        provedores[tipo] = list(vistos.values())

    return provedores

# Tira do nome o que só indica o plano ou o canal: "Netflix Standard with Ads" -> "Netflix",
# "Max Amazon Channel" -> "Max"
SUFIXOS_PLANO = re.compile(
    r"\s+(?:(?:standard|basic|premium)\s+)?with\s+ads$"
    r"|\s+(?:amazon|apple\s+tv|roku\s+premium|youtube\s+premium)\s+channel$",
    re.IGNORECASE,
)

def nome_do_servico(nome):
    return SUFIXOS_PLANO.sub("", nome).strip() or nome
