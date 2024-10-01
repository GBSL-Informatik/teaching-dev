---
page_id: 55d68d05-6283-4263-b062-0c3321025478
---

import Restricted from '@tdev-components/documents/Restricted';
import BrowserWindow from '@tdev-components/BrowserWindow';

# Zugriffsbeschränkte Elemente

Wenn ein Element nur nach einer Freigabe angezeigt werden soll, eignet sich die `<Restricted>`-Komponente - sie versteckt ihren Inhalt, bis er freigegeben wurde.

```md
<Restricted id="43ba2a38-9612-402f-9daf-91204ff47a71">
Dieser Link wird nur bei entsprechender Berechtigung angezeigt:

[🔗 https://test.com/nicht-oeffentlicher-link](https://test.com/nicht-oeffentlicher-link)
</Restricted>
```

<BrowserWindow>
<Restricted id="43ba2a38-9612-402f-9daf-91204ff47a71">
Dieser Link wird nur bei entsprechender Berechtigung angezeigt:

[🔗 https://test.com/nicht-oeffentlicher-link](https://test.com/nicht-oeffentlicher-link)
</Restricted>
</BrowserWindow>

:::warning[Inhalt ist nicht geheim]
Obwohl der zugriffsbeschränkte Inhalt bei fehlender Berechtigung nicht im Browser angezeigt wird, ist er dennoch im Seitenquelltext enthalten. Versierte Nutzer:innen könnten ihn also unter Umständen trotzdem herausfinden.
:::

## Mögliche Use Cases
- Bestimmte Nutzer:innen sollen einen Inhalt (noch) nicht sehen. Zum Beispiel:
  - Die Lehrperson möchte den Arbeitsfortschritt steuern können (teacher-pacing).
  - Eine Überraschung oder ein besonderer Effekt soll nicht vorweggenommen werden.
  - Die Lehrperson möchte Inhalte zwischen verschiedenen Schüler:innen oder Lerngruppen (z.B.) differenzieren.
- Ein bestimmtes Element ist nur für die eingeloggten und zugriffsberechtigten Besucher:innen sinnvoll (z.B. ein zugriffsbeschränkter OneDrive-Link). 