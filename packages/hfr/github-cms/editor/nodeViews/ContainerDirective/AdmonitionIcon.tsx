import { mdiLightbulbOnOutline, mdiPencilBoxOutline, mdiScriptTextOutline } from '@mdi/js';
import Icon from '@mdi/react';
import IconDanger from '@theme/Admonition/Icon/Danger';
import IconInfo from '@theme/Admonition/Icon/Info';
import IconNote from '@theme/Admonition/Icon/Note';
import IconTip from '@theme/Admonition/Icon/Tip';
import IconWarning from '@theme/Admonition/Icon/Warning';
import React from 'react';

const mdiIcon = (path: string) => () => <Icon path={path} />;

/** the icons of the admonitions in `src/theme/Admonition/Types.tsx` */
const ICONS: Record<string, React.ComponentType> = {
    note: IconInfo,
    tip: IconTip,
    info: IconNote,
    warning: IconWarning,
    caution: IconWarning,
    danger: IconDanger,
    aufgabe: mdiIcon(mdiPencilBoxOutline),
    definition: mdiIcon(mdiScriptTextOutline),
    finding: mdiIcon(mdiLightbulbOnOutline),
    insight: mdiIcon(mdiLightbulbOnOutline)
};

interface Props {
    type: string;
}

/**
 * The icon of an admonition, next to its toolbar and title. Unknown types show the info icon.
 */
const AdmonitionIcon = ({ type }: Props) => {
    const TypeIcon = ICONS[type] ?? IconNote;
    return (
        <span className="cms-admonition-icon">
            <TypeIcon />
        </span>
    );
};

export default AdmonitionIcon;
