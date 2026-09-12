# Running this project locally

> Tracked on purpose: this is the one file under `.freebuff/` that is committed
> (see `.gitignore`), because a fresh clone needs it to preview the site and to
> rebuild the generated artifacts without rediscovering how. Everything else in
> `.freebuff/` (session id, temp scripts, logs) stays ignored.

## 0. What is needed to view the site

The deliverable is a **static site** — `index.html` + `engine.js` + `app.js` +
`ch1.js`…`ch8.js` + `assets/` — with **no build step, no package manager and no
dependencies**. A fresh checkout is already viewable; nothing has to be installed
or compiled, and there is no `.env`.

## 1. Start a local server on a free port

Any static file server rooted at the repo root works. To dodge "port already in
use", let the OS pick a free one — `http.server 0` prints the port it chose:

```bash
# from the repo root
python -m http.server 0 --bind 127.0.0.1
# -> Serving HTTP on 127.0.0.1 port 54321 ...  (open that port)
```

If you need the number up front (e.g. to pass it to a preview or `curl`), reserve
a free port first, then start the server on it. The close-then-bind race is
harmless here — if the port is stolen between the two steps, `http.server` exits
and you rerun:

```bash
PORT=$(python - <<'PY'
import socket
s = socket.socket(); s.bind(('127.0.0.1', 0))
print(s.getsockname()[1]); s.close()
PY
)
python -m http.server "$PORT" --bind 127.0.0.1
# open http://127.0.0.1:$PORT/index.html
```

Windows / PowerShell equivalent, started detached so it outlives the shell:

```powershell
$port = 8152        # or any port not already listening: netstat -ano | findstr LISTENING
Start-Process -FilePath "py" -ArgumentList "-m","http.server","$port","--bind","127.0.0.1" `
  -WorkingDirectory (Get-Location) `
  -RedirectStandardOutput ".freebuff\preview-http.log" `
  -RedirectStandardError  ".freebuff\preview-http.log.err" `
  -WindowStyle Hidden -PassThru | Select-Object -ExpandProperty Id
```

`stdout` and `stderr` must go to **different** files — PowerShell fails if both
point at one path. Confirm the pid is alive and the URL answers before using it.

**Caveat that costs a pass every time:** registering a preview by *file path*
(`index.html`) resolves only that one file, so all eight `ch*.js`, `engine.js`,
the module scripts and everything under `assets/` and `data/` 404 and the app
renders an empty shell (`window.CHAPTERS` is undefined). Always open the
**`http://127.0.0.1:<port>/index.html` URL** from a server rooted at the repo
root. Opening the file directly with `file://` also works, because the chapters
and analysis data are plain `<script>` tags rather than `fetch()` calls.

## 2. Reproduce the generated artifacts

None of these are needed to *view* the site; they rebuild the committed outputs.

| Artifact | Rebuild with | Reads |
| :--- | :--- | :--- |
| `ch*.js` `occ[]` / `repeats`, `data/occurrences.json`, `data/occurrence_report.txt` | `python tools/extract_occurrences.py` then `python tools/merge_past.py` (`--apply` to write) | `_source/past_questions.ocr.txt`, `_reference/Simulation_Modeling_Question_Bank.html`, `data/*.json` |
| `data/question_bank.json`, `data/analysis.js` | `python tools/import_question_bank.py` | `_reference/Simulation_Modeling_Question_Bank.html` |
| `data/duplicate_clusters.json` | `python tools/find_duplicates.py --json` | the chapter files (via `node tools/dump_chapters.js`) |
| `data/same_question_merges.json` | `node tools/gen_same_question_merges.js` | `data/duplicate_clusters.json` + the chapter files |
| `data/variant_answers.json` | `node tools/extract_variant_answers.js` | `_audit/pre_answer_pass/` — **ignored**, so this one is machine-local only |
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

## 3. Verification, in this order

```bash
node tools/dump_chapters.js > /dev/null      # all 8 chapter files still parse
node tools/test_engine.js                    # the app's pure contracts: exam allocation,
                                             # marking denominators, quiz scoring, search
python tools/validate_site.py                # structural / data / coverage gate;
                                             # also node --checks every script the page loads
python tools/validate_site.py --strict       # syllabus coverage: complete
python tools/merge_past.py                   # must print "imported new 0"
python tools/check_ch2_coin_game.py
python tools/check_ch3_pure_pursuit.py
python tools/check_ch4_queuing.py
```
