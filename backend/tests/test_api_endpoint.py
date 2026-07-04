import random

import pytest

pytest.importorskip("fastapi", reason="api extra not installed")

from fastapi.testclient import TestClient  # noqa: E402

from cash_register.api import app  # noqa: E402
from cash_register.currency import USD  # noqa: E402
from cash_register.processor import process_text  # noqa: E402

README_LINES = ["2.12,3.00", "1.97,2.00", "3.33,5.00"]

CENTS_BY_NAME = {d.singular: d.value_cents for d in USD.denominations} | {
    d.plural: d.value_cents for d in USD.denominations
}


def change_line_cents(line):
    total = 0
    for part in line.split(","):
        count, name = part.split(" ", 1)
        total += int(count) * CENTS_BY_NAME[name]
    return total


@pytest.fixture
def client():
    return TestClient(app)


class TestChangeEndpoint:
    def test_readme_sample(self, client):
        response = client.post("/change", json={"lines": README_LINES, "seed": 42})
        assert response.status_code == 200
        results = response.json()["results"]
        assert [r["line_number"] for r in results] == [1, 2, 3]
        assert [r["status"] for r in results] == ["ok", "ok", "ok"]
        assert results[0]["input"] == "2.12,3.00"
        assert results[0]["change"] == "3 quarters,1 dime,3 pennies"
        assert results[1]["change"] == "3 pennies"
        assert change_line_cents(results[2]["change"]) == 167

    def test_single_line(self, client):
        response = client.post("/change", json={"lines": ["1.97,2.00"]})
        assert response.status_code == 200
        results = response.json()["results"]
        assert len(results) == 1
        assert results[0]["change"] == "3 pennies"

    def test_many_lines_keep_order(self, client):
        lines = ["1.97,2.00"] * 50 + ["2.12,3.00"] * 50
        response = client.post("/change", json={"lines": lines})
        results = response.json()["results"]
        assert len(results) == 100
        assert results[0]["change"] == "3 pennies"
        assert results[99]["change"] == "3 quarters,1 dime,3 pennies"
        assert [r["line_number"] for r in results] == list(range(1, 101))

    def test_endpoint_matches_core_processor(self, client):
        expected = process_text("\n".join(README_LINES), rng=random.Random(7)).split("\n")
        response = client.post("/change", json={"lines": README_LINES, "seed": 7})
        changes = [r["change"] for r in response.json()["results"]]
        assert changes == expected

    def test_same_seed_same_response(self, client):
        payload = {"lines": README_LINES, "seed": 11}
        first = client.post("/change", json=payload).json()
        second = client.post("/change", json=payload).json()
        assert first == second

    def test_custom_divisor_forces_minimum(self, client):
        response = client.post(
            "/change", json={"lines": ["3.33,5.00"], "divisor": 1000000}
        )
        assert response.json()["results"][0]["change"] == (
            "1 dollar,2 quarters,1 dime,1 nickel,2 pennies"
        )


class TestStructuredErrors:
    def test_mixed_batch_continues_processing(self, client):
        lines = ["2.12,3.00", "bogus,x", "2.00,1.00", "1.97,2.00"]
        response = client.post("/change", json={"lines": lines})
        assert response.status_code == 200
        results = response.json()["results"]
        assert [r["status"] for r in results] == ["ok", "error", "error", "ok"]
        assert results[1]["line_number"] == 2
        assert results[1]["input"] == "bogus,x"
        assert results[1]["error"] == "invalid amount: 'bogus'"
        assert results[2]["error"] == "paid 1.00 is less than owed 2.00"
        assert results[3]["change"] == "3 pennies"

    def test_all_lines_invalid_still_200(self, client):
        response = client.post("/change", json={"lines": ["x,y", "1,2,3", "5.00,1.00"]})
        assert response.status_code == 200
        results = response.json()["results"]
        assert all(r["status"] == "error" for r in results)
        assert results[0]["error"] == "invalid amount: 'x'"
        assert results[1]["error"] == "expected 'owed,paid': '1,2,3'"
        assert results[2]["error"] == "paid 1.00 is less than owed 5.00"

    @pytest.mark.parametrize("line", ["", "   "])
    def test_blank_line_is_an_explicit_error_entry(self, client, line):
        response = client.post("/change", json={"lines": [line, "1.97,2.00"]})
        assert response.status_code == 200
        results = response.json()["results"]
        assert results[0]["status"] == "error"
        assert "expected 'owed,paid'" in results[0]["error"]
        assert results[1]["change"] == "3 pennies"

    def test_entry_field_exclusivity(self, client):
        response = client.post("/change", json={"lines": ["1.97,2.00", "nope,x"]})
        ok_entry, error_entry = response.json()["results"]
        assert ok_entry["error"] is None and ok_entry["change"] is not None
        assert error_entry["change"] is None and error_entry["error"] is not None

    def test_shape_problems_are_422_not_error_entries(self, client):
        assert client.post("/change", json={"lines": []}).status_code == 422
        assert client.post("/change", json={"lines": [123]}).status_code == 422


class TestConfigSelection:
    def test_eur_minimum_change(self, client):
        response = client.post("/change", json={"lines": ["2.12,5.00"], "currency": "EUR"})
        assert response.status_code == 200
        assert response.json()["results"][0]["change"] == (
            "1 two euro coin,1 fifty cent coin,1 twenty cent coin,"
            "1 ten cent coin,1 five cent coin,1 two cent coin,1 one cent coin"
        )

    def test_eur_random_line_sums_exactly(self, client):
        from cash_register.currency import EUR

        cents_by_name = {d.singular: d.value_cents for d in EUR.denominations} | {
            d.plural: d.value_cents for d in EUR.denominations
        }
        response = client.post(
            "/change", json={"lines": ["3.33,5.00"], "currency": "EUR", "seed": 42}
        )
        change = response.json()["results"][0]["change"]
        total = 0
        for part in change.split(","):
            count, name = part.split(" ", 1)
            total += int(count) * cents_by_name[name]
        assert total == 167

    def test_negative_divisor_rejected(self, client):
        response = client.post("/change", json={"lines": ["1,2"], "divisor": -3})
        assert response.status_code == 422


class TestRequestShapeRejection:
    @pytest.mark.parametrize(
        "payload",
        [
            {"lines": []},
            {"lines": ["1,2"], "divisor": 0},
            {"lines": ["1,2"], "currency": "XYZ"},
            {"lines": ["1,2"], "bogus": True},
            {"lines": "1,2"},
            {},
        ],
    )
    def test_invalid_shapes_get_422(self, client, payload):
        assert client.post("/change", json=payload).status_code == 422


class TestPhase2Audit:
    def test_batch_at_the_cap_is_accepted(self, client):
        response = client.post("/change", json={"lines": ["1.97,2.00"] * 1000})
        assert response.status_code == 200
        assert len(response.json()["results"]) == 1000

    def test_batch_over_the_cap_is_422(self, client):
        response = client.post("/change", json={"lines": ["1.97,2.00"] * 1001})
        assert response.status_code == 422

    def test_explicit_null_seed_is_accepted(self, client):
        response = client.post("/change", json={"lines": ["1.97,2.00"], "seed": None})
        assert response.status_code == 200

    @pytest.mark.parametrize("seed", ["abc", 4.5])
    def test_non_integer_seed_is_422(self, client, seed):
        response = client.post("/change", json={"lines": ["1,2"], "seed": seed})
        assert response.status_code == 422

    def test_non_json_body_is_422(self, client):
        response = client.post(
            "/change", content="lines=1,2", headers={"Content-Type": "text/plain"}
        )
        assert response.status_code == 422

    def test_get_method_not_allowed(self, client):
        assert client.get("/change").status_code == 405

    def test_unicode_digit_line_is_an_error_entry(self, client):
        response = client.post("/change", json={"lines": ["٢,٣"]})
        result = response.json()["results"][0]
        assert result["status"] == "error"
        assert "invalid amount" in result["error"]

    def test_embedded_newline_line_is_an_error_entry(self, client):
        response = client.post("/change", json={"lines": ["2.12,3.00\n1.97,2.00"]})
        result = response.json()["results"][0]
        assert result["status"] == "error"

    def test_padded_line_is_ok(self, client):
        response = client.post("/change", json={"lines": [" 1.97 , 2.00 "]})
        result = response.json()["results"][0]
        assert result["status"] == "ok"
        assert result["change"] == "3 pennies"

    def test_divisor_one_with_seed_is_deterministic(self, client):
        payload = {"lines": ["2.12,3.00"], "divisor": 1, "seed": 5}
        first = client.post("/change", json=payload).json()
        second = client.post("/change", json=payload).json()
        assert first == second
        assert first["results"][0]["status"] == "ok"


class TestOpenApiSchema:
    def test_models_documented(self, client):
        schema = client.get("/openapi.json").json()
        components = schema["components"]["schemas"]
        assert "ChangeRequest" in components
        assert "ChangeResponse" in components
        assert "LineResult" in components
