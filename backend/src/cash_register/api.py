"""FastAPI adapter exposing the cash register core over HTTP."""

from fastapi import FastAPI

app = FastAPI(title="Cash Register API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
