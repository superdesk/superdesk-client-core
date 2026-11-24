import React from 'react';
import {
    IAttachment,
    IAttachmentsValueOperational,
    IRestApiResponse,
    IArticleSideWidgetComponentType,
} from 'superdesk-api';
import {CC} from 'core/ui/configurable-ui-components';
import {AttachmentsWidgetComponent} from 'apps/authoring/attachments/AttachmentsWidgetComponent';
import {isUploadValid} from 'apps/authoring/attachments/AttachmentsWidget';
import {WithLiveResources} from 'core/with-resources';
import {dispatchCustomEvent} from 'core/get-superdesk-api-implementation';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {ATTACHMENTS_WIDGET_ID, getWidgetLabel} from '.';
import {attachments as attachmentsAdapter} from '../../field-adapters/attachments';

/**
 * ID is hardcoded.
 * To handle this case, it would be better to have an option in the UI to allow
 * custom field to work as a widget. In this case, it wouldn't have to have an ID at all,
 * and would instead receive a value and `onChange` function.
 */
const fieldId = 'attachments';

/**
 * The widget is available whether or not the content profile has the attachments field. Without the field,
 * `fieldsData` has no entry for it and is not serialized on save, so the value is kept on the article instead.
 */
function profileHasAttachmentsField(props: IArticleSideWidgetComponentType): boolean {
    return props.fieldsData?.has(fieldId) === true;
}

export function getWidgetAttachments(props: IArticleSideWidgetComponentType): IAttachmentsValueOperational {
    if (profileHasAttachmentsField(props)) {
        return (props.fieldsData.get(fieldId) ?? []) as IAttachmentsValueOperational;
    } else {
        return attachmentsAdapter.retrieveStoredValue(
            props.article,
            props.authoringStorage,
            {},
        ) as IAttachmentsValueOperational;
    }
}

export function setWidgetAttachments(props: IArticleSideWidgetComponentType, val: IAttachmentsValueOperational) {
    if (profileHasAttachmentsField(props)) {
        props.onFieldsDataChange(props.fieldsData.set(fieldId, val));
    } else {
        props.onItemChange(attachmentsAdapter.storeValue(val, props.article, {}, false));
    }
}

export class AuthoringAttachmentsWidget extends React.PureComponent<IArticleSideWidgetComponentType> {
    constructor(props: IArticleSideWidgetComponentType) {
        super(props);

        this.getAttachments = this.getAttachments.bind(this);
        this.setAttachments = this.setAttachments.bind(this);
        this.addAttachments = this.addAttachments.bind(this);
        this.removeAttachment = this.removeAttachment.bind(this);
        this.handleAttachmentUpdated = this.handleAttachmentUpdated.bind(this);
    }

    private getAttachments(): IAttachmentsValueOperational {
        return getWidgetAttachments(this.props);
    }

    private setAttachments(val: IAttachmentsValueOperational) {
        setWidgetAttachments(this.props, val);
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
                bodyClassName="authoring-widget__body"
                header={(
                    <AuthoringWidgetHeading
                        widgetId={ATTACHMENTS_WIDGET_ID}
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
