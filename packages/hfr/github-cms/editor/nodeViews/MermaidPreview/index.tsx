import ErrorBoundary from '@docusaurus/ErrorBoundary';
import Mermaid from '@theme/Mermaid';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { useDebouncedValue } from './useDebouncedValue';

/** rendering a diagram is slow, it is rendered when typing pauses */
const RENDER_DELAY_MS = 300;

interface Props {
    code: string;
}

/**
 * Renders a mermaid diagram like on the page, with the `Mermaid` component of
 * `@docusaurus/theme-mermaid` (enabled in `docusaurus.config.ts`).
 */
const MermaidPreview = ({ code }: Props) => {
    const debouncedCode = useDebouncedValue(code, RENDER_DELAY_MS);
    return (
        <div className={clsx(styles.preview)}>
            {/* the code is often invalid while typing: the error is reset when the code changes */}
            <ErrorBoundary
                key={debouncedCode}
                fallback={({ error }) => <pre className={clsx(styles.error)}>{error.message}</pre>}
            >
                <Mermaid value={debouncedCode} />
            </ErrorBoundary>
        </div>
    );
};

export default MermaidPreview;
