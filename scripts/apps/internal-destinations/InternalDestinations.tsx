import React from "react";
import {getGenericListPageComponent, GenericListPageComponent} from "core/ui/components/ListPage/generic-list-page";
import {IFormField, IFormGroup} from "core/ui/components/generic-form/interfaces/form";
import {ListItemColumn, ListItemActionsMenu, ListItem} from "core/components/ListItem";
import {getFormFieldPreviewComponent} from "core/ui/components/generic-form/form-field";
import {IInternalDestination} from "superdesk-interfaces/InternalDestination";

const InternalDestinationsPageComponent = getGenericListPageComponent<IInternalDestination>('internal_destinations');

const nameField: IFormField = {
    label : gettext('Destination name'),
    type: 'text_single_line',
    field: 'name',
};

const isActiveField: IFormField = {
    label : gettext('Active'),
    type: 'checkbox',
    field: 'is_active',
};

const contentFilterField: IFormField = {
    label : gettext('Content filter'),
    type: 'content_filter_single_value',
    field: 'filter',
};

const deskStageMacroField: IFormField = {
    type: 'desk_stage_macro',
    component_parameters: {
        deskField: 'desk',
        stageField: 'stage',
        macroField: 'macro',
    },
};

const formConfig: IFormGroup = {
    direction: 'vertical',
    type: 'inline',
    form: [
        isActiveField,
        nameField,
        contentFilterField,
        deskStageMacroField,
    ],
};

const renderRow = (
    key: string,
    item: IInternalDestination,
    page: GenericListPageComponent<IInternalDestination>,
) => (
    <ListItem key={key} onClick={() => page.openPreview(item._id)} inactive={!item.is_active}>
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
            <div style={{ display: 'flex' }}>
                <button
                    onClick={(event) => {
                        event.stopPropagation();
                        page.startEditing(item._id);
                    }}
                    className="icn-btn"
                    title={gettext('Edit')}
                >
                    <i className="icon-pencil" />
                </button>
                <button
                    onClick={(event) => {
                        event.stopPropagation(); // prevents preview from opening
                        page.deleteItem(item);
                    }}
                    className="icn-btn"
                    title={gettext('Remove')}>
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
