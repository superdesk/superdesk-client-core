import React from 'react';
import type {IPropsGenericFormItemComponent} from 'superdesk-api';
import type {IProductionApiKeyConfig} from './utils';
import {ListItem, ListItemColumn, ListItemActionsMenu} from 'core/components/ListItem';
import {getFormFieldPreviewComponent} from 'core/ui/components/generic-form/form-field';
import {formatDate} from 'core/get-superdesk-api-implementation';
import {getNameField} from './ProductionApiKeys';
import {Button, IconButton} from 'superdesk-ui-framework/react';
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
};
