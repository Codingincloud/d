<#
  win_ocr.ps1 — read scanned images with the OCR engine that ships with Windows
  (Windows.Media.Ocr). No Tesseract, no install, no network.

  Usage:
    powershell -NoProfile -ExecutionPolicy Bypass -File tools/win_ocr.ps1 -Dir pages
    powershell -NoProfile -ExecutionPolicy Bypass -File tools/win_ocr.ps1 -Path a.png,b.png
    powershell -NoProfile -ExecutionPolicy Bypass -File tools/win_ocr.ps1 -ListLanguages

  A directory is read in name order, and each file is preceded by a
  `===== FILE: <name> =====` banner so the caller can split the output back into
  one text file per page. Batching matters: starting PowerShell costs about a
  second, and an OCR of a full book is hundreds of pages.

  Reads one line per recognised line, in reading order. Exit code 1 with a
  message on stderr if the engine or a file is unusable.
#>
[CmdletBinding()]
param(
  [string[]]$Path,
  [string]$Dir,
  [string]$Lang = "en-US",
  [switch]$ListLanguages,
  [switch]$FromStdin
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Runtime.WindowsRuntime

[void][Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
[void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
[void][Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
[void][Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
[void][Windows.Globalization.Language, Windows.Foundation, ContentType = WindowsRuntime]

# IAsyncOperation<T> -> Task<T>, so the WinRT calls can be awaited synchronously.
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
  })[0]

function Await($op, [Type]$type) {
  $t = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($op))
  [void]$t.Wait(-1)
  $t.Result
}

if ($ListLanguages) {
  foreach ($l in [Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages) { $l.LanguageTag }
  exit 0
}

# Prefer the requested language, then the usual English tags, then whatever the
# user profile offers. Any of these can be absent on a given machine.
$engine = $null
foreach ($cand in @($Lang, "en-US", "en-GB")) {
  if ($engine) { break }
  try {
    $language = New-Object Windows.Globalization.Language $cand
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($language)
  } catch { }
}
if (-not $engine) { $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages() }
if (-not $engine) { [Console]::Error.WriteLine("no Windows OCR engine installed"); exit 1 }

# One path per line on stdin. This is the shape to prefer from a caller: it has
# no command-line length limit and no comma/space quoting rules to get wrong,
# which is what `-Path a,b,c` silently trips over when the array has to survive
# an argv round trip.
if ($FromStdin) {
  $lines = New-Object System.Collections.Generic.List[string]
  while ($null -ne ($l = [Console]::In.ReadLine())) {
    if ($l.Trim()) { $lines.Add($l.Trim()) }
  }
  $Path = $lines.ToArray()
}
if ($Dir) {
  $Path = @(Get-ChildItem -LiteralPath $Dir -File |
            Where-Object { $_.Extension -match '^\.(png|jpg|jpeg|bmp|tif|tiff)$' } |
            Sort-Object Name | ForEach-Object { $_.FullName })
}
if (-not $Path -or $Path.Count -eq 0) { [Console]::Error.WriteLine("nothing to read"); exit 1 }

# Batch: decode then recognise each page, releasing the stream as we go. A single
# bitmap held open across hundreds of pages is what makes this run out of memory.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
foreach ($p in $Path) {
  if (-not (Test-Path -LiteralPath $p)) {
    [Console]::Error.WriteLine("skipped, no such file: $p")
    continue
  }
  $full = (Resolve-Path -LiteralPath $p).Path
  Write-Output ("===== FILE: " + [System.IO.Path]::GetFileName($full) + " =====")
  $file = $null; $stream = $null; $bitmap = $null
  try {
    $file    = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($full)) ([Windows.Storage.StorageFile])
    $stream  = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap  = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $result  = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
    foreach ($line in $result.Lines) { Write-Output $line.Text }
  } catch {
    [Console]::Error.WriteLine("FAILED on $full : $($_.Exception.Message)")
  } finally {
    if ($bitmap) { $bitmap.Dispose() }
    if ($stream) { $stream.Dispose() }
  }
}
