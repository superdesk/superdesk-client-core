/* eslint-disable react/no-multi-comp */
import * as React from 'react';
import {IConfigComponentProps, IFormField, IFormGroup, IPropsGenericFormItemComponent} from 'superdesk-api';
import {IPredefinedFieldConfig, IPredefinedFieldOption, IExtensionConfigurationOptions} from './interfaces';
import {Tag, Checkbox} from 'superdesk-ui-framework/react';

import {superdesk} from './superdesk';
import {noop} from 'lodash';
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
    type: FormFieldType.plainText,
    field: nameof<IPredefinedFieldOption>('title'),
    required: true,
};

const definitionField: IFormField = {
    label: gettext('Definition'),
    type: FormFieldType.textEditor3,
    field: nameof<IPredefinedFieldOption>('definition'),
    required: true,
};

class ItemComponent extends React.PureComponent<IPropsGenericFormItemComponent<IPredefinedFieldOption>> {
    render() {
        const {item, page, getId, index} = this.props;

        return (
            <ListItem key={index} onClick={() => page.openPreview(getId(item))}>
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
    }
}

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

        const GenericArrayListPageComponent = getGenericArrayListPageComponent<IPredefinedFieldOption, never>();

        const value = this.props.config?.options ?? [];
        const getId = (item: IPredefinedFieldOption) => item._id;

        const extensionConfig: IExtensionConfigurationOptions = superdesk.getExtensionConfig();
        const availablePlaceholders =
            Object.keys(extensionConfig.placeholderMapping ?? {})
                .map((val) => `{{${val}}}`);

        return (
            <div>
                <div className="form-label">{gettext('Configure predefined values')}</div>

                {
                    availablePlaceholders.length > 0 && (
                        <div>
                            {gettext('The following placeholders are available to be used in definitions:')}
                            {' '}
                            {
                                availablePlaceholders.map((placeholder) => (
                                    <Tag
                                        key={placeholder}
                                        text={placeholder}
                                        readOnly
                                        onClick={noop}
                                    />
                                ))
                            }

                            <br />
                            <br />
                        </div>
                    )
                }

                <GenericArrayListPageComponent
                    defaultSortOption={{field: nameof<IPredefinedFieldOption>('title'), direction: 'ascending'}}
                    getFormConfig={() => formConfig}
                    ItemComponent={ItemComponent}
                    defaultFilters={{}}
                    disallowSorting
                    disallowFiltering
                    value={value}
                    getNewItemTemplate={() => {
                        const ids = value.map(({_id: id}) => parseInt(id, 10));

                        return ({
                            _id: value.length < 1 ? '1' : (Math.max(...ids) + 1).toString(),
                        });
                    }}
                    onChange={(val) => {
                        const nextConfig: IPredefinedFieldConfig = {
                            ...this.props.config,
                            options: val,
                        };

                        this.props.onChange(nextConfig);
                    }}
                    getId={getId}
                />

                <Checkbox
                    label={{side: 'end', text: gettext('Allow switching to free text input')}}
                    checked={this.props.config?.allowSwitchingToFreeText ?? false}
                    onChange={(allowSwitchingToFreeText) => {
                        this.props.onChange({
                            ...this.props.config,
                            allowSwitchingToFreeText,
                        });
                    }}
                />
            </div>
        );
    }
}
