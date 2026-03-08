import clsx from 'clsx';
import Layout from '@theme/Layout';
import StandaloneEditor from '@tdev/excalidoc/ImageMarkupEditor/StandaloneEditor';
import { observer } from 'mobx-react-lite';
import styles from './excalidraw.module.scss';

const ExcalidrawEditor = observer((): React.ReactNode => {
    return (
        <Layout
            title={`Excalidraw Image Markup Editor`}
            description="A standalone version of the Excalidraw-based image markup editor used in Teaching Dev."
            wrapperClassName={clsx(styles.editor)}
        >
            <main>
                <StandaloneEditor />
            </main>
        </Layout>
    );
});

export default ExcalidrawEditor;
