import React from 'react';
import {noop} from 'lodash';
import {IAttachment} from 'superdesk-api';
import {AttachmentsListItem} from 'apps/authoring/attachments/AttachmentsListItem';
import {gettext} from 'core/utils';
import {SpacerBlock} from 'core/ui/components/Spacer';

interface IProps {
    attachment: IAttachment;
    differenceType: 'added' | 'removed' | 'modified' | 'none';
}

interface IChange {
    label: string;
    backgroundColor: string;
}

export class DifferenceRow extends React.PureComponent<IProps> {
    render() {
        const {attachment, differenceType} = this.props;

        const change = ((): IChange | null => {
            if (differenceType === 'added') {
                return {
                    label: gettext('Added'),
                    backgroundColor: 'var(--diff-color-addition)',
                };
            } else if (differenceType === 'modified') {
                return {
                    label: gettext('Modified'),
                    backgroundColor: 'var(--diff-color-modification)',
                };
            } if (differenceType === 'removed') {
                return {
                    label: gettext('Removed'),
                    backgroundColor: 'var(--diff-color-removal)',
                };
            } else {
                return null;
            }
        })();

        return (
            <div key={attachment._id} className="tr"> {/** child of .css-table */}
                <div className="td" style={{backgroundColor: change == null ? undefined : change.backgroundColor}}>
                    <AttachmentsListItem
                        attachment={attachment}
                        readOnly={true}
                        editAttachment={noop}
                        removeAttachment={noop}
                        noBackground={change != null}
                    />
                </div>

                {
                    change != null && (
                        <div className="td">
                            <SpacerBlock h gap="16" />
                            <div className="label" style={{backgroundColor: change.backgroundColor, color: 'black'}}>
                                {change.label}
                            </div>
                        </div>
                    )
                }
            </div>
        );
    }
}
