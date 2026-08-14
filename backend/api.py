from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

#Enable CORS
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
    return {"message": "O filme "+user_busca+" tem na netflix"}