import React from 'react';
import {Button} from 'superdesk-ui-framework/react';
import type {IPropsGenericFormItemComponent} from 'superdesk-api';
import {ListItem, ListItemColumn, ListItemActionsMenu} from 'core/components/ListItem';
import {getFormFieldPreviewComponent} from 'core/ui/components/generic-form/form-field';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {notify} from 'core/notify/notify';
import {gettext} from 'core/utils';
import {AI_PROVIDER_TYPES, getNameField} from './form-config';
import type {IAIProvider, IAIProviderTestResult} from './interfaces';

function getProviderTypeLabel(providerType: IAIProvider['provider_type']): string {
    return AI_PROVIDER_TYPES.find(({id}) => id === providerType)?.getLabel() ?? providerType;
}

function testConnection(providerId: IAIProvider['_id']): Promise<void> {
    return httpRequestJsonLocal<IAIProviderTestResult>({
        method: 'POST',
        path: `/ai_providers/${providerId}/test`,
        payload: {},
    }).then((result) => {
        if (result.ok === true) {
            notify.success(gettext(
                'Connection successful. Models available: {{count}}.',
                {count: result.models_count ?? 0},
            ));
        } else {
            notify.error(gettext(
                'Connection failed: {{error}}',
                {error: result.error || gettext('unknown error')},
            ));
        }
    }, () => {
        notify.error(gettext('Connection could not be tested.'));
    });
}

export class AiProviderItem extends React.PureComponent<IPropsGenericFormItemComponent<IAIProvider>> {
    render() {
        const {item, page, inEditMode, inPreviewMode} = this.props;

        return (
            <ListItem
                className={inEditMode || inPreviewMode ? 'sd-list-item--selected' : ''}
                onClick={() => page.openPreview(item._id)}
                inactive={item.active !== true}
                data-test-id="ai-providers-item"
            >
                <ListItemColumn ellipsisAndGrow noBorder>
                    {getFormFieldPreviewComponent(item, getNameField())}
                </ListItemColumn>
                <ListItemColumn noBorder>
                    <span data-test-id="ai-providers-item--type">
                        {getProviderTypeLabel(item.provider_type)}
                    </span>
                </ListItemColumn>
                <ListItemColumn ellipsisAndGrow noBorder>
                    <span data-test-id="ai-providers-item--base-url">{item.base_url}</span>
                </ListItemColumn>
                {
                    item.active === true ? null : (
                        <ListItemColumn noBorder>
                            <span
                                className="label label--hollow label--alert"
                                data-test-id="ai-providers-item--inactive"
                            >
                                {gettext('Inactive')}
                            </span>
                        </ListItemColumn>
                    )
                }
                <ListItemActionsMenu>
                    <div style={{display: 'flex'}}>
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                testConnection(item._id);
                            }}
                            iconOnly
                            text=""
                            style="text-only"
                            icon="signal"
                            size="small"
                            ariaLabel={gettext('Test connection')}
                            data-test-id="test-connection"
                        />
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                page.startEditing(item._id);
                            }}
                            iconOnly
                            text=""
                            style="text-only"
                            icon="pencil"
                            size="small"
                            ariaLabel={gettext('Edit')}
                            data-test-id="edit"
                        />
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                page.deleteItem(item);
                            }}
                            iconOnly
                            text=""
                            style="text-only"
                            icon="trash"
                            size="small"
                            ariaLabel={gettext('Delete')}
                            data-test-id="delete"
                        />
                    </div>
                </ListItemActionsMenu>
            </ListItem>
        );
    }
}
