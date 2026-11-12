import BrowserOnly from '@docusaurus/BrowserOnly';
import useIsBrowser from '@docusaurus/useIsBrowser';
import Loader from '@tdev-components/Loader';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useCmsStore } from '../hooks/useCmsStore';
import CmsLayout from './CmsLayout';
import CmsRoute from './CmsRoute';
import Directory from './MdxEditor/Directory';
import EditorNav from './MdxEditor/EditorNav';
import { useLoadedFile } from './MdxEditor/hooks/useLoadedFile';
import ShowFile from './ShowFile';
import styles from './styles.module.scss';

const CmsLandingPage = observer(() => {
    const isBrowser = useIsBrowser();
    const cmsStore = useCmsStore();
    const { settings, activeEntry, viewStore } = cmsStore;
    const entry = useLoadedFile(activeEntry);
    if (!settings || !cmsStore.github || !entry || !isBrowser) {
        return <Loader label="Laden..." />;
    }
    return (
        <main className={clsx(styles.cms, viewStore.showFileTree && styles.showFileTree)}>
            <div className={clsx(styles.header)}>
                <EditorNav />
            </div>
            <div className={clsx(styles.fileTree, viewStore.showFileTree && styles.showFileTree)}>
                <Directory
                    dir={cmsStore.rootDir}
                    className={clsx(styles.tree)}
                    contentClassName={clsx(styles.treeContent)}
                    showActions="hover"
                    compact
                    showAvatar
                />
            </div>
            <div className={clsx(styles.content)}>
                <ShowFile file={entry} />
            </div>
        </main>
    );
});

const Cms = () => {
    return (
        <CmsLayout>
            <BrowserOnly fallback={<Loader />}>
                {() => (
                    <CmsRoute>
                        <CmsLandingPage />
                    </CmsRoute>
                )}
            </BrowserOnly>
        </CmsLayout>
    );
};

export default Cms;
