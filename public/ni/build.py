# /// script
# dependencies = ["markdown"]
# ///
"""Erzeugt lessons/*.html, reference/*.html, assets/fragenbank.js und index.html aus src/.

Aufruf:  uv run build.py
"""
import html
import json
import pathlib
import re

import markdown

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
VIDEO = "http://wien.kite-ling.ts.net:5173/video/{id}?t={t}"

TEILE = {
    "I": "Grundlagen der Neurosystemischen Integration",
    "II": "Nervensystem, Stress und Trauma",
    "III": "Gehirn, Glaubenssysteme, Körper",
    "IV": "Anteile, Imagination, Systemik",
    "V": "Bindung, Grenzen, intensive Gefühle, Praxis",
    "VI": "Fallvignetten – Wissen anwenden",
}


def md(text: str) -> str:
    return markdown.markdown(text, extensions=["tables", "attr_list", "md_in_html", "sane_lists"])


def inline(text: str) -> str:
    t = html.escape(text, quote=False)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)", r"<em>\1</em>", t)
    return t


def seconds(ts: str) -> int:
    m, s = ts.strip().split(":")
    return int(m) * 60 + int(s)


def rec_link(entry: str) -> str:
    # "M2.1·02 Stresstoleranzfenster | 12790 | 01:32"
    label, vid, ts = [p.strip() for p in entry.split("|")]
    url = VIDEO.format(id=vid, t=seconds(ts))
    stamp = "" if ts in ("00:00", "0:00") else f" @ {ts}"
    return f'<a href="{url}">{html.escape(label)}{stamp}</a>'


def parse_quiz(text: str, where: str, multi: bool = False):
    qs, cur = [], None
    for raw in text.splitlines():
        line = raw.rstrip()
        if line.startswith("? "):
            cur = {"q": inline(line[2:]), "o": [], "a": [] if multi else None, "e": ""}
            qs.append(cur)
        elif line.startswith("+ "):
            if multi:
                cur["a"].append(len(cur["o"]))
            else:
                assert cur["a"] is None, f"{where}: Frage „{cur['q']}“ hat mehrere richtige Antworten"
                cur["a"] = len(cur["o"])
            cur["o"].append(inline(line[2:]))
        elif line.startswith("- "):
            cur["o"].append(inline(line[2:]))
        elif line.startswith("> "):
            cur["e"] += (" " if cur["e"] else "") + inline(line[2:])
    for i, q in enumerate(qs, 1):
        assert q["a"] not in (None, []), f"{where}: Frage {i} ohne richtige Antwort"
        assert len(q["o"]) >= (4 if multi else 3), f"{where}: Frage {i} hat zu wenige Optionen"
    return qs


def parse_freitext(text: str, where: str):
    items, cur = [], None
    for raw in text.splitlines():
        line = raw.rstrip()
        if line.startswith("?? "):
            cur = {"q": inline(line[3:]), "k": [], "m": ""}
            items.append(cur)
        elif line.startswith("* "):
            cur["k"].append(inline(line[2:]))
        elif line.startswith(">> "):
            cur["m"] += (" " if cur["m"] else "") + inline(line[3:])
    for i, it in enumerate(items, 1):
        assert it["k"] and it["m"], f"{where}: Freitext {i} ohne Kernpunkte/Musterantwort"
    return items


def parse_lesson(path: pathlib.Path):
    text = path.read_text()
    head, rest = text.split("\n---\n", 1)
    meta = {}
    for line in head.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    summary, quiz = rest.split("\n===QUIZ===\n")
    quiz, _, ft = quiz.partition("\n===FREITEXT===\n")
    quiz, _, mr = quiz.partition("\n===MEHRFACH===\n")
    meta["freitext"] = parse_freitext(ft, path.name)
    meta["mehrfach"] = parse_quiz(mr, path.name, multi=True)
    meta["summary"] = summary
    meta["quiz"] = parse_quiz(quiz, path.name)
    meta["file"] = f"{meta['nr']}-{meta['slug']}.html"
    return meta


def page(title: str, body: str, depth: int = 1, scripts: str = "", nav: str = "") -> str:
    up = "../" * depth
    nav = nav or f'<a href="{up}index.html">Kursübersicht</a><a href="{up}lessons/pruefung.html">Prüfungssimulation</a><a href="{up}reference/glossar.html">Glossar</a><a href="{up}reference/modelle.html">Modelle</a>'
    return f"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<link rel="stylesheet" href="{up}assets/style.css">
</head>
<body>
<nav class="top">{nav}</nav>
<main>
{body}
</main>
{scripts}
</body>
</html>
"""


ASK = """<aside class="ask"><strong>Frag nach!</strong> Etwas unklar, eine Frage falsch verstanden oder du willst ein Thema vertiefen?
Frag deinen Lehrer (Claude) direkt im Chat – z.&nbsp;B. „Erklär mir den Unterschied zwischen Freeze und dorsalem Shutdown nochmal“ oder „Gib mir 10 neue Fragen zu Lektion 09“.</aside>"""


def render_lesson(m, prev, nxt):
    teil = m["teil"]
    recs = [e for e in m.get("aufnahmen", "").split(";;") if e.strip()]
    rec_html = "".join(f"<li>{rec_link(e)}</li>" for e in recs)
    pager = '<nav class="pager">'
    pager += f'<a href="{prev["file"]}">← {prev["nr"]} {html.escape(prev["title"])}</a>' if prev else "<span></span>"
    pager += f'<a href="{nxt["file"]}">{nxt["nr"]} {html.escape(nxt["title"])} →</a>' if nxt else '<a href="pruefung.html">Prüfungssimulation →</a>'
    pager += "</nav>"
    mr_html = ""
    if m["mehrfach"]:
        mr_html = f"""<section id="mehrfach" class="quiz">
<h2>Mehrfachauswahl <span class="count">({len(m['mehrfach'])})</span></h2>
<p class="hint">Hier können eine, mehrere oder alle Antworten richtig sein. Wähle alle zutreffenden aus und klicke dann „Prüfen“ – richtig ist die Frage nur, wenn die Auswahl genau stimmt.</p>
<div id="mquiz"></div>
</section>"""
    ft_html = ""
    if m["freitext"]:
        ft_html = f"""<section id="freitext-fragen" class="freitext-section">
<h2>Freitext-Fragen <span class="count">({len(m['freitext'])})</span></h2>
<p class="hint">Schreib deine Antwort in Stichworten oder ganzen Sätzen. Dann Musterlösung aufdecken und ehrlich abhaken, welche Kernpunkte du genannt hast.</p>
<div id="freitext"></div>
</section>"""
    body = f"""<header>
<p class="kicker">Lektion {m['nr']} · Teil {teil}: {TEILE[teil]}</p>
<h1>{html.escape(m['title'])}</h1>
<p class="subtitle">{html.escape(m.get('subtitle', ''))}</p>
</header>
<p class="goal"><strong>Dein Gewinn:</strong> {inline(m['gewinn'])}</p>
<section id="summary" class="summary">
<h2>Kurz zusammengefasst</h2>
{md(m['summary'])}
</section>
<section class="sources">
<h2>Primärquelle</h2>
<p><strong>Skript „NI kompakt“</strong>, {html.escape(m['skript'])} – lies diese Seiten zuerst. Hauptaufnahme: {rec_link(m['primaer'])}</p>
{"<p class='more'>Weitere Aufnahmen:</p><ul class='recs'>" + rec_html + "</ul>" if rec_html else ""}
</section>
<section id="fragen" class="quiz">
<h2>Prüfungsfragen <span class="count">({len(m['quiz'])})</span></h2>
<p class="hint">Tipp: Blende erst die Zusammenfassung aus und beantworte aus dem Gedächtnis – das Erinnern selbst festigt das Wissen.
<button type="button" class="toggle-summary">Zusammenfassung ausblenden</button></p>
<div id="quiz"></div>
</section>
{mr_html}
{ft_html}
{ASK}
{pager}"""
    data = json.dumps(m["quiz"], ensure_ascii=False)
    lesson = json.dumps({"id": m["nr"], "title": m["title"]}, ensure_ascii=False)
    ftdata = json.dumps(m["freitext"], ensure_ascii=False)
    mrdata = json.dumps(m["mehrfach"], ensure_ascii=False)
    scripts = f'<script>window.LESSON={lesson};window.QUIZ={data};window.MEHRFACH={mrdata};window.FREITEXT={ftdata};</script>\n<script src="../assets/quiz.js"></script>'
    nav = '<a href="../index.html">Kursübersicht</a><a href="#fragen">Fragen</a>'
    nav += '<a href="#mehrfach">Mehrfachauswahl</a>' if m["mehrfach"] else ""
    nav += '<a href="#freitext-fragen">Freitext</a>' if m["freitext"] else ""
    return page(f"{m['nr']} · {m['title']}", body, 1, scripts, nav)


def render_exam():
    body = f"""<header>
<p class="kicker">Gemischtes Training · alle Lektionen</p>
<h1>Prüfungssimulation</h1>
<p class="subtitle">Zufällige Fragen aus allen Lektionen – gemischt, wie in der echten Prüfung.</p>
</header>
<p class="goal"><strong>Warum gemischt?</strong> Wenn Themen durcheinander kommen, musst du erst erkennen, <em>welches</em> Modell gefragt ist. Genau das trainiert die Prüfungssituation und festigt das Langzeitgedächtnis.</p>
<section class="quiz">
<div class="exam-setup">
<label>Anzahl Fragen
<select id="exam-n"><option>20</option><option selected>40</option><option>80</option><option value="0">alle</option></select></label>
<label>Aus Teil
<select id="exam-teil"><option value="">alle Teile</option>{"".join(f'<option value="{k}">Teil {k}: {v}</option>' for k, v in TEILE.items())}</select></label>
<label>Fragetyp
<select id="exam-typ"><option value="mc">Einfachauswahl</option><option value="mr">Mehrfachauswahl</option><option value="mix">Einfach + Mehrfach gemischt</option><option value="ft">Freitext</option></select></label>
<button type="button" id="exam-start">Neue Simulation starten</button>
</div>
<div id="quiz"></div>
</section>
{ASK}"""
    scripts = '<script src="../assets/fragenbank.js"></script>\n<script src="../assets/quiz.js"></script>'
    return page("Prüfungssimulation", body, 1, scripts)


def lesson_links(m):
    f = f'lessons/{m["file"]}'
    links = [f'<a href="{f}#fragen">Fragen ({len(m["quiz"])})</a>']
    if m["mehrfach"]:
        links.append(f'<a href="{f}#mehrfach">Mehrfachauswahl ({len(m["mehrfach"])})</a>')
    if m["freitext"]:
        links.append(f'<a href="{f}#freitext-fragen">Freitext ({len(m["freitext"])})</a>')
    return " | ".join(links)


def render_index(lessons):
    parts = []
    for k, name in TEILE.items():
        items = "".join(
            f'<li><a href="lessons/{m["file"]}"><span class="nr">{m["nr"]}</span> {html.escape(m["title"])}</a>'
            f' <span class="meta">{lesson_links(m)} · {html.escape(m["skript"])}</span>'
            f' <span class="progress" data-progress="{m["nr"]}"></span><span class="progress" data-progress="{m["nr"]}m" data-label="Mehrfach: "></span></li>'
            for m in lessons if m["teil"] == k
        )
        parts.append(f"<h2>Teil {k}: {name}</h2><ol class='lessons'>{items}</ol>")
    total = sum(len(m["quiz"]) + len(m["mehrfach"]) for m in lessons)
    body = f"""<header>
<p class="kicker">Prüfungsvorbereitung · Weiterbildung 25/26</p>
<h1>Neurosystemische Integration nach Verena König</h1>
<p class="subtitle">{len(lessons)} Lektionen · {total} Prüfungsfragen · Grundlage: Skript „NI kompakt“ und 162 Kursaufnahmen</p>
</header>
<p class="goal"><strong>So lernst du:</strong> Eine Lektion pro Sitzung. Zusammenfassung lesen, ausblenden, Fragen beantworten.
Falsche Fragen wiederholen. Nach ein paar Tagen dieselbe Lektion noch einmal (Abstand festigt).
Ab und zu die <a href="lessons/pruefung.html">Prüfungssimulation</a> mit gemischten Fragen.
<strong><a href="reference/lernplan.html">Lernplan bis 10.10.</a></strong> · Nachschlagen: <a href="reference/glossar.html">Glossar</a> · <a href="reference/modelle.html">Modelle auf einen Blick</a>.</p>
{"".join(parts)}
<h2>Gemischt</h2>
<ol class="lessons"><li><a href="lessons/pruefung.html"><span class="nr">★</span> Prüfungssimulation</a> <span class="meta">zufällige Fragen aus allen Lektionen</span> <span class="progress" data-progress="exam"></span></li></ol>
{ASK}"""
    scripts = '<script src="assets/quiz.js"></script>'
    return page("Neurosystemische Integration – Kursübersicht", body, 0, scripts)


def render_reference(path: pathlib.Path):
    text = path.read_text()
    title = text.splitlines()[0].lstrip("# ").strip()
    body = f'<article class="reference">{md(text)}</article>\n{ASK}'
    return page(title, body, 1)


def main():
    lessons = sorted((parse_lesson(p) for p in (SRC / "lessons").glob("*.md")), key=lambda m: m["nr"])
    out = ROOT / "lessons"
    out.mkdir(exist_ok=True)
    for i, m in enumerate(lessons):
        prev = lessons[i - 1] if i > 0 else None
        nxt = lessons[i + 1] if i + 1 < len(lessons) else None
        (out / m["file"]).write_text(render_lesson(m, prev, nxt))
    (out / "pruefung.html").write_text(render_exam())

    bank = []
    for m in lessons:
        for q in m["quiz"] + m["mehrfach"]:
            bank.append({**q, "l": m["nr"], "t": m["title"], "f": m["file"], "p": m["teil"]})
    ftbank = [{**f, "l": m["nr"], "t": m["title"], "f": m["file"], "p": m["teil"]} for m in lessons for f in m["freitext"]]
    (ROOT / "assets" / "fragenbank.js").write_text(
        "window.BANK=" + json.dumps(bank, ensure_ascii=False) + ";\n"
        + "window.FTBANK=" + json.dumps(ftbank, ensure_ascii=False) + ";\n")

    ref = ROOT / "reference"
    ref.mkdir(exist_ok=True)
    for p in (SRC / "reference").glob("*.md"):
        (ref / f"{p.stem}.html").write_text(render_reference(p))

    (ROOT / "index.html").write_text(render_index(lessons))
    print(f"{len(lessons)} Lektionen, {sum(1 for q in bank if not isinstance(q["a"], list))} MC-Fragen, {sum(1 for q in bank if isinstance(q["a"], list))} Mehrfachauswahl, {len(ftbank)} Freitextfragen gebaut.")


if __name__ == "__main__":
    main()
