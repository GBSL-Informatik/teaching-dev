# Uhr

Voraussetzung ist eine Teaching-Dev-Website mit installiertem `pyodide-code`-Package. Kopiere diesen vollständigen Ordner nach `website/pyodide/clock` und ergänze im vorhandenen Pyodide-Plugin die `extensions`-Liste:

```ts
extensions: [
    './website/pyodide/clock'
]
```

Starte den Entwicklungsserver neu. Der Browser-Store wird automatisch angelegt; Änderungen am `SiteStore` sind nicht nötig.

## Im Unterrichtsmaterial verwenden

```mdx
import Clock from '@tdev/pyodide/clock/src/components/Clock';

<Clock clockId="meine-uhr" />
```

```python
from clock import use_clock

uhr = use_clock('meine-uhr')
uhr.set_time(90, 180, 270)
```

Die Winkel für Stunden-, Minuten- und Sekundenzeiger werden in Grad angegeben.

Die [Package-Dokumentation](https://github.com/GBSL-Informatik/teaching-dev/blob/main/packages/tdev/pyodide-code/docs/README.mdx) beschreibt die Erweiterungs-API.
