import BrowserWindow from '@site/src/components/BrowserWindow';

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
![Streetfood Festival --width=450px --border-radius=20px](./images/street-food.jpg)
</BrowserWindow>

:::warning[Formatierte Bildunterschrift]
Die Bildunterschrift kann aktuell nicht formatiert werden.
:::


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

```ts {1,10-13,18-21,26-29}
import imagePlugin from './src/plugins/remark-images/plugin';

const config: Config = {
    presets: [
        [
            'classic',
            {
                docs: {
                    beforeDefaultRemarkPlugins: [
                        [
                            imagePlugin,
                            { tagNames: { sourceRef: 'SourceRef', figure: 'Figure' } }
                        ]
                    ]
                },
                blog: {
                    beforeDefaultRemarkPlugins: [
                        [
                            imagePlugin,
                            { tagNames: { sourceRef: 'SourceRef', figure: 'Figure' } }
                        ]
                    ]
                },
                pages: {
                    beforeDefaultRemarkPlugins: [
                        [
                            imagePlugin,
                            { tagNames: { sourceRef: 'SourceRef', figure: 'Figure' } }
                        ]
                    ]
                },
            }
        ]
    ]
}

```
:::

### VS Code
Damit die Bild-Quellen einfach eingefügt werden können, kann folgendes Snippet unter hinzugefügt werden. So wird beim Eintippen von `src` in einem `.json`-File automatisch die Quellenangabe eingefügt.

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