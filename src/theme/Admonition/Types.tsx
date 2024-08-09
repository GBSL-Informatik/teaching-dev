import React from 'react';
import DefaultAdmonitionTypes from '@theme-original/Admonition/Types';
import AdmonitionLayout from '@theme/Admonition/Layout';
import clsx from 'clsx';
import styles from './types.module.scss';

function FindingIcon() {
    return (
        <svg viewBox="0 0 12 16">
            <path
                fillRule="evenodd"
                d="M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"
            ></path>
        </svg>
    );
}

function AufgabeIcon() {
    return (
        <svg viewBox="0 0 576 512">
            <path
                fill="currentColor"
                d="M402.3 344.9l32-32c5-5 13.7-1.5 13.7 5.7V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V112c0-26.5 21.5-48 48-48h273.5c7.1 0 10.7 8.6 5.7 13.7l-32 32c-1.5 1.5-3.5 2.3-5.7 2.3H48v352h352V350.5c0-2.1.8-4.1 2.3-5.6zm156.6-201.8L296.3 405.7l-90.4 10c-26.2 2.9-48.5-19.2-45.6-45.6l10-90.4L432.9 17.1c22.9-22.9 59.9-22.9 82.7 0l43.2 43.2c22.9 22.9 22.9 60 .1 82.8zM460.1 174L402 115.9 216.2 301.8l-7.3 65.3 65.3-7.3L460.1 174zm64.8-79.7l-43.2-43.2c-4.1-4.1-10.8-4.1-14.8 0L436 82l58.1 58.1 30.9-30.9c4-4.2 4-10.8-.1-14.9z"
            ></path>
        </svg>
    );
}

function FindingAmonition(props) {
    return (
        <AdmonitionLayout
            icon={<FindingIcon />}
            title="Finding"
            {...props}
            className={clsx('alert', 'alert--warning', props.className, styles.finding)}
        >
            {props.children}
        </AdmonitionLayout>
    );
}

function AufgabeAmonition(props) {
    return (
        <AdmonitionLayout
            icon={<AufgabeIcon />}
            title="Aufgabe"
            {...props}
            className={clsx('alert', 'alert--info', props.className, styles.aufgabe)}
        >
            {props.children}
        </AdmonitionLayout>
    );
}

const AdmonitionTypes = {
    ...DefaultAdmonitionTypes,

    // Add all your custom admonition types here...
    // You can also override the default ones if you want
    finding: FindingAmonition,
    aufgabe: AufgabeAmonition
};

export default AdmonitionTypes;
