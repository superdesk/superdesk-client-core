import React from 'react';
import ObjectEditor from './ObjectEditor';
import {has} from 'lodash';
import {gettext} from 'core/utils';

interface ISchemaField {
    key: string;
    label?: string;
    type?: 'object' | string;
}

interface IProps {
    model: {[key: string]: any};
    schema: {[key: string]: any};
    schemaFields: Array<ISchemaField>;
    update(item, key, value): void;
    remove(index): void;
}

interface IState {
    targetInput: any;
    items: Array<{[key: string]: any}>;
    itemsValidation: Array<{[key: string]: any}>;
    caretPosition: any;
}

export default class ItemsTableComponent extends React.Component<IProps, IState> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.state = {
            items: [],
            itemsValidation: [],
            caretPosition: '',
            targetInput: '',
        };
    }

    componentDidUpdate() {
        const {targetInput, caretPosition} = this.state;

        if (caretPosition != null) {
            this.setCaretPosition(targetInput, caretPosition);
        }
    }

    setCaretPosition(ctrl, pos) {
        if (ctrl.setSelectionRange) {
            ctrl.focus();
            ctrl.setSelectionRange(pos, pos);
        }
    }

    inputField(field: ISchemaField, item, index) {
        const value = item[field.key] || '';
        const disabled = !item.is_active;
        const update = (event) => {
            const _value = field.type === 'integer' ? parseInt(event.target.value, 10) : event.target.value;

            const caretPosition = event.target.selectionStart;
            const targetInput = event.target;

            this.setState({targetInput, caretPosition});
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

    render() {
        return (
            <table>
                <thead>
                <tr>
                    {
                        this.props.schemaFields.map((field) => (
                            <th key={field.key}>
                                <label>{field.label || field.key}</label>
                            </th>
                        ))
                    }
                    <th>
                        <label>{gettext('Active')}</label>
                    </th>
                    <th />
                </tr>
                </thead>
                <tbody>
                    {
                        this.state.items.map((item, index) => (
                            <tr key={index}>
                                {this.props.schemaFields.map((field) => (
                                    <td key={field.key}>
                                        {this.inputField(field, item, index)}
                                    </td>
                                ))}
                                <td>
                                    <span className="vocabularyStatus">
                                        <input type="checkbox"
                                            checked={!!item.is_active}
                                            onChange={() => this.props.update(item, 'is_active', !item.is_active)}
                                        />
                                    </span>
                                </td>
                                <td>
                                    <button className="icn-btn" onClick={() => this.props.remove(index)}>
                                        <i className="icon-close-small" />
                                    </button>
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        );
    }
}
