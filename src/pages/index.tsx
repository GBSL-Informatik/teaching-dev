import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import HomepageFeatures from '@tdev-components/HomepageFeatures';
import Layout from '@theme/Layout';
import clsx from 'clsx';

import HomepageCourses from '@tdev-components/HomepageCourses';
import { useClassVersions } from '@tdev-components/HomepageCourses/useClassVersions';
import { HomepageHeader } from '@tdev-components/HomepageHeader';
import styles from './index.module.css';

const Home = (): React.ReactNode => {
    const { siteConfig } = useDocusaurusContext();
    const { courseList } = useClassVersions();
    const hasCourses = courseList.length > 0;

    return (
        <Layout
            title={`Hello from ${siteConfig.title}`}
            description="Description will go into a meta tag in <head />"
        >
            <HomepageHeader hasCourses={hasCourses} />
            <main className={clsx(styles.main, hasCourses && styles.courses)}>
                {hasCourses ? <HomepageCourses /> : <HomepageFeatures />}
            </main>
        </Layout>
    );
};

export default Home;
