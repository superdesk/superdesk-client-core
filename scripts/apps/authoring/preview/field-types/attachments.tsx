import React from 'react';
import {IAttachment} from 'superdesk-api';
import {dataApi} from 'core/helpers/CrudManager';
import {AttachmentItem} from 'core/editor3/components/links/AttachmentList';
import {noop} from 'lodash';

interface IProps {
    attachmentsIds: Array<{attachment: IAttachment['_id']}>;
}

interface IState {
    attachments: Array<IAttachment> | 'loading';
}

export class AttachmentsPreview extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            attachments: 'loading',
        };
    }
    componentDidMount() {
        Promise.all(
            this.props.attachmentsIds.map(
                ({attachment}) => dataApi.findOne<IAttachment>('attachments', attachment),
            ),
        ).then((attachments: Array<IAttachment>) => {
            this.setState({attachments});
        });
    }
    render() {
        const {attachments} = this.state;

        if (attachments === 'loading') {
            return null;
        }

        return (
            <div>
                {attachments.map((attachment) => (
                    <AttachmentItem
                        key={attachment._id}
                        attachment={attachment}
                        selected={false}
                        onClick={noop}
                    />
                ))}
            </div>
        );
    }
}
