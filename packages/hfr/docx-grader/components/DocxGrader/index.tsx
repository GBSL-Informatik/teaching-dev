import { mdiFileWordOutline } from '@mdi/js';
import Icon from '@mdi/react';
import Alert from '@tdev-components/shared/Alert';
import clsx from 'clsx';
import React, { useId, useMemo, useRef, useState } from 'react';
import { CheckResult, gradeDocx } from '../../checks/gradeDocument';
import { DocxSpec, parseSpec } from '../../spec/DocxSpec';
import Results from './Results';
import styles from './styles.module.scss';

interface Props {
    /** The docx-spec, imported from its YAML file. */
    spec: unknown;
    className?: string;
}

interface Grading {
    fileName: string;
    results?: CheckResult[];
    error?: string;
}

const DocxGrader = (props: Props) => {
    const { spec, errors } = useMemo(() => parseSpec(props.spec), [props.spec]);
    const [grading, setGrading] = useState<Grading>();
    const [isDragOver, setIsDragOver] = useState(false);
    const latestFile = useRef<File>(undefined);
    const inputId = useId();

    const handleFile = async (file: File | undefined) => {
        if (!file || !spec) {
            return;
        }
        latestFile.current = file;
        setGrading({ fileName: file.name });
        const graded = await gradeFile(spec, file);
        // A file uploaded meanwhile replaces this one's results.
        if (latestFile.current === file) {
            setGrading(graded);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => setIsDragOver(false);

    const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setIsDragOver(false);
        handleFile(event.dataTransfer.files[0]);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFile(event.target.files?.[0]);
        // Allows uploading the same, changed file again.
        event.target.value = '';
    };

    return (
        <div className={clsx(styles.docxGrader, props.className)}>
            {errors.length > 0 && (
                <Alert type="warning">
                    <strong>Fehler in der docx-spec</strong>
                    <ul>
                        {errors.map((error) => (
                            <li key={error}>{error}</li>
                        ))}
                    </ul>
                </Alert>
            )}
            <label
                htmlFor={inputId}
                className={clsx(styles.upload, isDragOver && styles.dragOver, !spec && styles.disabled)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <Icon path={mdiFileWordOutline} size={1.2} />
                <span>{grading ? grading.fileName : 'Word-Dokument hierher ziehen oder auswählen'}</span>
                <span className="button button--primary button--sm">
                    {grading ? 'Neu überprüfen' : 'Auswählen'}
                </span>
                <input
                    id={inputId}
                    type="file"
                    className={styles.input}
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    disabled={!spec}
                    onChange={handleInputChange}
                />
            </label>
            <div aria-live="polite">
                {grading?.error && <Alert type="danger">{grading.error}</Alert>}
                {grading && !grading.results && !grading.error && (
                    <p className={styles.status}>Wird überprüft…</p>
                )}
                {grading?.results && <Results results={grading.results} />}
            </div>
        </div>
    );
};

const gradeFile = async (spec: DocxSpec, file: File): Promise<Grading> => {
    try {
        return { fileName: file.name, results: await gradeDocx(spec, await file.arrayBuffer()) };
    } catch (error) {
        return { fileName: file.name, error: error instanceof Error ? error.message : String(error) };
    }
};

export default DocxGrader;
