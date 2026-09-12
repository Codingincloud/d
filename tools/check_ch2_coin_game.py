"""Re-derive the coin-toss game problem (Ch2 §2.3) from first principles.

Source: note 2, page 45 (mis-mapped to Ch8 in the old page map — see plan §2.3).

    "An unbiased coin is repeatedly flipped. For each flip you have to pay Rs.1
     and when the difference between the head & tail becomes three, you get
     Rs.8. If the required difference is achieved in less than 8 flips you win
     some money and if it is more than 8 flips you lose. Illustrate the
     simulation to decide whether to play this game or not?"

So one game ends the moment |heads - tails| = 3. The payoff is

    net = 8 - (number of flips)

and the decision is the sign of the expected net. The number of flips is the
hitting time of +-3 for a simple symmetric random walk starting at 0, whose
expectation is a*b = 3*3 = 9 for the interval (-a, b). Expected net = 8 - 9 =
-Re 1, so the game is not worth playing - which is what the simulation below is
meant to show.

    python tools/check_ch2_coin_game.py
"""

from __future__ import annotations

import random

TARGET = 3          # |heads - tails| that ends a game
PAYOFF = 8.0        # rupees received when the target is reached
COST_PER_FLIP = 1.0  # rupees paid for every flip
BREAK_EVEN_FLIPS = 8  # fewer than this = win, more = lose

# Illustrative digit stream: even -> Head, odd -> Tail. The paper/notes supply
# no digits, so a random-number table has to; these are printed on the page so
# every game below can be re-derived by hand.
DIGITS = [
    3, 8, 1, 4, 7, 2, 9, 5, 0, 6, 3, 3, 8, 1, 5, 9, 2, 7, 4, 0,
    6, 1, 8, 9, 3, 5, 7, 2, 4, 0, 6, 8, 1, 9, 3, 5, 2, 7, 4, 8,
    0, 6, 9, 1, 3, 5, 7, 2, 8, 4, 6, 0, 1, 9, 3, 7, 5, 2, 4, 8,
    6, 1, 0, 9, 3, 5, 7, 2, 4, 8, 6, 0, 1, 9, 5, 3, 7, 2, 4, 8,
]

problems: list[str] = []


def check(label: str, got: float, want: float, tol: float) -> None:
    ok = abs(got - want) <= tol
    if not ok:
        problems.append(f"{label}: got {got}, expected {want} +-{tol}")
    print(f"  [{'ok' if ok else 'XX'}] {label:<52} {got}")


def play(digits: list[int], start: int) -> tuple[int, int, str]:
    """One game. Returns (flips, net index, the digits consumed)."""
    diff = 0
    used: list[str] = []
    for i in range(start, len(digits)):
        d = digits[i]
        diff += 1 if d % 2 == 0 else -1   # even -> H (+1), odd -> T (-1)
        used.append(str(d))
        if abs(diff) == TARGET:
            flips = i - start + 1
            return flips, i + 1, " ".join(used)
    raise ValueError("digit stream exhausted before the target was reached")


def main() -> int:
    print("1. Exact expectation by Monte Carlo (200000 games, fixed seed)")
    rng = random.Random(7026)
    total = 0
    for _ in range(200_000):
        diff, flips = 0, 0
        while abs(diff) != TARGET:
            diff += 1 if rng.random() < 0.5 else -1
            flips += 1
        total += flips
    mean_flips = total / 200_000
    check("E[flips] ~ a*b = 3*3", mean_flips, 9.0, tol=0.05)
    check("E[net] = 8 - E[flips]", PAYOFF - mean_flips, -1.0, tol=0.05)
    print(f"       -> expected net is negative, so you should NOT play\n")

    print("2. Illustrative hand-run from the printed digit stream")
    print("   game  digits used                                  flips  net")
    pos = 0
    nets: list[float] = []
    game = 0
    while pos < len(DIGITS) and game < 8:
        flips, pos, used = play(DIGITS, pos)
        net = PAYOFF - COST_PER_FLIP * flips
        nets.append(net)
        game += 1
        flag = "win" if flips < BREAK_EVEN_FLIPS else ("even" if flips == BREAK_EVEN_FLIPS else "LOSE")
        print(f"   {game:>4}  {used:<48} {flips:>5}  {net:>+5.0f}  {flag}")

    avg = sum(nets) / len(nets)
    wins = sum(1 for n in nets if n > 0)
    print(f"\n   games {len(nets)} | wins {wins} | losses {sum(1 for n in nets if n < 0)}"
          f" | average net {avg:+.2f} per game")
    print(f"   average flips in this run: "
          f"{sum(PAYOFF - n for n in nets) / len(nets):.2f} (theory: 9)")
    print("\n   Note: a handful of games proves very little on its own - the "
          "sample is tiny and\n   the expectation has to come from the theory "
          "(or from many replications).")

    print()
    if problems:
        print(f"{len(problems)} MISMATCH(ES):")
        for p in problems:
            print("  -", p)
        return 1
    print("Coin-game figures agree with the theory. OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
