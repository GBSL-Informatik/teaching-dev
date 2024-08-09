import BrowserWindow from '@site/src/components/BrowserWindow';

# KBD
Tastenkombinationen und Tastenkürzel lassen sich mit `[[Taste]]` darstellen. Das Remark-Plugin wandelt dies in ein `<kbd>`-Element um.

```md
Drücke `[[Ctrl]]` + `[[C]]` um zu kopieren.
```

<BrowserWindow>
Drücke [[Ctrl]] + [[C]] um zu kopieren.
</BrowserWindow>

## Installation

:::info[Code]
- `src/plugins/remark-kbd`
:::

:::info[`docusaurus.config.ts`]
```ts
import kbdPlugin from './src/plugins/remark-kbd/plugin';
const config: Config = {
    presets: [
        [
            'classic',
            {
                docs: {
                    remarkPlugins: [kbdPlugin]
                },
                blog: {
                    remarkPlugins: [kbdPlugin]
                },
                pages: {
                    remarkPlugins: [kbdPlugin]
                },
            }
        ]
    ]
}
```
:::

:::info[`src/css/custom.scss`]
```css
kbd {
    padding: 0.3em 0.5em;
    padding-bottom: 0.35em;
    padding-top: 0.25em;
    border-radius: 0.5em;
    box-shadow: inset 1px -2px 0 var(--ifm-color-emphasis-400);
}
```