/* eslint-disable react/no-multi-comp */
import * as React from 'react';

import {gettext} from 'core/utils';
import {FormFieldType} from 'core/ui/components/generic-form/interfaces/form';
import {ListItem, ListItemActionsMenu, ListItemColumn, ListItemRow} from 'core/components/ListItem';
import {getFormFieldPreviewComponent} from 'core/ui/components/generic-form/form-field';
import {getGenericHttpEntityListPageComponent} from 'core/ui/components/ListPage/generic-list-page';
import {IFormField, IFormGroup, IPropsGenericFormItemComponent} from 'superdesk-api';
import {Label} from 'superdesk-ui-framework/react/components/Label';
import {assertNever} from 'core/helpers/typescript-helpers';
import {ISystemMessage, RESOURCE} from '..';
import {Page} from 'core/ui/components/Page';

const getTypeLabel = (type: ISystemMessage['type']) => {
    switch (type) {
    case 'alert':
        return gettext('Alert');

    case 'primary':
        return gettext('Info');

    case 'warning':
        return gettext('Warning');

    case 'success':
        return gettext('Success');

    default:
        assertNever(type);
    }
};

/**
 * It needs to be a function because calling gettext in the top level doesn't work
 */
function getFormConfig(): IFormGroup {
    const formConfig: IFormGroup = {
        type: 'inline',
        direction: 'vertical',
        form: [
            {
                field: 'is_active',
                label: gettext('Active'),
                type: FormFieldType.checkbox,
            },
            {
                field: 'type',
                label: gettext('Style'),
                type: FormFieldType.select,
                required: true,
                component_parameters: {
                    options: [
                        {id: 'primary', label: getTypeLabel('primary')},
                        {id: 'success', label: getTypeLabel('success')},
                        {id: 'warning', label: getTypeLabel('warning')},
                        {id: 'alert', label: getTypeLabel('alert')},
                    ],
                },
            },
            {
                field: 'message_title',
                label: gettext('Title'),
                type: FormFieldType.plainText,
                required: true,
            },
            {
                field: 'message',
                label: gettext('Message'),
                type: FormFieldType.textEditor3,
                required: true,
            },
        ],
    };

    return formConfig;
}

class ItemComponent extends React.PureComponent<IPropsGenericFormItemComponent<ISystemMessage>> {
    render() {
        const {item, page} = this.props;
        const formConfig = getFormConfig();

        return (
            <ListItem onClick={() => page.openPreview(item._id)}>
                <ListItemColumn ellipsisAndGrow noBorder>
                    <ListItemRow>
                        <ListItemColumn bold noBorder>
                            <b>{item.message_title}</b>
                        </ListItemColumn>

                        <ListItemColumn>
                            {
                                getFormFieldPreviewComponent(
                                    item,
                                    formConfig.form[3] as IFormField,
                                    {showAsPlainText: true},
                                )
                            }
                        </ListItemColumn>
                    </ListItemRow>

                    <ListItemRow>
                        <ListItemColumn>
                            <Label type={item.type} text={getTypeLabel(item.type)} />
                        </ListItemColumn>
                    </ListItemRow>
                </ListItemColumn>

                <ListItemActionsMenu>
                    <div style={{display: 'flex'}}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                page.startEditing(item._id);
                            }}
                            title={gettext('Edit')}
                            aria-label={gettext('Edit')}
                        >
                            <i className="icon-pencil" />
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                page.deleteItem(item);
                            }}
                            title={gettext('Remove')}
                            aria-label={gettext('Remove')}
                        >
                            <i className="icon-trash" />
                        </button>
                    </div>
                </ListItemActionsMenu>
            </ListItem>
        );
    }
}

export class SystemMessagesSettingsComponent extends React.PureComponent {
    render() {
        const formConfig = getFormConfig();
        const ListComponent = getGenericHttpEntityListPageComponent<ISystemMessage, never>(
            RESOURCE,
            formConfig,
            {field: 'message_title', direction: 'ascending'},
        );

        return (
            <Page title={gettext('System Message')}>
                <ListComponent
                    ItemComponent={ItemComponent}
                    getFormConfig={() => formConfig}
                    defaultSortOption={{field: 'message_title', direction: 'ascending'}}
                    getId={(item) => item._id}
                />
            </Page>
        );
    }
}
