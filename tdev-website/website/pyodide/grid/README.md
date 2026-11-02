# Grid

Voraussetzung ist eine Teaching-Dev-Website mit installiertem `pyodide-code`-Package. Kopiere den vollständigen Ordner nach `website/pyodide/grid` und ergänze im bestehenden Pyodide-Plugin die `extensions`-Liste:

```ts
extensions: [
    './website/pyodide/grid'
]
```

Starte den Entwicklungsserver neu.

## Im Unterrichtsmaterial verwenden

```mdx
import Grid from '@tdev/pyodide/grid/src/components/Grid';

<Grid gridId="board" />
```

```py
from grid import Grid

board = Grid(10, 10, 'white', grid_id='board')
board[2][3] = 'navy'
board[2][3].text = 'A'
board[2][3].text_color = 'white'
await board.render()
```

`gridId`, `grid_id`
: Verbinden die Zeichenfläche mit dem Python-Gitter. Mehrere Ansichten derselben ID teilen die Anzeige; unabhängige Gitter benötigen unterschiedliche IDs.
`board[row][col]`
: Liefert eine leichte Zellansicht mit `color`, `text`, `text_color`, `text_scale`, `row`, `col` und `get(offset_x, offset_y)`. Die Nachbarsuche verbindet gegenüberliegende Ränder.
`board.set_cells(values, palette=None)`
: Übernimmt einen zusammenhängenden zweidimensionalen Integer-Buffer mit der Form `(rows, cols)`. Die Werte sind Indizes der bei `Grid(..., palette=colors)` oder bei `set_cells()` angegebenen Farbliste.
`await board.render()`
: Überträgt den vollständigen Zustand. Warte den Aufruf ab, bevor du erneut renderst. Farben und Text werden bis dahin nur im Worker geändert.

Für grosse Gitter werden die Zellen kompakt gespeichert. NumPy erlaubt eine Berechnung ohne Python-Schleife über jede Zelle:

```py
import numpy as np
from grid import Grid
from webio import gameloop, run

colors = ['navy', 'royalblue', 'deepskyblue', 'lightcyan']
board = Grid(1000, 1000, grid_id='board', palette=colors)
columns = np.arange(1000, dtype=np.uint16)
state = np.empty((1000, 1000), dtype=np.uint8)

@gameloop(fps=30, sources=[board])
async def update(ctx):
    offset = int(ctx.time / 20) % 100
    state[:] = ((columns + offset) // 25) % len(colors)
    board.set_cells(state)
    await board.render()

await run()
```

Die Python-Imports laden NumPy automatisch. Klickereignisse enthalten `row` und `col` sowie die Position `x` und `y` in Zellkoordinaten im Payload. Die zuletzt gezeichnete Ansicht bleibt nach Ende des Skripts erhalten.
