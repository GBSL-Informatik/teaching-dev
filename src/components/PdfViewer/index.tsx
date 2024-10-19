import useIsBrowser from '@docusaurus/useIsBrowser';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import type { default as PdfViewerType, Props } from './PdfViewer';
import Loader from '@tdev-components/Loader';

/**
 * Lazy load PdfViewer component - this is a workaround for SSR
 * Background: PdfViewer uses react-pdf which uses background-worker
 * which are not available in SSR
 *
 * --> dynamic import PdfViewer component when it's needed
 */

export const PdfViewer = observer((props: Props) => {
    const [pdfViewer, setPdfViewer] = React.useState<{ default: typeof PdfViewerType }>();
    React.useEffect(() => {
        import('./PdfViewer').then((pdfViewer) => {
            setPdfViewer(pdfViewer);
        });
    }, []);
    if (!useIsBrowser() || !pdfViewer) {
        return <Loader />;
    }

    return <pdfViewer.default {...props} />;
});

export default PdfViewer;
