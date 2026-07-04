"""FastAPI adapter exposing the cash register core over HTTP."""

import random
from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field

from cash_register.currency import CURRENCIES
from cash_register.domain import CashRegisterError
from cash_register.parser import parse_line
from cash_register.policy import ChangePolicy
from cash_register.processor import process_transaction

MAX_LINES = 1000


class ChangeRequest(BaseModel):
    """One batch of owed,paid lines plus optional policy configuration."""

    model_config = ConfigDict(extra="forbid")

    lines: list[str] = Field(min_length=1, max_length=MAX_LINES)
    currency: Literal["USD", "EUR"] = "USD"
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


@app.post("/change")
def make_change(request: ChangeRequest) -> ChangeResponse:
    """Translate the request into core calls; no change math happens here."""
    policy = ChangePolicy(currency=CURRENCIES[request.currency], random_divisor=request.divisor)
    rng = random.Random(request.seed)
    results = []
    for number, line in enumerate(request.lines, start=1):
        try:
            change = process_transaction(parse_line(line), policy, rng)
            results.append(
                LineResult(line_number=number, input=line, status="ok", change=change)
            )
        except CashRegisterError as error:
            results.append(
                LineResult(line_number=number, input=line, status="error", error=str(error))
            )
    return ChangeResponse(results=results)
