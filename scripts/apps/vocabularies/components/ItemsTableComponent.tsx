import React from 'react';
import PropTypes from 'prop-types';
import ObjectEditor from './ObjectEditor';
import {has} from 'lodash';

export default class ItemsTableComponent extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.state = {items: [], itemsValidation: []};
    }

    getModelKeys() {
        const {gettext, model} = this.props;

        return Object.keys(model)
            .filter((key) => key !== 'is_active')
            .map((key) => (
                <th key={key}>
                    <label>{gettext(key)}</label>
                </th>
            ));
    }

    getSchemaKeys() {
        const {gettext, schemaFields} = this.props;

        return schemaFields.map((field) => (
            <th key={field.key}>
                <label>{field.label || gettext(field.key)}</label>
            </th>
        ));
    }

    header() {
        const {schema, gettext} = this.props;
        const fields = schema ? this.getSchemaKeys() : this.getModelKeys();

        fields.push(<th key="is_active"><label>{gettext('Active')}</label></th>);
        fields.push(<th key={''} />);

        return <tr>{fields}</tr>;
    }

    inputField(field, item, index?) {
        const value = item[field.key] || '';
        const disabled = !item.is_active;
        const update = (event) => {
            const _value = field.type === 'integer' ? parseInt(event.target.value, 10) : event.target.value;

            this.props.update(item, field.key, _value);
        };
        const required = this.state.itemsValidation.length && has(this.state.itemsValidation[index], field.key);
        const valid = !required || this.state.itemsValidation[index][field.key];
        let className = 'sd-line-input sd-line-input--no-margin sd-line-input--no-label sd-line-input--boxed';

        if (required) {
            className += ' sd-line-input--required';
        }
        if (!valid) {
            className += ' sd-line-input--invalid';
        }

        switch (field.type) {
        case 'bool':
            return (
                <input type="checkbox"
                    checked={!!value}
                    disabled={disabled}
                    onChange={(event) => this.props.update(item, field.key, !value)}
                />
            );

        case 'color':
            return (
                <input type="color"
                    value={value}
                    disabled={disabled}
                    onChange={update}
                />
            );

        case 'short':
            return (
                <input type="text"
                    value={value}
                    disabled={disabled}
                    onChange={update}
                />
            );

        case 'object': {
            return (
                <ObjectEditor
                    value={value}
                    disabled={disabled}
                    onChange={(_value) => this.props.update(item, field.key, _value)}
                />
            );
        }

        case 'integer':
            return (
                <div className={className}>
                    <input type="number"
                        value={value}
                        disabled={disabled}
                        onChange={update}
                        className={field.key === 'name' ? 'long-name sd-line-input__input' : 'sd-line-input__input'}
                    />
                </div>
            );

        default:
            return (
                <div className={className}>
                    <input type="text"
                        value={value}
                        disabled={disabled}
                        onChange={update}
                        className={field.key === 'name' ? 'long-name sd-line-input__input' : 'sd-line-input__input'}
                    />
                </div>
            );
        }
    }

    modelItem(item, keys) {
        return keys.map((key) => (
            <td key={key}>
                {this.inputField({key: key, type: key}, item)}
            </td>
        ));
    }

    modelBody() {
        const {model} = this.props;
        const keys = Object.keys(model).filter((key) => key !== 'is_active');
        const removeDisabled = !this.props.schema && this.state.items.length <= 1;

        return this.state.items.map((item, index) => (
            <tr key={index}>
                {this.modelItem(item, keys)}
                {this.toggleActiveButton(item)}
                {this.removeItemButton(index, removeDisabled)}
            </tr>
        ));
    }

    schemaBody() {
        const {schemaFields} = this.props;

        return this.state.items.map((item, index) => (
            <tr key={index}>
                {schemaFields.map((field) => (
                    <td key={field.key}>
                        {this.inputField(field, item, index)}
                    </td>
                ))}
                {this.toggleActiveButton(item)}
                {this.removeItemButton(index)}
            </tr>
        ));
    }

    toggleActiveButton(item) {
        return (
            <td>
                <span className="vocabularyStatus">
                    <input type="checkbox"
                        checked={!!item.is_active}
                        onChange={() => this.props.update(item, 'is_active', !item.is_active)}
                    />
                </span>
            </td>
        );
    }

    removeItemButton(index, disabled?) {
        return (
            <td>
                <button className="icn-btn" disabled={!!disabled} onClick={() => this.props.remove(index)}>
                    <i className="icon-close-small" />
                </button>
            </td>
        );
    }

    body() {
        return this.props.schema ? this.schemaBody() : this.modelBody();
    }

    render() {
        return (
            <table>
                <thead>
                    {this.header()}
                </thead>
                <tbody>
                    {this.body()}
                </tbody>
            </table>
        );
    }
}

ItemsTableComponent.propTypes = {
    model: PropTypes.object,
    schema: PropTypes.object,
    schemaFields: PropTypes.array,
    gettext: PropTypes.func.isRequired,
    update: PropTypes.func.isRequired,
    remove: PropTypes.func.isRequired,
};
