from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Testando api"}

@app.get("/busca/{user_busca}")
async def read_item(user_busca):
    return {"message": "O filme "+user_busca+" tem na netflix"}