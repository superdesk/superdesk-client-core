import React from 'react';
import {IAttachment, IEditorComponentProps, IRestApiResponse} from 'superdesk-api';
import {CC} from 'core/ui/configurable-ui-components';
import {AttachmentsWidgetComponent} from 'apps/authoring/attachments/AttachmentsWidgetComponent';
import {IAttachmentsValueOperational, IAttachmentsConfig, IAttachmentsUserPreferences} from './interfaces';
import {isUploadValid} from 'apps/authoring/attachments/AttachmentsWidget';
import {dispatchCustomEvent} from 'core/get-superdesk-api-implementation';
import {WithLiveResources} from 'core/with-resources';

type IProps = IEditorComponentProps<IAttachmentsValueOperational, IAttachmentsConfig, IAttachmentsUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.addAttachments = this.addAttachments.bind(this);
        this.removeAttachment = this.removeAttachment.bind(this);
        this.updateAttachment = this.updateAttachment.bind(this);
    }

    addAttachments(val: Array<IAttachment>) {
        const attachments = (this.props.value ?? []);

        this.props.onChange(attachments.concat(val.map(({_id}) => ({id: _id}))));
    }

    removeAttachment(val: IAttachment) {
        const attachments = (this.props.value ?? []);

        this.props.onChange(attachments.filter(({id}) => id !== val._id));
    }

    updateAttachment(val: IAttachment) {
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
                                onAttachmentUpdated={this.updateAttachment}
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
