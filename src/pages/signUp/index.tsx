import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';
import { useStore } from '../../hooks/useStore';
import { authClient } from '@site/src/auth-client';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { Redirect } from '@docusaurus/router';

export default function SignUp(): React.ReactNode {
    const { siteConfig } = useDocusaurusContext();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const authStore = useStore('authStore');
    const { data: session } = authClient.useSession();
    const userPage = useBaseUrl('/user');

    if (session?.user) {
        return <Redirect to={userPage} />;
    }

    return (
        <Layout
            title={`Hello from ${siteConfig.title}`}
            description="Description will go into a meta tag in <head />"
        >
            <input
                type="text"
                placeholder="Vorname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Nachname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
            />
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            />
            {email && password && firstName && lastName && (
                <button
                    onClick={async () => {
                        // call the sign up method from the auth store
                        authStore.signUp(email, password, firstName, lastName);
                    }}
                >
                    Sign Up
                </button>
            )}
        </Layout>
    );
}
