import checkbox, { Separator } from '@inquirer/checkbox';
import { Check, CHECK_KINDS, CheckKindName } from '../checks/kinds';
import { DocxSpec } from '../spec/DocxSpec';

const PAGE_SIZE = 30;

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
            new Separator(`── ${CHECK_KINDS[kind].category} ──`),
            ...checksOfKind.map((check) => ({
                name: `${check.title}${occurrences(check)}`,
                value: check.id,
                checked: previousIds ? previousIds.has(check.id) : true
            }))
        ];
    });

    const selected = await checkbox({
        message: 'Welche Formatierungen sollen überprüft werden?',
        choices,
        pageSize: PAGE_SIZE,
        loop: false
    });
    return new Set(selected);
};

const occurrences = (check: Check) => {
    if (!('anchors' in check) || check.anchors.length < 2) {
        return '';
    }
    return ` (${check.anchors.length}×)`;
};
