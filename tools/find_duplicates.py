#!/usr/bin/env python3
"""Report paraphrase duplicates among the site's past questions.

"Show one question, with how many times it was asked" is only half done while
two cards describe the same question. Ch1, for example, carries both
*"Explain the ways to study a system. What are the criteria of classifying
Simulation models?"* and *"What are the criteria of classifying Simulation
models? Brief it with suitable example"* - the second is the tail of the first.

This tool only REPORTS. It never edits a chapter file. The clusters it finds are
meant to be eyeballed before anything is merged, because a wrong merge would
destroy wording that cannot be reconstructed (rule 0.1/0.2 in plan.md).

Usage (from the project root):

    python tools/find_duplicates.py                 # report
    python tools/find_duplicates.py --threshold 0.85
    python tools/find_duplicates.py --chapter 1
    python tools/find_duplicates.py --json          # write data/duplicate_clusters.json

Two kinds of duplicate end up in the output:

* **fragments** - one text is contained in the other, or they are near identical.
  Found automatically by similarity, as described below.
* **same-question groups** - the same question asked again in another paper with
  different wording ("Short Note: GPSS" / "Explain GPSS in brief with suitable
  example" / "What is GPSS language & its application?"). Similarity cannot see
  that these are one question and the LCM items are three, so the judgement is
  curated in data/same_question_merges.json (see
  tools/gen_same_question_merges.js) and merged in here. A group that names a
  question which no longer exists is a hard error, never a silent skip.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))

import re  # noqa: E402

from merge_past import similarity, normalise, norm_key, load_site_chapters  # noqa: E402


def classify(a: str, b: str, score: float, threshold: float) -> str:
    """Decide whether two entries are the SAME question or merely related.

    "fragment"  one text is contained in the other (or they are almost identical)
                -> safe to merge: the shorter entry adds no new question, only a
                   different cut of the same wording.
    "related"   similar topic, but each carries its own content. This is where a
                naive threshold destroys information: "find pi from x^2+y^2=16",
                "integrate cos x" and "integrate (x+4)^3" are three DIFFERENT
                Monte Carlo problems, and the LCM questions differ in their
                parameters (a=12/m=26 vs a=13/m=64). Never auto-merge these.
    """
    na, nb = normalise(a), normalise(b)
    shorter, longer = sorted((na, nb), key=len)
    contained = bool(shorter) and shorter in longer and len(shorter) / max(len(longer), 1) >= 0.6
    if score >= 0.9 or contained:
        return "fragment"
    return "related" if score >= threshold else "no"


def differing_numbers(a: str, b: str) -> str:
    """Numbers that appear in one question but not the other - a strong hint that
    two 'similar' numericals are in fact different problems."""
    nums = lambda s: set(re.findall(r"\d+(?:\.\d+)?", s))
    only_a = sorted(nums(a) - nums(b))
    only_b = sorted(nums(b) - nums(a))
    if not only_a and not only_b:
        return ""
    return f"{','.join(only_a[:6])} | {','.join(only_b[:6])}"

OUT = ROOT / "data" / "duplicate_clusters.json"

for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8", errors="replace")


class Union:
    def __init__(self, n: int):
        self.p = list(range(n))

    def find(self, a: int) -> int:
        while self.p[a] != a:
            self.p[a] = self.p[self.p[a]]
            a = self.p[a]
        return a

    def join(self, a: int, b: int) -> None:
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.p[rb] = ra


CURATED = ROOT / "data" / "same_question_merges.json"


def load_curated() -> tuple[dict[str, list[dict]], list[dict]]:
    """Hand-curated same-question groups (data/same_question_merges.json).

    Similarity alone cannot see that "Explain the mid square random number
    generator" and "Explain the Mid square method for generating random numbers
    with an example" are ONE exam question and not two - different verb, same
    question - while the three LCM questions with different parameters are two
    different questions that look alike. So the judgement is written down: each
    group lists the exact texts that are the same question, generated from the
    chapter files, and the reasons for NOT merging the look-alikes are recorded
    beside it. Nothing is guessed at run time.
    """
    if not CURATED.exists():
        return {}, []
    raw = json.loads(CURATED.read_text(encoding="utf-8"))
    groups: dict[str, list[dict]] = {}
    for ch_key, items in (raw.get("chapters") or {}).items():
        groups[ch_key] = [{"note": g.get("note", ""), "texts": g.get("q") or []}
                          for g in items]
    return groups, raw.get("refused") or []


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--threshold", type=float, default=0.75)
    ap.add_argument("--chapter", type=int)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    site = load_site_chapters()
    curated, refused = load_curated()
    # clusters written out as-is (curated groups that are already applied)
    resolved_groups: list[dict] = []
    report: dict = {"threshold": args.threshold, "chapters": {}, "curated": {},
                    "refused": refused}
    grand = {"clusters": 0, "entries_in_clusters": 0, "pairs": 0,
             "curated_groups": 0, "curated_folded": 0}

    for n in range(1, 9):
        if args.chapter and n != args.chapter:
            continue
        entries = site[n].get("past") or []
        union = Union(len(entries))
        edges = []
        related = []
        # every text in a curated group, resolved against this chapter. A text
        # that no longer exists is an error, never a silent skip: it means the
        # group is stale and the questions it names are no longer being folded.
        by_key: dict[str, int] = {}
        for i, e in enumerate(entries):
            by_key.setdefault(norm_key(e.get("q", "")), i)
        # Every wording recorded anywhere in this chapter: the cards themselves
        # plus the occurrences and variants they carry. A curated group whose
        # question is no longer a card is ALREADY APPLIED - but only if its
        # wording really is recorded on a surviving card. A wording that has
        # simply vanished is an error: content must never disappear silently.
        recorded: set[str] = set()
        for e in entries:
            recorded.add(norm_key(e.get("q", "")))
            for o in e.get("occ") or []:
                recorded.add(norm_key(o.get("q", "")))
            for v in e.get("variants") or []:
                recorded.add(norm_key(v.get("q", "")))

        curated_groups = []
        already = []
        for group in curated.get(str(n)) or []:
            idx = []
            missing = []
            for text in group["texts"]:
                k = norm_key(text)
                if k in by_key:
                    if by_key[k] not in idx:
                        idx.append(by_key[k])
                elif k in recorded:
                    missing.append(text)
                else:
                    raise SystemExit(
                        f"ch{n}: curated merge names a question that is neither a "
                        f"card nor recorded on one: {text[:70]!r}\n"
                        f"  re-run node tools/gen_same_question_merges.js after "
                        f"checking the chapter, or drop the group from "
                        f"data/{CURATED.name}.")
            if missing:
                already.append({"note": group["note"], "folded": missing})
            if len(idx) < 2:
                # Already applied. Still emit the group, with EVERY text in it:
                # tools/merge_past.py reads the same file to work out which
                # wordings a fold retired, and that list is what stops the
                # question bank re-importing a card the fold removed.
                resolved_groups.append({
                    "note": group["note"],
                    "members": [{"index": i, "q": entries[i].get("q", "")} for i in idx]
                               + [{"q": t} for t in missing],
                    "pairs": [],
                    "applied": True,
                })
                continue
            for a in idx[1:]:
                union.join(idx[0], a)
                edges.append((idx[0], a, 1.0))
            curated_groups.append({"note": group["note"], "idx": idx})
        report.setdefault("already_folded", {})[str(n)] = already
        grand["already_folded"] = grand.get("already_folded", 0) + len(already)

        for i in range(len(entries)):
            for j in range(i + 1, len(entries)):
                qa, qb = entries[i].get("q", ""), entries[j].get("q", "")
                score = similarity(qa, qb)
                if score < args.threshold:
                    continue
                kind = classify(qa, qb, score, args.threshold)
                if kind == "fragment":
                    if union.find(i) != union.find(j):
                        edges.append((i, j, round(score, 3)))
                    union.join(i, j)
                else:
                    related.append({"a": i, "b": j, "score": round(score, 3),
                                    "numbers": differing_numbers(qa, qb)})

        groups: dict[int, list[int]] = {}
        for i in range(len(entries)):
            groups.setdefault(union.find(i), []).append(i)

        clusters = []
        for members in groups.values():
            if len(members) < 2:
                continue
            pairs = [(a, b, s) for a, b, s in edges if a in members and b in members]
            clusters.append({"members": members, "pairs": pairs})
        clusters.sort(key=lambda c: -len(c["members"]))
        clusters.extend(resolved_groups)
        resolved_groups = []

        for g in curated_groups:
            grand["curated_groups"] += 1
            grand["curated_folded"] += len(g["idx"]) - 1
        print(f"\n{'=' * 76}\nChapter {n} — {len(entries)} questions, "
              f"{len(clusters)} same-question cluster(s) "
              f"({len(curated_groups)} hand-checked)\n{'=' * 76}")
        for c in clusters:
            if c.get("members") and isinstance(c["members"][0], dict):
                # already applied in an earlier run
                print(f"  already one card ({len(c['members'])} wordings kept): "
                      + " | ".join(str(m.get('q', ''))[:44] for m in c["members"]))
                grand["clusters"] += 1
                grand["entries_in_clusters"] += len(c["members"])
                continue
            print(f"  cluster of {len(c['members'])} "
                  f"(weakest pair {min(p[2] for p in c['pairs']):.2f}):")
            for i in c["members"]:
                e = entries[i]
                occ = len(e.get("occ") or [])
                print(f"    [{i:2d}] x{e.get('repeats', 1)} {str(e.get('year', '')):9s} "
                      f"occ:{occ}  {e.get('q', '')[:94]}")
            grand["clusters"] += 1
            grand["entries_in_clusters"] += len(c["members"])

        if curated_groups:
            print("  groups confirmed by hand (identical question, different wording):")
            for g in curated_groups:
                print(f"    x{len(g['idx'])}: "
                      + " | ".join(entries[k].get("q", "")[:46] for k in g["idx"]))
                print(f"         {g['note'][:110]}")

        if related:
            print(f"\n  NOT merged - {len(related)} related pair(s) that carry their own content:")
            for r in related[:8]:
                print(f"    {r['score']:.2f}  [{r['a']}] {entries[r['a']].get('q','')[:58]}")
                print(f"          [{r['b']}] {entries[r['b']].get('q','')[:58]}"
                      + (f"   numbers only in one: {r['numbers']}" if r["numbers"] else ""))

        grand["pairs"] += len(edges)
        grand["related_pairs"] = grand.get("related_pairs", 0) + len(related)
        report["chapters_related"] = report.get("chapters_related", {})
        report["chapters_related"][str(n)] = related
        report["curated"][str(n)] = [
            {"note": g["note"],
             "members": [{"index": i, "year": entries[i].get("year", ""),
                          "marks": str(entries[i].get("marks", "")),
                          "repeats": int(entries[i].get("repeats", 1) or 1),
                          "q": entries[i].get("q", ""),
                          "has_answer": entries[i].get("answer") is not None}
                         for i in g["idx"]]}
            for g in curated_groups]
        def member_json(m):
            if isinstance(m, dict):   # an already-applied group: text only
                return {"index": None, "year": "", "marks": "", "repeats": 0,
                        "q": m.get("q", ""), "has_answer": None, "occ": []}
            return {"index": m, "year": entries[m].get("year", ""),
                    "marks": str(entries[m].get("marks", "")),
                    "repeats": int(entries[m].get("repeats", 1) or 1),
                    "q": entries[m].get("q", ""),
                    "has_answer": entries[m].get("answer") is not None,
                    "occ": [o.get("paper") for o in (entries[m].get("occ") or [])]}

        report["chapters"][str(n)] = [
            {"members": [member_json(m) for m in c["members"]],
             "applied": bool(c.get("applied")),
             "pairs": c["pairs"]} for c in clusters
        ]

    report["totals"] = grand
    if args.json:
        OUT.write_text(json.dumps(report, indent=1, ensure_ascii=False), encoding="utf-8")
        print(f"\nwritten: {OUT.relative_to(ROOT)}")
    print(f"\nclusters: {grand['clusters']}   entries involved: "
          f"{grand['entries_in_clusters']}   merging pairs: {grand['pairs']}")
    print(f"hand-checked same-question groups: {grand['curated_groups']} "
          f"({grand['curated_folded']} cards folded)")
    if grand.get("already_folded"):
        print(f"groups already applied in an earlier run, wording verified on the "
              f"surviving card: {grand['already_folded']}")
    print(f"related pairs left alone: {grand.get('related_pairs', 0)}")
    if refused:
        print("\ndeliberately NOT merged (recorded in " + CURATED.name + "):")
        for r in refused:
            print(f"  ch{r.get('chapter')}: {r.get('reason','')[:120]}")
    print("Report only - no chapter file was touched.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
