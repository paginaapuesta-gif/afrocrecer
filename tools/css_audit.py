#!/usr/bin/env python3
"""Auditoría CSS no destructiva para Afrocrecer frontend.
Genera reporte de uso de selectores por vista y duplicados exactos de bloques.
"""
from pathlib import Path
import re
from collections import Counter,defaultdict

ROOT=Path(__file__).resolve().parents[1]
CSS=ROOT/'frontend/css/style.css'
VIEWS=['login.html','registro.html','home.html','historia.html','atacaf.html','archivo.html']

css=CSS.read_text(encoding='utf-8',errors='ignore')
blocks=re.findall(r'([^{}]+)\{([^{}]*)\}',css,re.S)
selectors=[]
for sel,_ in blocks:
    for part in sel.split(','):
        s=' '.join(part.split())
        if s and not s.startswith('@'):
            selectors.append(s)

class_tokens=sorted(set(re.findall(r'\.([a-zA-Z0-9_-]+)',"\n".join(selectors))))
id_tokens=sorted(set(re.findall(r'#([a-zA-Z0-9_-]+)',"\n".join(selectors))))

def html_tokens(path:Path):
    t=path.read_text(encoding='utf-8',errors='ignore')
    tokens=set(re.findall(r'id=["\']([^"\']+)',t))
    for grp in re.findall(r'class=["\']([^"\']+)',t):
        tokens.update(grp.split())
    return tokens

used_global=set()
per_view={}
for v in VIEWS:
    toks=html_tokens(ROOT/'frontend'/v)
    used_cls={c for c in class_tokens if c in toks}
    used_ids={i for i in id_tokens if i in toks}
    used_global.update(used_cls); used_global.update(used_ids)
    per_view[v]=(used_cls,used_ids)

unused_classes=[c for c in class_tokens if c not in used_global]

normalized=[]
for sel,body in blocks:
    s=' '.join(sel.split())
    b=';'.join(x.strip() for x in body.split(';') if x.strip())
    normalized.append((s,b))
count=Counter(normalized)
exact_dupes=[(s,b,n) for (s,b),n in count.items() if n>1]

out=[]
out.append('# Fase 2 - Auditoría CSS (no destructiva)')
out.append('')
out.append(f'- Archivo auditado: `{CSS.relative_to(ROOT)}`')
out.append(f'- Total bloques CSS analizados: **{len(blocks)}**')
out.append(f'- Clases CSS detectadas: **{len(class_tokens)}**')
out.append(f'- IDs CSS detectados: **{len(id_tokens)}**')
out.append('')
out.append('## Uso por vista (tokens encontrados en HTML)')
for v,(cls,ids) in per_view.items():
    out.append(f'- `{v}`: clases usadas **{len(cls)}**, ids usados **{len(ids)}**')
out.append('')
out.append('## Clases potencialmente no usadas en vistas principales')
out.append('> Nota: estas clases pueden ser usadas por JS dinámico o vistas secundarias; no eliminar sin validación visual.')
out.append('')
for c in unused_classes[:120]:
    out.append(f'- `{c}`')
out.append('')
out.append('## Bloques CSS exactos duplicados (mismo selector + mismas propiedades)')
out.append('> Duplicado exacto no siempre implica borrado seguro si hay intención de orden por contexto; revisar caso a caso.')
out.append('')
for s,_,n in sorted(exact_dupes,key=lambda x:-x[2])[:80]:
    out.append(f'- `{s}` aparece **{n}** veces')
out.append('')
out.append('## Propuesta modular (sin aplicar aún)')
out.append('- `global.css`: reset/base, tipografías, body/background, utilidades globales.')
out.append('- `components.css`: botones, cards, modales, badges, formularios reutilizables.')
out.append('- `auth.css`: login/registro y variantes pro (`.login-page-pro`, `.btn-login`, `.login-panel`).')
out.append('- `home.css`: layout home/feed (`main-layout`, `sidebar`, `post`, `home-header`, `home-nav`).')
out.append('- `feed.css`: publicaciones, grids y detalle de post (`post-image`, galerías, estados).')
out.append('- `responsive.css`: media queries ordenadas por breakpoint ascendente (480, 768, 1024, 1280...).')
out.append('')
out.append('## Estrategia segura de migración')
out.append('1. Crear archivos por módulo y mover reglas por bloques completos sin editar propiedades.')
out.append('2. Mantener temporalmente `style.css` como agregador con `@import` o concatenación de build.')
out.append('3. Comparar capturas mobile/tablet/desktop antes de borrar reglas antiguas.')
out.append('4. Eliminar únicamente duplicados exactos validados por vista.')

report=ROOT/'frontend/css/FASE2_CSS_AUDIT.md'
report.write_text('\n'.join(out),encoding='utf-8')
print('Wrote',report)
