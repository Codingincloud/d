#!/usr/bin/env python3
"""dcc_scaffold.py — write a chapter file per syllabus unit, if it is missing.

The portal is built chapter by chapter, so between the shell working and the
notes being written the site would otherwise load nine scripts that do not
exist. This writes the missing ones as an explicit, honest placeholder: the
chapter appears in the sidebar, opens, and says which syllabus sub-topics it
will cover and which extracted source it will be written from — rather than
being silently absent or, worse, quietly pretending to be finished.

It never overwrites a chapter that already carries notes. `--force` rewrites
placeholders only.

The source list is READ from `_source/dcc/MANIFEST.json`, not written down here.
Hand-listing the filenames got Chapter 3, 4, 5 and 8 wrong, because
`out_name()` prefixes a chapter's own folder slug and those four folders are
already named "Chapter N ..." — so the file is `ch3_ch_3_sync_and_cordn.txt`
and not `ch_3_sync_and_cordn.txt`. Deriving it means the placeholder names the
file that actually exists.

Usage
-----
    python tools/dcc_scaffold.py            # fill in what is missing
    python tools/dcc_scaffold.py --list     # what exists, what is still a stub
    python tools/dcc_scaffold.py --force    # rewrite the placeholders
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'dcc-site'
MANIFEST = ROOT / '_source' / 'dcc' / 'MANIFEST.json'

# The unit headings and sub-topics, read off the syllabus PDF
# (_source/dcc/syllabus_distbd_cloudcomptng.txt, pages 1-2). Kept here so a
# placeholder cannot drift from what the exam actually lists.
UNITS = {
    1: ('Introduction to Distributed Systems', 4, [
        '1.1 Definition and characteristics',
        '1.2 Goals of distributed systems',
        '1.3 Examples: Google File System, Hadoop, BitTorrent, etc.',
        '1.4 Models: Client-server, Peer-to-peer, Multitier',
    ]),
    2: ('Communication in Distributed Systems', 7, [
        '2.1 Remote Procedure Calls (RPC)',
        '2.2 Remote Method Invocation (RMI)',
        '2.3 Message Passing and Serialization',
        '2.4 Sockets and Web services (REST & SOAP)',
    ]),
    3: ('Synchronization and Coordination', 5, [
        "3.1 Clock Synchronization: Cristian's Algorithm, NTP",
        "3.2 Logical Clocks: Lamport's and Vector Clocks",
        '3.3 Mutual Exclusion Algorithms (Ricart-Agrawala, Token Ring)',
        '3.4 Election Algorithms (Bully, Ring)',
    ]),
    4: ('Distributed File Systems and Middleware', 5, [
        '4.1 DFS concepts: Transparency, Naming, Replication, Consistency',
        '4.2 NFS, HDFS',
        '4.3 Middleware: CORBA, Java RMI, Messaging (MQTT, AMQP)',
    ]),
    5: ('Introduction to Cloud Computing', 4, [
        '5.1 History and evolution of cloud',
        '5.2 Characteristics and benefits',
        '5.3 Cloud service models: IaaS, PaaS, SaaS',
        '5.4 Cloud deployment models: Public, Private, Hybrid, Community',
    ]),
    6: ('Virtualization and Cloud Architecture', 6, [
        '6.1 Basics of virtualization: Hypervisors (Type I & II)',
        '6.2 Virtual Machines vs Containers',
        '6.3 Cloud reference architecture',
        '6.4 Resource management and provisioning',
    ]),
    7: ('Cloud Platforms and Technologies', 4, [
        '7.1 Overview of AWS, Microsoft Azure, and Google Cloud',
        '7.2 Storage services (S3, Blob, etc.)',
        '7.3 Compute services (EC2, Lambda, GCE)',
    ]),
    8: ('Security and Challenges in Cloud', 6, [
        '8.1 Data security, privacy, and compliance',
        '8.2 Identity and access management (IAM)',
        '8.3 Service Level Agreements (SLA)',
        '8.4 Cloud vulnerabilities and risk mitigation',
    ]),
    9: ('Emerging Trends in Distributed and Cloud Computing', 4, [
        '9.1 Edge and Fog Computing',
        '9.2 Serverless Architecture',
        '9.3 Kubernetes and Docker',
        '9.4 Cloud-native and Microservices',
    ]),
}


def sources_by_unit() -> dict[int, list[str]]:
    """Map each syllabus unit to the extracted files that cover it.

    A source belongs to a unit when one of its path segments is named for that
    unit ("Chapter 3 - ...", "Chapter_5_Introduction ..."). The number is in the
    SECOND segment of most of these — the first is "Lecture Notes - all
    Chapterwise" — so every segment is checked rather than just the first, which
    is the mistake that made an earlier version report 0 sources for all nine
    units. Units 7 and 9 have no folder at all, and the placeholder says so
    rather than inventing a source for them.
    """
    if not MANIFEST.is_file():
        sys.exit(f'dcc_scaffold: {MANIFEST.relative_to(ROOT)} not found — '
                 f'run tools/dcc_extract.py first')
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    out: dict[int, list[str]] = {}
    for rel, info in sorted(manifest.items()):
        if info.get('error'):
            continue
        n = None
        for part in Path(rel).parts:
            # (?!\d) rather than \b: the separator after the number is often an
            # underscore, and `_` is a word character, so a word boundary never
            # fires there — which is why "Chapter_5_Introduction to Cloud
            # Computing" matched nothing and reported 0 sources.
            m = re.match(r'chapter[\s_-]+(\d+)(?!\d)', part, re.IGNORECASE)
            if m:
                n = int(m.group(1))
                break
        if n and 1 <= n <= 9 and info.get('out'):
            out.setdefault(n, []).append(info['out'])
    return out


STUB = """/* Chapter {n} — {title}. PLACEHOLDER.

   Scaffolded by tools/dcc_scaffold.py because the shell loads ch1..ch9 and a
   missing file would be a silent hole in the sidebar. Replace this whole object
   with real notes; the tool will not overwrite a chapter that has them.

   Syllabus unit {n}: {hours} hours, {marks} marks. Sub-topics:
{bullets}
*/

window.CHAPTERS = window.CHAPTERS || {{}};
window.CHAPTERS[{n}] = {{
  learn: `
<h2>Unit {n} — {title}</h2>
<p class="unit-meta">Syllabus: {hours} hours &middot; {marks} marks</p>

<div class="concept-box warn">
<h4>Notes for this unit are still being written</h4>
<p>Chapter 1 is written. The rest are being built unit by unit from the class
lecture notes; this page lists exactly what this unit has to cover, so the
sub-topic list can be revised from here in the meantime.</p>
</div>

<h2>What this unit covers</h2>
<ul>
{bullets_html}
</ul>

<h2>Where the material is</h2>
<p>The unit's own lecture material has already been read into text and is what
these notes will be written from:</p>
<ul>
{sources_html}
</ul>
`,
  quiz: [],
  past: []
}};
"""


def stub_text(n: int, marks: int, sources: list[str]) -> str:
    title, hours, subs = UNITS[n]
    bullets = '\n'.join(f'     * {s}' for s in subs) + '\n'
    bullets_html = '\n'.join(f'<li>{s}</li>' for s in subs)
    if sources:
        sources_html = '\n'.join(
            f'<li><code>_source/dcc/{s}</code></li>' for s in sources)
    else:
        sources_html = ('<li>No dedicated lecture deck was uploaded for this unit '
                        '&mdash; it will be written from the recommended '
                        'textbooks and the syllabus unit heading.</li>')
    return STUB.format(n=n, title=title, hours=hours, marks=marks, bullets=bullets,
                       bullets_html=bullets_html, sources_html=sources_html)


def main() -> int:
    p = argparse.ArgumentParser(description='scaffold missing DCC chapter files')
    p.add_argument('--force', action='store_true',
                   help='rewrite placeholders too (never a written chapter)')
    p.add_argument('--list', action='store_true')
    args = p.parse_args()

    course = (SITE / 'course.js').read_text(encoding='utf-8')
    m = re.search(r'examWeights:\s*\[([^\]]+)\]', course)
    if not m:
        sys.exit('dcc_scaffold: could not read examWeights from dcc-site/course.js')
    marks = [int(v) for v in m.group(1).split(',')]

    by_unit = sources_by_unit()
    written, stubbed, created = [], [], []
    for n in range(1, len(UNITS) + 1):
        path = SITE / f'ch{n}.js'
        body = path.read_text(encoding='utf-8') if path.is_file() else None
        is_stub = body is not None and 'PLACEHOLDER' in body
        if args.list:
            state = 'missing' if body is None else ('placeholder' if is_stub else 'written')
            chars = len(body) if body else 0
            print(f'  ch{n}.js  {state:<12} {chars:>7,} B  '
                  f'{len(by_unit.get(n, []))} source(s)  {UNITS[n][0]}')
            continue
        if body is not None and not is_stub:
            written.append(n)
            continue
        if body is not None and not args.force:
            stubbed.append(n)
            continue
        path.write_text(stub_text(n, marks[n - 1], by_unit.get(n, [])),
                        encoding='utf-8')
        created.append(n)

    if args.list:
        return 0
    print(f'  written:     {written or "none"}')
    print(f'  placeholder: {stubbed or "none"}  (kept)')
    print(f'  created now: {created or "none"}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
