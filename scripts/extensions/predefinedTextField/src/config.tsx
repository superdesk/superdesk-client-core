import * as React from 'react';
import {IConfigComponentProps, IFormField, IFormGroup, IGenericListPageComponent} from 'superdesk-api';
import {IPredefinedFieldConfig, IPredefinedFieldOption} from './interfaces';

import {superdesk} from './superdesk';
const {gettext} = superdesk.localization;
const {nameof} = superdesk.helpers;

const {
    getGenericArrayListPageComponent,
    ListItem,
    ListItemColumn,
    ListItemActionsMenu,
} = superdesk.components;
const {getFormFieldPreviewComponent} = superdesk.forms;

const {FormFieldType} = superdesk.forms;

const nameField: IFormField = {
    label: gettext('Title'),
    type: FormFieldType.textSingleLine,
    field: nameof<IPredefinedFieldOption>('title'),
    required: true,
};

const definitionField: IFormField = {
    label: gettext('Definition'),
    type: FormFieldType.textEditor3,
    field: nameof<IPredefinedFieldOption>('definition'),
    required: true,
};

export class PredefinedFieldConfig extends React.PureComponent<IConfigComponentProps<IPredefinedFieldConfig>> {
    render() {
        const formConfig: IFormGroup = {
            direction: 'vertical',
            type: 'inline',
            form: [
                nameField,
                definitionField,
            ],
        };

        const GenericArrayListPageComponent = getGenericArrayListPageComponent<IPredefinedFieldOption>();

        const value = this.props.config?.options ?? [];
        const getId = (item: IPredefinedFieldOption) => value.indexOf(item).toString();

        const renderRow = (
            key: string,
            item: IPredefinedFieldOption,
            page: IGenericListPageComponent<IPredefinedFieldOption>,
        ) => (
            <ListItem key={key} onClick={() => page.openPreview(getId(item))}>
                <ListItemColumn bold noBorder>
                    {getFormFieldPreviewComponent(item, nameField)}
                </ListItemColumn>
                <ListItemColumn ellipsisAndGrow noBorder>
                    {getFormFieldPreviewComponent(item, definitionField, {showAsPlainText: true})}
                </ListItemColumn>
                <ListItemActionsMenu>
                    <div style={{display: 'flex'}}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                page.startEditing(getId(item));
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

        return (
            <GenericArrayListPageComponent
                defaultSortOption={{field: nameof<IPredefinedFieldOption>('title'), direction: 'ascending'}}
                formConfig={formConfig}
                renderRow={renderRow}
                defaultFilters={{}}
                disallowSorting
                disallowFiltering
                value={value}
                onChange={(val) => {
                    const nextConfig: IPredefinedFieldConfig = {
                        ...this.props.config,
                        options: val,
                    };

                    this.props.onChange(nextConfig);
                }}
                getId={getId}
            />
        );
    }
}
