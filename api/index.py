"""Ponto de entrada do backend no Vercel.

O Vercel procura funções na pasta api/. Este arquivo só carrega o app de backend/api.py
(o mesmo que você roda localmente) e o coloca sob o prefixo /api, então o front publicado
fala com a API em "/api/populares", "/api/pesquisa" etc. no próprio endereço do site.
"""
import importlib.util
from pathlib import Path

from fastapi import FastAPI

# Carrega backend/api.py com outro nome, pra não confundir com esta pasta "api"
_caminho = Path(__file__).resolve().parent.parent / "backend" / "api.py"
_spec = importlib.util.spec_from_file_location("backend_api", _caminho)
_modulo = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_modulo)

app = FastAPI()
app.mount("/api", _modulo.app)
