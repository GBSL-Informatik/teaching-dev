import clsx from 'clsx';
import { CheckResult } from '../../../checks/gradeDocument';
import { CHECK_KINDS } from '../../../checks/kinds';
import ResultItem from './ResultItem';
import styles from './styles.module.scss';

interface Props {
    results: CheckResult[];
}

/** Results like a test run: a summary, then the checks grouped by category. */
const Results = ({ results }: Props) => {
    const passedCount = results.filter((result) => result.failures.length === 0).length;
    const share = results.length > 0 ? passedCount / results.length : 1;
    const categories = groupByCategory(results);

    return (
        <div className={styles.results}>
            <div className={styles.summary}>
                <strong>
                    {passedCount} von {results.length} Formatierungen erfüllt
                </strong>
                <div className={styles.progress}>
                    <div
                        className={clsx(styles.bar, share === 1 && styles.complete)}
                        style={{ width: `${share * 100}%` }}
                    />
                </div>
            </div>
            {categories.map(({ category, results: resultsOfCategory }) => (
                <section key={category}>
                    <h4 className={styles.category}>{category}</h4>
                    <ul className={styles.list}>
                        {resultsOfCategory.map((result) => (
                            <ResultItem key={result.check.id} result={result} />
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
};

const groupByCategory = (results: CheckResult[]) => {
    const categories = new Map<string, CheckResult[]>();
    for (const result of results) {
        const category = CHECK_KINDS[result.check.kind].category;
        categories.set(category, [...(categories.get(category) ?? []), result]);
    }
    return [...categories].map(([category, resultsOfCategory]) => ({ category, results: resultsOfCategory }));
};

export default Results;
