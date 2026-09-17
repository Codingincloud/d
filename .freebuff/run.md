# Running, serving and publishing this project

> Tracked on purpose: this is the one file under `.freebuff/` that is committed
> (see `.gitignore`), because a fresh clone needs it to preview the site, to put
> it on the internet, and to rebuild the generated artifacts without
> rediscovering how. Everything else in `.freebuff/` (session id, temp scripts,
> logs) stays ignored.

## 0. What is needed to view the site

Two study portals, one shared shell, each shipped as a **prebuilt bundle**:
static files, with **no build step, no package manager, no server-side code and
no dependencies**. A fresh checkout is already viewable; nothing has to be
installed or compiled, and there is no `.env`.

| Course | Built from | **Serve this directory** | Upload this file |
| :--- | :--- | :--- | :--- |
| **DCC** — Distributed & Cloud Computing (BCE7024) | `dcc-site/index.html` | **`dist-dcc/`** | `dcc-study-portal.zip` |
| Simulation & Modeling (BCE7026) | `index.html` | `dist/` | `simulation-study-portal.zip` |

A bundle is only `index.html` + `site.css` + `site.js` + `assets/`: the entry
page's scripts and stylesheets have already been concatenated into one file each,
in the order the page loads them, and marked `defer`. That is the point of the
bundle — 5 requests instead of 21, because a classic `<script src>` is not even
*discovered* until the one before it has run. What is on disk today:

| Archive | Entries | Uncompressed | Carries |
| :--- | ---: | ---: | :--- |
| `dcc-study-portal.zip` | 244 | 12.5 MB | the DCC bundle + its mode sheet + the teacher's 231 slide images (`assets/dcc-slides/`, 232 files with `FIGURES.json`) |
| `simulation-study-portal.zip` | 53 | 8.0 MB | the Simulation bundle + its mode sheet + 41 rendered note pages (`assets/notes/`) |

Both bundles and both archives are **git-ignored generated output**: never edit
anything inside one, and their absence is not a fault. They are on this machine;
rebuild them when a chapter file has changed since they were built, or when the
directory is missing:

```bash
python tools/build_deploy.py --entry dcc-site/index.html --out dist-dcc \
                             --sheet --zip --zip-name dcc-study-portal.zip    # DCC
python tools/build_deploy.py --sheet --zip                                # Simulation
```

Each writes `index.html` at the **root of the output directory**, which is also
the layout every drag-and-drop host wants — see §2. `--sheet` also writes the
mode comparison sheet (§4a) into the bundle, and it has to be a flag on the build
rather than a command after it: the build clears its output directory and the
archive is made by walking it, so a sheet written before is deleted and one
written after is missing from the zip. Both of those happened.

## 1. Serve it locally

### 1a. The DCC bundle — the directory to serve

From the project root:

```bash
python -m http.server 8331 --directory dist-dcc
# -> http://127.0.0.1:8331/   "Distributed & Cloud Computing — Study Portal | BCE7024"
```

`--directory` is not cosmetic. A server started *inside* the bundle
(`cd dist-dcc && python -m http.server`) makes that directory the process's
working directory, and on Windows the next `build_deploy.py` run then cannot
clear it — having already deleted half the files. Serve the parent, point at the
child.

### 1b. The Simulation site instead

One word changes — its bundle is `dist/`:

```bash
python -m http.server 8331 --directory dist
# -> http://127.0.0.1:8331/   "Simulation & Modeling — Study Portal | BCE7026"
```

Only one of the two can sit at `/`, because each bundle carries its own
`index.html` at its root. For both at once, see §1c, or run a second server on a
second port.

### 1c. Both courses, and the live source while editing

Serve the **project root**. Nothing in either entry page or stylesheet is an
absolute path, so a bundle works from any root and is reachable as a
subdirectory, with the live source beside it:

```bash
python -m http.server 8331 --directory .
# http://127.0.0.1:8331/            Simulation, live source (17 scripts, slow)
# http://127.0.0.1:8331/dist/       Simulation, bundle
# http://127.0.0.1:8331/dcc-site/   DCC, live source (17 scripts)
# http://127.0.0.1:8331/dist-dcc/   DCC, bundle
```

Use this while editing chapters: a source edit shows on reload, with no rebuild.
Two caveats, each a wasted pass otherwise:

* **Open it by URL, from a server rooted above `dcc-site/`.** The DCC page loads
  the shared shell as `../engine.js` and `../assets/…`, so a server rooted
  *inside* `dcc-site/` 404s the whole shell and renders an empty frame with no
  styles (`window.CHAPTERS` undefined).
* **Never register a preview by file path.** A file path resolves that one file
  only, so the chapters, the modules and everything under `assets/` 404. Register
  the `http://127.0.0.1:<port>/…` URL. Straight-from-disk `file://` works for the
  *source* tree — the chapters and the analysis data are plain `<script>` tags,
  not `fetch()` — so a server here is a convenience, not a requirement.

### 1d. Ports, and a server that outlives the shell

Check before you pick: `netstat -ano | findstr LISTENING | findstr :8331`. On
this machine **8341 is already taken** by another session's server, loopback-only,
serving the source tree (§1c); 8331 is the bundle's. To let the OS choose instead,
`python -m http.server 0 --directory dist-dcc` prints the port it picked.

Windows / PowerShell, started detached so it outlives the shell — `stdout` and
`stderr` must go to **different** files, or PowerShell fails:

```powershell
$port = 8331
Start-Process -FilePath "python" -ArgumentList "-m","http.server","$port","--directory","dist-dcc" `
  -WorkingDirectory (Get-Location) `
  -RedirectStandardOutput ".freebuff\preview-http.log" `
  -RedirectStandardError  ".freebuff\preview-http.log.err" `
  -WindowStyle Hidden -PassThru | Select-Object -ExpandProperty Id
```

Confirm the pid is alive and the URL answers (`curl -s -o /dev/null -w "%{http_code}\n"
http://127.0.0.1:$port/` → `200`) before using it.

## 2. Put it online — Netlify Drop and similar

Serving a directory and uploading an archive are two routes to the same bytes,
and you do not need both: a local server needs *your* machine on and reachable,
while an upload takes that machine out of the picture entirely. There is no LAN
step and nothing to keep running — the host serves the files, and any phone can
open the URL it hands back.

### 2a. Netlify Drop — one file, no CLI, no account needed

1. Open <https://app.netlify.com/drop>.
2. Drag **`dcc-study-portal.zip`** from the project root onto the page. The
   *archive*, not the `dist-dcc/` folder and not a chapter file — 10.9 MB, so
   give it a few seconds.
3. It answers with a live URL such as
   `https://spiffy-tartufo-1a2b3c.netlify.app`. Open that on any phone: a normal
   public https site.
4. The name is random until you claim the site with a free account (Site
   configuration → *Change site name*). Claiming is also what keeps it from being
   cleaned up. No CLI, no build command, no repo connection: the archive *is* the
   site, because its root is `index.html`.

**The Simulation portal is the same procedure with the other archive.** Each drop
is its own site, so dropping `simulation-study-portal.zip` gives a second URL.
Two courses, two links, both shareable with the class.

### 2b. The stale-archive trap

`--zip` is the only thing that rewrites an archive. Build without it, edit a
chapter, and last week's zip sits on disk next to this week's `dist-dcc/` — drop
that and you publish a site that no longer matches the source, with nothing on the
page to say so. So rebuild with `--zip` immediately before uploading, and look at
what you are about to publish:

```bash
python -m zipfile -l dcc-study-portal.zip | head -5   # index.html must be at the root
python -m zipfile -l dcc-study-portal.zip | wc -l     # 243 entries + a header line
```

### 2c. Other hosts, and the no-account alternative

| Host | How |
| :--- | :--- |
| **Netlify Drop** | The zip, as above. Fastest route from here to a public URL. |
| **Cloudflare Pages** | Workers & Pages → Create → Pages → *Upload assets*, and give it the same zip. |
| **GitHub Pages** | Set up already for the DCC portal — see §2d, which needs no CLI and no token in any command. (Committing the bundle to *this* repo instead would mean deleting the `dist` lines from `.gitignore` and pointing Pages at the repo root; a separate repo is cleaner, since the bundle is generated.) |
| **localhost.run tunnel** | No upload and no account, but it needs this machine awake and the shell session alive. |

```bash
python -m http.server 8331 --directory dist-dcc   # terminal 1
ssh -R 80:127.0.0.1:8331 nokey@localhost.run      # terminal 2 -> prints a public https URL
```

Treat the tunnel as a way to *show* someone the site: the URL lives only as long
as that ssh session, and localhost.run's free tier starts answering `503` after a
while.

What none of these give you is access control. The portal is static files with no
login, so anyone holding the link reads all of it — fine for course notes, and the
reason not to put anything private in the notes or the archives.

### 2d. GitHub Pages — the one to hand out

The DCC portal is published, permanently, from a separate public repo. **This is
the current one:**

    https://codingincloud.github.io/dcc-study-portal-v2/

`Codingincloud/dcc-study-portal-v2` holds **exactly the bundle** — 246 files
(245 + `.nojekyll`; the count follows the build, so `find dist-dcc -type f | wc -l`
is the number to compare against), `index.html` at the repo root, Pages deploying from `main`
at `/`. It survives living at a subpath (`/dcc-study-portal-v2/` rather than `/`)
because nothing in the bundle is an absolute path, which is the same property
that lets `dist-dcc/` be served as a directory. The staging clone is
`.freebuff/pages-v2/` — git-ignored, so the project's own `git status` never
shows it — and the push takes its credential from Git Credential Manager, so no
token goes in any command and none appears in the remote URL.

`Codingincloud/dcc-study-portal` still exists and still serves the **first**
build. It is superseded: it carries the uncorrected layout (prose capped at 528px
in a 1060px left-aligned column) and the first dark palette. Leave it alone until
someone decides whether to redirect or delete it — it may already be in someone's
bookmarks — but do not hand its URL out.

**Re-publishing after a rebuild.** Clear the staging clone first — `cp -r`
overwrites but never deletes, so a file dropped from the bundle would linger and
keep being served:

```bash
python tools/build_deploy.py --entry dcc-site/index.html --out dist-dcc \
                             --sheet --zip --zip-name dcc-study-portal.zip
cd .freebuff/pages-v2
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r ../../dist-dcc/. . && printf '' > .nojekyll
git add -A && git commit -m "<what changed>" && git push origin main
```

The comparison sheet is inside the bundle and therefore published with it: after
a deploy it is at `<the site URL>/theme-sheet.html`. Nothing links to it - a cell
of it *is* the app, so visiting it leaves the last mode it showed stored on that
device - but it is the fastest way to see a palette on a real phone.

This is the same repo and the same URL, so **the link already handed out keeps
working** and just gets better. A *new* repo is needed only when two bundles must
both stay live at once (two `index.html` files cannot share one site root), or
when an old one has to stay frozen exactly as someone bookmarked it.

Pages republishes `main` within about 30–60 s. Poll for a *string you just added*
rather than for `200` — the old bytes serve `200` the whole time:

```bash
B=https://codingincloud.github.io/dcc-study-portal-v2
until curl -s "$B/site.css" | grep -q eveningmix; do sleep 10; done   # live
```

The deployed bytes are **not** byte-identical to `dist-dcc/` on disk: the checkout
has `core.autocrlf=true`, so the commit stores LF and every text file comes back
one byte per line smaller. Confirmed for the v2 rebuild by CRLF-normalising the
local file and comparing — identical. A size difference is not a deploy failure;
a missing new string is.

### The Simulation portal has its own site too

    https://codingincloud.github.io/simulation-study-portal/

`Codingincloud/simulation-study-portal`, created the same way and for the same
reason: two sites cannot share one site root, because each needs its own
`index.html`. It is 54 files (49 assets + entry sheet, script,
`theme-sheet.html` and `.nojekyll`) from `dist/`. The staging clone is
`.freebuff/pages-sim/` — also git-ignored, also publishing with the credential
from Git Credential Manager, so no token appears in any command or remote.

**Re-publishing it** is the DCC recipe with two path changes:

```bash
python tools/build_deploy.py --entry index.html --out dist --sheet --zip \
                             --zip-name simulation-study-portal.zip
cd .freebuff/pages-sim
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r ../../dist/. . && printf '' > .nojekyll
git add -A && git commit -m "<what changed>" && git push origin main
```

Same polling rule as the DCC site: wait for a *string you just added* in
`site.css` or `site.js`, not for `200`. First build answered `404` for about 40 s.

Both sites are now three repos in total, one of which (`dcc-study-portal`) is
superseded and still serving the first build. Do not hand that URL out.

## 3. Reproduce the generated artifacts

None of these are needed to *view* the site; they rebuild the committed outputs.

| Artifact | Rebuild with | Reads |
| :--- | :--- | :--- |
| `ch*.js` `occ[]` / `repeats`, `data/occurrences.json`, `data/occurrence_report.txt` | `python tools/extract_occurrences.py` then `python tools/merge_past.py` (`--apply` to write) | `_source/past_questions.ocr.txt`, `_reference/Simulation_Modeling_Question_Bank.html`, `data/*.json` |
| `data/question_bank.json`, `data/analysis.js` | `python tools/import_question_bank.py` | `_reference/Simulation_Modeling_Question_Bank.html` |
| `data/duplicate_clusters.json` | `python tools/find_duplicates.py --json` | the chapter files (via `node tools/dump_chapters.js`) |
| `data/same_question_merges.json` | `node tools/gen_same_question_merges.js` | `data/duplicate_clusters.json` + the chapter files |
| `data/variant_answers.json` | `node tools/extract_variant_answers.js` | `_audit/pre_answer_pass/` — **ignored**, so this one is machine-local only |
| `dist-dcc/theme-sheet.html` (the side-by-side mode sheet) | `python tools/build_deploy.py --sheet`, or `python tools/make_theme_sheet.py --out <dir>/theme-sheet.html` into a bundle you are not rebuilding | `app.js`'s `THEMES`, `tokens.css`'s blocks, and the derivation in `custom-theme.js` |
| the seed palette `[data-theme="custom"]` in `tokens.css` | `python tools/gen_custom_palette.py` (`--check` to only test) | `custom-theme.js`, via `node` |
| `Simulation_Notes.pdf` | `python build_pdf.py` (`--chapters 5,6,7`, `--no-practice`, `--answers-only` supported) | the chapter files; needs `xhtml2pdf` + `node` |
| `_source/notes/note<N>_p<NN>.jpg` | `python tools/render_notes.py --note 1 --pages 18-31` | the pdf24 PDFs under `C:\Users\ghimi\Downloads\pdf24_ocrPdf\` — **outside the repo**, so the page images cannot be regenerated from a fresh clone |

`merge_past.py` is safe to re-run: `--apply` twice in a row leaves all eight
`ch*.js` byte-identical, and it backs up to `_audit/pre_merge/` (or a dated
folder) only when that backup does not already exist. Always run it **dry
first** and check it prints `imported new 0`.

### Which source each input belongs to

| Source | Lives in the repo? | Consumed by |
| :--- | :--- | :--- |
| `_source/note1.ocr.txt`, `note2.ocr.txt` | **yes** (committed) | the notes cross-check; `render_notes.py` reads the PDFs, not the OCR |
| `_source/past_questions.ocr.txt` | **yes** (committed) | `tools/extract_occurrences.py` (the occurrence trail) |
| `_reference/Simulation_Modeling_Question_Bank.html` | **yes** (committed) | `import_question_bank.py`, `merge_past.py` |
| `_audit/pre_answer_pass/` | no (ignored) | `extract_variant_answers.js` only |
| `_source/notes/*.jpg` | no (ignored) | human page reading only |
| the original note/work PDFs | no (outside the repo) | `render_notes.py` |

The three `_source/*.ocr.txt` files are committed precisely so the occurrence
trail stays re-derivable from a fresh clone; the multi-megabyte page images and
their source PDFs are not.

## 4. Verification

**One command.** The list below used to be retyped by hand, and a gate you retype
is a gate with a memory requirement - the line that gets skipped is the one that
would have failed:

```bash
python tools/run_checks.py            # the gate; stops at the first failure
python tools/run_checks.py --all      # plus the content audits
python tools/run_checks.py -v         # stream each step's output live
```

What it runs, in order - the same steps, so this list is documentation rather
than instructions:

```bash
node tools/dump_chapters.js                  # all 8 chapter files still parse
node tools/test_engine.js                    # the app's pure contracts: exam allocation,
                                             # marking denominators, quiz scoring, search
python tools/validate_site.py                # structural / data / coverage gate;
                                             # also node --checks every script the page loads
python tools/validate_site.py --strict       # syllabus coverage: complete
python tools/extract_syllabus.py --check     # the extracted syllabus still reproduces from
                                             # its own OCR (marks sum to 60, hours to 45)
python tools/syllabus_map.py --check         # every syllabus sub-topic is taught by a named
                                             # section - the map is by section NUMBER, so
                                             # this fails if a sub-topic loses its sections
python tools/fold_orphans.py --check         # no Chapter 1 section is numbered for a topic
                                             # the syllabus does not name (1.5-1.8 used to be)
python tools/move_exam_summary.py --check    # exam-facing material is out of the Learn
                                             # text and into each chapter's pastSummary,
                                             # with a pointer left behind; also runs the
                                             # move/restore self-test
python tools/strip_exam_preamble.py --check  # no chapter opens with "what this unit is
                                             # worth in the exam" or a "read the unit in
                                             # this order" paragraph
python tools/make_reference.py --check       # the figures from the teacher's circled-i
                                             # slides are on the Reference tab, not in
                                             # the notes, and the tab still matches
                                             # data/off_syllabus_slides.json; also runs
                                             # the cut/put-back self-test
python tools/check_themes.py                 # all 9 reading modes hold AA; the mode ids
                                             # agree across tokens.css, app.js and both
                                             # entry pages' boot scripts
node tools/test_custom_theme.js              # the derived mode's contracts over 168 inputs,
                                             # and the link codec round-tripped
python tools/check_themes.py --palettes .freebuff/custom_grid.css
                                             # those 168 derived palettes through the SAME
                                             # contrast list (written by the step above)
python tools/make_theme_sheet.py --check     # the built sheet lists every mode that exists
python tools/voice_rewrite.py --check        # every retired third-person sentence is still
                                             # retired: the original wording gone and the
                                             # replacement present, entry by entry; also runs
                                             # the undo-then-redo self-test
python tools/voice_audit.py --guard          # the two things exempt from the voice audit are
                                             # still just metadata: an attribution may name a
                                             # book (not a deck or a file), and the Past
                                             # pointer is one line of navigation
python tools/revise_blocks.py --check        # every note section has an answer block, each one
                                             # inside the length cap, and no block claims a term
                                             # or a number its own section does not use
python tools/merge_past.py                   # must print "imported new 0"
python tools/check_ch2_coin_game.py
python tools/check_ch3_pure_pursuit.py
python tools/check_ch4_queuing.py
```

Two notes on the runner: `merge_past.py` exits 0 whether or not it imported
anything, so only its output can tell you the importer stopped double-counting -
which is why a step can carry a string it must print. And the two steps that could
have been done by hand are tools for a reason: a sub-topic's coverage and a slide's
mark are both **claims about the source material**, and a claim that lives in the
notes rather than in a check is a claim that quietly stops being true.

#### Where exam-facing material lives

Every chapter's Learn text used to end with an `Exam-facing summary` block - the
"if the question says X, give Y" table, or a run of `Model answer - N marks`
headings. That is paper-facing material in the middle of the teaching text, and
the user asked for it to be moved.

`tools/move_exam_summary.py` moves it without rewriting it: the block becomes the
chapter's `pastSummary` field, `modules/past.js` renders it under that chapter's
cards on the Past tab, `engine.js` indexes it for search, and Learn keeps a
one-line pointer to where it went. Eight chapters had a block; Chapter 1 has none
and is not touched.

**Read the self-test before trusting this tool.** Its first version was only
*nearly* reversible - it used `rstrip()` on both halves, so `--restore` returned a
file that differed from the original in whitespace - and worse, it wrote the new
`learn` field with `</div>`,` on one line, which meant the learn field no longer
ended at a `\n`,\n` boundary. The learn regex then ran straight past its own field
and swallowed the `pastSummary` field whole, and `--restore` deleted the block it
was supposed to put back - silently, across eight files. It was caught by
diffing chapter content against the **built bundle**, which is a verbatim copy of
every source file and was written before the move, and everything was recovered
from it. Two guards exist now: `move_one` refuses any file whose field boundary is
not the expected shape, and `--check` runs a synthetic move-then-restore that must
return the original byte for byte. If the self-test fails, do not run `--apply`.

#### The third-person voice, and how to continue it

The notes used to read as somebody describing a class deck and a question paper
("the deck states …", "both halves of the first definition are load-bearing, and the
exam answer is stronger if you say why") rather than as teaching. `PLAN.md` is the
plan and the status board for removing that voice; `tools/voice_audit.py` is the
measurement, and it prints a per-chapter count of every sentence that talks about the
deck, the source, the paper, the reader's strategy, the unit, or **the writing itself**
instead of the subject. The last of those is the `recount` family — "The reading order is
the order to work through", "Two sentences close the unit", "Three things in that
definition are worth pulling out" — which the reader named by quoting Unit 3's opener.
Those sentences have no subject outside the notes, so they cannot be asked for in an
exam, and the patterns for them are written against the shapes that occur here rather
than against the idea of a meta sentence: "Four things have to be kept under control"
is a list label and is deliberately left alone.

The fix is a reviewed catalogue, not a regex: `tools/voice_rewrite.py --context ch4`
prints each tell with the exact HTML around it, an entry in
`data/voice_rewrites.json` says what replaces it and why, `--apply` writes it, `--check`
proves every entry is still in force, and `--roundtrip` undoes every recorded pass and
redoes it, requiring the files back byte for byte. Three things to know before editing
that catalogue:

* `find` must occur **exactly once** in the chapter, or the whole file is refused;
* an entry that deletes text and re-running it after another tool has moved the text is
  the failure mode to watch - a `find` that has quietly stopped matching is how a
  rewrite silently stops being applied, which is why `--check` is a gate step;
* **two things are exempt from the audit and guarded instead**: the attribution span
  beside a definition (`(Tanenbaum & Van Steen)` - naming a book once is allowed) and the
  one-line Past-questions pointer that `move_exam_summary.py` writes. `voice_audit.py
  --guard` fails if either starts doing something else.

#### Writing an edit, since HTML is where the time goes

A batch of edits is written as prose in `data/voice_curate*.json` - one file per round,
out of one file's worth of scrolling - and `--curate` resolves each one against the
chapter file and appends the exact markup. Points worth knowing:

* an entry is `old`/`new` (the sentence to change, the sentence to put in its place),
  or `find`/`to` written out in full when prose cannot express it: a deletion that has
  to take a whole callout box with it, or a replacement whose words straddle a `<b>` or
  a `<code>`. A `find` that does not match the file **exactly once** is refused, so a
  stale exact entry fails at curating time rather than at applying time;
* `"which": n` picks among identical occurrences. Markup is full of them: a table
  header that is also the first words of the sentence under it, a caption repeated on
  two figures;
* the resolver matches against the file's *plain text*, so entities are written as the
  characters they stand for (`&mdash;` is written `—`, `&ldquo;` is written `"`) and
  the tool maps back to the exact bytes;
* a replacement that has to change text inside a tag is refused and printed with the
  HTML span it matched, to paste in as an exact entry;
* **an entry that supersedes an earlier one should sit inside it.** `--check` excuses a
  missing replacement when a peer was written over the same words, and it decides that
  by one span containing the other — so an entry whose `find` runs past the end of the
  earlier entry's `to` reads as a revert. That happened once, on Unit 8's "top-of-list
  challenges", and the fix was to shorten the new span until it nested rather than to
  loosen the check.

**A pass covers the `learn` field only.** The quiz explanations, the Past tab's answers,
and the captions and group headings in the `slides` and `reference` fields carry the
same tells and are their own pass — 147 of them when the notes were taken to zero
(most in those two `slides` fields, whose captions are the pictures waiting on R10's
written lines), because a quiz explanation that says "the deck flags this" is the same
defect in a different pane. `find` outside `learn` needs `voice_rewrite.py` extended
the way `ref_slide_notes.py` was, not a new tool.

#### The teacher's marks, and where that material lives now

`tools/dcc_marks.py` finds the slides the teacher marks with his Information icon
(a circled i) by searching the decks for the icon's own id, `Icons_Information` -
not by looking for a filename or a shape. It found 28 marked slides; 10 of them are
figures the site displays, and `data/off_syllabus_slides.json` records every one
with the section that shows it.

**The sign means reference material, so that is where it went.** The reader read
the mark the way the teacher means it and asked for the notes to read without it,
so `tools/make_reference.py` takes the figures that came from a marked slide OUT of
each chapter's `learn` text and into a chapter's `reference` field, which
`modules/reference.js` draws on the **Reference** tab: the figures grouped under
the heading of the section they were lifted from, with a line naming the deck and
slide. The section itself stays in the notes, because the syllabus names it - four
of the marked slides carry the Bully algorithm, which the teacher's own Model
Question 2025 asks for 8 marks.

The tab appears only in the chapters that have material behind it, and a link to it
elsewhere falls back to the notes and rewrites the address. An earlier treatment of
this same discovery painted a chip onto each marked figure inside the notes; that is
gone, and `make_reference.py --check` fails if a chip comes back. Two limits are
recorded in the tool rather than hidden: Ch5's deck is a legacy `.ppt`, which needs
LibreOffice to read, and a figure that came from a PDF cannot be scanned for an icon
at all.

**The tab has a second, larger block: the teacher's other slides.** The notes used
to paste **201** of them inline, and `tools/slim_dcc_figures.py` moves the **197**
that no sentence in the notes points at into each chapter's `slides` field. Four
stay in `learn`, each named by a sentence in its own section and listed in
`tools/dcc_figure_keepers.json`; the 20 hand-built SVG diagrams are never touched.
Captions come from `tools/figcaptions.py`, which says what a picture shows or emits
no caption at all — never the section heading (`Figure for 4.3.4 …`) and never a
file name, which is what the reader quoted back. Both writers of this tab import
it, so the two blocks cannot drift apart.

Three things about that move are worth knowing before touching it.

* **The state is provable; a byte-exact undo is no longer available.** Each change
  was recorded as `{field, index, cut, put}` in `data/slim_figures.json`, which
  `--restore` inverted — and both bugs this tool shipped with were invisible to
  reading it. The first `--restore` put 7 of 9 chapters back wrong: the position of
  an operation in the worked-on text is its original index minus what was taken out
  ahead of it **plus what was put in**, and for a pure cut that second term is zero,
  so the formula looked right and only a block rewritten in place went wrong —
  landing tens of characters away, inside the next paragraph. The second: the
  off-syllabus dump was cut twice, once as a block and once figure by figure. Both
  are fixed. The undo itself is gone: the journal belonged to that one run and the
  text it held existed nowhere else, so a second `--apply` after the fact overwrote
  it, and it has been removed rather than left as a file that a future `--restore`
  would act on. Two guards stop a repeat — `--apply` refuses a unit that already has
  a `slides` field, and `--restore` refuses to remove a tab holding pictures its
  journal cannot put back — and `--check` proves the state with no journal at all:
  it takes all **231** pictures from `assets/dcc-slides/FIGURES.json`, requires each
  to be on exactly one page, and requires everything left in `learn` to be one of
  the four keepers. If the notes ever need the pictures back, the way is
  `place_dcc_figures.py`, which re-derives the placement.
* **Order matters, and the tools do not guard each other.** `place_dcc_figures.py`
  strips every `<!-- dcc-fig: -->` block it can find and re-derives placement from
  scratch, so running it after this tool puts all 201 pictures back into `learn`.
  `make_reference.py --restore` records positions in the notes as they were before
  *its* move, so it is only valid before this one. The order is:
  `extract_dcc_figures` → `place_dcc_figures` → `make_reference` →
  `slim_dcc_figures`.
* **Moving a picture moves its caption and its sentences.**
  `voice_rewrite.py --check` looks for an applied replacement across `learn`,
  `reference` and `slides` together, not just `learn`, because a caption travels
  with its picture to another panel — and two ch2 sentences that promised "the
  figures below" were re-pointed at the tab, with their catalogue entries updated
to match.

**`--restore` is proved, not assumed.** The recorded cut is the text that goes
back, so `--check` runs a cut/put-back self-test every gate run, and the first
version of this tool failed it: the recorded position is a position in the *full*
text, and putting a block back into the text the figures were cut from has to
subtract everything cut ahead of it - without that, two of the four Bully figures
landed in the middle of a paragraph further down the page. Two blocks that sit
directly after one another also land on the same position, and they are put back
last-first for exactly that reason. Both cases are in the self-test's input now,
and the failure is reproducible by deleting either rule.

#### Revising a section instead of reading it

The reader's second complaint is about shape, not wording: the Simulation site's
notes are the ones that are *"directly upto point best for exam"*, and a DCC section
is not. Measured with the same splitter this tool uses (unit titles out): **57 words**
median in the Simulation sections against **252** in the DCC ones, 128 DCC sections
over 200 words, and a longest paragraph of **216**. Both sites share the shell and the
stylesheets, so the difference is the writing. Total: 16,388 words against 53,434.

`tools/revise_blocks.py` writes one short **revise block** above every note section —
the answer in a sentence, then the terms and numbers as bullets — capped at 90 words.
The blocks are hand-written in `data/dcc_revise.json`; the prose underneath is not
touched, so nothing can be lost. Three things to know before writing more:

* **The guard is anti-invention.** A block may compress its section; it may not add to
  it. `--check` fails if a term the block marks **bold** is not a term that section
  uses, or if a number it quotes is not in the section — which is what caught
  `Call semantics must be the same locally and remotely.` (a sentence the section does
  not make) and two step numbers from the wrong section on the first run. It also
  fails on a section with no block, a block over the cap, an unbalanced tag, and any
  mention of the deck, the notes, the source or the exam.
* **`--strict` is the count still to write, and it is a known gap** (141 sections);
  the plain `--check` is the gate step. **Order matters**: `--strict` also fails on a
  real defect, so it must sit *after* the plain step in the runner or the gap entry
  would swallow the failure. **Unit 2 is written** (30 blocks, mean 70 words).
* **`--apply` cannot be run twice and the inverse needs no journal.** The field is one
  physical line, so `--restore` recomputes what it removes instead of trusting a
  recorded file, and `--roundtrip` proves apply + restore byte-exact on the real
  chapters. R9's journal is why: a second `--apply` overwrote it and a `--restore`
  would then have deleted 106 pictures without a word.

The heading-to-key rule — a section's number, or its text as a slug — is implemented
in **two languages** (`tools/revise_blocks.py` writes the keys, `engine.js`'s
`injectRevise` looks them up), so four contracts in `tools/test_engine.js` pin it.
A drift there is silent: a block whose key matches no heading simply is not drawn.

**Revise mode** is the switch in the notes bar — `body.revise-mode`, rules in
`foundation.css` §22, the state in `localStorage`. It hides a section's own `<p>`
children and keeps the blocks, lists, tables, callouts and figures. Paragraphs inside
a callout or a figure are not direct children, which is exactly why they stay. On
Unit 2: 58 visible section paragraphs to none, 30 blocks still there. It prints
complete, and the switch is only drawn for a chapter that has blocks.

**`--list` for the pictures is the other tool's, not this one** — do not confuse
`revise_blocks.py --report` (what each section has) with `ref_slide_notes.py`'s
counts; the two passes both number in the hundreds and both are reported as gaps.

**The tab the pictures land on has to teach, and that is R10.** Two steps on it:
`ref_slide_notes.py --check` (a line that goes missing, reads differently from the
catalogue or reverts to filler) and `--strict` (the count of pictures still to
write, held as a known gap so the number can only move when it moved). The lines
live in `tools/dcc_slide_notes.json`, one written line per picture, read off the
picture itself. **Do not generate them**: scoring each sentence of the section a
picture was cut from against the picture's own words was measured over all 217 and
produced a line for 36 of them, most of them the section heading glued to the
section's opening sentence — the same filler, arrived at by machine.

* **A picture with no line keeps its honest label instead of getting a sentence.**
  153 of the 217 slides are image-only, with nothing in the OCR and nothing to
  caption from. Writing a description of a picture nobody has looked at is the
  failure mode this whole iteration is measured against, so the catalogue is
  silent and `--strict` reports the count.
* **The group heading is a link back into the notes** (`modules/reference.js`,
  matched on heading text with entities decoded — the notes write `&mdash;` where
  the tab holds a literal —, which is what made 11 of 79 headings look renamed when
  nothing had been). A heading with a section number *must* exist in the notes:
  `ref_slide_notes.py --check` fails otherwise, so a renamed section cannot quietly
  cost the reader the way back.

**Two shifts, and the inverse is not the other one.** `ref_slide_notes.py` records
every index on the untouched text. Applying them in that order needs the running
shift — each edit moves everything after it by what it added minus what it took
out, the same rule `slim_dcc_figures.py` learned the hard way. Undoing them in that
order needs **no** shift at all: every earlier edit's growth has already been taken
back out by the time the next one is looked for. Getting that backwards does not
look like a bug in the shift; it looks like a corrupt file, 120 characters from
where the edit really is. `--roundtrip` is what catches it, before anything is
written — and it has to be run on the real files, because the failure was invisible
to reading the code.

Text that the index carries is **text, not markup**: the search panel draws a
title or a snippet as text, so `buildIndex` decodes HTML entities before handing
an entry over (`&mdash;` in a heading used to show up in the result list as
`&mdash;`). The map is a table rather than the DOM because `engine.js` also runs
under node in `tools/test_engine.js`, and three contracts pin it.

One step is a **known gap**: `check_note_pages.js` (19 of 41 rendered note pages
are uncited) is reported on
every run and does not fail the suite, because a gate that is always red is a gate
nobody reads. It prints a notice if it starts passing, so the entry cannot rot.

### 4a. Looking at the page, when the change is visual

None of the above ever renders anything, and no layout claim can be settled by
reading CSS. The rendered check is a headless Edge screenshot plus the stdlib PNG
reader in `.freebuff/probe/` (ignored session state - regenerate it if gone):

```bash
cmd //c "C:\<repo>\.freebuff\probe\shot.bat http://127.0.0.1:8331/ shot.png 1680 1050"
python .freebuff/probe/png.py map   shot.png 112 34   # coarse text map of the page
python .freebuff/probe/png.py bands shot.png 105      # ink per band: shows a void on the right
```

Three things about that, each of which cost a pass to rediscover:

* `msedge.exe` run straight from the shell **returns exit 0 at once, prints
  nothing and writes no file** - it hands the request to the Edge that is already
  running, and a GUI binary has no console to print on. It has to go through
  `cmd //c`.
* Even then the PNG lands a second or two *after* the batch returns, because the
  launcher exits before the headless process has finished. Re-check the file
  before concluding it failed.
* `--virtual-time-budget=15000` is what makes it wait for the app to render.
  Without it the shot is taken before `site.js` has drawn the chapter.

**If the page refuses to show an edited chapter, it is the offline worker's cache,
not your edit.** The service worker registered by a *bundle* page keeps its
responses in a `Cache Storage` entry named `offline-<hash>`, and those responses
are served to the **source** page too - a stale `ch1.js` came back 200 with the old
bytes while the server had the new file, which looks exactly like a failed edit.
Clear it before believing a screenshot, from the console of any page on the origin:

```js
// Deleting the caches alone is not enough: a registration that is still active
// re-populates them on the next load. Unregister first, then delete, then reload.
navigator.serviceWorker.getRegistrations()
  .then(rs => Promise.all(rs.map(r => r.unregister())))
  .then(() => caches.keys())
  .then(ks => Promise.all(ks.map(k => caches.delete(k))))
```

Then reload. One rebuild left three stale registrations on this origin, and only
the unregister step made the fresh `site.js` load.

**Compare a fetched file to the disk by characters, not bytes.** `fetch('site.js')`
followed by `.text().length` returns JavaScript string length, so a bundle that is
1 061 138 *bytes* on disk reports 1 060 532 *characters* - the difference is the
multi-byte em dashes and quotes, not a stale response. Measuring bytes against
characters looks like a 606-byte difference and sends you hunting for a cache that
is not there.

**Wait for the app to boot before reading the DOM.** The shell draws the sidebar
first and the chapter a moment later, so a DOM read taken immediately after
registering a preview finds an empty content pane - `document.querySelectorAll`
returns 0 for elements that appear a second later. A reload, or a read taken after
the first render, is what shows the chapter.

**And if a rebuilt bundle still renders the old markup, change the origin.** Clearing
`Cache Storage` and unregistering every worker is not always enough: the webview holds
its own copy of `site.js` against the URL, so after a rebuild that changed `engine.js`
the page still rendered the previous markup - 0 new elements, 14 of the old ones - while
`grep revise-lead dist-dcc/site.js` on disk found the new code twice. What works in one
step is a second server on a fresh port against the same bundle, and registering the
preview against that origin. `dist-dcc/` and `dist/` can be served from two ports at
once; only the registration has to move.

**Do not edit text inside a recorded voice rewrite.** `tools/voice_rewrite.py` records
its replacement text verbatim and `--check` fails when that text is not on the page, so a
later pass editing inside one of those passages reports a revert. Two sentence splits hit
this and took two chapters out of the gate; both were withdrawn rather than fixed by
editing the catalogue, because a changed `to` breaks the entry's fingerprint and the
`--restore` and `--roundtrip` that depend on it. Re-check with
`python tools/voice_rewrite.py --check` before and after any pass that rewrites prose. `curl`ing the file proves the server is fine; only the browser cache
can be wrong.

**A rebuilt stylesheet can be the same trap, and the document cache-bust does not
fix it.** On the palette pass the new `site.css` was on disk and served (`curl`
returned it, 3 hits of the new `--bg`), the document was re-loaded with `?v=2`,
and the page still reported the old palette — the webview held its own copy of
that URL and re-served it even on a `?v=` link. What worked, in one step: start a
second server on a fresh port against the same bundle and register the preview
against that origin, because a new origin has an empty cache.

```bash
nohup python -m http.server 8342 --directory dist-dcc >/dev/null 2>&1 &   # then register 8342
```

**And clearing it is not enough by itself: the page has to be loaded again.**
Navigating to the hash it is already on does not re-fetch `course.js`, `app.js` or
the chapter files, so the *old* modules keep running with the *new* files on disk -
which looks like a real bug in the app. The giveaway is a value the page reports
that no file on disk contains: `COURSE.tabs` came back without `reference` while
`curl /dcc-site/course.js` had it, because the modules in memory came from the
cache the page was first loaded with. Clear the caches, then load the page with a
query that makes it a different document (`?bust=1#/ch/3/reference`) and check the
value again before believing anything the page says.

**When the webview will not composite, measure instead of looking.** The screenshot
route above fails with "it produced no frames" in some sessions, and there is no
point reloading for it repeatedly: geometry and computed style answer most of the
same questions and are reproducible. Three that have each caught a real bug - a
tab that `hidden` did not hide (`display:inline-flex` beats the user agent's rule),
a progress line that was supposed to sit on the header's edge (`|prog.y+prog.h -
(topbar.y+topbar.h)| <= 1`), and a pill that had to stay inside the floating column
to not cover the buttons - are all one `preview_evaluate` call.

**Forcing a mode or a width is now a URL, not a patched copy of the entry page.**
The shared-appearance link does exactly this job, so point the shot at it:

```bash
cmd //c "C:\<repo>\.freebuff\probe\shot.bat \
  'http://127.0.0.1:8331/?t=sunsetwine&w=full' wine.png 1680 1050"
```

The boot script applies `t`/`w`/`c` before first paint and `applyLink()` persists
them, so the page renders in that mode and stays there. (The old recipe - copy the
entry page into `dist-dcc/`, replace `var t=localStorage.getItem(...)` and set the
storage in the same script - still works, but it is now more work for the same
result.)

**Give each probe run its own Edge profile.** `shot.bat` takes a profile name as
its fifth argument and defaults to `ep`; a *persistent* profile applies heuristic
freshness to `python -m http.server` responses, which send no `Cache-Control`, so
a run can be served the **previous** version of a script and report a bug that was
already fixed. `shot.bat ... w5.png 1400 900 ep6` after `rm -rf .freebuff/probe/ep6`
is what settled the link codec - the first two runs failed with
`ct.link is not a function` against a file that had contained `link:link` for
half an hour.

To look at every mode at once instead of one at a time:

```bash
python tools/build_deploy.py --entry dcc-site/index.html --out dist-dcc --sheet
# then open http://127.0.0.1:8331/theme-sheet.html   (cells are the real pages)
```

Plain `msedge.exe` (without `cmd //c`) will not render at all - it delegates to
the Edge already running and exits. To *measure* a narrow viewport instead of
looking at one, park real `width="390"` iframes off-screen in a probe page and
have it beacon the numbers back as an image request:
`new Image().src='/probe-report/X?d='+encodeURIComponent(...)` lands in the
serving `python -m http.server` log as a 404 with the whole payload in the path.
That is how the phone top bar and the comfort/full column widths were settled, and
it beats reading a PNG for anything numeric. **Delete any `_*.html` probe copies
from `dist-dcc/` before publishing** - a plain rebuild does not remove them, and
they would ship.

