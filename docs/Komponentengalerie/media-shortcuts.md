import BrowserWindow from '@site/src/components/BrowserWindow';

# Medien Einfügen

Folgende Quellen werden aktuell unterstützt:
- video
- audio
- youtube
- circuitverse

```md
::video[./assets/yogi-bear.mp4]{width=100% height=200px}

::audio[./assets/sound.mp3]
@by [KAM HESARI - Chill](https://freemusicarchive.org/music/kam-hesari/single/chill-3/)

::youtube[https://www.youtube.com/embed/QPZ0pIK_wsc?si=fP8L8fYQ-TYgYwUe]

::circuitverse[https://circuitverse.org/simulator/embed/rothe-inverter]
```

<BrowserWindow>
::video[./assets/yogi-bear.mp4]{width=100% height=200px}
</BrowserWindow>
<BrowserWindow>
::audio[./assets/sound.mp3]

@by [KAM HESARI - Chill](https://freemusicarchive.org/music/kam-hesari/single/chill-3/)
</BrowserWindow>
<BrowserWindow>
::youtube[https://www.youtube.com/embed/QPZ0pIK_wsc?si=fP8L8fYQ-TYgYwUe]
</BrowserWindow>
<BrowserWindow>
::circuitverse[https://circuitverse.org/simulator/embed/rothe-inverter]
</BrowserWindow>



## Installation

:::info[Code]
- `src/plugins/remark-media`
:::

:::info[`docusaurus.config.ts]

```ts {1,8,11,14}
import mediaPlugin from './src/plugins/remark-media/plugin';
const config: Config = {
    presets: [
        [
            'classic',
            {
                docs: {
                    remarkPlugins: [mediaPlugin]
                },
                blog: {
                    remarkPlugins: [mediaPlugin]
                },
                pages: {
                    remarkPlugins: [mediaPlugin]
                },
            }
        ]
    ]
}

```
:::
