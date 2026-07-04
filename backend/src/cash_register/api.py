"""FastAPI adapter exposing the cash register core over HTTP."""

from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field

MAX_LINES = 1000


class ChangeRequest(BaseModel):
    """One batch of owed,paid lines plus optional policy configuration."""

    model_config = ConfigDict(extra="forbid")

    lines: list[str] = Field(min_length=1, max_length=MAX_LINES)
    currency: Literal["USD"] = "USD"
    divisor: int = Field(default=3, ge=1)
    seed: int | None = None


class LineResult(BaseModel):
    """Outcome for one input line: a change string or an error message."""

    line_number: int
    input: str
    status: Literal["ok", "error"]
    change: str | None = None
    error: str | None = None


class ChangeResponse(BaseModel):
    """Per-line results in input order."""

    results: list[LineResult]


app = FastAPI(title="Cash Register API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
