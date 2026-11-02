# Schneefall-Spiel

Voraussetzung ist eine Teaching-Dev-Website mit installiertem `pyodide-code`-Package und `webio.gameloop`. Kopiere diesen vollständigen Ordner nach `website/pyodide/snowfall-game` und ergänze im vorhandenen Pyodide-Plugin die `extensions`-Liste:

```ts
extensions: [
    './website/pyodide/snowfall-game'
]
```

Starte den Entwicklungsserver neu. Der Browser-Store wird automatisch angelegt.

## Im Unterrichtsmaterial verwenden

```mdx
import SnowfallGame from '@tdev/pyodide/snowfall-game/src/components/SnowfallGame';

<SnowfallGame sceneId="snowfall" />
```

```python
from snowfall_game import use_scene
from webio import gameloop, run

scene = use_scene('snowfall')
scene.configure(width=400, height=800, background_color='black')
scene.add_snowflake(200, 0, 12, 80, color='lightblue')
scene.add_dot(200, 400, 6, color='#ff8800')

@gameloop(fps=30, sources=[scene])
def update(ctx):
    for snowflake in scene.snowflakes:
        snowflake.y += snowflake.speed * ctx.dt
        if snowflake.y > scene.height:
            scene.remove_snowflake(snowflake)
    scene.render()

await run()
```

`ctx.dt` ist die seit dem letzten Frame verstrichene Zeit in Sekunden. `render()` überträgt den aktuellen Zustand als eine Nachricht an die Anzeige. Änderungen an Schneeflocken werden bis dahin nur im Worker gespeichert.

`scene.add_snowflake(x, y, size, speed, color='white')`
: Erzeugt ein `mdiSnowflake`-Symbol mit Mittelpunkt `(x, y)` und halber Symbolgrösse `size`. Gibt einen Handle mit veränderbaren Eigenschaften `x`, `y`, `size`, `speed` und `color` zurück.
`scene.add_dot(x, y, size, color='white')`
: Erzeugt einen ausgefüllten Kreis mit Mittelpunkt `(x, y)` und Radius `size`. Gibt einen Handle mit veränderbaren Eigenschaften `x`, `y`, `size` und `color` zurück. Punkte werden vor den Schneeflocken gezeichnet.
`scene.snowflakes`, `scene.dots`
: Momentaufnahmen der jeweiligen Handles. Während der Iteration können Elemente entfernt werden.
`scene.remove_snowflake(snowflake)`, `scene.remove_dot(dot)`
: Entfernen den angegebenen Handle aus der Szene.
`scene.reset()`
: Entfernt alle Schneeflocken und Punkte und behält die Szenenkonfiguration.
`scene.render()`
: Überträgt Positionen, Grössen und CSS-Farben gemeinsam an die Anzeige.

Klickereignisse enthalten `x` und `y` im `payload`, bereits in die konfigurierten Szenenkoordinaten umgerechnet. Das SVG passt sich schmalen Fenstern an. Mehrere Ansichten derselben `sceneId` teilen ihren Zustand.
