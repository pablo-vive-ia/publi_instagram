"""Presets de edición de fotos para el Instagram de Pablo.

Uso:
  python3 grade.py <entrada> <salida> --preset ambar|bn|bn_oro [--embers] [--izq "A|B|C"] [--der "LINEA 1|LINEA 2"]

Presets:
  ambar  -> low-key cálido: negros profundos, luces ámbar, sombras frías, mucha textura (ref. foto gym con capucha)
  bn     -> blanco y negro dramático: contraste alto, negros densos, grano fino
  bn_oro -> blanco y negro con virado dorado sutil en las luces (puente con la paleta #D9A441)
Opciones:
  --embers  partículas/brasas doradas (ref. selfie con chispas)
  --izq/--der  textos finos en mayúsculas, espaciados, en las esquinas superiores (| = salto de línea)
"""
import argparse
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT = '/usr/share/fonts/truetype/google-fonts/Poppins-Light.ttf'


def to_arr(im):
    return np.asarray(im.convert('RGB')).astype(np.float32) / 255.0


def to_img(a):
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def clarity(im, amount=0.6, radius=25):
    """Contraste local (textura en piel, venas, tela)."""
    a = to_arr(im)
    b = to_arr(im.filter(ImageFilter.GaussianBlur(radius)))
    return to_img(a + (a - b) * amount)


def contrast(a, k, mid=0.5):
    """Curva S (sigmoide normalizada a 0..1)."""
    s = lambda v: 1 / (1 + np.exp(-k * (v - mid)))
    return (s(np.clip(a, 0, 1)) - s(0)) / (s(1) - s(0))


def vignette(a, strength=0.55):
    h, w = a.shape[:2]
    y, x = np.ogrid[-1:1:h * 1j, -1:1:w * 1j]
    r = np.sqrt(x ** 2 * 0.9 + y ** 2 * 1.1)
    m = 1 - strength * np.clip((r - 0.45) / 0.9, 0, 1) ** 1.6
    return a * m[..., None]


def grain(a, amt=0.035, seed=7):
    rng = np.random.default_rng(seed)
    n = rng.normal(0, amt, a.shape[:2])[..., None]
    return a + n


def low_key(a, target):
    """Gamma automático para llevar la luminancia media a 'target' (look oscuro consistente)."""
    l = lum(a) if a.ndim == 3 and a.shape[-1] == 3 else a.squeeze()
    m = float(np.clip(np.median(l), 0.05, 0.95))
    g = np.log(target) / np.log(m)
    return np.clip(a, 1e-4, 1) ** max(g, 1.0)


def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def preset_ambar(im):
    im = clarity(im, 0.7)
    a = to_arr(im)
    a = low_key(a, 0.17)  # low-key: medios oscuros
    a = contrast(a, 6.0, 0.38)
    L = lum(a)[..., None]
    a = L + (a - L) * 0.55  # desaturar
    a = a * np.array([1.12, 0.93, 0.70])  # virado ámbar
    sh = np.clip(1 - L * 3.0, 0, 1)
    a = a + sh * np.array([-0.01, 0.006, 0.02])  # sombras apenas frías
    a = np.clip(a, 0.012, 1)
    return grain(vignette(a, 0.72), 0.028)


def preset_bn(im, oro=False):
    im = clarity(im, 0.8)
    a = to_arr(im)
    L = a[..., 0] * 0.35 + a[..., 1] * 0.5 + a[..., 2] * 0.15
    L = low_key(L[..., None], 0.2)[..., 0]
    L = contrast(L, 7.0, 0.4)
    a = np.repeat(L[..., None], 3, axis=2)
    if oro:
        hi = np.clip((L - 0.4) * 1.5, 0, 1)[..., None]
        a = a + hi * np.array([0.07, 0.035, -0.04])
    return grain(vignette(a, 0.72), 0.04)


def embers(img, n=110, seed=3):
    w, h = img.size
    rng = np.random.default_rng(seed)
    layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(n):
        x = rng.uniform(0, w)
        y = h * (0.45 + 0.55 * rng.beta(2, 1))  # más densas abajo
        r = rng.uniform(1.5, 6) * w / 1080
        al = int(rng.uniform(120, 255))
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 150, 40, al))
    glow = layer.filter(ImageFilter.GaussianBlur(6 * w / 1080))
    out = img.convert('RGBA')
    out = Image.alpha_composite(out, glow)
    out = Image.alpha_composite(out, layer.filter(ImageFilter.GaussianBlur(0.8)))
    return out.convert('RGB')


def corner_text(img, izq=None, der=None):
    w, h = img.size
    d = ImageDraw.Draw(img)
    size = int(w * 0.022)
    f = ImageFont.truetype(FONT, size)
    sp = size * 0.55
    lh = size * 2.1
    m = w * 0.06
    top = h * 0.17

    def tw(t):
        return sum(d.textlength(c, font=f) + sp for c in t) - sp

    def draw(t, x, y):
        for c in t:
            d.text((x, y), c, font=f, fill=(240, 236, 228))
            x += d.textlength(c, font=f) + sp
    if izq:
        for i, t in enumerate(izq.split('|')):
            draw(t.upper(), m, top + i * lh)
    if der:
        lines = der.split('|')
        for i, t in enumerate(lines):
            draw(t.upper(), w - m - tw(t.upper()), top + i * lh)
        y = top + len(lines) * lh + size * 0.6
        d.line([w - m - w * 0.04, y, w - m, y], fill=(240, 236, 228), width=max(1, int(w / 540)))
    return img


def main():
    p = argparse.ArgumentParser()
    p.add_argument('src'); p.add_argument('dst')
    p.add_argument('--preset', default='ambar', choices=['ambar', 'bn', 'bn_oro'])
    p.add_argument('--embers', action='store_true')
    p.add_argument('--izq'); p.add_argument('--der')
    a = p.parse_args()
    im = Image.open(a.src).convert('RGB')
    out = to_img(preset_ambar(im) if a.preset == 'ambar' else preset_bn(im, a.preset == 'bn_oro'))
    if a.embers:
        out = embers(out)
    if a.izq or a.der:
        out = corner_text(out, a.izq, a.der)
    out.save(a.dst, quality=95)


if __name__ == '__main__':
    main()
