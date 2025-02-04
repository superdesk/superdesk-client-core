import React from 'react';
import {
    IAttachment,
    IEditorComponentProps,
    IRestApiResponse,
    IAttachmentsValueOperational,
    IAttachmentsConfig,
    IAttachmentsUserPreferences,
} from 'superdesk-api';
import {CC} from 'core/ui/configurable-ui-components';
import {AttachmentsWidgetComponent} from 'apps/authoring/attachments/AttachmentsWidgetComponent';
import {isUploadValid} from 'apps/authoring/attachments/AttachmentsWidget';
import {dispatchCustomEvent} from 'core/get-superdesk-api-implementation';
import {WithLiveResources} from 'core/with-resources';

type IProps = IEditorComponentProps<IAttachmentsValueOperational, IAttachmentsConfig, IAttachmentsUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.addAttachments = this.addAttachments.bind(this);
        this.removeAttachment = this.removeAttachment.bind(this);
        this.handleAttachmentUpdated = this.handleAttachmentUpdated.bind(this);
    }

    addAttachments(val: Array<IAttachment>) {
        const attachments = (this.props.value ?? []);

        this.props.onChange(attachments.concat(val.map(({_id}) => ({id: _id}))));
    }

    removeAttachment(val: IAttachment) {
        const attachments = (this.props.value ?? []);

        this.props.onChange(attachments.filter(({id}) => id !== val._id));
    }

    handleAttachmentUpdated(val: IAttachment) {
        dispatchCustomEvent('attachmentUpdated', val);
    }

    render() {
        const Container = this.props.container;
        const ids = (this.props.value ?? []).map(({id}) => id);
        const {readOnly} = this.props;

        const AttachmentsEditor = CC.AuthoringAttachmentsWidget != null ?
            CC.AuthoringAttachmentsWidget :
            AttachmentsWidgetComponent;

        return (
            <Container>
                <WithLiveResources resources={[{resource: 'attachments', ids: ids}]}>
                    {([res]: Array<IRestApiResponse<IAttachment>>) => {
                        const attachments = res._items;

                        return (
                            <AttachmentsEditor
                                attachments={attachments}
                                addAttachments={this.addAttachments}
                                removeAttachment={this.removeAttachment}
                                onAttachmentUpdated={this.handleAttachmentUpdated}
                                readOnly={readOnly}
                                isWidget={false}
                                isUploadValid={(files) => isUploadValid(files, readOnly, attachments)}
                            />
                        );
                    }}
                </WithLiveResources>
            </Container>
        );
    }
}
