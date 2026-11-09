import ErrorBoundary from '@docusaurus/ErrorBoundary';
import { PageMetadata } from '@docusaurus/theme-common';
import ErrorPageContent from '@theme/ErrorPageContent';
import Footer from '@theme/Footer';
import LayoutProvider from '@theme/Layout/Provider';
import React from 'react';

interface Props {
    children: React.ReactNode;
}

/**
 * Like `@theme/Layout`, without navbar and announcement bar: the editor uses the whole screen.
 * The website can be opened from the repository overview, see `RepositoryOverview`.
 */
const CmsLayout = ({ children }: Props) => {
    return (
        <LayoutProvider>
            <PageMetadata title="CMS" description="Github" />
            <ErrorBoundary fallback={(params) => <ErrorPageContent {...params} />}>{children}</ErrorBoundary>
            <Footer />
        </LayoutProvider>
    );
};

export default CmsLayout;
