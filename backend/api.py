import os
import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

URL_TMDB = "https://api.themoviedb.org/3"

headers = {
    "accept": "application/json",
    "Authorization": f"Bearer {os.getenv("TMDB_TOKEN")}"
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

@app.get("/busca/{user_busca}")
async def read_item(user_busca: str):
    provedores = busca_filme_tmdb(user_busca)

    # Retornando mensagem quando não tem provedor
    
    if not provedores:
        return {"message": f"Não encontramos onde assistir '{user_busca}' no momento."}
    
    return {"message": "O filme " + user_busca + " tem na " + ', '.join(provedores)}

# Pegar oq o usuario digitou e buscar no TMDB
def busca_filme_tmdb(filme_procurado):
    url = f"{URL_TMDB}/search/movie?query={filme_procurado}&include_adult=false&language=en-US&page=1"
    resposta = (requests.get(url, headers=headers)).json()
    
    if not resposta['results']:
        return set()  # Retorna um conjunto vazio se não houver resultados
    
    resposta_filme = resposta['results'][0]
    id_filme = resposta_filme['id']
    return provider_pelo_id(id_filme)

def provider_pelo_id(id_filme):
    url = f"{URL_TMDB}/movie/{id_filme}/watch/providers" 
    resposta = (requests.get(url, headers=headers)).json()
   
    provedores = set()

    if 'results' not in resposta or 'BR' not in resposta['results']:
        return provedores  # Retorna um conjunto vazio se não houver resultados para o Brasil

    if 'flatrate' in resposta['results']['BR']:
        lista_flatrates = resposta['results']['BR']['flatrate'] 
        for provider in lista_flatrates:
            if provider['display_priority'] <= 20:
                provedores.add(provider['provider_name'])
    
    if 'buy' in resposta['results']['BR']:
        lista_buy = resposta['results']['BR']['buy']
        for provider in lista_buy:
            if provider['display_priority'] <= 20:
                provedores.add(provider['provider_name'])
    
    if 'rent' in resposta['results']['BR']:
        lista_rent = resposta['results']['BR']['rent']
        for provider in lista_buy:
            if provider['display_priority'] <= 20:
                provedores.add(provider['provider_name'])

    return provedores

