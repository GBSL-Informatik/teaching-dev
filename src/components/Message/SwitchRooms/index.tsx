import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

import { matchPath, useLocation } from '@docusaurus/router';

interface Props {
    basePath: string;
}
export default function SwitchRooms(props: Props): JSX.Element {
    const location = useLocation();
    const room = matchPath(location.pathname, '/rooms/:room');
    return (
        <Layout
            title={`Räume`}
            description="Nachrichtenräume"
        >
            {JSON.stringify(room)}
        </Layout>
    );
}
