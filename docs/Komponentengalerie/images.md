---
page_id: e1405533-17b1-46d8-9168-97c6c0d1f362
tags: [remark]
---
import BrowserWindow from '@tdev-components/BrowserWindow';

# Bilder

Bilder können im Markdown-Style eingebunden werden. Der `alt`-Text wird automatisch als Bildunterschrift hinzugefügt, wobei zusätzliche Eigenschaften wie die Breite oder Höhe des Bildes zuerst extrahiert werden. Zudem wird eine Quellenangabe hinzugefügt, falls sich beim Bildpfad ein gleichnamiges `.json`-File befindet, welches die Bildinformationen enthält.

```md
![Streetfood Festival --width=300px](./images/street-food.jpg)
```

mit einem gleichnamigen `.json`-File:

```json title="./images/street-food.json"
{
    "author": "Takeaway",
    "source": "https://commons.wikimedia.org/wiki/File:Street_food_Yasothon.jpg",
    "licence": "CC BY-SA 3.0",
    "licence_url": "https://creativecommons.org/licenses/by-sa/3.0/deed.en",
    "edited": false
}
```

<BrowserWindow>
![Streetfood Festival --width=450px](./images/street-food.jpg)
</BrowserWindow>

:::warning[Formatierte Bildunterschrift]
Die Bildunterschrift kann aktuell nicht formatiert werden.
:::

## Inlining der Quellenangabe
Wenn keine Bildunterschrift angegeben wird, wird die Quellenangabe automatisch _inlined_ (also in das Bild hineinverschoben):

```md
![--width=450px](./images/street-food.jpg)
```

<BrowserWindow>
![--width=450px](./images/street-food.jpg)
</BrowserWindow>

Dieses Verhalten kann mit der Plugin-Option `inlineEmptyCaptions: false` deaktiviert werden ([siehe unten](#automatisches-inlining-deaktivieren)).

Zudem kann das Inlining der Quellenangabe (und Bildunterschrift, falls vorhanden) mit der Option `--inlineCaption` auch für ein einzelnes Bild erzwingen oder verhindert werden:

 ```md
![Schneebedeckte Strasse --width=450px --inlineCaption={true}](./images/snowy-street.jpg)
```

<BrowserWindow>
![Schneebedeckte Strasse --width=450px --inlineCaption={true}](./images/snowy-street.jpg)
</BrowserWindow>

## Formatierung der Bildunterschrift
Die Bildunterschrift kann mit gängigen Markdown-Formatierungen wie **Fett**, *Kursiv* oder `Code` versehen werden

```md
![**Fett**, *Kursiv* und :mdi[laptop]{.red} `Code` --width=450px](./images/fat-cursive-code.jpg)
```
<BrowserWindow>
![**Fett**, *Kursiv* und :mdi[laptop]{.red} `Code` --width=450px](./images/fat-cursive-code.jpg)
</BrowserWindow>

## Installation

:::info[Code]
- `src/components/Figure`
- `src/plugins/remark-images`
:::

:::info[`src/theme/MDXComponents.tsx`]
```tsx {2-3,8-9}
import MDXComponents from '@theme-original/MDXComponents';
import Figure from '../components/Figure';
import SourceRef from '../components/Figure/SourceRef';

export default {
  // Re-use the default mapping
  ...MDXComponents,
    Figure: Figure,
    SourceRef: SourceRef,
};
```
:::

:::info[`docusaurus.config.ts]

```ts
import imagePlugin from './src/plugins/remark-images/plugin';

const BEFORE_DEFAULT_REMARK_PLUGINS = [
    /* ... */
    [
        imagePlugin,
        { tagNames: { sourceRef: 'SourceRef', figure: 'Figure' } }
    ]
];
```
:::

### Automatisches Inlining deaktivieren
Um das automatische Inlining von leeren Bildunterschriften zu deaktivieren, können die Plugin-Optionen wie folgt ergänzt werden:

```ts
[
    imagePlugin,
    { inlineEmptyCaptions: false, ... }
]
```

### VS Code
Damit die Bild-Quellen einfach eingefügt werden können, kann folgendes Snippet unter hinzugefügt werden. So wird beim Eintippen von `src` in einem `.json`-File automatisch die Quellenangabe eingefügt.
:::details[`.vscode/json.code-snippets`]
```json	title=".vscode/json.code-snippets"
{
	// Place your ofi-blog workspace snippets here. Each snippet is defined under a snippet name and has a scope, prefix, body and 
	// description. Add comma separated ids of the languages where the snippet is applicable in the scope field. If scope 
	// is left empty or omitted, the snippet gets applied to all languages. The prefix is what is 
	// used to trigger the snippet and the body will be expanded and inserted. Possible variables are: 
	// $1, $2 for tab stops, $0 for the final cursor position, and ${1:label}, ${2:another} for placeholders. 
	// Placeholders with the same ids are connected.
	// Example:
	// "Print to console": {
	// 	"scope": "javascript,typescript",
	// 	"prefix": "log",
	// 	"body": [
	// 		"console.log('$1');",
	// 		"$2"
	// 	],
	// 	"description": "Log output to console"
	// }
	
	"licence": {
		"prefix": "src",
		"scope": "json",
		"body": [
			"{" \
				"\"author\": \"$1\"," \
				"\"source\": \"$2\"," \
				"\"licence\": \"$3\"," \
				"\"licence_url\": \"$4\"," \
				"\"edited\": false" \
			"}"
		],
		"description": "licence information for a picture"
	},
	"cc0": {
		"prefix": "cc0",
		"body": "https://creativecommons.org/share-your-work/public-domain/cc0/",
		"description": "Creative Commons 0"
	},
	"cc4": {
		"prefix": "cc4",
		"body": "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.de",
		"description": "Creative Commons 4.0"
	}
}
```
:::
