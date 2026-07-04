"""Thin command line adapter: parse args, delegate to the processor, report."""

import argparse
import random
import sys
from pathlib import Path

from cash_register.domain import InvalidConfigError
from cash_register.policy import ChangePolicy
from cash_register.processor import process_file


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="cash-register",
        description="Compute change denominations for owed,paid lines in a flat file.",
    )
    parser.add_argument("input_path", type=Path, help="flat file with one owed,paid pair per line")
    parser.add_argument("output_path", type=Path, help="file to write one change line per input")
    parser.add_argument(
        "--divisor",
        type=int,
        default=3,
        help="owed amounts divisible by this get random change (default: 3)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="seed the random source for reproducible output",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        policy = ChangePolicy(random_divisor=args.divisor)
    except InvalidConfigError as error:
        print(f"error: {error}", file=sys.stderr)
        return 2
    try:
        process_file(args.input_path, args.output_path, policy, random.Random(args.seed))
    except FileNotFoundError:
        print(f"error: input file not found: {args.input_path}", file=sys.stderr)
        return 1
    except OSError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
