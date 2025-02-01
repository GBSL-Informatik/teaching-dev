---
page_id: edebd470-67c3-4ebe-9e96-3674b34dff25
tags: [remark]
---

import BrowserWindow from '@tdev-components/BrowserWindow'

# Flex Cards

```md
:::flex
Hello world!
::br
Hello moon!
:::
```

<BrowserWindow>
  :::flex
  Hello world!

  ::br

  Hello moon!
  :::
</BrowserWindow>

## Verschachtelt

```md
::::flex
Nesting Level 1
::br
Content with a flex
:::flex
Boo!
::br
Yaa!
:::
::::
```

<BrowserWindow>
  ::::flex
  Nesting Level 1

  ::br

  Content with a flex

  :::flex
  Boo!

  ::br

  Yaa!
  :::
  ::::
</BrowserWindow>

## Cards

Dasselbe mit den Docusaurus-Cards und dem Stichwort `cards`

```md
::::cards
Nesting Level 1
::br
Content with a cards section
:::cards
::br{.alert .alert--danger}
Boo!
::br{.alert .alert--primary}
Yaa!
:::
::::
```

<BrowserWindow>
  ::::cards
  Nesting Level 1

  ::br

  Content with a cards section

  :::cards
  ::br{.alert.alert--danger}

  Boo!

  ::br{.alert.alert--primary}

  Yaa!
  :::
  ::::
</BrowserWindow>

### Mit Bildern

```md
:::cards{flexBasis=200px maxWidth=300px}
![Some Image](https://images.unsplash.com/photo-1506624183912-c602f4a21ca7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60)
Hello world!
::br
![Some Image](https://images.unsplash.com/photo-1501619951397-5ba40d0f75da?ixlib=rb-1.2.1&auto=format&fit=crop&w=1655&q=80)
Hello Holidays!
:::
```

<BrowserWindow>
  :::cards{flexBasis="200px" maxWidth="420px"}
  ![Drone View](https://images.unsplash.com/photo-1506624183912-c602f4a21ca7?ixlib=rb-1.2.1\&ixid=eyJhcHBfaWQiOjEyMDd9\&auto=format\&fit=crop\&w=800\&q=60)
  Hello world!

  ::br

  ![Sunset](https://images.unsplash.com/photo-1501619951397-5ba40d0f75da?ixlib=rb-1.2.1\&auto=format\&fit=crop\&w=1655\&q=80)
  Hello Holidays!
  :::
</BrowserWindow>

## Installation

:::info[Code]
- `src/plugins/remark-flex-cards`
:::

:::info[`src/css/custom.scss`]
```css
div.flex {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em;
    margin-bottom: 1em;

    > div.item {
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: 10px;

        &.noFlex {
            flex-grow: unset;
            flex-shrink: unset;
            flex-basis: unset;
        }
        &.empty {
            opacity: 0;
        }

        .card__image {
            :first-child {
                margin: 0;
                margin-left: auto;
                margin-right: auto;
            }

            figure {
                margin: 0;
                line-height: 0;
                flex-grow: 1;

                > * {
                    line-height: normal;
                }

                figcaption {
                    margin: 0.4em 1em;
                }
            }

            &.code__card {
                padding: 0;
            }
        }
    }
    
    &[style*='justify-content: space-around'],
    &[style*='justify-content: space-between'],
    &[style*='justify-content: center'],
    &[style*='justify-content: flex-end'],
    &[style*='justify-content: end'],
    &[style*='justify-content: space-evenly'] {
        > div.item {
            flex-grow: 0;
        }
    }
}
```
:::

:::info[`docusaurus.config.ts`]
```ts
import flexCardsPlugin from './src/plugins/remark-flex-cards/plugin';
const BEFORE_DEFAULT_REMARK_PLUGINS = [
    /* ... */
    flexCardsPlugin
];
```
:::