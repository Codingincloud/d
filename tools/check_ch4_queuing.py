"""Re-derive every Chapter 4 (queuing) figure from first principles.

Ground rule §0.6: a number only goes on a page after it has been recomputed.
The Ch4 figures are long enough that re-doing them by hand is error-prone, so
this script is the derivation. Run it before/after editing ch4.js:

    python tools/check_ch4_queuing.py

Sources for the three problems:
  * 8-customer bank .................. n1 p39-p41  (also 2012 C, 10 marks)
  * 15-customer library .............. n1 p41-p43  (2010 C, 10 marks)
  * 30-day computer facility ......... n1 p43-p45  (2014 F / 2010 F, 10 marks)

Rounding convention (stated on the page as well): the class notes round the
service rate to two decimals first - mu = 1/1.85 = 0.54 - and then use 0.54 in
the Lq/Wq formulas. Reproducing that convention is deliberate: the marker
compares against the notes' numbers, so the page shows 0.54, -5.67 and -8.10.
This script checks the notes' convention and prints the unrounded value beside
it so the difference is visible rather than hidden.

The library and the computer-facility questions hand out *distributions*, not
lists of times, and neither paper supplies random digits. The class notes
therefore verify them analytically (mean rates + Little's-law style formulas);
that route is reproduced here, together with the cumulative-probability ->
random-number interval mapping the manual simulation needs.
"""

from __future__ import annotations

from sitelib import Reporter

PASS = "OK"
report = Reporter(width=58)
check = report.check


def intervals(pdf: dict[int, float]) -> dict[int, str]:
    """value -> 'lo-hi' two-digit random-number interval (cumulative inverse)."""
    out: dict[int, str] = {}
    lo = 0
    for value, p in pdf.items():
        hi = lo + round(p * 100) - 1
        out[value] = f"{lo:02d}-{hi:02d}"
        lo = hi + 1
    return out


def mean(pdf: dict[int, float]) -> float:
    return sum(v * p for v, p in pdf.items())


# ---------------------------------------------------------------- 8 customers
def bank_8() -> None:
    print("\n1. Bank, 8 customers  (n1 p39-p41, 2012 C)")
    iat = [0.4, 1.2, 0.5, 1.7, 0.2, 1.6, 0.2, 1.8]
    st = [2.0, 0.7, 0.2, 1.1, 3.7, 0.6, 0.4, 0.7]

    arrival = 0.0
    prev_end = 0.0
    waits: list[float] = []
    in_system: list[float] = []
    print("  cust  IAT  arrival  start  svc   end   wait")
    for i, (a, s) in enumerate(zip(iat, st), 1):
        arrival = round(arrival + a, 4)
        start = max(arrival, prev_end)
        end = round(start + s, 4)
        wait = round(start - arrival, 4)
        waits.append(wait)
        in_system.append(round(end - arrival, 4))
        print(
            f"   {i:>2}  {a:>4}  {arrival:>7}  {start:>5}  {s:>3}  {end:>5}  {wait:>4}"
        )
        prev_end = end

    total_wait = round(sum(waits), 4)
    check("sum of waiting times", total_wait, 11.1)
    check("(i)  average waiting time = 11.1/8", total_wait / 8, 1.3875)
    check("(ii) probability of waiting = 6/8", sum(1 for w in waits if w > 0) / 8, 0.75)
    span = round(arrival - iat[0], 4)  # last arrival - first arrival
    check("total arrival span = 7.6 - 0.4", span, 7.2)
    check("(iii) avg customers in queue = 11.1/7.2", total_wait / span, 1.5417)


# ---------------------------------------------------------------- library 15
ARRIVAL_PDF = {1: 0.23, 2: 0.37, 3: 0.25, 4: 0.15}
SERVICE_PDF = {1: 0.10, 2: 0.20, 3: 0.33, 4: 0.22, 5: 0.10, 6: 0.05}

# Illustrative two-digit stream for the 15-customer run. The paper gives the
# distributions but no digits, so a random-number table has to supply them.
# These blocks are printed on the page so every row can be re-derived.
ARRIVAL_DIGITS = [62, 17, 84, 41, 95, 28, 73, 6, 55, 39, 88, 12, 67, 24, 91]
SERVICE_DIGITS = [12, 58, 34, 5, 81, 46, 27, 69, 38, 93, 15, 72, 49, 8, 64]


def sample(pdf: dict[int, float], digit: int) -> int:
    lo = 0.0
    for value, p in pdf.items():
        lo += p
        if digit < round(lo * 100):
            return value
    return value


def library_15() -> None:
    print("\n2. Library, 15 customers  (n1 p41-p43, 2010 C)")
    print("   mapping: arrivals", intervals(ARRIVAL_PDF))
    print("            service ", intervals(SERVICE_PDF))

    a_bar = mean(ARRIVAL_PDF)
    s_bar = mean(SERVICE_PDF)
    check("mean inter-arrival A = sum(v*p)", a_bar, 2.32)
    check("arrival rate lambda = 1/A", 1 / a_bar, 0.4310, tol=1e-3)
    check("mean service time S = sum(v*p)", s_bar, 3.17)

    lam = 1 / a_bar
    rho = lam * s_bar
    check("traffic intensity rho = lambda*S", rho, 1.3664, tol=1e-3)
    # M/G/1 (Pollaczek-Khinchine) with E[S^2] taken as S^2 - the notes' formula.
    # The page uses lambda = 0.431 (rounded), so check that convention.
    lam_r = 0.431
    rho_r = lam_r * s_bar
    wq = lam_r * s_bar**2 / (2 * (1 - rho_r))
    print(f"       (unrounded lambda = {lam:.6f} would give Wq = "
          f"{lam * s_bar**2 / (2 * (1 - rho)):.4f})")
    check("rho = lambda*S with lambda = 0.431", rho_r, 1.3663, tol=1e-3)
    check("Wq = lambda*S^2 / (2(1-rho))", wq, -5.91, tol=5e-3)
    check("Ws = Wq + S", wq + s_bar, -2.74, tol=5e-3)
    check("P(server busy) = rho = lambda*S", rho_r, 1.37, tol=5e-3)

    print("   illustrative run (digit -> sampled time):")
    arrival = 0.0
    prev_end = 0.0
    waits, in_system, busy_end = [], [], 0.0
    print("  cust  adig  IAT  sdig   ST  arrival  start   end  wait   T")
    for i, (ad, sd) in enumerate(zip(ARRIVAL_DIGITS, SERVICE_DIGITS), 1):
        iat = sample(ARRIVAL_PDF, ad)
        st = sample(SERVICE_PDF, sd)
        arrival = round(arrival + iat, 4)
        start = max(arrival, prev_end)
        end = round(start + st, 4)
        wait = round(start - arrival, 4)
        waits.append(wait)
        in_system.append(round(end - arrival, 4))
        busy_end = max(busy_end, end)
        print(
            f"   {i:>2}  {ad:>4}  {iat:>3}  {sd:>4}  {st:>3}  {arrival:>7}  "
            f"{start:>5}  {end:>4}  {wait:>4}  {end - arrival:>4}"
        )
        prev_end = end

    # Busy time is the sum of the service times, which for a single server must
    # equal (last departure - first service start - idle gaps).
    busy = sum(sample(SERVICE_PDF, d) for d in SERVICE_DIGITS)
    print(f"   sum waits = {round(sum(waits), 4)}   sum T = {round(sum(in_system), 4)}")
    print(f"   avg wait = {round(sum(waits) / 15, 4)}   avg T = {round(sum(in_system) / 15, 4)}")
    print(f"   busy time = {busy}   run length = {busy_end} (last departure)   "
          f"P(busy) = {busy}/{busy_end} = {round(busy / busy_end, 4)}")
    print("   (waits grow 0 -> 10 and never recover: rho > 1, so the analytic"
          " negative Wq is a signal of instability, not an answer)")


# ------------------------------------------------------- computer facility 30
def computer_facility() -> None:
    print("\n3. Computer facility, 30 days  (n1 p43-p45, 2014 F / 2010 F)")
    fail_pdf = {0: 0.50, 1: 0.30, 2: 0.20}
    repair_pdf = {1: 0.40, 2: 0.35, 3: 0.25}
    print("   mapping: failures/day", intervals(fail_pdf))
    print("            repair days ", intervals(repair_pdf))

    lam = mean(fail_pdf)
    t_bar = mean(repair_pdf)
    check("failure arrival rate lambda", lam, 0.70)
    check("mean repair time T", t_bar, 1.85)
    check("service rate mu = 1/T", 1 / t_bar, 0.54, tol=1e-2)
    mu = 1 / t_bar
    check("efficiency rho = lambda/mu", lam / mu, 1.30, tol=1e-2)
    # Notes' convention: mu rounded to 0.54 before substitution.
    mu_r = 0.54
    print(f"       (unrounded mu = {mu:.6f} would give Lq = "
          f"{lam**2 / (mu * (mu - lam)):.4f}, Wq = {lam / (mu * (mu - lam)):.4f})")
    check("Lq = lambda^2 / (mu*(mu-lambda))", lam**2 / (mu_r * (mu_r - lam)), -5.67, tol=5e-3)
    check("Wq = lambda / (mu*(mu-lambda))", lam / (mu_r * (mu_r - lam)), -8.10, tol=5e-3)


def main() -> int:
    bank_8()
    library_15()
    computer_facility()
    return report.finish(f"All Ch4 queuing figures agree with the sources. {PASS}")


if __name__ == "__main__":
    raise SystemExit(main())
