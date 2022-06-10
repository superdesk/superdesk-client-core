import React from 'react';
import {keyBy, uniq} from 'lodash';
import {IAttachment, IDifferenceComponentProps, IRestApiResponse} from 'superdesk-api';
import {IAttachmentsConfig, IAttachmentsValueOperational} from './interfaces';
import {getDifferenceStatistics, IDifferenceStats} from '../difference-statistics';
import {DifferenceRow} from './difference-row';
import {WithLiveResources} from 'core/with-resources';

type IProps = IDifferenceComponentProps<IAttachmentsValueOperational, IAttachmentsConfig>;

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

export class Difference extends React.PureComponent<IProps> {
    render() {
        const ids1 = (this.props.value1 ?? []).map(({id}) => id);
        const ids2 = (this.props.value2 ?? []).map(({id}) => id);

        const stats = getDifferenceStatistics(
            ids1,
            ids2,
            (id) => id,
            (a, b) => a === b,
        );

        const allIds = uniq(ids1.concat(ids2));

        return (
            <WithLiveResources resources={[{resource: 'attachments', ids: allIds}]}>
                {([res]: [IRestApiResponse<IAttachment>]) => {
                    const attachmentsById = keyBy(res._items, ({_id}) => _id);

                    return (
                        <div className="css-table" style={{width: '100%'}}>
                            {
                                stats.removed.map((id) => {
                                    const attachment = attachmentsById[id];

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
                                    const attachment = attachmentsById[id];

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
                }}
            </WithLiveResources>
        );
    }
}
