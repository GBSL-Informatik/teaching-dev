import * as React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { Prism } from 'prism-react-renderer';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Translate, { translate } from '@docusaurus/Translate';
import DiffViewer from 'react-diff-viewer-continued';
import Details from '@theme/Details';
import { observer } from 'mobx-react-lite';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { DocumentType } from '@tdev-api/document';
import ScriptVersion from '@tdev-models/documents/ScriptVersion';

const highlightSyntax = (str: string) => {
    if (!str) {
        return;
    }
    const leftSpacesCount = str.match(/^\s*/)?.[0].length || 0;
    const prefix = '&nbsp;'.repeat(leftSpacesCount);
    return (
        <span
            dangerouslySetInnerHTML={{
                __html: prefix + Prism.highlight(str, Prism.languages.python, 'python')
            }}
        />
    );
};

const CodeHistory = observer(() => {
    const script = useDocument<'script'>();
    const [version, setVersion] = React.useState(1);
    if (script.versions?.length < 2) {
        return null;
    }

    const old = script.versions[version - 1];
    const current = script.versions[version];

    return (
        <div className={clsx(styles.codeHistory)}>
            <Details
                className={clsx(styles.historyDetails)}
                summary={
                    <summary>
                        <div className={clsx(styles.summary)}>
                            <span className="badge badge--secondary">
                                {script.versionsLoaded
                                    ? translate(
                                          {
                                              message: '{n} Versions',
                                              id: 'CodeHistory.nVersions.text'
                                          },
                                          { n: script.versions.length }
                                      )
                                    : translate({
                                          message: 'Load Versions',
                                          id: 'CodeHistory.LoadVersions.text'
                                      })}
                            </span>
                            <span className={clsx(styles.spacer)}></span>
                        </div>
                    </summary>
                }
            >
                <div
                    className={clsx(styles.content)}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <div className={clsx(styles.versionControl)}>
                        <Slider
                            value={version}
                            onChange={(c: number | number[]) => {
                                if (Array.isArray(c)) {
                                    return;
                                }
                                setVersion(c);
                            }}
                            min={1}
                            max={script.versions.length - 1}
                            dots={script.versions.length < 50}
                        />
                        <span className="badge badge--primary">V{version}</span>
                    </div>
                    <div className={clsx(styles.diffViewer)}>
                        {script.versions.length > 0 && (
                            <DiffViewer
                                splitView
                                oldValue={old.code}
                                newValue={current.code}
                                leftTitle={
                                    <div className={clsx(styles.diffHeader)}>
                                        {`V${old.version}`}
                                        {old.pasted && (
                                            <span className={clsx('badge', 'badge--danger')}>
                                                <Translate id="CodeHistory.PastedBadge.Text">
                                                    Pasted
                                                </Translate>
                                            </span>
                                        )}
                                    </div>
                                }
                                rightTitle={
                                    <div className={clsx(styles.diffHeader)}>
                                        {`V${current.version}`}
                                        {current.pasted && (
                                            <span className={clsx('badge', 'badge--danger')}>
                                                <Translate id="CodeHistory.PastedBadge.Text">
                                                    Pasted
                                                </Translate>
                                            </span>
                                        )}
                                    </div>
                                }
                                renderContent={highlightSyntax as any}
                                showDiffOnly
                                hideMarkers
                            />
                        )}
                    </div>
                </div>
            </Details>
        </div>
    );
});

export default CodeHistory;
