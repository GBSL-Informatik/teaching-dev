import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import {
    defaultScoring,
    SCORING_FUNCTIONS,
    scoringAttribute,
    scoringImport,
    withScoring,
    type Scoring,
    type ScoringAttribute
} from '../../../../assessable/scoring';
import type { JsxAttribute } from '../../../../schema';
import type { NodeViewProps } from '../../../ReactNodeView';
import styles from '../styles.module.scss';
import ArgumentInput from './ArgumentInput';

const NONE = '';
const CUSTOM = 'custom';

const selectedOption = (current: ScoringAttribute) => {
    switch (current.kind) {
        case 'none':
            return NONE;
        case 'custom':
            return CUSTOM;
        case 'call':
            return current.scoring.fn.name;
    }
};

/**
 * The `scoring` attribute: a scoring function chosen from a dropdown, with an input for each argument.
 * Other expressions are shown as custom scoring, to be edited in the tag.
 */
const ScoringSelect = observer(({ handle }: NodeViewProps) => {
    const attributes: JsxAttribute[] = handle.node.attrs.attributes;
    const current = scoringAttribute(attributes);

    const updateScoring = (scoring: Scoring | null) => {
        const imports = scoring ? [scoringImport(scoring)] : [];
        handle.updateAttrs({ attributes: withScoring(attributes, scoring) }, imports);
    };
    const handleSelect = (name: string) => {
        const fn = SCORING_FUNCTIONS.find((candidate) => candidate.name === name);
        updateScoring(fn ? defaultScoring(fn) : null);
    };
    const handleArgumentChange = (scoring: Scoring, index: number, value: number | boolean) => {
        const args = scoring.args.map((arg, i) => (i === index ? value : arg));
        updateScoring({ ...scoring, args });
    };

    return (
        <span className={clsx(styles.group)}>
            <select
                className={clsx(styles.input)}
                value={selectedOption(current)}
                title="Bewertung (scoring)"
                onChange={(event) => handleSelect(event.target.value)}
            >
                <option value={NONE}>Standard-Bewertung</option>
                {SCORING_FUNCTIONS.map((fn) => (
                    <option key={fn.name} value={fn.name}>
                        {fn.label}
                    </option>
                ))}
                {current.kind === 'custom' && (
                    <option value={CUSTOM} disabled>
                        Benutzerdefiniert (im Tag bearbeiten)
                    </option>
                )}
            </select>
            {current.kind === 'call' &&
                current.scoring.fn.parameters.map((parameter, index) => (
                    <ArgumentInput
                        key={`${current.scoring.fn.name}-${index}`}
                        parameter={parameter}
                        value={current.scoring.args[index]}
                        onChange={(value) => handleArgumentChange(current.scoring, index, value)}
                    />
                ))}
        </span>
    );
});

export default ScoringSelect;
