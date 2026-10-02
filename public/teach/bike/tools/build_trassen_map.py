# /// script
# dependencies = ["gpxpy"]
# ///
"""Build reference/trassen-karte.html: all NRW Bahntrassen from bahntrassenradeln.de on one map.

Run: uv run tools/build_trassen_map.py
"""
import html
import json
import math
import re
import urllib.request
from pathlib import Path

import gpxpy

ROOT = Path(__file__).resolve().parent.parent
GPX_DIR = ROOT / "tracks/nrw-trassen/alle"
OUT = ROOT / "reference/trassen-karte.html"
BASE = "https://bahntrassenradeln.de/"
REGIONS = {
    "1": "linksrheinisch",
    "2": "nördlich der Lippe",
    "3": "Ruhrgebiet (Lippe–Ruhr)",
    "4": "südlich der Ruhr",
    "5": "Ostwestfalen-Lippe",
}


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def clean(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s).replace("\x96", "–")
    return re.sub(r"\s+", " ", s).strip()


def parse_entries(page: str) -> dict[str, dict]:
    entries = {}
    head = re.compile(r'<a name="(nw\d_[0-9a-z]+)"></a>(NW [^<]+)</font>(.*?)</td>', re.S)
    matches = list(head.finditer(page))
    for i, m in enumerate(matches):
        tid = m.group(1)
        if tid in entries:
            continue
        end = matches[i + 1].start() if i + 1 < len(matches) else len(page)
        body = page[m.end():end]

        def field(label):
            f = re.search(label + r':</td>\s*<td class="bn">(.*?)</td>', body, re.S)
            return clean(f.group(1)) if f else ""

        entries[tid] = {
            "id": tid,
            "nr": clean(m.group(2)),
            "name": clean(m.group(3)),
            "laenge_text": field("Streckenlänge \\(einfach\\)"),
            "belag": field("Oberfläche"),
            "has_gpx": f"gpx/{tid}.gpx" in body,
        }
    return entries


def ascent_descent(eles: list[float], threshold: float = 5.0) -> tuple[float, float]:
    """Hysteresis filter: count a climb only once it exceeds `threshold` metres."""
    up = down = 0.0
    ref = eles[0]
    for e in eles[1:]:
        d = e - ref
        if d >= threshold:
            up += d
            ref = e
        elif d <= -threshold:
            down -= d
            ref = e
    return up, down


def haversine(a, b) -> float:
    lat1, lon1, lat2, lon2 = map(math.radians, (a[1], a[0], b[1], b[0]))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))


def thin(coords, min_dist=25.0):
    out = [coords[0]]
    for c in coords[1:-1]:
        if haversine(out[-1], c) >= min_dist:
            out.append(c)
    out.append(coords[-1])
    return [[round(x, 5), round(y, 5)] for x, y in out]


def main():
    GPX_DIR.mkdir(parents=True, exist_ok=True)
    # bahn_nw1..5.htm are all served as the same document containing every NRW entry
    page = fetch(BASE + "bahn_nw1.htm").decode("latin-1")
    entries = parse_entries(page)

    features = []
    for tid, e in sorted(entries.items()):
        if not e["has_gpx"]:
            continue
        path = GPX_DIR / f"{tid}.gpx"
        if not path.exists():
            try:
                path.write_bytes(fetch(BASE + f"gpx/{tid}.gpx"))
            except Exception as ex:
                print("skip", tid, ex)
                continue
        g = gpxpy.parse(path.read_text(encoding="utf-8", errors="replace"))
        lines, eles = [], []
        for trk in g.tracks:
            for seg in trk.segments:
                pts = seg.points
                if len(pts) < 2:
                    continue
                lines.append(thin([(p.longitude, p.latitude) for p in pts]))
                eles += [p.elevation for p in pts if p.elevation is not None]
        if not lines:
            continue
        up, down = ascent_descent(eles) if len(eles) > 1 else (None, None)
        features.append({
            "type": "Feature",
            "geometry": {"type": "MultiLineString", "coordinates": lines},
            "properties": {
                "id": tid,
                "nr": e["nr"],
                "name": e["name"],
                "region": tid[2],
                "km": round(g.length_2d() / 1000, 1),
                "up": round(up) if up is not None else None,
                "down": round(down) if down is not None else None,
                "min": round(min(eles)) if eles else None,
                "max": round(max(eles)) if eles else None,
                "belag": e["belag"][:140],
                "url": f"{BASE}bahn_nw.htm#{tid}",
                "gpx": f"{BASE}gpx/{tid}.gpx",
            },
        })

    total = sum(f["properties"]["km"] for f in features)
    data = json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, separators=(",", ":"))
    tpl = (ROOT / "tools/trassen-karte.template.html").read_text()
    OUT.write_text(
        tpl.replace("__DATA__", data)
        .replace("__COUNT__", str(len(features)))
        .replace("__KM__", f"{total:,.0f}".replace(",", "."))
        .replace("__REGIONS__", json.dumps(REGIONS, ensure_ascii=False))
    )
    print(f"{len(features)} Trassen, {total:.0f} km -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
