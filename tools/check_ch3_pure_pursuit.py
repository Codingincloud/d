"""Re-derive the Ch3 pure-pursuit step and guard the four places it is stated.

Source: note 1, pages 18-23 (fighter/bomber pure pursuit). The assumption page
gives the initial conditions and the 10-unit firing range; the two pages after it
give

    d        = sqrt((x_b - x_f)^2 + (y_b - y_f)^2)
    sin t    = (y_b - y_f) / d          cos t = (x_b - x_f) / d
    x_f(t+1) = x_f(t) + V_p * cos t     y_f(t+1) = y_f(t) + V_p * sin t

The pairing is the whole point: cos carries the x-component. Swapping the two
makes the fighter fly (partly) away from the bomber, so the distance it reports
after a step grows instead of shrinking. That swap was corrected in the Learn
section once and left standing in the quiz and in a past-question answer - this
script exists so the same half-fix cannot happen again.

    python tools/check_ch3_pure_pursuit.py

Exit status 1 if any figure disagrees or any stale claim is still in ch*.js.
"""

from __future__ import annotations

import glob
import math
import os
import re

from sitelib import Reporter

X_F0, Y_F0 = 0.0, 50.0     # fighter, from the site's stated initial conditions
X_B0, Y_B0 = 90.0, 0.0     # bomber, on the x-axis
V_P = 20.0                 # units per step (the notes leave the speed symbolic)
HIT_RANGE = 10.0           # "minimum distance required ... is 10 units"

report = Reporter(width=54)
check = report.check
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def step(xf: float, yf: float, xb: float, yb: float, speed: float, swap: bool) -> tuple[float, float]:
    """One pure-pursuit step. `swap=True` reproduces the old, wrong pairing."""
    d = math.hypot(xb - xf, yb - yf)
    cos_t, sin_t = (xb - xf) / d, (yb - yf) / d
    if swap:
        cos_t, sin_t = sin_t, cos_t
    return xf + speed * cos_t, yf + speed * sin_t


def main() -> int:
    print("1. One step from the stated initial conditions (fighter (0,50), bomber (90,0))")
    d0 = math.hypot(X_B0 - X_F0, Y_B0 - Y_F0)
    check("d at t=0", d0, 102.9563, tol=1e-3)
    check("cos theta = (x_b - x_f)/d", (X_B0 - X_F0) / d0, 0.8742, tol=1e-4)
    check("sin theta = (y_b - y_f)/d", (Y_B0 - Y_F0) / d0, -0.4856, tol=1e-4)
    x1, y1 = step(X_F0, Y_F0, X_B0, Y_B0, V_P, swap=False)
    check("x_f(t+1) with V_p=20 (exact)", x1, 17.4831, tol=1e-3)
    check("y_f(t+1) with V_p=20 (exact)", y1, 40.2871, tol=1e-3)
    # The site prints cos=0.8742 / sin=-0.4856 and then the positions to 2 dp;
    # rounding the trig first (the notes' convention) must agree with that text.
    check("x_f(t+1) from the printed cos=0.8742", 20 * 0.8742, 17.48, tol=5e-3)
    check("y_f(t+1) from the printed sin=-0.4856", 50 + 20 * -0.4856, 40.29, tol=5e-3)
    check("d(t+1) - d(t), correctly paired", math.hypot(X_B0 - x1, Y_B0 - y1) - d0, -V_P, tol=1e-3)
    print()
    print("2. Why the pairing is not cosmetic: a stationary target must be closed on")
    for swap in (False, True):
        xs, ys = step(X_F0, Y_F0, X_B0, Y_B0, V_P, swap=swap)
        d1 = math.hypot(X_B0 - xs, Y_B0 - ys)
        label = "swapped (the old site text)" if swap else "cos->x, sin->y (correct)"
        closing = d1 - d0
        ok = closing < 0 if not swap else closing > 0
        if not ok:
            report.problems.append(
                f"{label}: distance moved {closing:+.4f}, expected the opposite sign")
        print(f"  [{'ok' if ok else 'XX'}] {label:<36} d goes {d0:.2f} -> {d1:.2f} ({closing:+.2f})")
    print("       -> only the correct pairing closes the gap; the swap opens it.\n")

    print("3. Site files must not still state the old facts")
    stale_patterns = [
        (r"x_f\(t\+1\) = x_f\(t\) \+ V_p × sin", "x step paired with sin theta"),
        (r"y_f\(t\+1\) = y_f\(t\) \+ V_p × cos", "y step paired with cos theta"),
        (r"(?:≤|<=|&le;)\s*100\s*m\b", "firing range stated as 100 m"),
        (r"\b1000\s*m\b", "escape rule stated as 'distance > 1000m'"),
    ]
    hits = 0
    for path in sorted(glob.glob(os.path.join(ROOT, "ch*.js"))):
        text = open(path, encoding="utf-8", errors="replace").read().splitlines()
        for n, line in enumerate(text, 1):
            for pat, what in stale_patterns:
                if re.search(pat, line, re.IGNORECASE):
                    hits += 1
                    report.problems.append(f"{os.path.basename(path)}:{n}: {what}")
                    print(f"  [XX] {os.path.basename(path)}:{n}: still says {what}")
    if not hits:
        print("  [ok] no chapter still states a swapped step or a 100 m / 1000 m rule")

    return report.finish(
        "Pure-pursuit figures agree with the source and the site is self-consistent. OK")


if __name__ == "__main__":
    raise SystemExit(main())
