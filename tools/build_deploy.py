#!/usr/bin/env python3
"""Build the deployable copy of the site into dist/.

Why this exists
---------------
Every chapter, module and data file is loaded as a plain classic
`<script src>`: thirteen of them, each blocking, each one after the last.
A classic script blocks the parser, so script N+1 is not even *discovered*
until script N has been fetched and run - the page pays thirteen round trips in
series, not in parallel, whatever the protocol. On a fast host that is a second
of pure latency; behind a throttled tunnel it is closer to a minute. The three
stylesheets get the same treatment for the same reason.

So the build concatenates the sheets and the scripts, in the order index.html
already loads them, into one file each, and marks the bundle `defer` so it stops
blocking the parser at all. It is a copy, not a transform: same sources, same
order, same markup, only the tags collapsed. That ordering is READ OUT of
index.html rather than duplicated here, so the build cannot drift from the page.

Nothing under dist/ is meant to be edited - it is generated, and re-running this
script is how it is regenerated. It is also not committed: the source tree is
the site, and dist/ is one way of shipping it.

Pass --zip to also write simulation-study-portal.zip with index.html at its
ROOT, which is the layout every drag-and-drop host (Netlify Drop, Cloudflare
Pages, GitHub Pages' upload flow) expects. Without it the archive silently rots:
there is no script that rebuilds it, so the one on disk keeps whatever bundle it
was made from.

Two sites share this build
--------------------------
The Simulation portal is the default. The DCC portal (dcc-site/) is the same
shell and the same design layer, reached from its own entry page:

    python tools/build_deploy.py --entry dcc-site/index.html --out dist-dcc \
                                 --zip dcc-study-portal.zip

Every `<script src>` and `<link href>` is therefore resolved against the ENTRY
FILE'S OWN DIRECTORY rather than against the project root. That one detail is
the whole difference: dcc-site/index.html refers to the shared shell as
`../engine.js`, which against the root would resolve *outside the repository*,
and the build would either fail on a missing file or quietly bundle the wrong
one. The chapter files and the four DCC data files stay where they are, because
the bundle inlines them all anyway — there is no second copy of anything.
"""
from __future__ import annotations

import re
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINK_RE = re.compile(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>')
SCRIPT_RE = re.compile(r'<script src="([^"]+)"></script>')
# url(...) inside a stylesheet resolves against THAT stylesheet's own directory,
# so moving the sheets to the output root means every relative url has to be
# rewritten against where the file is going. Nothing else in these sheets is
# path-dependent.
URL_RE = re.compile(r"""url\(\s*(['"]?)([^'")]+)\1\s*\)""")
REMOTE = ('http://', 'https://', '//', 'data:')


def read(path: Path) -> str:
    return path.read_text(encoding='utf-8')


def rebase_entry_paths(text: str, entry_dir: Path) -> str:
    """Re-point entry-relative asset paths at the output root, inside scripts.

    `dcc-site/ch1.js` names the extracted slides as `../assets/dcc-slides/...`,
    which is correct where that page sits and wrong in a bundle whose index.html
    IS the output root - the same problem the stylesheet urls above have, and
    solved the same way: the output tree mirrors the source tree, so the path
    that works from the output root is the one measured from the project root.

    Only first segments that really exist at the root are rewritten, so a `../`
    in prose, in an arrow or in a URL cannot be mangled by this.
    """
    if entry_dir.resolve() == ROOT:
        return text
    depth = len(entry_dir.resolve().relative_to(ROOT).parts)
    prefix = '../' * depth
    pattern = re.compile(r'(["\'`])' + re.escape(prefix) + r'([^"\'`\n]+)\1')

    def fix(m: re.Match) -> str:
        rel = m.group(2)
        head = rel.split('/', 1)[0]
        if (ROOT / head).exists():
            return f'{m.group(1)}{rel}{m.group(1)}'
        return m.group(0)
    return pattern.sub(fix, text)


def rewrite_urls(css: str, source_dir: Path) -> str:
    """Point every relative url() at the same file from the output root.

    The output tree mirrors the source tree for assets - assets/fonts goes to
    dist/assets/fonts - so the URL that works from the output root is simply the
    asset's own path from the project root. Written as a relative URL, not as a
    filesystem path: a stylesheet in dist/ resolving 'assets/fonts/x.woff2' finds
    dist/assets/fonts/x.woff2, and the same file still works at any other root.
    """
    def sub(m: re.Match) -> str:
        quote, url = m.group(1), m.group(2)
        if url.startswith(REMOTE) or url.startswith('/') or url.startswith('#'):
            return m.group(0)
        target = (source_dir / url).resolve()
        try:
            rel = target.relative_to(ROOT)
        except ValueError:
            sys.exit(f'build_deploy: {url} resolves outside the project ({target})')
        if not target.is_file():
            sys.exit(f'build_deploy: {url} is referenced but missing ({target})')
        return f'url({quote}{rel.as_posix()}{quote})'
    return URL_RE.sub(sub, css)


def collapse(html: str, pattern: re.Pattern, replacement: str, what: str) -> tuple[str, list[str]]:
    """Replace the first match with `replacement` and delete the rest."""
    found = pattern.findall(html)
    if not found:
        sys.exit(f'build_deploy: index.html has no {what} to bundle')
    first = [True]

    def sub(m: re.Match) -> str:
        if first[0]:
            first[0] = False
            return replacement
        return ''

    return pattern.sub(sub, html), found


def make_zip(out_dir: Path, name: str) -> Path:
    """Archive dist/ with index.html at the archive root, as drop hosts expect."""
    target = ROOT / name
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as z:
        for path in sorted(p for p in out_dir.rglob('*') if p.is_file()):
            z.write(path, path.relative_to(out_dir).as_posix())
    return target


def option(argv: list[str], name: str, default: str) -> str:
    """Read `--name value` out of argv, falling back to `default`."""
    if name in argv:
        i = argv.index(name)
        if i + 1 >= len(argv):
            sys.exit(f'build_deploy: {name} needs a value')
        return argv[i + 1]
    return default


def main() -> int:
    argv = sys.argv[1:]
    flags = {a for a in argv if a.startswith('-')}
    known = {'--zip', '--entry', '--out', '--zip-name', '--sheet'}
    unknown = flags - known
    if unknown:
        sys.exit(f'build_deploy: unknown option(s) {" ".join(sorted(unknown))}')
    # Bare-word options are skipped when picking up the optional trailing
    # directory, so `--entry a/index.html dist-x` and `dist-x` both work.
    values = {argv[i + 1] for i, a in enumerate(argv[:-1]) if a in known}
    positional = [a for a in argv if not a.startswith('-') and a not in values]

    entry_rel = option(argv, '--entry', 'index.html')
    entry = (ROOT / entry_rel).resolve()
    if not entry.is_file():
        sys.exit(f'build_deploy: entry page {entry_rel} not found')
    if ROOT not in entry.parents:
        sys.exit(f'build_deploy: entry page {entry_rel} is outside the project')
    # EVERY reference is resolved against the entry page's own directory, not the
    # project root: dcc-site/index.html loads the shared shell as '../engine.js'.
    entry_dir = entry.parent

    out_dir = (ROOT / (option(argv, '--out', positional[0] if positional else 'dist'))).resolve()
    if ROOT not in out_dir.parents:
        sys.exit(f'build_deploy: refusing to build outside the project ({out_dir})')
    zip_name = option(argv, '--zip-name', 'simulation-study-portal.zip')
    html = read(entry)

    def resolve(ref: str) -> Path:
        """A reference in the entry page -> the file it points at, checked."""
        path = (entry_dir / ref).resolve()
        if not path.is_file():
            sys.exit(f'build_deploy: {ref} is referenced by {entry_rel} but missing\n'
                     f'  (resolved to {path})')
        if ROOT not in path.parents:
            sys.exit(f'build_deploy: {ref} resolves outside the project ({path})')
        return path

    # --- stylesheets -------------------------------------------------------
    html, sheets = collapse(html, LINK_RE, '<link rel="stylesheet" href="site.css">',
                            'stylesheet links')
    css_parts = []
    for href in sheets:
        src = resolve(href)
        banner = f'/* {href} */\n'
        css_parts.append(banner + rewrite_urls(read(src), src.parent))
    css = '\n'.join(css_parts)

    # --- scripts -----------------------------------------------------------
    html, scripts = collapse(html, SCRIPT_RE, '<script defer src="site.js"></script>',
                             'script tags')
    # Joined with an explicit semicolon: in separate files each was its own parse
    # unit, so a file ending in `foo()` followed by one starting `(function(){`
    # could never be glued together. In one file it can.
    js_parts = []
    for src in scripts:
        path = resolve(src)
        js_parts.append(f'/* {src} */\n' + rebase_entry_paths(read(path), entry_dir))
    js = '\n;\n'.join(js_parts)

    # --- offline -----------------------------------------------------------
    # The entry page carries a marker rather than the registration, so the SOURCE
    # page stays worker-free (there is nothing worth caching before the build, and
    # a worker over the source tree would serve the chapter file being edited).
    # The build swaps the marker in, and only the marker - a snippet written here
    # by hand would be a second copy of what tools/make_sw.py owns.
    import make_sw
    if make_sw.MARKER not in html:
        sys.exit(f'build_deploy: {entry_rel} carries no {make_sw.MARKER} marker, so '
                 f'the built bundle would have no offline support')
    html = html.replace(make_sw.MARKER, make_sw.OFFLINE_SNIPPET, 1)

    # --- assemble ----------------------------------------------------------
    if out_dir.exists():
        # On Windows a directory that any process has open as its working
        # directory cannot be removed, and rmtree deletes files as it walks -
        # so a half-cleared dist/ is what a failed rebuild leaves behind. Say
        # which process is likely holding it rather than raising WinError 32.
        try:
            shutil.rmtree(out_dir)
        except OSError as exc:
            sys.exit(f'build_deploy: cannot clear {out_dir} ({exc}).\n'
                     f'  A server started inside it (cd dist && python -m http.server) '
                     f'holds the directory itself - serve the parent with '
                     f'`python -m http.server --directory dist` instead, or build '
                     f'to another directory.')
    out_dir.mkdir(parents=True)
    (out_dir / 'index.html').write_text(html, encoding='utf-8')
    (out_dir / 'site.css').write_text(css, encoding='utf-8')
    (out_dir / 'site.js').write_text(js, encoding='utf-8')
    # GitHub Pages runs the uploaded tree through Jekyll unless this exists. The
    # bundle has no underscore directories today, so Jekyll would currently do no
    # harm - but it is a file the site needs that nothing in the repo produced,
    # which is why a deploy that clears its staging clone silently dropped it.
    # Built here, it cannot go missing again.
    (out_dir / '.nojekyll').write_text('', encoding='utf-8')
    # assets/fonts is used by both sites: the sheets reference the woff2 files by
    # url, and fonts.css is itself bundled into site.css.
    #
    # assets/notes is the Simulation portal's rendered handwritten pages, and the
    # only thing that ever points at them is data/note_pages.js. So whether to
    # copy it is decided by whether this entry loads that file, read out of the
    # page's own script list rather than assumed — `assets/notes` exists at the
    # project root whichever course is building, so "copy it if it is there"
    # shipped 6.6 MB of images into the DCC bundle that nothing could open.
    asset_dirs = ['assets/fonts']
    if any('note_pages' in s for s in scripts):
        asset_dirs.append('assets/notes')
    # assets/dcc-slides is the DCC portal's extracted slide images, and the only
    # thing that points at them is a dcc-site chapter file. Asked of the bundled
    # text rather than of the folder, for the same reason as above: the directory
    # is at the root whichever course is building, so its existence says nothing
    # about whether this entry needs it.
    if 'assets/dcc-slides' in js:
        asset_dirs.append('assets/dcc-slides')
    for rel_path in asset_dirs:
        src = ROOT / rel_path
        if not src.is_dir():
            sys.exit(f'build_deploy: {rel_path}/ is missing')
        # fonts.css is bundled into site.css, so the sheet itself is not copied
        ignore = shutil.ignore_patterns('*.css') if rel_path.endswith('fonts') else None
        shutil.copytree(src, out_dir / rel_path, ignore=ignore)

    # --- the mode comparison sheet (--sheet) -------------------------------
    # Written HERE, between the assets and the archive, and not by a separate
    # command afterwards: this build clears its output directory, so a sheet
    # generated before it is deleted and one generated after it is missing from
    # the zip, which is made by walking the directory. The import lives here
    # rather than at the top because this is the only step that needs `node` on
    # PATH: a build without --sheet must not need it. When --sheet IS asked for,
    # a missing node is a failure and not a warning - a bundle that quietly lost
    # its sheet is exactly the drift the sheet exists to make visible.
    if '--sheet' in flags:
        import make_theme_sheet
        if make_theme_sheet.write_sheet(out_dir / 'theme-sheet.html') != 0:
            sys.exit('build_deploy: could not write the comparison sheet')

    # --- the service worker ------------------------------------------------
    # After the sheet, because the worker precaches theme-sheet.html when it is
    # there, and before the archive, which is made by walking this directory.
    if make_sw.write_worker(out_dir) != 0:
        sys.exit('build_deploy: could not write the service worker')

    # --- report ------------------------------------------------------------
    # Sizes come from the files on disk, not from len(text.encode()): write_text
    # opens in text mode, so on Windows every '\n' lands on disk as '\r\n' and
    # the encoded string is one byte short per line - which reads as though the
    # build had changed when it had not.
    files = sorted(p for p in out_dir.rglob('*') if p.is_file())
    total = sum(p.stat().st_size for p in files)
    on_disk = lambda name: (out_dir / name).stat().st_size
    print(f'dist: {len(files)} file(s), {total / 1048576:.1f} MB')
    print(f'entry: {entry_rel}')
    print(f'  index.html  {on_disk("index.html"):>9,} B')
    print(f'  site.css    {on_disk("site.css"):>9,} B   ({len(sheets)} sheets)')
    print(f'  site.js     {on_disk("site.js"):>9,} B   ({len(scripts)} scripts)')
    print(f'  assets: {len(files) - 3} file(s) from {" + ".join(asset_dirs)}')
    print(f'  first load: index.html + site.css + site.js '
          f'+ the fonts it actually needs = 5 requests, was {len(sheets) + len(scripts) + 1}')
    if '--zip' in flags:
        target = make_zip(out_dir, zip_name)
        print(f'  {target.name}: {target.stat().st_size / 1048576:.1f} MB, '
              f'index.html at the archive root - drop-ready')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
