# Cookie-Klicker

Voraussetzung ist eine Teaching-Dev-Website mit installiertem `pyodide-code`-Package. Kopiere diesen vollständigen Ordner nach `website/pyodide/cookie-klicker` und ergänze im vorhandenen Pyodide-Plugin die `extensions`-Liste:

```ts
extensions: [
    './website/pyodide/cookie-klicker'
]
```

Starte den Entwicklungsserver neu. Der Browser-Store wird automatisch angelegt; Änderungen am `SiteStore` sind nicht nötig.

## Im Unterrichtsmaterial verwenden

```mdx
import Cookie from '@tdev/pyodide/cookie-klicker/Component';

<Cookie cookieId="mein-cookie" />
```

```python
from cookie_klicker import use_cookie
from webio import on_click, run

cookie = use_cookie('mein-cookie')

@on_click(cookie)
def drehen(event):
    cookie.set_rotation(cookie.rotation + 30)

await run()
```

Die [Package-Dokumentation](https://github.com/GBSL-Informatik/teaching-dev/blob/main/packages/tdev/pyodide-code/docs/README.mdx) beschreibt die Erweiterungs-API.
