import React from 'react';
import type Directory from '@tdev-models/documents/FileSystem/Directory';
import type File from '@tdev-models/documents/FileSystem/File';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';

interface Props {
    model: Directory | File;
    className?: string;
}
const Name = observer((props: Props) => {
    const { model } = props;
    return (
        <>
            {model.isEditing ? (
                <input
                    type="text"
                    placeholder="Ordnername..."
                    value={model.name}
                    className={clsx(props.className)}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onDoubleClick={(e) => {
                        e.currentTarget.select();
                    }}
                    onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                            model.saveNow();
                            model.setIsEditing(false);
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        if (e.key === 'Enter') {
                            model.saveNow();
                            model.setIsEditing(false);
                        }
                        /**
                         * prevent space from toggling the details
                         */
                        if (e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            const inp = e.currentTarget;
                            const { selectionStart, selectionEnd } = inp;
                            if (selectionStart !== null && selectionEnd !== null) {
                                model.setName(
                                    `${model.name.slice(0, selectionStart)} ${model.name.slice(selectionEnd)}`
                                );
                                scheduleMicrotask(() => {
                                    inp.setSelectionRange(selectionStart + 1, selectionStart + 1);
                                });
                            }
                        }
                    }}
                    onChange={(e) => {
                        model.setName(e.target.value);
                    }}
                    onBlur={() => {
                        model.setIsEditing(false);
                    }}
                    autoFocus
                />
            ) : (
                <h4 className={clsx(props.className)}>{model.name}</h4>
            )}
        </>
    );
});

export default Name;
