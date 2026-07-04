import random

from cash_register.currency import USD
from cash_register.policy import ChangePolicy
from cash_register.processor import process_file, process_line, process_text

README_INPUT = "2.12,3.00\n1.97,2.00\n3.33,5.00"

CENTS_BY_NAME = {d.singular: d.value_cents for d in USD.denominations} | {
    d.plural: d.value_cents for d in USD.denominations
}


def parse_change_line_cents(line):
    total = 0
    for part in line.split(","):
        count, name = part.split(" ", 1)
        total += int(count) * CENTS_BY_NAME[name]
    return total


class TestProcessLine:
    def test_valid_line(self):
        assert process_line("2.12,3.00") == "3 quarters,1 dime,3 pennies"

    def test_invalid_amount_becomes_error_line(self):
        line = process_line("abc,3.00")
        assert line == "error: invalid amount: 'abc'"

    def test_wrong_field_count_becomes_error_line(self):
        line = process_line("2.12")
        assert line == "error: expected 'owed,paid': '2.12'"

    def test_underpayment_becomes_error_line(self):
        line = process_line("2.00,1.00")
        assert line == "error: paid 1.00 is less than owed 2.00"

    def test_zero_owed_zero_paid_is_no_change(self):
        assert process_line("0,0") == "no change"

    def test_zero_owed_with_payment_gives_full_change(self):
        assert process_line("0.00,0.03", rng=random.Random(1)) != ""


class TestProcessText:
    def test_readme_sample(self):
        output = process_text(README_INPUT, rng=random.Random(42))
        lines = output.split("\n")
        assert len(lines) == 3
        assert lines[0] == "3 quarters,1 dime,3 pennies"
        assert lines[1] == "3 pennies"
        assert parse_change_line_cents(lines[2]) == 167

    def test_blank_lines_are_skipped(self):
        output = process_text("\n2.12,3.00\n\n   \n1.97,2.00\n")
        assert output.split("\n") == ["3 quarters,1 dime,3 pennies", "3 pennies"]

    def test_crlf_input(self):
        output = process_text("2.12,3.00\r\n1.97,2.00")
        assert output.split("\n") == ["3 quarters,1 dime,3 pennies", "3 pennies"]

    def test_invalid_middle_line_does_not_stop_processing(self):
        output = process_text("2.12,3.00\nbogus\n1.97,2.00")
        lines = output.split("\n")
        assert lines[0] == "3 quarters,1 dime,3 pennies"
        assert lines[1].startswith("error: ")
        assert lines[2] == "3 pennies"

    def test_empty_text(self):
        assert process_text("") == ""

    def test_only_blank_lines(self):
        assert process_text("\n  \n\t\n") == ""

    def test_seeded_output_is_deterministic(self):
        first = process_text(README_INPUT, rng=random.Random(9))
        second = process_text(README_INPUT, rng=random.Random(9))
        assert first == second

    def test_policy_is_applied_to_every_line(self):
        output = process_text("3.00,4.00", ChangePolicy(random_divisor=1000000))
        assert output == "1 dollar"


class TestProcessFile:
    def test_round_trip(self, tmp_path):
        input_path = tmp_path / "input.txt"
        output_path = tmp_path / "output.txt"
        input_path.write_text(README_INPUT + "\n")
        process_file(input_path, output_path, rng=random.Random(42))
        content = output_path.read_text()
        assert content.endswith("\n")
        assert content.rstrip("\n").split("\n")[0] == "3 quarters,1 dime,3 pennies"
        assert len(content.rstrip("\n").split("\n")) == 3

    def test_empty_input_file(self, tmp_path):
        input_path = tmp_path / "input.txt"
        output_path = tmp_path / "output.txt"
        input_path.write_text("")
        process_file(input_path, output_path)
        assert output_path.read_text() == ""

    def test_mixed_file_with_errors(self, tmp_path):
        input_path = tmp_path / "input.txt"
        output_path = tmp_path / "output.txt"
        input_path.write_text("1.97,2.00\nnope,x\n2.00,1.00\n")
        process_file(input_path, output_path)
        lines = output_path.read_text().rstrip("\n").split("\n")
        assert lines == [
            "3 pennies",
            "error: invalid amount: 'nope'",
            "error: paid 1.00 is less than owed 2.00",
        ]
