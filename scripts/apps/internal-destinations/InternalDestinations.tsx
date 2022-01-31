/* eslint-disable react/no-multi-comp */

import React from 'react';
import {
    getGenericHttpEntityListPageComponent,
    GenericListPageComponent,
} from 'core/ui/components/ListPage/generic-list-page';
import {ListItemColumn, ListItemActionsMenu, ListItem} from 'core/components/ListItem';
import {getFormFieldPreviewComponent} from 'core/ui/components/generic-form/form-field';
import {IInternalDestination} from 'superdesk-interfaces/InternalDestination';
import {IFormField, IFormGroup} from 'superdesk-api';
import {FormFieldType} from 'core/ui/components/generic-form/interfaces/form';
import {gettext} from 'core/utils';

function getNameField(): IFormField {
    return {
        label: gettext('Destination name'),
        type: FormFieldType.textSingleLine,
        field: 'name',
        required: true,
    };
}

function getIsActiveField(): IFormField {
    return {
        label: gettext('Active'),
        type: FormFieldType.checkbox,
        field: 'is_active',
    };
}

function getContentFilterField(): IFormField {
    return {
        label: gettext('Content filter'),
        type: FormFieldType.contentFilterSingleValue,
        field: 'filter',
    };
}

function getDeskField(): IFormField {
    return {
        label: gettext('Desk'),
        type: FormFieldType.deskSingleValue,
        field: 'desk',
        required: true,
    };
}

function getStageField(): IFormField {
    return {
        label: gettext('Stage'),
        type: FormFieldType.stageSingleValue,
        field: 'stage',
        component_parameters: {
            deskField: 'desk',
        },
    };
}

function getMacroField(): IFormField {
    return {
        label: gettext('Macro'),
        type: FormFieldType.macroSingleValue,
        field: 'macro',
        component_parameters: {
            deskField: 'desk',
        },
    };
}

function getSendAfterScheduleField(): IFormField {
    return {
        label: gettext('Send only after publish schedule'),
        type: FormFieldType.checkbox,
        field: 'send_after_schedule',
    };
}

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
            {getFormFieldPreviewComponent(item, getNameField())}
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
        const formConfig: IFormGroup = {
            direction: 'vertical',
            type: 'inline',
            form: [
                getIsActiveField(),
                getSendAfterScheduleField(),
                getNameField(),
                getContentFilterField(),
                getDeskField(),
                getStageField(),
                getMacroField(),
            ],
        };

        const InternalDestinationsPageComponent =
            getGenericHttpEntityListPageComponent<IInternalDestination>('internal_destinations', formConfig);

        return (
            <InternalDestinationsPageComponent
                renderRow={renderRow}
                formConfig={formConfig}
                defaultSortOption={{field: 'name', direction: 'ascending'}}
                fieldForSearch={getNameField()}
            />
        );
    }
}
