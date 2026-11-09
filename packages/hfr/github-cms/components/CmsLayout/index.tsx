import ErrorBoundary from '@docusaurus/ErrorBoundary';
import { PageMetadata } from '@docusaurus/theme-common';
import ErrorPageContent from '@theme/ErrorPageContent';
import LayoutProvider from '@theme/Layout/Provider';
import React from 'react';

interface Props {
    children: React.ReactNode;
}

/**
 * Like `@theme/Layout`, without navbar, announcement bar and footer: the editor uses the whole page.
 * The website can be opened from the repository overview, see `RepositoryOverview`.
 */
const CmsLayout = ({ children }: Props) => {
    return (
        <LayoutProvider>
            <PageMetadata title="CMS" description="Github" />
            <ErrorBoundary fallback={(params) => <ErrorPageContent {...params} />}>{children}</ErrorBoundary>
        </LayoutProvider>
    );
};

export default CmsLayout;
