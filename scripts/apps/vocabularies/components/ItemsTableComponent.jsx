import React from 'react';
import PropTypes from 'prop-types';
import ObjectEditor from './ObjectEditor';

export default class ItemsTableComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {items: []};
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

    inputField(field, item) {
        const value = item[field.key] || '';
        const disabled = !item.is_active;
        const update = (event) => {
            this.props.update(item, field.key, event.target.value);
        };

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
                    onChange={(value) => this.props.update(item, field.key, value)}
                />
            );
        }

        default:
            return (
                <input type="text"
                    value={value}
                    disabled={disabled}
                    onChange={update}
                    className={field.key === 'name' ? 'long-name' : ''}
                />
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
                        {this.inputField(field, item)}
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

    removeItemButton(index, disabled) {
        return (
            <td>
                <button disabled={!!disabled} onClick={() => this.props.remove(index)}>
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