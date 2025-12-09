import React from 'react';
import type {IPropsGenericFormItemComponent} from 'superdesk-api';
import type {IProductionApiKeyConfig} from './utils';
import {ListItem, ListItemColumn, ListItemActionsMenu} from 'core/components/ListItem';
import {getFormFieldPreviewComponent} from 'core/ui/components/generic-form/form-field';
import {formatDate} from 'core/get-superdesk-api-implementation';
import {getNameField} from './ProductionApiKeys';
import {IconButton} from 'superdesk-ui-framework';
import {gettext} from 'core/utils';

export const ProductionApiItem: React.FC<IPropsGenericFormItemComponent<IProductionApiKeyConfig>> = (props) => {
    const {item, page, inEditMode, inPreviewMode} = props;

    const handleClick = () => {
        page.openPreview(item._id);
    };

    const handleDoubleClick = () => {
        page.startEditing(item._id);
    };

    return (
        <ListItem
            className={inEditMode || inPreviewMode ? 'sd-list-item--selected' : ''}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            data-test-id="production-api-keys"
        >
            <ListItemColumn ellipsisAndGrow noBorder>
                {getFormFieldPreviewComponent(item, getNameField())}
            </ListItemColumn>
            <ListItemColumn noBorder>
                {gettext('Last updated')}: {formatDate(new Date(item._updated))}
            </ListItemColumn>
            <ListItemColumn noBorder>
                {gettext('Created')}: {formatDate(new Date(item._created))}
            </ListItemColumn>
            <ListItemActionsMenu>
                <div style={{display: 'flex'}}>
                    <IconButton
                        onClick={(e) => {
                            e.stopPropagation();
                            page.startEditing(item._id);
                        }}
                        ariaValue={gettext('Edit')}
                        icon="pencil"
                        size="small"
                        data-test-id="edit"
                    />
                    <IconButton
                        onClick={(e) => {
                            e.stopPropagation();
                            page.deleteItem(item);
                        }}
                        ariaValue={gettext('Remove')}
                        icon="trash"
                        size="small"
                        data-test-id="delete"
                    />
                </div>
            </ListItemActionsMenu>
        </ListItem>
    );
};
