import prompts from 'prompts';
import { Check, CHECK_KINDS, CheckKindName } from '../checks/kinds';
import { DocxSpec } from '../spec/DocxSpec';

/** Lets the teacher pick the checks to keep: all on a first run, the previous selection on a re-run. */
export const selectChecks = async (
    checks: Check[],
    previousSpec: DocxSpec | undefined
): Promise<Set<string>> => {
    const previousIds = previousSpec && new Set(previousSpec.checks.map((check) => check.id));
    const kinds = Object.keys(CHECK_KINDS) as CheckKindName[];

    const choices = kinds.flatMap((kind) => {
        const checksOfKind = checks.filter((check) => check.kind === kind);
        if (checksOfKind.length === 0) {
            return [];
        }
        return [
            // A disabled choice serves as the heading of a category.
            { title: `── ${CHECK_KINDS[kind].category} ──`, value: kind, disabled: true },
            ...checksOfKind.map((check) => ({
                title: `${check.title}${occurrences(check)}`,
                value: check.id,
                selected: previousIds ? previousIds.has(check.id) : true
            }))
        ];
    });

    const { selected } = await prompts(
        {
            type: 'multiselect',
            name: 'selected',
            message: 'Welche Formatierungen sollen überprüft werden?',
            choices,
            instructions: false,
            hint: '[Leertaste] wählt ab/aus, [a] alle, [Enter] bestätigt'
        },
        {
            onCancel: () => {
                throw new Error('Abgebrochen, es wurde nichts gespeichert.');
            }
        }
    );
    return new Set(selected as string[]);
};

const occurrences = (check: Check) => {
    if (!('anchors' in check) || check.anchors.length < 2) {
        return '';
    }
    return ` (${check.anchors.length}×)`;
};
