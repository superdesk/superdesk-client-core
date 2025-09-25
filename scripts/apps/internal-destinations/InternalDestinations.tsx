/* eslint-disable react/no-multi-comp */

import React from 'react';
import {getGenericHttpEntityListPageComponent} from 'core/ui/components/ListPage/generic-list-page';
import {ListItemColumn, ListItemActionsMenu, ListItem} from 'core/components/ListItem';
import {getFormFieldPreviewComponent} from 'core/ui/components/generic-form/form-field';
import {IInternalDestination} from 'superdesk-interfaces/InternalDestination';
import {IFormField, IFormGroup, IPropsGenericFormItemComponent} from 'superdesk-api';
import {GenericFormFieldType} from 'core/ui/components/generic-form/interfaces/form';
import {gettext} from 'core/utils';

function getNameField(): IFormField<IInternalDestination> {
    return {
        label: gettext('Destination name'),
        type: GenericFormFieldType.plainText,
        field: 'name',
        required: true,
    };
}

function getIsActiveField(): IFormField<IInternalDestination> {
    return {
        label: gettext('Active'),
        type: GenericFormFieldType.checkbox,
        field: 'is_active',
    };
}

function getContentFilterField(): IFormField<IInternalDestination> {
    return {
        label: gettext('Content filter'),
        type: GenericFormFieldType.contentFilterSingleValue,
        field: 'filter',
    };
}

function getDeskField(): IFormField<IInternalDestination> {
    return {
        label: gettext('Desk'),
        type: GenericFormFieldType.deskSingleValue,
        field: 'desk',
        required: true,
    };
}

function getStageField(): IFormField<IInternalDestination> {
    return {
        label: gettext('Stage'),
        type: GenericFormFieldType.stageSingleValue,
        field: 'stage',
        component_parameters: {
            deskField: 'desk',
        },
    };
}

function getMacroField(): IFormField<IInternalDestination> {
    return {
        label: gettext('Macro'),
        type: GenericFormFieldType.macroSingleValue,
        field: 'macro',
        component_parameters: {
            deskField: 'desk',
        },
    };
}

function getSendAfterScheduleField(): IFormField<IInternalDestination> {
    return {
        label: gettext('Send only after publish schedule'),
        type: GenericFormFieldType.checkbox,
        field: 'send_after_schedule',
    };
}

class ItemComponent extends React.PureComponent<IPropsGenericFormItemComponent<IInternalDestination>> {
    render() {
        const {item, page} = this.props;

        return (
            <ListItem
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
    }
}

export class InternalDestinations extends React.Component {
    render() {
        const formConfig: IFormGroup<IInternalDestination> = {
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
            getGenericHttpEntityListPageComponent<IInternalDestination, never>(
                'internal_destinations',
                formConfig,
                {field: 'name', direction: 'ascending'},
            );

        return (
            <InternalDestinationsPageComponent
                ItemComponent={ItemComponent}
                getFormConfig={() => formConfig}
                fieldForSearch={getNameField()}
                getId={(item) => item._id}
                defaultSortOption={{field: 'name', direction: 'ascending'}}
            />
        );
    }
}
