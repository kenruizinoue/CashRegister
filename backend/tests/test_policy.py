import random

import pytest

from cash_register.currency import USD
from cash_register.domain import InvalidConfigError, Transaction, UnderpaymentError
from cash_register.policy import ChangePolicy, make_change, random_change


class SmallestPickingRng:
    """Fake random source that always picks the smallest eligible denomination."""

    def choice(self, options):
        return options[-1]


class ForbiddenRng:
    """Fake random source that fails the test if the strategy consults it."""

    def choice(self, options):
        raise AssertionError("random source must not be used for minimum change")


def total(counts):
    return sum(d.value_cents * n for d, n in counts.items())


def by_name(counts):
    return {d.singular: n for d, n in counts.items()}


class TestStrategySelection:
    def test_non_divisible_owed_uses_minimum_and_no_randomness(self):
        counts = make_change(
            Transaction(owed_cents=212, paid_cents=300),
            ChangePolicy(),
            rng=ForbiddenRng(),
        )
        assert by_name(counts) == {"quarter": 3, "dime": 1, "penny": 3}

    def test_divisible_owed_uses_random_strategy(self):
        counts = make_change(
            Transaction(owed_cents=212, paid_cents=300),
            ChangePolicy(random_divisor=53),
            rng=SmallestPickingRng(),
        )
        assert by_name(counts) == {"penny": 88}

    def test_readme_random_sample_sums_exactly(self):
        counts = make_change(
            Transaction(owed_cents=333, paid_cents=500),
            ChangePolicy(),
            rng=random.Random(42),
        )
        assert total(counts) == 167

    def test_default_policy_and_rng(self):
        counts = make_change(Transaction(owed_cents=197, paid_cents=200))
        assert by_name(counts) == {"penny": 3}

    def test_underpayment_propagates(self):
        with pytest.raises(UnderpaymentError):
            make_change(Transaction(owed_cents=300, paid_cents=100))


class TestRandomChange:
    def test_zero_change_is_empty(self):
        assert random_change(0, USD, random.Random(7)) == {}

    def test_one_cent_is_one_penny(self):
        counts = random_change(1, USD, random.Random(7))
        assert by_name(counts) == {"penny": 1}

    @pytest.mark.parametrize("seed", range(20))
    @pytest.mark.parametrize("amount", [1, 2, 3, 4, 5, 7, 25, 88, 99, 100, 167, 999, 12345])
    def test_sums_exactly_for_every_seed_and_amount(self, seed, amount):
        counts = random_change(amount, USD, random.Random(seed))
        assert total(counts) == amount
        assert all(n > 0 for n in counts.values())

    def test_seeded_runs_are_reproducible(self):
        first = random_change(167, USD, random.Random(11))
        second = random_change(167, USD, random.Random(11))
        assert first == second

    def test_counts_ordered_largest_first(self):
        counts = random_change(167, USD, random.Random(3))
        values = [d.value_cents for d in counts]
        assert values == sorted(values, reverse=True)


class TestPolicyConfig:
    def test_custom_divisor_selects_random(self):
        policy = ChangePolicy(random_divisor=7)
        counts = make_change(
            Transaction(owed_cents=700, paid_cents=800),
            policy,
            rng=SmallestPickingRng(),
        )
        assert by_name(counts) == {"penny": 100}

    def test_custom_divisor_keeps_minimum_for_non_multiples(self):
        policy = ChangePolicy(random_divisor=7)
        counts = make_change(
            Transaction(owed_cents=300, paid_cents=400),
            policy,
            rng=ForbiddenRng(),
        )
        assert by_name(counts) == {"dollar": 1}

    def test_divisor_one_is_always_random(self):
        counts = make_change(
            Transaction(owed_cents=212, paid_cents=300),
            ChangePolicy(random_divisor=1),
            rng=SmallestPickingRng(),
        )
        assert by_name(counts) == {"penny": 88}

    def test_divisible_owed_with_zero_change(self):
        counts = make_change(
            Transaction(owed_cents=300, paid_cents=300),
            ChangePolicy(),
            rng=random.Random(5),
        )
        assert counts == {}

    @pytest.mark.parametrize("divisor", [0, -3])
    def test_invalid_divisor_rejected(self, divisor):
        with pytest.raises(InvalidConfigError):
            ChangePolicy(random_divisor=divisor)
