import React from 'react';
import {keyBy, uniq} from 'lodash';
import {
    IAttachment,
    IAttachmentsConfig,
    IAttachmentsValueOperational,
    IDifferenceComponentProps,
    IRestApiResponse,
} from 'superdesk-api';
import {WithLiveResources} from 'core/with-resources';
import {CC} from 'core/ui/configurable-ui-components';
import {DifferenceDefaultImplementation} from './difference-default-implementation';

type IProps = IDifferenceComponentProps<IAttachmentsValueOperational, IAttachmentsConfig>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        const ids1 = (this.props.value1 ?? []).map(({id}) => id);
        const ids2 = (this.props.value2 ?? []).map(({id}) => id);
        const allIds = uniq(ids1.concat(ids2));

        return (
            <WithLiveResources resources={[{resource: 'attachments', ids: allIds}]}>
                {([res]: [IRestApiResponse<IAttachment>]) => {
                    const attachmentsById = keyBy(res._items, ({_id}) => _id);
                    const AttachmentsDifferenceView = CC.AuthoringAttachmentsDiffView != null
                        ? CC.AuthoringAttachmentsDiffView
                        : DifferenceDefaultImplementation;

                    return (
                        <AttachmentsDifferenceView
                            attachmentsPrevious={ids1.map((id) => attachmentsById[id])}
                            attachmentsCurrent={ids2.map((id) => attachmentsById[id])}
                        />
                    );
                }}
            </WithLiveResources>
        );
    }
}
