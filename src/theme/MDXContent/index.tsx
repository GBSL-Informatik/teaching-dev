import React, { type ReactNode } from 'react';
import MDXContent from '@theme-original/MDXContent';
import type MDXContentType from '@theme/MDXContent';
import type { WrapperProps } from '@docusaurus/types';
import Admonition from '@theme/Admonition';
import Icon from '@mdi/react';
import { mdiQrcodeScan } from '@mdi/js';

type Props = WrapperProps<typeof MDXContentType>;

export default function MDXContentWrapper(props: Props): ReactNode {
    return (
        <>
            <Admonition
                type="info"
                title="Entdecke die MINT-Rätsel"
                icon={<Icon path={mdiQrcodeScan} size={1} color="var(--ifm-color-blue)" />}
            >
                Überall in der Schule findest du QR-Codes - scanne sie und stelle dein Wissen in Mathematik,
                Informatik und Naturwissenschaften auf die Probe! Spannende Rätsel und knifflige Aufgaben
                warten auf dich. Bist du bereit, sie zu lösen? Dann starte jetzt im Foyer!
                <small style={{ float: 'right' }}>MINT-Woche der 26e</small>
            </Admonition>
            <MDXContent {...props} />
        </>
    );
}
