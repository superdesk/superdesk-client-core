import React from 'react';
import {Map} from 'immutable';
import {IAttachment, IConfigurableUiComponents} from 'superdesk-api';
import {getDifferenceStatistics, IDifferenceStats} from '../difference-statistics';
import {DifferenceRow} from './difference-row';

function getDifferenceType(
    stats: IDifferenceStats<string>,
    attachmentId: IAttachment['_id'],
): React.ComponentProps<typeof DifferenceRow>['differenceType'] {
    if (stats.added.find((_id) => _id === attachmentId) != null) {
        return 'added';
    } else if (stats.modified.find((_id) => _id === attachmentId) != null) {
        return 'modified';
    } else {
        return 'none';
    }
}

type IProps = React.ComponentProps<IConfigurableUiComponents['AuthoringAttachmentsDiffView']>;

export class DifferenceDefaultImplementation extends React.PureComponent<IProps> {
    render() {
        const ids1 = (this.props.attachmentsPrevious ?? []).map(({_id}) => _id);
        const ids2 = (this.props.attachmentsCurrent ?? []).map(({_id}) => _id);

        const stats = getDifferenceStatistics(
            ids1,
            ids2,
            (id) => id,
            (a, b) => a === b,
        );

        let attachmentsById = Map<string, IAttachment>(
            this.props.attachmentsCurrent.map((attachment) => [attachment._id, attachment]),
        );

        for (const attachment of this.props.attachmentsPrevious) {
            if (attachmentsById.has(attachment._id) !== true) {
                attachmentsById = attachmentsById.set(attachment._id, attachment);
            }
        }

        return (
            <div className="css-table" style={{width: '100%'}}>
                {
                    stats.removed.map((id) => {
                        const attachment = attachmentsById.get(id);

                        return (
                            <DifferenceRow
                                key={attachment._id}
                                attachment={attachment}
                                differenceType="removed"
                            />
                        );
                    })
                }

                {
                    ids2.map((id) => {
                        const attachment = attachmentsById.get(id);

                        return (
                            <DifferenceRow
                                key={attachment._id}
                                attachment={attachment}
                                differenceType={getDifferenceType(stats, attachment._id)}
                            />
                        );
                    })
                }
            </div>
        );
    }
}
