import useIsBrowser from '@docusaurus/useIsBrowser';
import styles from './PdfViewer.module.scss';
import clsx from 'clsx';
import React, { useState } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import Icon from '@mdi/react';
import { mdiArrowLeftCircle, mdiArrowRightCircle, mdiDownload } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';
import Loader from '@tdev-components/Loader';

export interface Props {
    file: string | { data: Uint8Array; url?: string } | { url: string };
    name: string;
    page?: number;
    scroll?: boolean;
    width?: number;
    minWidth?: number;
    scale?: number;
    noDownload?: boolean;
}

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();
const options = {
    cMapUrl: 'cmaps/',
    cMapPacked: true
};

const SCALE = 0.95;

const PdfViewer = (props: Props) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState(-1);
    const [width, setWidth] = useState(props.width);
    const [height, setHeight] = useState(150);
    const inBrowser = useIsBrowser();
    const [overflowing, setOverflowing] = useState(false);
    const { file } = props;
    React.useEffect(() => {
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
        };
    }, []);
    const ref = React.useRef<HTMLDivElement>(null);

    const onHeightChange = () => {
        if (!ref.current) {
            return;
        }
        const canv = ref.current.querySelector('canvas.react-pdf__Page__canvas');
        if (canv) {
            const h = canv.getBoundingClientRect().height;
            setHeight(h);
        }
    };

    const onResize = () => {
        if (!ref.current) {
            return;
        }
        const rect = ref.current.getBoundingClientRect();
        const maxWidth = rect.width * SCALE;
        onHeightChange();
        let newWidth = maxWidth;
        let overflow = false;
        if (props.width && props.scale) {
            newWidth = Math.min(props.width * props.scale, maxWidth);
        } else if (props.width) {
            newWidth = Math.min(props.width, maxWidth);
        } else if (props.scale) {
            newWidth = props.scale * maxWidth;
        }
        if (props.minWidth && newWidth < props.minWidth) {
            newWidth = props.minWidth;
            overflow = true;
        }
        if (overflow !== overflowing) {
            setOverflowing(overflow);
        }
        setWidth(newWidth);
    };

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        if (pageNumber < 0) {
            setPageNumber(props.page || 1);
        }
        onResize();
    };

    const changePage = (offset: number) => {
        const { scrollX, scrollY } = window;
        if (pageNumber + offset > numPages) {
            setPageNumber(1);
        } else if (pageNumber + offset < 1) {
            setPageNumber(numPages);
        } else {
            setPageNumber(pageNumber + offset);
        }
        scheduleMicrotask(() => {
            window.scrollTo(scrollX, scrollY);
        });
    };

    const previousPage = () => {
        changePage(-1);
    };

    const nextPage = () => {
        changePage(1);
    };

    if (!inBrowser) {
        return <Loader />;
    }

    return (
        <div
            className={clsx(
                styles.pdfWrapper,
                overflowing && styles.overflowing,
                props.scroll && styles.scroll,
                (numPages <= 1 || props.page !== undefined) && styles.singlepage
            )}
            ref={ref}
        >
            <div style={{ height: `${height + 8}px` }}>
                <Document
                    file={props.file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className={clsx(styles.doc)}
                    options={options}
                    onError={(err) => console.error(err)}
                >
                    {props.scroll &&
                        Array.from({ length: numPages }, (_, idx) => (
                            <Page
                                className={clsx(styles.pdfPage)}
                                pageNumber={idx + 1}
                                width={width}
                                onLoadSuccess={onHeightChange}
                                key={idx}
                            />
                        ))}
                    {!props.scroll && pageNumber > 0 && (
                        <Page pageNumber={pageNumber} width={width} onLoadSuccess={onHeightChange} />
                    )}
                    {!props.noDownload && (
                        <a
                            href={typeof file === 'string' ? file : file.url}
                            className={clsx(styles.download, 'button', 'button--secondary', 'button--sm')}
                            download={props.name}
                        >
                            <Icon path={mdiDownload} size={0.8} />
                        </a>
                    )}
                </Document>
            </div>
            {!props.scroll && (
                <div className={clsx(styles.controls)}>
                    {numPages > 1 && props.page === undefined && (
                        <div className={clsx('button-group')}>
                            <Button
                                onClick={previousPage}
                                icon={mdiArrowLeftCircle}
                                size={0.8}
                                color="secondary"
                            />
                            <span className={clsx(styles.badge, 'badge', 'badge--secondary')}>
                                {pageNumber || (numPages ? 1 : '--')} / {numPages || '--'}
                            </span>
                            <Button onClick={nextPage} icon={mdiArrowRightCircle} size={0.8} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PdfViewer;
