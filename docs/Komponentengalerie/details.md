import BrowserWindow from '@site/src/components/BrowserWindow';

# Details

In Docusaurus werden html-details hübsch dargestellt. Hier ein Beispiel:

```md
<details>
    <summary>
        Mehr zu meinen **Sommerferien** 🍹
    </summary>
    ☀️⛰️🏖️🏝️
</details>
```
<BrowserWindow>
<details>
    <summary>
        Mehr zu meinen **Sommerferien** 🍹
    </summary>
    ☀️⛰️🏖️🏝️
</details>
</BrowserWindow>

Um die Details mit weniger Aufwand zu erstellen, können auch `:::details`-Blöcke verwendet werden:

```md
:::details[Mehr zu meinen **Sommerferien** 🍹]
☀️⛰️🏖️🏝️
:::
```
mit demselben Resultat:

<BrowserWindow>
:::details[Mehr zu meinen **Sommerferien** 🍹]
☀️⛰️🏖️🏝️
:::
</BrowserWindow>


## Installation

:::info[Code]
- `src/plugins/remark-details`
:::


:::info[`docusaurus.config.ts]

```ts {1,8,11,14}
import detailsPlugin from './src/plugins/remark-details/plugin';
const config: Config = {
    presets: [
        [
            'classic',
            {
                docs: {
                    beforeDefaultRemarkPlugins: [detailsPlugin]
                },
                blog: {
                    beforeDefaultRemarkPlugins: [detailsPlugin]
                },
                pages: {
                    beforeDefaultRemarkPlugins: [detailsPlugin]
                },
            }
        ]
    ]
}

```
:::
