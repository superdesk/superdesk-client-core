/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import {
    IFormGroup,
    IPropsGenericFormItemComponent,
    IFormField,
} from 'superdesk-api';

import {superdesk} from '../superdesk';
import {IShow} from '../interfaces';

const {gettext} = superdesk.localization;
const {FormFieldType} = superdesk.forms;
const {
    getGenericHttpEntityListPageComponent,
    ListItem,
    ListItemColumn,
    ListItemActionsMenu,
} = superdesk.components;
const {getFormFieldPreviewComponent} = superdesk.forms;
const {nameof} = superdesk.helpers;

const nameField: IFormField = {
    label: gettext('Show name'),
    type: FormFieldType.plainText,
    field: nameof<IShow>('title'),
    required: true,
};
const shortCode: IFormField = {
    label: gettext('Show code'),
    type: FormFieldType.plainText,
    field: nameof<IShow>('shortcode'),
    required: true,
};
const descriptionField: IFormField = {
    label: gettext('Description'),
    type: FormFieldType.plainText,
    field: nameof<IShow>('description'),
    component_parameters: {
        multiline: true,
    },
    required: false,
};
const plannedDurationField: IFormField = {
    label: gettext('Planned duration'),
    type: FormFieldType.duration,
    field: nameof<IShow>('planned_duration'),
    required: true,
};

const formConfig: IFormGroup = {
    direction: 'vertical',
    type: 'inline',
    form: [
        nameField,
        shortCode,
        descriptionField,
        plannedDurationField,
    ],
};

const CRUDComponent = getGenericHttpEntityListPageComponent<IShow, never>(
    'shows',
    formConfig,
    {field: nameof<IShow>('title'), direction: 'ascending'},
);

export class ManageShows extends React.Component {
    render() {
        class ItemComponent extends React.PureComponent<IPropsGenericFormItemComponent<IShow>> {
            render() {
                const {item, page} = this.props;

                return (
                    <ListItem onClick={() => page.openPreview(item._id)}>
                        <ListItemColumn bold ellipsisAndGrow noBorder>
                            {getFormFieldPreviewComponent(item, nameField)}
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

        return (
            <CRUDComponent
                defaultSortOption={{field: nameof<IShow>('title'), direction: 'ascending'}}
                getFormConfig={() => formConfig}
                ItemComponent={ItemComponent}
                fieldForSearch={nameField}
                getId={(item) => item._id}
            />
        );
    }
}
