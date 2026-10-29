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
import SnowfallGame from '@tdev/pyodide/snowfall-game/Component';

<SnowfallGame sceneId="snowfall" />
```

```python
from snowfall_game import use_scene
from webio import gameloop, run

scene = use_scene('snowfall')
scene.configure(width=400, height=800, background_color='black')
scene.add_snowflake(200, 0, 5, 80)

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

`scene.snowflakes` liefert bei jedem Zugriff eine neue Liste der vorhandenen Handles. Dadurch können Schneeflocken während der Iteration entfernt werden. `reset()` entfernt alle Schneeflocken und behält die Szenenkonfiguration; mit `render()` wird die leere Szene sichtbar.

Klickereignisse enthalten `x` und `y` im `payload`, bereits in die konfigurierten Szenenkoordinaten umgerechnet. Das SVG passt sich schmalen Fenstern an. Mehrere Ansichten derselben `sceneId` teilen ihren Zustand.
