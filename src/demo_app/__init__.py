from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def index() -> dict[str, str]:
    return {"msg": "Hello, world!"}
