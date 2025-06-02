import useIsBrowser from '@docusaurus/useIsBrowser';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import type { default as PdfViewerType } from '@tdev/remark-pdf/PdfViewer/PdfViewer';
import Loader from '@tdev-components/Loader';

/**
 * Lazy load PdfViewer component - this is a workaround for SSR
 * Background: PdfViewer uses react-pdf which uses background-worker
 * which are not available in SSR
 *
 * --> dynamic import PdfViewer component when it's needed
 */

export const PdfViewer = observer((props: React.ComponentProps<typeof PdfViewerType>) => {
    const [pdfViewer, setPdfViewer] = React.useState<{ default: typeof PdfViewerType }>();
    const isBrowser = useIsBrowser();
    React.useEffect(() => {
        import('@tdev/remark-pdf/PdfViewer/PdfViewer').then((pdfViewer) => {
            setPdfViewer(pdfViewer);
        });
    }, []);
    if (!isBrowser || !pdfViewer) {
        return <Loader />;
    }

    return <pdfViewer.default {...props} />;
});

export default PdfViewer;
