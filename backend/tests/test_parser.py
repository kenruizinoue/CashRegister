import pytest

from cash_register.domain import InvalidLineError, Transaction
from cash_register.parser import parse_amount, parse_line


@pytest.mark.parametrize(
    ("text", "cents"),
    [
        ("2.13", 213),
        ("3", 300),
        ("0.05", 5),
        ("10.5", 1050),
        ("0", 0),
        ("0.00", 0),
        ("  1.25  ", 125),
        ("1000000.99", 100000099),
    ],
)
def test_parse_amount_valid(text, cents):
    assert parse_amount(text) == cents


@pytest.mark.parametrize(
    "text",
    [
        "",
        "   ",
        "abc",
        "-1",
        "-0.01",
        "1.234",
        "1.",
        ".5",
        "1e2",
        "1E+2",
        "NaN",
        "Infinity",
        "+1",
        "1 000",
        "$1.00",
    ],
)
def test_parse_amount_invalid(text):
    with pytest.raises(InvalidLineError, match="invalid amount"):
        parse_amount(text)


@pytest.mark.parametrize(
    ("line", "owed", "paid"),
    [
        ("2.13,3.00", 213, 300),
        ("3,5", 300, 500),
        ("0.05,1", 5, 100),
        (" 2.12 , 3.00 ", 212, 300),
        ("0,0", 0, 0),
        ("1.97,2.00", 197, 200),
    ],
)
def test_parse_line_valid(line, owed, paid):
    assert parse_line(line) == Transaction(owed_cents=owed, paid_cents=paid)


@pytest.mark.parametrize(
    "line",
    [
        "2.13",
        "1,2,3",
        "",
    ],
)
def test_parse_line_wrong_field_count(line):
    with pytest.raises(InvalidLineError, match="expected 'owed,paid'"):
        parse_line(line)


@pytest.mark.parametrize(
    "line",
    [
        "a,b",
        "-1,2",
        "1,-2",
        "1.234,2",
        ",2",
        "1,",
        ",",
    ],
)
def test_parse_line_bad_amounts(line):
    with pytest.raises(InvalidLineError, match="invalid amount"):
        parse_line(line)


def test_error_message_includes_offending_text():
    with pytest.raises(InvalidLineError, match="abc"):
        parse_amount("abc")


@pytest.mark.parametrize("text", ["٢", "٢.٥٠", "２", "１.５"])
def test_non_ascii_digits_rejected(text):
    with pytest.raises(InvalidLineError, match="invalid amount"):
        parse_amount(text)
