import Link from '@docusaurus/Link';
import { mdiCheckCircle, mdiCloseCircle, mdiLightbulbOnOutline } from '@mdi/js';
import Icon from '@mdi/react';
import clsx from 'clsx';
import { CheckResult } from '../../../../checks/gradeDocument';
import styles from './styles.module.scss';

const MAX_SHOWN_FAILURES = 8;

interface Props {
    result: CheckResult;
}

const ResultItem = ({ result }: Props) => {
    const { check, failures } = result;
    const passed = failures.length === 0;
    const hiddenCount = failures.length - MAX_SHOWN_FAILURES;

    return (
        <li className={clsx(styles.item, passed ? styles.passed : styles.failed)}>
            <div className={styles.title}>
                <Icon path={passed ? mdiCheckCircle : mdiCloseCircle} size={0.8} className={styles.icon} />
                <span>{check.title}</span>
            </div>
            {!passed && (
                <div className={styles.details}>
                    <ul className={styles.failures}>
                        {failures.slice(0, MAX_SHOWN_FAILURES).map((failure, index) => (
                            <li key={index}>{failure}</li>
                        ))}
                        {hiddenCount > 0 && <li>… und {hiddenCount} weitere</li>}
                    </ul>
                    {check.hint && (
                        <p className={styles.hint}>
                            <Icon path={mdiLightbulbOnOutline} size={0.7} />
                            <span>{check.hint}</span>
                        </p>
                    )}
                    {check.docs && <Link to={check.docs}>Zur Anleitung</Link>}
                </div>
            )}
        </li>
    );
};

export default ResultItem;
