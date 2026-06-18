# JCI JSON Comparer

Herramienta CLI para comparar semánticamente dos archivos JSON de modelos AHU (Air Handling Units) de Johnson Controls.

## El problema

Los archivos JSON de modelos AHU (~17K líneas) contienen cientos de GUIDs que **cambian en cada exportación**. Comparar por ID o por posición en arrays no funciona — la misma entidad lógica aparece con GUIDs diferentes y en orden distinto entre dos versiones.

## La solución

**Matching semántico por business keys**: en lugar de comparar por GUID o índice, la herramienta:

1. Empareja segmentos por `segmentType + segmentTypeSuffix`
2. Dentro de cada lista, empareja items usando todas sus propiedades no-ID como **business key**
3. Compara recursivamente hasta el último nivel de anidación
4. Ignora campos volátiles (`id`, `$type`, `*_ID`)

### Reorganización estructural (--reorganize)

Los JSON AHU tienen listas planas como `openingList` (27 items) y `bulkheadList` (8 items) que references a segmentos via `associatedUISegmentID`. Con `--reorganize`, la herramienta reordena el JSON antes de comparar, anidando cada lista bajo su segmento correspondiente:

```
Antes:                          Después:
unit/                           unit/
├── segmentList[15]             ├── segmentList[15]/
├── openingList[27]             │   └── IP-1/
├── bulkheadList[8]             │       ├── openings[2]
├── coilPanelList[2]            │       ├── bulkheads[1]
├── airPathList[2]              │       ├── coilPanels[...]
├── cabinetList[2]              │       └── relatedReferences[...]
├── ...                          ├── airPathList[2]    ← multi-segment, queda top-level
                                └── ...
```

Esto hace que el diff muestre cambios como `unit.segmentList[match:IP/0].openings[added:...]` en lugar de `unit.openingList[match:...]`, dando contexto estructural inmediato.

## Stack

- **Python 3.10+** — cero dependencias externas (solo stdlib)
- **pytest** — tests unitarios y de integración
- **ruff** — linter y formateador

## Instalación

```bash
pip install pytest ruff
```

No requiere instalar el proyecto — se ejecuta directo.

## Uso

### Pipeline completo (un solo comando)

```bash
# Todo en uno: reorganiza -> diff.json -> diff.html
python run_diff.py

# Sin reorganizar
python run_diff.py --no-reorganize

# Con archivos custom
python run_diff.py mi_archivo1.json mi_archivo2.json
```

### CLI directa — diff JSON

```bash
# Output con formato legible
python -m src.cli archivo1.json archivo2.json --pretty

# Reorganizar antes de comparar (anida openings, bulkheads, etc. bajo cada segmento)
python -m src.cli archivo1.json archivo2.json --reorganize --pretty

# Reorganizar y además guardar los JSON reordenados como archivos _reorganized.json
python -m src.cli archivo1.json archivo2.json --reorganize --output-reorganized
```

| Flag | Descripción |
|------|-------------|
| `--pretty` / `-p` | Output indentado legible |
| `--reorganize` / `-r` | Reordena el JSON anidando listas bajo sus segmentos antes de comparar |
| `--output-reorganized` / `-o` | Guarda los JSON reordenados como `{nombre}_reorganized.json` (implica `--reorganize`) |

### HTML Report — análisis visual

```bash
python generate_report.py diff.json
# Genera diff.html — abrir en el navegador
```

## Reporte HTML

El reporte `diff.html` es un árbol interactivo con:

- **Código de colores**: amarillo (cambiado), verde (agregado), rojo (eliminado)
- **Filtro por búsqueda** en paths
- **Toggle "Solo cambios"** para ocultar nodos unchanged
- **Expandir/Colapsar todo**
- **Contador de cambios** en el header
- **Valores left/right** side-by-side con tachado para los cambiados

## Estructura del diff JSON

Cada nodo:

```json
{
  "path": "$.unit.segmentList[3].weight",
  "type": "integer",
  "status": "changed",
  "has_changes": true,
  "left": 1900,
  "right": 1925
}
```

| Campo | Descripción |
|---|---|
| `path` | Ruta JSON al nodo (notación `$` estilo JMESPath) |
| `type` | Tipo del valor (`object`, `array`, `string`, `integer`, `number`, `boolean`) |
| `status` | `unchanged`, `changed`, `added`, `removed` |
| `has_changes` | `true` si el nodo o algún hijo tiene cambios |
| `left` | Valor en el **primer archivo** (el "original" / baseline) — solo en `changed`, `removed` |
| `right` | Valor en el **segundo archivo** (el "nuevo" / variante) — solo en `changed`, `added` |
| `value` | Valor único (solo `added` / `removed`) |
| `children` | Hijos del nodo (solo `object` y `array`) |

## Tests

```bash
python -m pytest tests/ -v
```

Incluye tests unitarios (`test_matcher.py`, `test_differ.py`, `test_reorganizer.py`) y de integración contra los archivos reales (`test_integration.py`).

## Proyecto

```
jci-json-comparer/
├── src/
│   ├── __init__.py
│   ├── cli.py          # Entry point
│   ├── types.py        # DiffNode, DiffStatus, utilidades
│   ├── loader.py       # Carga de JSON (utf-8 / cp1252)
│   ├── reorganizer.py  # Reordenamiento: anida listas bajo segmentos
│   ├── matcher.py      # Matching semántico por business keys
│   └── differ.py       # Comparación recursiva
├── tests/
│   ├── __init__.py
│   ├── test_matcher.py
│   ├── test_differ.py
│   ├── test_reorganizer.py
│   └── test_integration.py
├── generate_report.py  # Genera HTML visual desde diff.json
├── run_diff.py         # Helper: ejecuta el comparador
├── pyproject.toml
├── .gitignore
└── README.md
```

## Arquitectura

```
┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────┐
│  Loader  │ → │ Reorganizer  │ → │ Matcher  │ → │  Differ  │ → JSON
│ (parse)  │    │ (--reorg)    │    │ (match)  │    │ (diff)   │
└──────────┘    └──────────────┘    └──────────┘    └──────────┘
```

Cuatro capas independientes:
- **Loader**: carga y parsea los JSON
- **Reorganizer**: [opcional] reordena el JSON anidando listas bajo sus segmentos (solo con `--reorganize`)
- **Matcher**: empareja segmentos por `segmentType + segmentTypeSuffix` e items de listas por business keys
- **Differ**: recorre y compara recursivamente produciendo un árbol `DiffNode`

## Licencia

Uso interno.
