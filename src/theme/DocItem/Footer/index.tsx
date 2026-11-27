import type { WrapperProps } from '@docusaurus/types';
import CopyAsExcalidraw from '@tdev/excalidoc/CopyAsExcalidraw';
import Footer from '@theme-original/DocItem/Footer';
import type FooterType from '@theme/DocItem/Footer';

type Props = WrapperProps<typeof FooterType>;

const FooterWrapper = (props: Props) => {
    return (
        <>
            <CopyAsExcalidraw />
            <Footer {...props} />
        </>
    );
};

export default FooterWrapper;
