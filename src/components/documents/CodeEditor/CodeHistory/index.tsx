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
import Button from '../Button';
import { mdiSync } from '@mdi/js';
import iCode from '@tdev-models/documents/iCode';
import { CodeType } from '@tdev-api/document';

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

interface Props<T extends CodeType> {
    code: iCode<T>;
}

const CodeHistory = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    const [version, setVersion] = React.useState(1);
    const old = code.versions[version - 1];
    const current = code.versions[version];

    return (
        <div className={clsx(styles.codeHistory)}>
            <Details
                className={clsx(styles.historyDetails)}
                summary={
                    <summary
                        onClick={(e) => {
                            code.loadVersions();
                        }}
                    >
                        <div className={clsx(styles.summary)}>
                            <span className="badge badge--secondary">
                                {code.versionsLoaded
                                    ? translate(
                                          {
                                              message: '{n} Versions',
                                              id: 'CodeHistory.nVersions.text'
                                          },
                                          { n: code.versions.length }
                                      )
                                    : translate({
                                          message: 'Versionen laden',
                                          id: 'CodeHistory.LoadVersions.text'
                                      })}
                            </span>
                            <span className={clsx(styles.spacer)}></span>
                            {code.versionsLoaded && (
                                <Button
                                    icon={mdiSync}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        code.loadVersions(true);
                                    }}
                                    title="Versionen erneut synchronisieren"
                                />
                            )}
                        </div>
                    </summary>
                }
            >
                {code.versionsLoaded && current && (
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
                                max={code.versions.length - 1}
                                dots={code.versions.length < 50}
                            />
                            <span className="badge badge--primary">V{version}</span>
                        </div>
                        <div className={clsx(styles.diffViewer)}>
                            {code.versions.length > 0 && (
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
                )}
            </Details>
        </div>
    );
});

export default CodeHistory;
