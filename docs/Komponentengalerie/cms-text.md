---
page_id: 1eba00db-a78c-4cd7-afcb-2bf358c7ba00
---

import CmsDeflistEntry from '@tdev-components/documents/CmsDeflistEntry';
import CmsText from '@tdev-components/documents/CmsText';
import DefinitionList from '@tdev-components/DefinitionList';
import BrowserWindow from '@tdev-components/BrowserWindow';

# CMS Text
Use cases:
- Deflist entry (z.B. für Note)
- Theoretisch (wenn shared document gut funktioniert): nicht-öffentliche infos, die nicht im Client landen sollen.

:::info[IDs auf dieser Seite]
`21535ea1-47d9-4521-a7fa-392f06d08f0a` -> Dokument vorhanden

`2c0c085d-388a-48cd-9871-975bab0ffda3` -> kein Dokument vorhanden
:::

:::info[Kein Dokument erstellt]
Im Gegensatz zu vielen anderen Komponenten erstellen die Komponenten rund um CMS Text bewusst nicht automatisch ein Dokument, wenn keins vorhanden ist.
:::

## Inline-Text
```md
Der Text "<CmsText id="21535ea1-47d9-4521-a7fa-392f06d08f0a"/>" wurde aus der Datenbank geladen.
```

<BrowserWindow>
Der Text "<CmsText id="21535ea1-47d9-4521-a7fa-392f06d08f0a"/>" wurde aus der Datenbank geladen.
</BrowserWindow>

Besitzt der aktuelle User kein Document für die angegebene DocumentRoot `id`, dann bleibt der Text leer:

```md
Der Text "<CmsText id="2c0c085d-388a-48cd-9871-975bab0ffda3"/>" wurde aus der Datenbank geladen.
```

<BrowserWindow>
Der Text "<CmsText id="2c0c085d-388a-48cd-9871-975bab0ffda3"/>" wurde aus der Datenbank geladen.
</BrowserWindow>

## `DefinitionList`-Eintrag
Mit der Komponente `<CmdDeflistEntry>` wird ein Eintrag in einer `DefinitionList` nur dann angezeigt, wenn der aktuelle User ein Document für diese DocumentRoot `id` besitzt. Der `<dt>`-Wert wird als Attribut gesetzt, während der `<dd>`-Wert aus dem Document ausgelesen wird.

```md
<DefinitionList>
    <dt>Hallo</dt>
    <dd>Das ist der erste Eintrag.</dd>
    <dt>Welt</dt>
    <dd>Das ist der zweite Eintrag.</dd>
    <CmsDeflistEntry id="21535ea1-47d9-4521-a7fa-392f06d08f0a" dt="CMS-Eintrag" />
</DefinitionList>
```

<BrowserWindow>
  <DefinitionList>
      <dt>Hallo</dt>
      <dd>Das ist der erste Eintrag.</dd>
      <dt>Welt</dt>
      <dd>Das ist der zweite Eintrag.</dd>
      <CmsDeflistEntry id="21535ea1-47d9-4521-a7fa-392f06d08f0a" dt="CMS-Eintrag" />
  </DefinitionList>
</BrowserWindow>

Besitzt der aktuelle User kein Document für die angegebene DocumentRoot `id`, dann wird der gesamte Eintrag nicht angezeigt:

```md
<DefinitionList>
    <dt>Hallo</dt>
    <dd>Das ist der erste Eintrag.</dd>
    <dt>Welt</dt>
    <dd>Das ist der zweite Eintrag.</dd>
    <CmsDeflistEntry id="2c0c085d-388a-48cd-9871-975bab0ffda3" dt="CMS-Eintrag" />
</DefinitionList>
```

<BrowserWindow>
  <DefinitionList>
      <dt>Hallo</dt>
      <dd>Das ist der erste Eintrag.</dd>
      <dt>Welt</dt>
      <dd>Das ist der zweite Eintrag.</dd>
      <CmsDeflistEntry id="2c0c085d-388a-48cd-9871-975bab0ffda3" dt="CMS-Eintrag" />
  </DefinitionList>
</BrowserWindow>

Für den `<dt>`-Eintrag kann auch ein React-Node angegeben werden:

```md
<DefinitionList>
    <dt>Hallo</dt>
    <dd>Das ist der erste Eintrag.</dd>
    <dt>Welt</dt>
    <dd>Das ist der zweite Eintrag.</dd>
    <CmsDeflistEntry
      id="21535ea1-47d9-4521-a7fa-392f06d08f0a"
      dt={<span style={{color: 'blue'}}>CMS-Eintrag</span>} />
</DefinitionList>
```

<BrowserWindow>
  <DefinitionList>
    <dt>Hallo</dt>
    <dd>Das ist der erste Eintrag.</dd>
    <dt>Welt</dt>
    <dd>Das ist der zweite Eintrag.</dd>
    <CmsDeflistEntry
      id="21535ea1-47d9-4521-a7fa-392f06d08f0a"
      dt={<span style={{color: 'blue'}}>CMS-Eintrag</span>} />
  </DefinitionList>
</BrowserWindow>

## TODO
- Inline-Component, die ein Document erstellt
- Allenfalls so umbauen, dass man einen `<CmsTextContext>` angeben kann, und dass der ganze Context nur dann angezeigt wird, wenn ein Dokument verfügbar ist. So könnte man sich die spezifische `CmsDeflistEntry` gleich sparen. Das müsste man idealerweise aber schlau genug machen, dass man im gleichen Kontext auch auf mehrere CmsText-Elemente reagieren kann, denke ich...
- evtl. CMS Admin-Panel: docRoot eingeben, docs mit author-name anzeigen / löschen; CSV upload
  - Achtung, Erstellung für Student durch Admin: API um eine Art "create document on behalf"-Funktionalität erweitern?
