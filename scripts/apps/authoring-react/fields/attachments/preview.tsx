import React from 'react';
import {noop} from 'lodash';
import {IAttachment, IPreviewComponentProps, IRestApiResponse} from 'superdesk-api';
import {IAttachmentsValueOperational, IAttachmentsConfig} from './interfaces';
import {CC} from 'core/ui/configurable-ui-components';
import {AttachmentsWidgetComponent} from 'apps/authoring/attachments/AttachmentsWidgetComponent';
import {WithLiveResources} from 'core/with-resources';

type IProps = IPreviewComponentProps<IAttachmentsValueOperational, IAttachmentsConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        if (this.props.value == null || this.props.value.length < 1) {
            return null;
        }

        const ids = (this.props.value ?? []).map(({id}) => id);

        const AttachmentsEditor = CC.AuthoringAttachmentsWidget != null ?
            CC.AuthoringAttachmentsWidget :
            AttachmentsWidgetComponent;

        return (
            <WithLiveResources resources={[{resource: 'attachments', ids: ids}]}>
                {([res]: Array<IRestApiResponse<IAttachment>>) => {
                    const attachments = res._items;

                    return (
                        <AttachmentsEditor
                            attachments={attachments}
                            addAttachments={noop}
                            removeAttachment={noop}
                            onAttachmentUpdated={noop}
                            readOnly={true}
                            isWidget={false}
                            isUploadValid={() => false}
                        />
                    );
                }}
            </WithLiveResources>
        );
    }
}
