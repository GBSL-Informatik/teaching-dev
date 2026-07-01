import React from 'react';
import styles from './styles.module.scss';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import siteConfig from '@generated/docusaurus.config';
import { useStore } from '@tdev-hooks/useStore';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { observer } from 'mobx-react-lite';
const { DOCS_ONLY } = siteConfig.customFields as { DOCS_ONLY?: boolean };
import { Course, useClassVersions } from './useClassVersions';

// add additional courses here, e.g. for workshops or alumni
// CourseList.push({ title: 'Workshops', classes: ['LPs'] });
const CourseList: Course[] = [];

// const CourseComponent = (course: Course) => {
const CourseComponent = ({ course }: { course: Course }) => {
    return (
        <div className={clsx('card margin--md shadow--md')}>
            <div className="card__header">
                <h3>{course.title}</h3>
            </div>
            <div className="card__body">
                {course.classes.map((cl, idx) => {
                    const isString = typeof cl === 'string';
                    const to = isString ? `${cl}/home` : cl.uri;
                    const label = isString ? cl : cl.label;
                    return (
                        <Link
                            key={idx}
                            to={to}
                            className="button button--outline button--secondary margin--xs"
                        >
                            {label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

const HomepageCourses = observer(() => {
    const userStore = useStore('userStore');
    const { courseList } = useClassVersions();
    const isBrowser = useIsBrowser();

    if (!isBrowser) {
        return null;
    }

    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {!DOCS_ONLY && (
                        <>
                            {courseList.map((course, idx) => (
                                <CourseComponent key={idx} course={course} />
                            ))}
                            {CourseList.map((course, idx) => (
                                <CourseComponent key={idx} course={course} />
                            ))}
                        </>
                    )}
                </div>
                <div className="row">
                    {(DOCS_ONLY || process.env.NODE_ENV === 'development' || userStore.current?.isAdmin) && (
                        <CourseComponent
                            course={{ title: 'All Docs', classes: [{ label: 'Docs', uri: '/home' }] }}
                        />
                    )}
                </div>
            </div>
        </section>
    );
});

export default HomepageCourses;
