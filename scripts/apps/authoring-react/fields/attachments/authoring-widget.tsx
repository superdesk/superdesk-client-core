import React from 'react';
import {IAttachment, IAttachmentsValueOperational, IArticleSideWidget, IRestApiResponse} from 'superdesk-api';
import {CC} from 'core/ui/configurable-ui-components';
import {AttachmentsWidgetComponent} from 'apps/authoring/attachments/AttachmentsWidgetComponent';
import {isUploadValid} from 'apps/authoring/attachments/AttachmentsWidget';
import {WithLiveResources} from 'core/with-resources';
import {dispatchCustomEvent} from 'core/get-superdesk-api-implementation';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {ATTACHMENTS_FIELD_ID, getWidgetLabel} from '.';

type IProps = React.ComponentProps<IArticleSideWidget['component']>;

/**
 * ID is hardcoded.
 * To handle this case, it would be better to have an option in the UI to allow
 * custom field to work as a widget. In this case, it wouldn't have to have an ID at all,
 * and would instead receive a value and `onChange` function.
 */
const fieldId = 'attachments';

export class AuthoringAttachmentsWidget extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.getAttachments = this.getAttachments.bind(this);
        this.setAttachments = this.setAttachments.bind(this);
        this.addAttachments = this.addAttachments.bind(this);
        this.removeAttachment = this.removeAttachment.bind(this);
        this.handleAttachmentUpdated = this.handleAttachmentUpdated.bind(this);
    }

    private getAttachments(): IAttachmentsValueOperational {
        return (this.props.fieldsData.get(fieldId) ?? []) as unknown as IAttachmentsValueOperational;
    }

    private setAttachments(val: IAttachmentsValueOperational) {
        this.props.onFieldsDataChange(
            this.props.fieldsData.set(fieldId, val),
        );
    }

    private addAttachments(val: Array<IAttachment>) {
        const attachments = this.getAttachments();

        this.setAttachments(attachments.concat(val.map(({_id}) => ({id: _id}))));
    }

    private removeAttachment(val: IAttachment) {
        const attachments = this.getAttachments();

        this.setAttachments(attachments.filter(({id}) => id !== val._id));
    }

    private handleAttachmentUpdated(val: IAttachment) {
        dispatchCustomEvent('attachmentUpdated', val);
    }

    render() {
        const {readOnly} = this.props;

        const AttachmentsEditor = CC.AuthoringAttachmentsWidget != null ?
            CC.AuthoringAttachmentsWidget :
            AttachmentsWidgetComponent;

        const ids = this.getAttachments().map(({id}) => id);

        return (
            <AuthoringWidgetLayout
                header={(
                    <AuthoringWidgetHeading
                        widgetId={ATTACHMENTS_FIELD_ID}
                        widgetName={getWidgetLabel()}
                        editMode={false}
                    />
                )}
                body={(
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
                                    isWidget={true}
                                    isUploadValid={(files) => isUploadValid(files, readOnly, attachments)}
                                />
                            );
                        }}
                    </WithLiveResources>
                )}
            />
        );
    }
}
