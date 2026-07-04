import pytest

pytest.importorskip("fastapi", reason="api extra not installed")

from pydantic import ValidationError  # noqa: E402

from cash_register.api import ChangeRequest, ChangeResponse, LineResult  # noqa: E402


class TestChangeRequest:
    def test_valid_minimal_payload_applies_defaults(self):
        request = ChangeRequest(lines=["2.12,3.00"])
        assert request.lines == ["2.12,3.00"]
        assert request.currency == "USD"
        assert request.divisor == 3
        assert request.seed is None

    def test_full_payload(self):
        request = ChangeRequest(lines=["1,2"], currency="USD", divisor=5, seed=42)
        assert request.divisor == 5
        assert request.seed == 42

    def test_empty_lines_rejected(self):
        with pytest.raises(ValidationError):
            ChangeRequest(lines=[])

    def test_missing_lines_rejected(self):
        with pytest.raises(ValidationError):
            ChangeRequest()

    def test_wrong_line_types_rejected(self):
        with pytest.raises(ValidationError):
            ChangeRequest(lines=[1, 2])

    def test_unknown_fields_rejected(self):
        with pytest.raises(ValidationError):
            ChangeRequest(lines=["1,2"], bogus=True)

    def test_unknown_currency_rejected(self):
        with pytest.raises(ValidationError):
            ChangeRequest(lines=["1,2"], currency="XYZ")

    def test_invalid_divisor_rejected(self):
        with pytest.raises(ValidationError):
            ChangeRequest(lines=["1,2"], divisor=0)

    def test_oversized_payload_rejected(self):
        with pytest.raises(ValidationError):
            ChangeRequest(lines=["1,2"] * 1001)


class TestResponseModels:
    def test_ok_line_result(self):
        result = LineResult(line_number=1, input="2.12,3.00", status="ok", change="3 pennies")
        assert result.status == "ok"
        assert result.error is None

    def test_error_line_result(self):
        result = LineResult(line_number=2, input="bogus,x", status="error", error="invalid amount")
        assert result.change is None

    def test_unknown_status_rejected(self):
        with pytest.raises(ValidationError):
            LineResult(line_number=1, input="x", status="maybe")

    def test_response_envelope(self):
        response = ChangeResponse(
            results=[LineResult(line_number=1, input="1,2", status="ok", change="1 dollar")]
        )
        assert len(response.results) == 1
