#!/usr/bin/env python3
"""Merge the 148-question bank into the site's own past-question arrays.

The bank (data/question_bank.json) has breadth — every question from 2010-2025
with year, marks and repeat counts — but no answers. The site has depth: 61
questions with written model answers. This tool dedupes the two, raises the
`repeats` counts to the bank's authoritative values, imports the questions the
site never had, and attaches model answers from data/tier_a_answers.json.

Usage (from the project root):

    python tools/merge_past.py                 # report only, writes data/qa_coverage.json
    python tools/merge_past.py --apply         # also rewrite the past arrays in ch*.js
    python tools/merge_past.py --report --limit 5

Answer tiers, per the project plan:
    Tier A  repeated 2+ times, or any Ch5 / Ch6 question  -> answer written by hand
    Tier B  everything else                               -> answer:null + status:"pending"
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys

from sitelib import (ROOT, load_chapters as load_site_chapters, norm_key,
                     normalise_question as normalise, numeric_tokens,
                     similarity, strict_similarity, use_utf8_stdout)

BANK = ROOT / "data" / "question_bank.json"
ANSWERS = ROOT / "data" / "tier_a_answers.json"
COVERAGE = ROOT / "data" / "qa_coverage.json"
OCCURRENCES = ROOT / "data" / "occurrences.json"
CLUSTERS = ROOT / "data" / "duplicate_clusters.json"
ALIASES = ROOT / "data" / "bank_row_aliases.json"
VARIANTS = ROOT / "data" / "variant_answers.json"
BACKUP = ROOT / "_audit" / "pre_merge"

use_utf8_stdout()


def tier_of(num: int, repeats: int) -> str:
    return "A" if (repeats >= 2 or num in (5, 6)) else "B"


def match_chapter(site_past: list, bank_qs: list, threshold: float) -> dict:
    """Pair bank questions with site questions, best match first."""
    pairs: list[tuple[float, int, int]] = []
    for bi, bq in enumerate(bank_qs):
        for si, sq in enumerate(site_past):
            score = similarity(bq["q"], sq.get("q", ""))
            if score >= threshold:
                pairs.append((score, bi, si))
    pairs.sort(reverse=True)

    matched_b, matched_s = set(), set()
    taken = {}
    for score, bi, si in pairs:
        if bi in matched_b or si in matched_s:
            continue
        matched_b.add(bi)
        matched_s.add(si)
        taken[bi] = (si, round(score, 3))

    new = [q for i, q in enumerate(bank_qs) if i not in matched_b]
    return {"taken": taken, "new": new, "matched_site": sorted(matched_s)}


def js_string(text: str) -> str:
    out = (text or "").replace("\\", "\\\\").replace('"', '\\"')
    out = out.replace("\n", " ").replace("\r", "")
    return re.sub(r"\s+", " ", out).strip()


def already_present(bank_q: str, wordings: list[str], threshold: float = 0.8) -> str | None:
    """Is this bank question one we already show - under any of its wordings?

    Once a repeated question is folded into one card, the other papers' wordings
    live inside that card (occ[] and variants[]), not as extra entries. The
    bank's copy of one of those wordings must therefore count as present, or the
    very next merge would re-import exactly the card the fold removed.

    The similarity bar is lower than the import bar (0.8 vs 0.92) because the
    fold has already decided these wordings are one question - but a wording
    carrying DIFFERENT NUMBERS is a different question (the three LCM items,
    the three auto-correlation samples), so numbers must match.
    """
    nb = numeric_tokens(bank_q)
    for t in wordings:
        if not t:
            continue
        if strict_similarity(bank_q, t) < threshold:
            continue
        nt = numeric_tokens(t)
        if nb and nt and nb != nt:
            continue
        return t
    return None


def attach_variants(entries: list[dict], chapter: int, data: dict) -> int:
    """Re-attach the per-paper model answers of folded wordings to their card.

    data/variant_answers.json records, for every wording a fold moved onto another
    card, the card it belongs to (`parent`) and the model answer that paper was
    given. Attaching them here - on every run, not only when something else
    changed - makes that file the owner of those answers, so a later `--apply`
    re-attaches them instead of dropping them. That drop is not hypothetical: the
    answer pass lost all 15 of these, and index.html kept rendering the "its own
    model answer" affordance for wordings that no longer had one.

    Matching is on the parent's TEXT, never its position, because the fold
    re-sorts these arrays. A parent that no longer exists is a loud failure: the
    mapping has gone stale, and quietly discarding a model answer is the bug
    this function exists to prevent.
    """
    rows = [r for r in (data.get("variants") or [])
            if int(r.get("chapter") or 0) == chapter]
    if not rows:
        return 0
    by_text = {norm_key(e.get("q", "")): e for e in entries}
    added = 0
    for r in rows:
        entry = by_text.get(norm_key(r.get("parent", "")))
        if entry is None:
            raise SystemExit(
                f"ch{chapter}: data/{VARIANTS.name} attaches a variant to "
                f"\"{(r.get('parent') or '')[:60]}...\" but no card in this chapter "
                f"carries that text. The card was renamed or removed - update the "
                f"mapping (tools/extract_variant_answers.js regenerates it)."
            )
        existing = list(entry.get("variants") or [])
        seen = {norm_key(v.get("q", "")) for v in existing}
        key = norm_key(r.get("q", ""))
        if not key or not r.get("answer") or key in seen:
            continue
        entry["variants"] = existing + [{"year": r.get("year", ""),
                                         "marks": r.get("marks", ""),
                                         "q": r.get("q", ""),
                                         "answer": r.get("answer", "")}]
        added += 1
    return added


def load_aliases(path: Path) -> dict[str, list[dict]]:
    """Curated "this bank row IS this site card" pairs, keyed by chapter.

    The similarity rules cannot decide every case. When a card is rewritten to
    the wording the paper actually prints, the bank's short summary of the same
    question can fall far below the 0.80 dedupe bar - the 2010 C library row
    scores 0.30 against its own card - and would be re-imported as a second card
    for one question. Loosening the threshold is the wrong fix, because it would
    also start folding genuinely different questions (the three LCM parameter
    sets), so the judgement is recorded in data/bank_row_aliases.json instead.
    """
    if not path.exists():
        return {}
    raw = json.loads(path.read_text(encoding="utf-8"))
    out: dict[str, list[dict]] = {}
    for a in raw.get("aliases") or []:
        out.setdefault(str(a["chapter"]), []).append(a)
    return out


def alias_target(bank_q: str, chapter: int, wordings: list[str],
                 aliases: dict[str, list[dict]]) -> str | None:
    """The site wording this bank row is known to duplicate, or None.

    Fails loudly if the alias points at a wording the chapter no longer carries:
    that means the card was renamed or removed and the alias is now stale - the
    same guard tools/find_duplicates.py applies to its question groups.
    """
    nq = normalise(bank_q)
    for a in aliases.get(str(chapter)) or []:
        if normalise(a.get("bank", "")) != nq:
            continue
        target = normalise(a.get("site", ""))
        for t in wordings:
            if normalise(t) == target:
                return t
        raise SystemExit(
            f"ch{chapter}: {ALIASES.name} says the bank row \"{a.get('bank', '')[:60]}...\" "
            f"is already shown, but the chapter no longer carries the wording it "
            f"points at (\"{a.get('site', '')[:60]}...\"). The card was renamed or "
            f"removed - update or delete that alias."
        )
    return None


def year_key(year: str) -> int:
    m = re.search(r"(20\d\d)", year or "")
    return int(m.group(1)) if m else 0


def fold_duplicates(entries: list[dict], clusters: list[dict]) -> tuple[list[dict], list[dict]]:
    """Fold each paraphrase cluster into ONE card (the "show 1 question" rule).

    Nothing is discarded: every dropped entry's own wording, paper and marks is
    appended to the surviving entry's `occ[]`, so the exact text still reaches
    the page - as an occurrence of one question rather than a second card.

    The incoming `clusters` are produced by tools/find_duplicates.py, which only
    groups entries where one text is contained in the other (or is near
    identical). Merely-related questions (different parameters, different
    integrals) are deliberately left alone there.
    """
    # Members are resolved by their OWN TEXT, not by position: this tool re-sorts
    # and re-writes the chapter arrays, so index-based clusters would fold the
    # wrong question the moment a re-run sees an already-folded chapter. Text
    # keys also make the whole step idempotent - once a paraphrase is folded its
    # text is gone from the array, so a second run simply finds <2 members.
    by_text: dict[str, int] = {}
    for i, e in enumerate(entries):
        tk = norm_key(e.get("q", ""))
        if tk and tk not in by_text:
            by_text[tk] = i

    drop: set[int] = set()
    folds: list[dict] = []
    for cluster in clusters:
        members: list[int] = []
        for m in cluster["members"]:
            if isinstance(m, dict):
                # TEXT ONLY. `m["index"]` is deliberately ignored: the array is
                # re-sorted and re-written on every run, so a stale index points
                # at whatever question happens to sit there now.
                i = by_text.get(norm_key(m.get("q", "")))
            else:
                i = int(m)
                if i >= len(entries):
                    i = None
            if i is not None and i not in drop and i not in members:
                members.append(i)
        if len(members) < 2:
            continue

        def rank(i: int):
            e = entries[i]
            return (e.get("answer") is not None, len(e.get("q", "")), len(e.get("occ") or []))

        keep = max(members, key=rank)
        merged_occ = list(entries[keep].get("occ") or [])
        seen = {o.get("paper") or o.get("year") for o in merged_occ}
        # wording is deduped on the text itself, not on the year: a paraphrase
        # asked in the SAME paper must still reach the page
        seen_text = {norm_key(o.get("q", "")) for o in merged_occ}
        repeats = max(int(entries[i].get("repeats", 1) or 1) for i in members)
        answer = entries[keep].get("answer")
        # Same question, other papers: those entries had model answers of their
        # own (a 2-mark "why" answer reads differently from a 10-mark "why +
        # replication" answer). Folding must not throw them away, so each is
        # carried as a VARIANT - wording plus its own answer - and the page
        # shows them behind one click. See plan.md 3.5.
        variants = list(entries[keep].get("variants") or [])
        seen_var = {norm_key(v.get("q", "")) for v in variants}
        folded = []

        for i in members:
            if i == keep:
                continue
            other = entries[i]
            # its own paper-level evidence first
            for o in other.get("occ") or []:
                key = o.get("paper") or o.get("year")
                if key not in seen:
                    seen.add(key)
                    merged_occ.append(o)
            # then the wording itself, so nothing is lost. If that paper is
            # already listed, its own wording is on the card already - only a
            # genuinely different wording is added.
            tk = norm_key(other.get("q", ""))
            paper_already = str(other.get("year", "")) in seen and tk in seen_text
            if other.get("q") and tk and tk not in seen_text and not paper_already:
                seen_text.add(tk)
                merged_occ.append({"year": other.get("year", ""),
                                   "marks": str(other.get("marks", "")),
                                   "q": other.get("q", "")})
            # the variant, with its answer when it has one of its own
            if other.get("q") and tk and tk not in seen_var and other.get("answer"):
                seen_var.add(tk)
                variants.append({"year": other.get("year", ""),
                                 "marks": str(other.get("marks", "")),
                                 "q": other.get("q", ""),
                                 "answer": other["answer"]})
            for v in other.get("variants") or []:
                vk = norm_key(v.get("q", ""))
                if vk and vk not in seen_var:
                    seen_var.add(vk)
                    variants.append(v)
            if answer is None and other.get("answer") is not None:
                answer = other["answer"]
                entries[keep]["status"] = None
            drop.add(i)
            folded.append({"index": i, "q": other.get("q", "")})

        entries[keep]["occ"] = merged_occ
        entries[keep]["repeats"] = max(repeats, len(merged_occ))
        entries[keep]["answer"] = answer
        if variants:
            entries[keep]["variants"] = variants
        if answer is None:
            entries[keep]["status"] = "pending"
        else:
            entries[keep].pop("status", None)
        folds.append({"kept": keep, "kept_q": entries[keep].get("q", ""),
                      "folded": folded, "occ": len(merged_occ),
                      "variants": [v.get("q", "")[:60] for v in entries[keep].get("variants") or []],
                      "repeats": entries[keep]["repeats"]})

    return [e for i, e in enumerate(entries) if i not in drop], folds


def render_occ(occ: list[dict]) -> str:
    """`occ:[{year,marks,q}, …]` - every paper this question was actually asked in.

    Only entries found in a real paper by tools/extract_occurrences.py ever get
    here, so the list can be shown to the user as evidence.
    """
    items = []
    for o in occ:
        q = js_string(o.get("q", ""))
        if not q:
            continue
        # `paper` carries the exam term ("2019 F", "2012 C"); `year` alone is
        # just the number, and F (Final) vs C (Chance) matters to a student.
        items.append(f'{{year:"{js_string(o.get("paper") or o.get("year",""))}", '
                     f'marks:"{js_string(str(o.get("marks","")))}", q:"{q}"}}')
    return "occ:[" + ", ".join(items) + "]" if items else ""


def render_variants(variants: list[dict]) -> str:
    """`variants:[{year,marks,q,answer}, …]` - the SAME question as asked in
    other papers, each with the model answer written for that paper.

    They exist because folding a repeated question into one card is only safe if
    the other papers' answers survive the fold (plan.md 3.5). Nothing here is
    invented: every entry is a real question that was on the site, with its own
    answer, moved next to the question it repeats.
    """
    items = []
    for v in variants:
        q = js_string(v.get("q", ""))
        a = v.get("answer")
        if not q or not a:
            continue
        if "`" in a or "${" in a:
            raise SystemExit(f"variant answer for {q[:50]!r} contains a backtick or ${{")
        items.append('{year:"' + js_string(v.get("paper") or v.get("year", "")) + '", '
                     'marks:"' + js_string(str(v.get("marks", ""))) + '", '
                     'q:"' + q + '", answer:`' + a.rstrip() + '`}')
    return "variants:[" + ", ".join(items) + "]" if items else ""


def render_past(entries: list[dict]) -> str:
    lines = ["past: ["]
    for i, e in enumerate(entries):
        comma = "," if i < len(entries) - 1 else ""
        occ = render_occ(e.get("occ") or [])
        vars_block = render_variants(e.get("variants") or [])
        head = (f'  {{year:"{js_string(e["year"])}", marks:"{js_string(str(e["marks"]))}", '
                f'repeats:{int(e["repeats"])}, q:"{js_string(e["q"])}",'
                + ((" " + occ + ",") if occ else ""))
        answer = e.get("answer")
        if answer is None:
            body = 'status:"pending", answer:null}'
            lines.append(head + body + comma)
        else:
            if "`" in answer or "${" in answer:
                raise SystemExit(f"answer for {e['q'][:50]!r} contains a backtick or ${{")
            lines.append(head)
            if vars_block:
                lines.append("   " + vars_block + ",")
            lines.append("   answer:`" + answer.rstrip() + "`}" + comma)
    lines.append("]")
    return "\n".join(lines)


def write_chapter(chapter: int, entries: list[dict], apply: bool) -> str:
    path = ROOT / f"ch{chapter}.js"
    src = path.read_text(encoding="utf-8")
    start = src.find("past: [")
    if start == -1:
        raise SystemExit(f"ch{chapter}.js: no past array found")
    end = src.rfind("\n]")
    if end == -1 or end < start:
        raise SystemExit(f"ch{chapter}.js: could not find the end of the past array")
    end += len("\n]")

    block = render_past(entries)
    new_src = src[:start] + block + src[end:]

    if apply:
        # Never overwrite an existing backup: _audit/pre_merge/ holds the ONLY
        # copy of the original question wording, taken before the first merge.
        target = BACKUP / path.name
        if target.exists():
            stamp = "pre_merge_" + __import__("datetime").date.today().isoformat()
            target = ROOT / "_audit" / stamp / path.name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)
        path.write_text(new_src, encoding="utf-8")
    return new_src


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="rewrite the ch*.js files")
    ap.add_argument("--threshold", type=float, default=0.75,
                    help="similarity needed to match a bank question to a site question")
    ap.add_argument("--intra-threshold", type=float, default=0.92,
                    help="similarity needed to treat two bank questions as duplicates")
    ap.add_argument("--limit", type=int, default=4,
                    help="how many new questions to preview per chapter")
    args = ap.parse_args()

    bank = json.loads(BANK.read_text(encoding="utf-8"))
    site = load_site_chapters()
    answers = json.loads(ANSWERS.read_text(encoding="utf-8")) if ANSWERS.exists() else {}

    # Occurrences found in the real papers by tools/extract_occurrences.py,
    # keyed by (chapter, question text). Text-keyed on purpose: this tool
    # re-sorts the arrays, so a positional key would drift onto another question.
    variant_answers = json.loads(VARIANTS.read_text(encoding="utf-8")) if VARIANTS.exists() else {}
    if variant_answers.get("variants"):
        print(f"variants: {len(variant_answers['variants'])} per-paper answer(s) will be "
              f"re-attached to the card they belong to (from {VARIANTS.name})\n")

    aliases = load_aliases(ALIASES)
    if aliases:
        print(f"bank-row aliases: {sum(len(v) for v in aliases.values())} curated bank "
              f"row(s) count as already shown (from {ALIASES.name})\n")

    duplicate_clusters: dict[str, list[dict]] = {}
    if CLUSTERS.exists():
        raw = json.loads(CLUSTERS.read_text(encoding="utf-8"))
        duplicate_clusters = {k: v for k, v in (raw.get("chapters") or {}).items()}
        n_folds = sum(max(0, len(c["members"]) - 1)
                      for cs in duplicate_clusters.values() for c in cs)
        print(f"duplicates: {n_folds} paraphrase entries will be folded into the "
              f"question they repeat (from {CLUSTERS.name})\n")

    occ_lookup: dict[tuple[int, str], list[dict]] = {}
    if OCCURRENCES.exists():
        occ_data = json.loads(OCCURRENCES.read_text(encoding="utf-8"))
        for ch_key, rows in (occ_data.get("chapters") or {}).items():
            for row in rows:
                if row.get("occ"):
                    occ_lookup[(int(ch_key), row.get("q", ""))] = row["occ"]
        print(f"occurrences: {len(occ_lookup)} questions carry paper-level evidence "
              f"(from {OCCURRENCES.name})\n")
    else:
        print("occurrences: data/occurrences.json not found - repeats stay as recorded\n")

    coverage: dict = {"threshold": args.threshold, "chapters": {}}
    totals = {"site": 0, "bank": 0, "matched": 0, "new": 0, "pending": 0,
              "answered_new": 0, "with_occ": 0, "occ_total": 0, "occ_bumped": 0}

    if args.apply and not answers:
        print("! data/tier_a_answers.json is missing — every new question would be "
              "imported as a practice question.\n")

    for n in range(1, 9):
        site_past = site[n].get("past") or []
        bank_qs = bank["chapters"][str(n)]["questions"]
        result = match_chapter(site_past, bank_qs, args.threshold)

        # texts that a paraphrase fold removed from this chapter in an earlier
        # run (they are the cluster members no longer present in site_past)
        live = {norm_key(e.get("q", "")) for e in site_past}
        retired: list[str] = []
        for cluster in duplicate_clusters.get(str(n)) or []:
            for m in cluster["members"]:
                q = (m or {}).get("q", "") if isinstance(m, dict) else ""
                if q and norm_key(q) not in live:
                    retired.append(q)

        merged: list[dict] = []
        for si, sq in enumerate(site_past):
            entry = {
                "year": sq.get("year", ""),
                "marks": str(sq.get("marks", "")),
                "repeats": int(sq.get("repeats", 1)),
                "q": sq.get("q", ""),
                "answer": sq.get("answer"),
            }
            # variants (other papers' wordings + their answers) are carried as
            # they are: a later run rebuilds occ, but it must never drop them.
            if sq.get("variants"):
                entry["variants"] = sq["variants"]
            if entry["answer"] is None:
                entry["status"] = "pending"
            # bank repeats are authoritative — take the larger count
            for bi, (msi, _score) in result["taken"].items():
                if msi == si:
                    entry["repeats"] = max(entry["repeats"], int(bank_qs[bi]["repeats"]))
            # a count is never lowered: take the largest of what the site had,
            # what the bank says, and how many papers we can actually show
            #
            # The occurrences already on disk are CARRIED OVER rather than
            # re-derived: a fold contributes occurrences of its own (the
            # duplicate's wording), and those do not exist in occurrences.json,
            # so rebuilding from the extractor alone would silently delete them
            # on the next run. Union with the extractor's list, deduped by
            # wording, keeps both and makes every re-run a no-op.
            occ = list(sq.get("occ") or [])
            seen_occ = {norm_key(o.get("q", "")) for o in occ}
            for o in (occ_lookup.get((n, entry["q"])) or []):
                tk = norm_key(o.get("q", ""))
                if tk and tk not in seen_occ:
                    seen_occ.add(tk)
                    occ.append(o)
            if occ:
                entry["occ"] = occ
                before = entry["repeats"]
                entry["repeats"] = max(entry["repeats"], len(occ))
                if entry["repeats"] != before:
                    totals["occ_bumped"] += 1
                totals["with_occ"] += 1
                totals["occ_total"] += len(occ)
            merged.append(entry)

        # the bank itself repeats some questions across sub-sections, so also
        # dedupe bank-against-bank before importing. Paraphrases folded away by
        # an earlier run are no longer in site_past, so the bank's twin of one
        # would look "new" and be re-imported as a second card - count them as
        # already present too.
        # Every wording recorded for a question - the card itself, the other
        # papers' wordings it now carries, and the texts a fold retired.
        seen_texts = [e["q"] for e in merged] + retired
        for e in merged:
            seen_texts += [o.get("q", "") for o in (e.get("occ") or [])]
            seen_texts += [v.get("q", "") for v in (e.get("variants") or [])]
        new_entries = []
        duplicates = []
        for bq in result["new"]:
            if any(strict_similarity(bq["q"], t) >= args.intra_threshold for t in seen_texts) \
                    or already_present(bq["q"], seen_texts):
                duplicates.append(bq)
                continue
            # A curated alias: the bank's own compression of a question whose
            # card now carries the paper's wording (data/bank_row_aliases.json).
            if alias_target(bq["q"], n, seen_texts, aliases):
                totals["aliased"] = totals.get("aliased", 0) + 1
                duplicates.append(bq)
                continue
            seen_texts.append(bq["q"])
            key = bq["id"]
            tier = tier_of(n, bq["repeats"])
            answer = answers.get(key)
            entry = {
                "year": bq["year"] or "General",
                "marks": str(bq["marks"] or "5"),
                "repeats": int(bq["repeats"]),
                "q": bq["q"],
                "answer": answer,
            }
            occ = occ_lookup.get((n, entry["q"])) or []
            if occ:
                entry["occ"] = occ
                entry["repeats"] = max(entry["repeats"], len(occ))
                totals["with_occ"] += 1
                totals["occ_total"] += len(occ)
            if answer is None:
                entry["status"] = "pending"
                totals["pending"] += 1
            else:
                totals["answered_new"] += 1
            new_entries.append((tier, key, entry))

        merged.extend(e for _t, _k, e in new_entries)
        before = len(merged)

        folds = []
        if duplicate_clusters.get(str(n)):
            merged, folds = fold_duplicates(merged, duplicate_clusters[str(n)])
            for f in folds:
                totals["folded"] = totals.get("folded", 0) + len(f["folded"])

        # Safety net for the bug class this step is prone to: a cluster that
        # resolves to the WRONG entries removes cards that were never meant to
        # be folded (silent question loss). Exactly one card must disappear per
        # folded paraphrase, never more.
        removed = before - len(merged)
        folded_away = sum(len(f["folded"]) for f in folds)
        if removed != folded_away:
            raise SystemExit(
                f"ch{n}: {removed} card(s) removed but {folded_away} paraphrase(s) "
                f"folded - refusing to write. The duplicate clusters in "
                f"data/{CLUSTERS.name} no longer match this chapter; re-run "
                f"tools/find_duplicates.py --json."
            )

        totals["variants"] = totals.get("variants", 0) + attach_variants(
            merged, n, variant_answers)

        merged.sort(key=lambda e: (-int(e.get("repeats", 1)), -year_key(e.get("year", ""))))

        missing_tier_a = [k for t, k, e in new_entries if t == "A" and e["answer"] is None]
        write_chapter(n, merged, args.apply)

        if not args.apply:
            for f in folds:
                print(f"      fold: keep {f['kept']} (x{f['repeats']})"
                      f"  <- {', '.join(x['q'][:40] for x in f['folded'])}")

        totals["site"] += len(site_past)
        totals["bank"] += len(bank_qs)
        totals["matched"] += len(result["taken"])
        totals["new"] += len(new_entries)
        totals["duplicates"] = totals.get("duplicates", 0) + len(duplicates)

        coverage["chapters"][str(n)] = {
            "site_questions": len(site_past),
            "bank_questions": len(bank_qs),
            "matched": len(result["taken"]),
            "matched_pairs": [{"bank": bank_qs[bi]["q"], "site": site_past[si]["q"],
                               "score": sc} for bi, (si, sc) in sorted(result["taken"].items())],
            "new": [{"key": k, "tier": t, "repeats": e["repeats"], "year": e["year"],
                     "marks": e["marks"], "q": e["q"],
                     "answered": e["answer"] is not None}
                    for t, k, e in new_entries],
            "merged_total": len(merged),
            "duplicates_skipped": [{"id": q["id"], "year": q["year"], "q": q["q"]}
                                  for q in duplicates],
            "paraphrase_folds": folds,
            "tier_a_still_missing_answer": missing_tier_a,
        }

        print(f"ch{n}: site {len(site_past):2d} + bank {len(bank_qs):2d} -> "
              f"matched {len(result['taken']):2d}, new {len(result['new']):2d}, "
              f"dupes skipped {len(duplicates):2d}, merged {len(merged):2d}"
              + (f"   [{len(missing_tier_a)} tier-A answers still needed]"
                 if missing_tier_a else ""))
        for t, k, e in new_entries[: args.limit]:
            flag = "answered" if e["answer"] else ("TIER-A" if t == "A" else "practice")
            print(f"      [{t}|{flag}] {k}  x{e['repeats']} {e['year']}: {e['q'][:78]}")

    coverage["totals"] = totals
    COVERAGE.write_text(json.dumps(coverage, indent=1, ensure_ascii=False), encoding="utf-8")

    print(f"\nsite questions {totals['site']} | bank questions {totals['bank']} | "
          f"matched {totals['matched']} | imported new {totals['new']}")
    print(f"new questions answered from tier_a_answers.json: {totals['answered_new']}")
    print(f"new questions left as practice (answer:null): {totals['pending']}")
    print(f"questions carrying paper-level occurrences: {totals['with_occ']} "
          f"({totals['occ_total']} occurrences, {totals['occ_bumped']} repeat counts raised)")
    if totals.get("variants"):
        print(f"per-paper model answers re-attached to their card: {totals['variants']}")
    if totals.get("aliased"):
        print(f"bank rows matched to an existing card by name, not by similarity: "
              f"{totals['aliased']} (data/{ALIASES.name})")
    if totals.get("folded"):
        print(f"paraphrase duplicates folded into one card: {totals['folded']}")
    pending_a = sum(len(v["tier_a_still_missing_answer"]) for v in coverage["chapters"].values())
    if pending_a:
        print(f"Tier-A answers still to write: {pending_a}")
    print(f"report: {COVERAGE.relative_to(ROOT)}"
          + ("" if args.apply else "   (dry run — pass --apply to rewrite ch*.js)"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
