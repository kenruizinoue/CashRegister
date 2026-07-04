import subprocess
import sys

import pytest

from cash_register.cli import main

README_INPUT = "2.12,3.00\n1.97,2.00\n3.33,5.00\n"


@pytest.fixture
def io_paths(tmp_path):
    input_path = tmp_path / "input.txt"
    output_path = tmp_path / "output.txt"
    input_path.write_text(README_INPUT)
    return input_path, output_path


class TestHappyPath:
    def test_exit_code_and_output(self, io_paths):
        input_path, output_path = io_paths
        assert main([str(input_path), str(output_path), "--seed", "42"]) == 0
        lines = output_path.read_text().rstrip("\n").split("\n")
        assert len(lines) == 3
        assert lines[0] == "3 quarters,1 dime,3 pennies"
        assert lines[1] == "3 pennies"

    def test_seed_makes_runs_reproducible(self, io_paths):
        input_path, output_path = io_paths
        main([str(input_path), str(output_path), "--seed", "7"])
        first = output_path.read_text()
        main([str(input_path), str(output_path), "--seed", "7"])
        assert output_path.read_text() == first

    def test_divisor_flag(self, io_paths):
        input_path, output_path = io_paths
        assert main([str(input_path), str(output_path), "--divisor", "1000000"]) == 0
        lines = output_path.read_text().rstrip("\n").split("\n")
        assert lines[2] == "1 dollar,2 quarters,1 dime,1 nickel,2 pennies"

    def test_currency_flag_eur(self, tmp_path):
        input_path = tmp_path / "input.txt"
        output_path = tmp_path / "output.txt"
        input_path.write_text("2.12,5.00\n")
        assert main([str(input_path), str(output_path), "--currency", "EUR"]) == 0
        assert output_path.read_text().rstrip("\n") == (
            "1 two euro coin,1 fifty cent coin,1 twenty cent coin,"
            "1 ten cent coin,1 five cent coin,1 two cent coin,1 one cent coin"
        )

    def test_currency_defaults_to_usd(self, tmp_path):
        input_path = tmp_path / "input.txt"
        output_path = tmp_path / "output.txt"
        input_path.write_text("2.12,3.00\n")
        assert main([str(input_path), str(output_path)]) == 0
        assert output_path.read_text().rstrip("\n") == "3 quarters,1 dime,3 pennies"

    def test_unknown_currency_exits_with_usage_error(self, io_paths):
        input_path, output_path = io_paths
        with pytest.raises(SystemExit) as excinfo:
            main([str(input_path), str(output_path), "--currency", "XYZ"])
        assert excinfo.value.code == 2

    def test_error_lines_still_succeed_as_a_run(self, tmp_path):
        input_path = tmp_path / "input.txt"
        output_path = tmp_path / "output.txt"
        input_path.write_text("bogus,x\n1.97,2.00\n")
        assert main([str(input_path), str(output_path)]) == 0
        lines = output_path.read_text().rstrip("\n").split("\n")
        assert lines[0].startswith("error: ")
        assert lines[1] == "3 pennies"


class TestFailures:
    def test_missing_input_file(self, tmp_path, capsys):
        missing = tmp_path / "nope.txt"
        out = tmp_path / "output.txt"
        assert main([str(missing), str(out)]) == 1
        assert "input file not found" in capsys.readouterr().err

    def test_unwritable_output_path(self, io_paths, tmp_path, capsys):
        input_path, _ = io_paths
        bad_output = tmp_path / "no_such_dir" / "output.txt"
        assert main([str(input_path), str(bad_output)]) == 1
        assert "error" in capsys.readouterr().err

    def test_invalid_divisor(self, io_paths, capsys):
        input_path, output_path = io_paths
        assert main([str(input_path), str(output_path), "--divisor", "0"]) == 2
        assert "divisor" in capsys.readouterr().err

    def test_missing_args_exit_with_usage_error(self):
        with pytest.raises(SystemExit) as excinfo:
            main([])
        assert excinfo.value.code == 2

    def test_non_utf8_input_file(self, tmp_path, capsys):
        input_path = tmp_path / "input.txt"
        input_path.write_bytes(b"\xff\xfe\x00bad")
        output_path = tmp_path / "output.txt"
        assert main([str(input_path), str(output_path)]) == 1
        assert "UTF-8" in capsys.readouterr().err

    def test_input_path_is_directory(self, tmp_path, capsys):
        output_path = tmp_path / "output.txt"
        assert main([str(tmp_path), str(output_path)]) == 1
        assert "error" in capsys.readouterr().err


class TestModuleEntryPoint:
    def test_python_dash_m(self, io_paths):
        input_path, output_path = io_paths
        result = subprocess.run(
            [sys.executable, "-m", "cash_register.cli", str(input_path), str(output_path)],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0
        assert output_path.read_text().rstrip("\n").split("\n")[1] == "3 pennies"
