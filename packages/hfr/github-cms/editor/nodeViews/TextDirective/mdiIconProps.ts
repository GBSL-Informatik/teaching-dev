import type Icon from '@mdi/react';
import { transformAttributes } from '@tdev-plugins/helpers';
import { MDI_PLUGIN_OPTIONS } from '@tdev-plugins/remark-mdi/options';
import { transformMdiAttributes } from '@tdev-plugins/remark-mdi/plugin';
import type React from 'react';
import type { DirectiveAttributes } from '../../schema';

/**
 * The props of the icon of `:mdi[name]{attributes}` as the page renders it (size, color, spin,
 * class, ...), see `remark-mdi`. The class `mdi-icon` applies the styles of the site css.
 */
export const mdiIconProps = (attributes: DirectiveAttributes) => {
    const options = transformMdiAttributes(transformAttributes(attributes), MDI_PLUGIN_OPTIONS);
    // the attributes are written by the author: like on the page, they are passed as they are
    return options.attributes as Omit<React.ComponentProps<typeof Icon>, 'path'>;
};
