#!/usr/bin/env python3
"""Erzeugt aus einer einzigen Datenquelle zwei Karten:

  map/oeffi-radtouren.kml   -> Import in Google My Maps (maps.google.com/mymaps)
  reference/karte.html      -> interaktive Karte, sofort im Browser nutzbar

Die HTML-Karte liegt bei den uebrigen Referenzdokumenten, weil sie genau das
ist: ein Nachschlagewerk. Das KML bleibt hier, weil es kein Dokument zum Lesen
ist, sondern eine Importdatei.

Koordinaten stammen aus OpenStreetMap (Nominatim), geprueft am 3. August 2026.
Die Linien sind SCHEMATISCH: gerade Verbindungen zwischen den Halten, nicht der
tatsaechliche Gleisverlauf. Fuer die Orientierung reicht das; zum Navigieren
nicht.

Aufruf:  python3 build-map.py
"""

import json
import os
import xml.sax.saxutils as esc

HERE = os.path.dirname(os.path.abspath(__file__))
REFERENCE = os.path.join(os.path.dirname(HERE), "reference")

# ---------------------------------------------------------------- Koordinaten

P = {
    # Standorte
    "Köln-Zündorf":            (50.86593, 7.04298),
    "Bonn Vilich-Müldorf":     (50.75672, 7.14425),
    # Einstiegsbahnhoefe
    "Bonn Hbf":                (50.73204, 7.09676),
    "Porz-Wahn":               (50.85816, 7.07923),
    "Troisdorf":               (50.81395, 7.15087),
    "Siegburg/Bonn":           (50.79403, 7.20266),
    # linksrheinisch Sued
    "Bonn-Bad Godesberg":      (50.68381, 7.15968),
    "Bonn-Mehlem":             (50.66907, 7.18142),
    "Remagen":                 (50.57732, 7.22971),
    "Sinzig":                  (50.54675, 7.25824),
    "Bad Neuenahr":            (50.54740, 7.14420),
    "Ahrweiler":               (50.54183, 7.09511),
    "Altenahr":                (50.50479, 6.97750),
    "Ahrbrück":                (50.48879, 6.97215),
    "Andernach":               (50.43448, 7.40507),
    "Koblenz Hbf":             (50.35031, 7.59045),
    "Boppard":                 (50.23140, 7.58601),
    "Bingen (Rhein)":          (49.96881, 7.88349),
    "Mainz Hbf":               (50.00111, 8.25872),
    # Voreifel / Eifel
    "Bonn-Duisdorf":           (50.71826, 7.04303),
    "Witterschlick":           (50.68969, 7.02613),
    "Rheinbach":               (50.62953, 6.94826),
    "Euskirchen":              (50.65800, 6.79204),
    "Bad Münstereifel":        (50.55875, 6.76479),
    "Kall":                    (50.53854, 6.55669),
    "Gerolstein":              (50.22392, 6.66036),
    "Trier Hbf":               (49.75758, 6.65207),
    # Siegtal
    "Steinstraße":             (50.90027, 7.05972),
    "Spich":                   (50.82865, 7.11720),
    "Hennef (Sieg)":           (50.77328, 7.28444),
    "Blankenberg (Sieg)":      (50.76857, 7.34770),
    "Eitorf":                  (50.77357, 7.44752),
    "Au (Sieg)":               (50.77377, 7.65664),
    "Betzdorf (Sieg)":         (50.78947, 7.86952),
    "Siegen Hbf":              (50.87596, 8.01646),
    # rechtsrheinisch Sued
    "Bonn-Beuel":              (50.73853, 7.12746),
    "Königswinter":            (50.67874, 7.19314),
    "Königswinter Fähre":      (50.67332, 7.19217),
    "Bad Honnef":              (50.64424, 7.22460),
    "Unkel":                   (50.60294, 7.21966),
    "Linz (Rhein)":            (50.56925, 7.27606),
    "Neuwied":                 (50.43124, 7.47302),
    # Brücke / Koeln
    "Bonn Ramersdorf":         (50.72515, 7.15475),
    "Sankt Augustin Zentrum":  (50.77682, 7.18809),
    "Köln Messe/Deutz":        (50.94173, 6.97389),
    "Köln Hbf":                (50.94278, 6.95907),
    "Köln/Bonn Flughafen":     (50.87908, 7.11936),
    "Düren":                   (50.81006, 6.48320),
    # Bergisches
    "Overath":                 (50.93274, 7.28876),
    "Gummersbach":             (51.02308, 7.56611),
}

# ------------------------------------------------------------------- Korridore
# farbe = HTML-Hex (Leaflet); kml_color = KML aabbggrr
# paket  = erforderliches Tagespaket, siehe reference/tagespakete.html
#          klasse: "rheinland" | "rlp" | "nrw" | "" (keins)

PAKETE = {
    "rheinland": ("Rheinland-Paket", "35,40 €",
                  "24hTicket 5 Personen Preisstufe 3 (26,40 €) + 2 × 24hTicket Fahrrad (9,00 €)"),
    "rlp":       ("Rheinland-Pfalz-Ticket", "40,00 €",
                  "30 € erste Person + 10 € zweite Person. Räder gratis ab 9 Uhr. Werktags erst ab 9 Uhr gültig."),
    "nrw":       ("NRW-Paket", "72,40 €",
                  "24hTicket NRW 5 Personen (59,80 €) + 2 × 24hFahrradTicket NRW (12,60 €)"),
}

LAYERS = [
    {
        "name": "Standorte und Einstiegsbahnhöfe",
        "farbe": "#16130f", "kml": "ff0f1316",
        "paket": "",
        "punkte": [
            ("Köln-Zündorf", "Standort — Stadtbahn 7. Zum DB-Anschluss Porz-Wahn rund 4 km mit dem Rad."),
            ("Bonn Vilich-Müldorf", "Standort — Haltestelle der Stadtbahn 66. Nach Norden Siegburg, nach Süden Bonn Hbf."),
            ("Bonn Hbf", "Einstieg LINKSRHEINISCH. Alles nach Süden: RB 30 Ahrtal, RB 26 / RE 5 Mittelrhein, S 23 Voreifel. Rheinland-Pfalz-Ticket gilt bis hierher."),
            ("Porz-Wahn", "Einstieg RECHTSRHEINISCH. S 12 ins Siegtal, 20-Minuten-Takt. RE 9 und S 19 halten hier NICHT."),
            ("Troisdorf", "Knoten rechtsrheinisch. S 12, S 19, RE 9 — und im Normalbetrieb RE 8 / RB 27 nach Koblenz."),
            ("Siegburg/Bonn", "Knoten. Von Vilich-Müldorf direkt mit der Stadtbahn 66 erreichbar. S 12, S 19, RE 9."),
        ],
        "linien": [],
    },
    {
        "name": "RB 30 — Ahrtal (Ahr-Radweg)",
        "farbe": "#1f4e79", "kml": "ff794e1f",
        "paket": "rlp",
        "punkte": [
            ("Bad Neuenahr", "Ahr-Radweg. Kurort, guter Wiedereinstieg."),
            ("Ahrweiler", "Altstadt. Haltepunkt ist Ahrweiler Markt — Lage hier auf Ortsmitte gesetzt."),
            ("Altenahr", "Enges Ahrtal, Felsen. Beliebter Startpunkt talabwärts."),
            ("Ahrbrück", "Endpunkt der Ahrtalbahn. Seit Dezember 2025 wieder erreichbar."),
        ],
        "linien": [["Bonn Hbf", "Bonn-Bad Godesberg", "Bonn-Mehlem", "Remagen",
                    "Bad Neuenahr", "Ahrweiler", "Altenahr", "Ahrbrück"]],
        "info": "Werktags erst ab 9 Uhr nutzbar — das ist die Zeitgrenze des RLP-Tickets und zugleich der Beginn der kostenlosen Radmitnahme. Am Wochenende ab 0 Uhr.",
    },
    {
        "name": "RB 26 / RE 5 — Mittelrhein (Rheinradweg links)",
        "farbe": "#2f6ea8", "kml": "ffa86e2f",
        "paket": "rlp",
        "punkte": [
            ("Remagen", "Grenze NRW / Rheinland-Pfalz. Umstieg zur Ahrtalbahn. Fähre nach Erpel."),
            ("Sinzig", "Zwischen Rhein und Ahr — kurze Verbindung zwischen beiden Radwegen."),
            ("Andernach", "Geysir, Rheinradweg."),
            ("Koblenz Hbf", "Deutsches Eck. Umstieg Mosel und Lahn."),
            ("Boppard", "Beginn des Oberen Mittelrheintals."),
            ("Bingen (Rhein)", "Ende des Welterbetals. RB 26 fährt weiter bis Mainz."),
        ],
        "linien": [["Bonn Hbf", "Bonn-Bad Godesberg", "Bonn-Mehlem", "Remagen", "Sinzig",
                    "Andernach", "Koblenz Hbf", "Boppard", "Bingen (Rhein)", "Mainz Hbf"]],
        "info": "RB 26 hält überall, RE 5 ist schneller aber gröber. Für Radtouren die RB 26.",
    },
    {
        "name": "S 23 — Voreifel (Erft-Radweg, Eifel)",
        "farbe": "#1b6b3a", "kml": "ff3a6b1b",
        "paket": "rheinland",
        "punkte": [
            ("Rheinbach", "Glasstadt, Tor zur Voreifel."),
            ("Euskirchen", "Knoten. Anschluss RE 22 Richtung Gerolstein und Trier."),
            ("Bad Münstereifel", "Endpunkt, mittelalterliche Stadtmauer."),
            ("Kall", "Nationalpark Eifel. Über RE 22 ab Euskirchen."),
            ("Gerolstein", "Vulkaneifel. Weit, aber machbar als langer Tag."),
        ],
        "linien": [
            ["Bonn Hbf", "Bonn-Duisdorf", "Witterschlick", "Rheinbach", "Euskirchen", "Bad Münstereifel"],
            ["Euskirchen", "Kall", "Gerolstein", "Trier Hbf"],
        ],
        "info": "Die einzige Südrichtung, die im NRW-Tarif bleibt — und darum die einzige, die auch werktags vor 9 Uhr funktioniert.",
    },
    {
        "name": "S 12 — Siegtal (Sieg-Radweg)",
        "farbe": "#8a3324", "kml": "ff24338a",
        "paket": "rheinland",
        "punkte": [
            ("Steinstraße", "S-12-Halt in Köln-Gremberghoven."),
            ("Spich", "S-12-Halt vor Troisdorf."),
            ("Hennef (Sieg)", "Sieg-Radweg. Kurze Tour: hin mit der S 12, zurück am Fluss."),
            ("Blankenberg (Sieg)", "Burgruine über dem Siegtal."),
            ("Eitorf", "Letzter Halt im Rheinlandnetz."),
            ("Au (Sieg)", "ACHTUNG ANDERES PAKET: Au liegt schon in Rheinland-Pfalz. "
                          "Das Rheinland-Paket endet in Eitorf. Für Au entweder "
                          "Rheinland-Pfalz-Ticket (40 €) oder NRW-Paket (72,40 €)."),
        ],
        "linien": [["Porz-Wahn", "Steinstraße", "Spich", "Troisdorf", "Siegburg/Bonn",
                    "Hennef (Sieg)", "Blankenberg (Sieg)", "Eitorf", "Au (Sieg)"]],
        "info": "Die beste Linie ab Porz: 20-Minuten-Takt, kein Umsteigen. Das Rheinland-Paket reicht bis Eitorf.",
    },
    {
        "name": "RE 9 — Westerwald und Siegerland",
        "farbe": "#b05a1e", "kml": "ff1e5ab0",
        "paket": "nrw",
        "punkte": [
            ("Betzdorf (Sieg)", "Westerwald, liegt in Rheinland-Pfalz. Tarifisch heikel — "
                                "vor der Fahrt am Automaten gegenprüfen."),
            ("Siegen Hbf", "Endpunkt, NRW aber außerhalb des Rheinlandnetzes. Ganzer Tag."),
        ],
        "linien": [["Troisdorf", "Siegburg/Bonn", "Hennef (Sieg)", "Au (Sieg)",
                    "Betzdorf (Sieg)", "Siegen Hbf"]],
        "info": "Hält NICHT in Porz-Wahn. Ab Troisdorf oder Siegburg einsteigen. "
                "Bis Hennef reicht das Rheinland-Paket; östlich von Au wird die Tarifzuordnung "
                "gemischt (RLP und Westfalen) — die teuerste Richtung, die ihr habt.",
    },
    {
        "name": "Stadtbahn 66 — die Brücke",
        "farbe": "#6a3d9a", "kml": "ff9a3d6a",
        "paket": "rheinland",
        "punkte": [
            ("Sankt Augustin Zentrum", "Zwischen Vilich-Müldorf und Siegburg."),
            ("Bonn Ramersdorf", "Knoten in Beuel."),
            ("Königswinter", "Drachenfels, Siebengebirge."),
            ("Königswinter Fähre", "Rheinquerung zur linken Seite — Anschluss an RB 26 in Bad Godesberg."),
            ("Bad Honnef", "Endpunkt. Ab hier per Rad weiter nach Süden."),
        ],
        "linien": [["Siegburg/Bonn", "Sankt Augustin Zentrum", "Bonn Vilich-Müldorf",
                    "Bonn Hbf", "Bonn Ramersdorf", "Königswinter", "Bad Honnef"]],
        "info": "Verbindet beide Netze und hält vor der Haustür. Bis Dezember 2026 der einzige radtaugliche Weg ins Siebengebirge.",
    },
    {
        "name": "S 19 — Köln, Flughafen, Düren",
        "farbe": "#777777", "kml": "ff777777",
        "paket": "rheinland",
        "punkte": [
            ("Köln/Bonn Flughafen", "Die S 19 fährt hierüber — und lässt darum Porz-Wahn aus."),
        ],
        "linien": [["Troisdorf", "Köln/Bonn Flughafen", "Köln Messe/Deutz", "Köln Hbf", "Düren"]],
        "info": "Nicht über Porz-Wahn. Wer dort steht, sieht nur die S 12.",
    },
    {
        "name": "RE 8 / RB 27 — GESPERRT bis 13.12.2026",
        "farbe": "#a8402f", "kml": "ff2f40a8",
        "paket": "",
        "punkte": [
            ("Bonn-Beuel", "Bis 13. Dezember 2026 OHNE Zugverkehr."),
            ("Unkel", "Rheinland-Pfalz, Rheinradweg rechts."),
            ("Linz (Rhein)", "Fähre nach Remagen — Teil des Ersatzkonzepts."),
            ("Neuwied", "Rechtsrheinisch vor Koblenz."),
        ],
        "linien": [["Troisdorf", "Bonn-Beuel", "Königswinter", "Bad Honnef",
                    "Unkel", "Linz (Rhein)", "Neuwied", "Koblenz Hbf"]],
        "info": "Korridorsanierung Rechter Rhein, 10.07.–13.12.2026. SEV-Busse nehmen Räder nur nach Kapazität. Umgehung: Stadtbahn 66 bis Bad Honnef.",
    },
]


# ------------------------------------------------------------------------ KML

def paket_kurz(L) -> str:
    """'Rheinland-Paket 35,40 €' bzw. '' — fuer Ebenennamen und Marker."""
    key = L.get("paket", "")
    if not key:
        return ""
    name, preis, _ = PAKETE[key]
    return f"{name} {preis}"


def paket_lang(L) -> str:
    """Voller Erklaertext des Pakets fuer Beschreibungen."""
    key = L.get("paket", "")
    if not key:
        return ""
    name, preis, detail = PAKETE[key]
    return f"Tagespaket: {name}, {preis} für zwei Personen mit zwei Rädern. {detail}"


def kml() -> str:
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>',
           '<name>Radtouren mit Bahn — Bonn / Porz</name>',
           '<description>Schematischer Streckenplan mit dem jeweils '
           'erforderlichen Tagespaket (zwei Personen, zwei Räder). Linien sind '
           'gerade Verbindungen zwischen Halten, nicht der Gleisverlauf. '
           'Stand 3. August 2026.</description>']

    for i, L in enumerate(LAYERS):
        out.append(f'<Style id="s{i}"><LineStyle><color>{L["kml"]}</color>'
                   f'<width>4</width></LineStyle>'
                   f'<IconStyle><color>{L["kml"]}</color></IconStyle></Style>')

    for i, L in enumerate(LAYERS):
        # Das Paket steht im Ebenennamen — Google My Maps zeigt Ordnernamen
        # als Ebenenbezeichnung an, das ist die sichtbarste Stelle.
        kurz = paket_kurz(L)
        folder = f'{L["name"]}  [{kurz}]' if kurz else L["name"]
        out.append(f'<Folder><name>{esc.escape(folder)}</name>')

        beschreibung = " ".join(x for x in (paket_lang(L), L.get("info", "")) if x)
        if beschreibung:
            out.append(f'<description>{esc.escape(beschreibung)}</description>')

        for coords in L["linien"]:
            pts = " ".join(f"{P[n][1]},{P[n][0]},0" for n in coords)
            out.append(f'<Placemark><name>{esc.escape(folder)}</name>'
                       f'<description>{esc.escape(beschreibung)}</description>'
                       f'<styleUrl>#s{i}</styleUrl>'
                       f'<LineString><tessellate>1</tessellate>'
                       f'<coordinates>{pts}</coordinates></LineString></Placemark>')

        for name, desc in L["punkte"]:
            lat, lon = P[name]
            volltext = f"{desc}\n\n{paket_lang(L)}" if kurz else desc
            titel = f"{name} [{kurz}]" if kurz else name
            out.append(f'<Placemark><name>{esc.escape(titel)}</name>'
                       f'<description>{esc.escape(volltext)}</description>'
                       f'<styleUrl>#s{i}</styleUrl>'
                       f'<Point><coordinates>{lon},{lat},0</coordinates></Point></Placemark>')
        out.append('</Folder>')

    out.append('</Document></kml>')
    return "\n".join(out)


# ----------------------------------------------------------------------- HTML

HTML = """<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Karte — Radtouren mit Bahn, Bonn / Porz</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
  html,body{margin:0;height:100%%;font-family:ui-sans-serif,-apple-system,sans-serif}
  #map{height:100%%}
  .leaflet-popup-content{font-size:13px;line-height:1.45;min-width:210px}
  .leaflet-popup-content b{font-size:14px}
  .pk{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.04em;
      padding:1px 5px;border-radius:2px;color:#fff;vertical-align:1px;white-space:nowrap}
  .pk-rheinland{background:#1b5e3a}
  .pk-rlp{background:#1f4e79}
  .pk-nrw{background:#8a3324}
  .pk-none{background:#8b8b8b}
  .popup-paket{margin-top:.5rem;padding-top:.45rem;border-top:1px solid #ddd;font-size:12px;color:#444}
  .leaflet-control-layers-overlays label{margin-bottom:3px}
  .legende{position:absolute;bottom:14px;left:14px;z-index:1000;background:rgba(255,253,249,.95);
    border:1px solid #d8d2c8;border-radius:3px;padding:.6rem .8rem;font-size:11px;
    max-width:23rem;color:#55504a;line-height:1.45}
  .legende h4{margin:0 0 .35rem;font-size:12px;color:#16130f}
  .legende table{border-collapse:collapse;margin:.2rem 0 .5rem}
  .legende td{padding:1px 6px 1px 0;vertical-align:top}
  .legende a{color:#8a3324}
</style>
</head>
<body>
<div id="map"></div>
<div class="legende">
  <h4>Tagespaket — zwei Personen, zwei Räder</h4>
  <table>
    <tr><td><span class="pk pk-rheinland">RHEINLAND 35,40 €</span></td>
        <td>24hTicket 5 Pers. PS 3 + 2 × Radticket</td></tr>
    <tr><td><span class="pk pk-rlp">RLP 40,00 €</span></td>
        <td>RLP-Ticket, Räder gratis — werktags erst ab 9 Uhr</td></tr>
    <tr><td><span class="pk pk-nrw">NRW 72,40 €</span></td>
        <td>24hTicket NRW 5 Pers. + 2 × Radticket</td></tr>
  </table>
  <b>Schematisch</b> — gerade Verbindungen zwischen den Halten, nicht der
  Gleisverlauf. Preise geprüft am 3.&nbsp;August 2026, Details in
  <a href="tagespakete.html">Die drei Tagespakete</a> und
  <a href="streckenplan.html">Streckenplan Bonn / Porz</a>. Vor jeder Tour
  die Tageslage bei <a href="https://www.zuginfo.nrw/">zuginfo.nrw</a> prüfen.
</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const DATA = %s;
const map = L.map('map').setView([50.68, 7.15], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18, attribution: '&copy; OpenStreetMap'
}).addTo(map);

function badge(L_) {
  if (!L_.paket) return '';
  return '<span class="pk pk-' + L_.paket + '">' + L_.paket_kurz + '</span>';
}

const overlays = {};
DATA.forEach(L_ => {
  const grp = L.layerGroup();
  const gesperrt = L_.name.indexOf('GESPERRT') >= 0;

  L_.linien.forEach(coords => {
    L.polyline(coords, {color: L_.farbe, weight: 4, opacity: .85,
      dashArray: gesperrt ? '8,7' : null})
     .bindPopup('<b>' + L_.name + '</b> ' + badge(L_) +
       (L_.paket_lang ? '<div class="popup-paket">' + L_.paket_lang + '</div>' : '') +
       (L_.info ? '<div class="popup-paket">' + L_.info + '</div>' : ''))
     .addTo(grp);
  });

  L_.punkte.forEach(p => {
    L.circleMarker([p.lat, p.lon], {radius: 6, color: L_.farbe, weight: 2,
      fillColor: '#fff', fillOpacity: 1})
     .bindPopup('<b>' + p.name + '</b> ' + badge(L_) + '<br>' + p.desc +
       (L_.paket_lang ? '<div class="popup-paket">' + L_.paket_lang + '</div>' : '') +
       (L_.info ? '<div class="popup-paket"><i>' + L_.info + '</i></div>' : ''))
     .addTo(grp);
  });

  grp.addTo(map);
  overlays['<span style="color:' + L_.farbe + '">&#9632;</span> ' + L_.name +
           ' ' + badge(L_)] = grp;
});
L.control.layers(null, overlays, {collapsed: false}).addTo(map);
</script>
</body>
</html>
"""


def html() -> str:
    data = []
    for L in LAYERS:
        key = L.get("paket", "")
        data.append({
            "name": L["name"],
            "farbe": L["farbe"],
            "info": L.get("info", ""),
            "paket": key,
            "paket_kurz": paket_kurz(L).upper(),
            "paket_lang": paket_lang(L),
            "linien": [[[P[n][0], P[n][1]] for n in line] for line in L["linien"]],
            "punkte": [{"name": n, "lat": P[n][0], "lon": P[n][1], "desc": d}
                       for n, d in L["punkte"]],
        })
    return HTML % json.dumps(data, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    for path, content in ((os.path.join(HERE, "oeffi-radtouren.kml"), kml()),
                          (os.path.join(REFERENCE, "karte.html"), html())):
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(content)
        print(f"geschrieben: {path}")
