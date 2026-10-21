#!/usr/bin/env python3
"""Genera le immagini Open Graph (1200x630) in img/og/ per le pagine principali.
Uso: python3 scripts/build-og.py   (richiede Pillow; usa i font in assets/fonts)
Per una pagina nuova: aggiungi una riga in PAGES e metti nel suo <head>
<meta property="og:image" content="https://www.updateyourlife.it/img/og/<nome>.jpg">."""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'img', 'og')
PHOTO = os.path.join(ROOT, 'img', 'francesco-maragliulo-psicologo-online.webp')
SERIF = os.path.join(ROOT, 'assets', 'fonts', 'newsreader-normal.woff2')
SANS = os.path.join(ROOT, 'assets', 'fonts', 'lexend.woff2')
INK, PAPER, GRAPHITE, AMBER = '#1B2436', '#F3F5F8', '#4A5366', '#E3AE48'

PAGES = [
    ('home', 'Psicologo online, in videochiamata, ovunque tu sia'),
    ('chi-sono', 'Francesco Maragliulo, psicologo'),
    ('psicologo-online', 'Colloquio con lo psicologo online: come funziona'),
    ('ansia-online', "Psicologo online per l'ansia"),
    ('relazioni-coppia-online', 'Psicologo online per relazioni e coppia'),
    ('autostima-online', "Psicologo online per l'autostima"),
    ('momenti-di-cambiamento-online', 'Psicologo online per i momenti di cambiamento'),
    ('stress-lavoro-burnout-online', 'Psicologo online per stress da lavoro e burnout'),
    ('psicologo-per-manager', 'Psicologo online per manager e professionisti'),
    ('coaching', 'Coaching online per chi lavora in azienda'),
    ('psicologo-online-italiani-estero', "Psicologo italiano online per chi vive all'estero"),
    ('psicologo-online-milano', 'Psicologo online a Milano'),
    ('approfondimenti', 'Approfondimenti di psicologia'),
    ('sindrome-impostore', "La sindrome dell'impostore"),
    ('dipendenza-affettiva', 'Dipendenza affettiva: quando amare diventa bisogno'),
    ('cervello-predittivo', 'Non vedi il mondo: lo anticipi'),
    ('finestra-johari', 'La finestra di Johari'),
    ('solitudine-italiani-estero', "Solitudine all'estero: lo stress dell'espatrio"),
    ('ansia-domenica-sera', "L'ansia della domenica sera"),
    ('crisi-coppia-gottman', "Crisi di coppia: i 4 segnali di Gottman"),
    ('come-scegliere-psicologo', "Come scegliere uno psicologo"),
    ('rimuginio-overthinking', "Overthinking: quando la mente non si spegne"),
    ('primo-colloquio-psicologo', "Primo colloquio: cosa dire, cosa aspettarsi"),
    ('burnout-sintomi-oms', "Burnout: cosa dice davvero l'OMS"),
    ('psicologo-online-funziona', "Lo psicologo online funziona?"),
    ('prima-di-dimenticare', "Prima di dimenticare: 5 pagine del taccuino, in PDF"),
]


def font(path, size, wght=None):
    f = ImageFont.truetype(path, size)
    if wght:
        try: f.set_variation_by_axes([wght])
        except Exception: pass
    return f


def wrap(draw, text, f, width):
    lines, cur = [], ''
    for w in text.split():
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=f) <= width: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur)
    return lines


def render(slug, title):
    W, H, PW = 1200, 630, 420
    im = Image.new('RGB', (W, H), PAPER)
    ph = Image.open(PHOTO).convert('RGB')
    s = H / ph.height * 1.0
    ph = ph.resize((int(ph.width * max(s, PW / ph.width)), int(ph.height * max(s, PW / ph.width))), Image.LANCZOS)
    left = (ph.width - PW) // 2
    im.paste(ph.crop((left, 0, left + PW, H)), (W - PW, 0))
    d = ImageDraw.Draw(im)
    x, maxw = 72, W - PW - 72 - 56
    size = 68
    while size > 40:
        ft = font(SERIF, size, 500)
        lines = wrap(d, title, ft, maxw)
        if len(lines) <= 4: break
        size -= 4
    lh = int(size * 1.12)
    y = (H - len(lines) * lh) // 2 - 30
    d.rectangle((x, y - 34, x + 64, y - 30), fill=AMBER)
    for i, l in enumerate(lines):
        d.text((x, y + i * lh), l, font=ft, fill=INK)
    fs = font(SANS, 26, 500)
    d.text((x, H - 112), 'Francesco Maragliulo, psicologo online', font=fs, fill=INK)
    d.text((x, H - 76), 'updateyourlife.it', font=font(SANS, 22, 400), fill=GRAPHITE)
    os.makedirs(OUT, exist_ok=True)
    im.save(os.path.join(OUT, slug + '.jpg'), quality=82, optimize=True, progressive=True)


if __name__ == '__main__':
    for slug, title in PAGES:
        render(slug, title)
        print('og', slug)
