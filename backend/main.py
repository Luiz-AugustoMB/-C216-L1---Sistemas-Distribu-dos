from fastapi import FastAPI

app = FastAPI(title="C216 L1 - Backend")

@app.get("/")
def read_root():
    return {"message": "Olá, Sistemas Distribuídos!"}