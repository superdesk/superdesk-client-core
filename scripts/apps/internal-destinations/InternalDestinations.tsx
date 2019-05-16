/* eslint-disable react/no-multi-comp */

import React from 'react';
import {getGenericListPageComponent, GenericListPageComponent} from 'core/ui/components/ListPage/generic-list-page';
import {ListItemColumn, ListItemActionsMenu, ListItem} from 'core/components/ListItem';
import {getFormFieldPreviewComponent} from 'core/ui/components/generic-form/form-field';
import {IInternalDestination} from 'superdesk-interfaces/InternalDestination';
import {IFormField, IFormGroup} from 'superdesk-api';
import {FormFieldType} from 'core/ui/components/generic-form/interfaces/form';

const InternalDestinationsPageComponent = getGenericListPageComponent<IInternalDestination>('internal_destinations');

const nameField: IFormField = {
    label: gettext('Destination name'),
    type: FormFieldType.textSingleLine,
    field: 'name',
    required: true,
};

const isActiveField: IFormField = {
    label: gettext('Active'),
    type: FormFieldType.checkbox,
    field: 'is_active',
};

const contentFilterField: IFormField = {
    label: gettext('Content filter'),
    type: FormFieldType.contentFilterSingleValue,
    field: 'filter',
};

const deskField: IFormField = {
    label: gettext('Desk'),
    type: FormFieldType.deskSingleValue,
    field: 'desk',
    required: true,
};

const stageField: IFormField = {
    label: gettext('Stage'),
    type: FormFieldType.stageSingleValue,
    field: 'stage',
    component_parameters: {
        deskField: 'desk',
    },
};

const macroField: IFormField = {
    label: gettext('Macro'),
    type: FormFieldType.macroSingleValue,
    field: 'macro',
    component_parameters: {
        deskField: 'desk',
    },
};

const formConfig: IFormGroup = {
    direction: 'vertical',
    type: 'inline',
    form: [
        isActiveField,
        nameField,
        contentFilterField,
        deskField,
        stageField,
        macroField,
    ],
};

const renderRow = (
    key: string,
    item: IInternalDestination,
    page: GenericListPageComponent<IInternalDestination>,
) => (
    <ListItem
        key={key}
        onClick={() => page.openPreview(item._id)}
        inactive={!item.is_active}
        data-test-id="internal-destinations-item"
    >
        <ListItemColumn ellipsisAndGrow noBorder>
            {getFormFieldPreviewComponent(item, nameField)}
        </ListItemColumn>
        {
            item.is_active ? null : (
                <ListItemColumn noBorder>
                    <span className="label label--hollow label--alert">{gettext('Inactive')}</span>
                </ListItemColumn>
            )
        }
        <ListItemActionsMenu>
            <div style={{display: 'flex'}}>
                <button
                    onClick={(event) => {
                        event.stopPropagation();
                        page.startEditing(item._id);
                    }}
                    className="icn-btn"
                    title={gettext('Edit')}
                    data-test-id="edit"
                >
                    <i className="icon-pencil" />
                </button>
                <button
                    onClick={(event) => {
                        event.stopPropagation(); // prevents preview from opening
                        page.deleteItem(item);
                    }}
                    className="icn-btn"
                    title={gettext('Remove')}
                    data-test-id="delete"
                >
                    <i className="icon-trash" />
                </button>
            </div>
        </ListItemActionsMenu>
    </ListItem>
);

export class InternalDestinations extends React.Component {
    render() {
        return (
            <InternalDestinationsPageComponent
                renderRow={renderRow}
                formConfig={formConfig}
            />
        );
    }
}
