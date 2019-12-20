import React from 'react';
import ReactPaginate from 'react-paginate';
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
    addItem(): void;
}

interface IState {
    targetInput: any;
    items: Array<{[key: string]: any}>;
    itemsValidation: Array<{[key: string]: any}>;
    caretPosition: any;
    page: number;
}

const pageSize = 5;

function getPageCount(items: IState['items']) {
    return Math.ceil(items.length / pageSize);
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
            page: 1,
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

    receiveState(items: IState['items'], itemsValidation: IState['itemsValidation']) {
        const pageCount = getPageCount(items);

        this.setState({
            items: items,
            itemsValidation: itemsValidation,

            // if items are removed, the page needs to be updated so it doesn't point to a page that no longer exists
            page: Math.min(this.state.page, pageCount),
        });
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
        const takeFrom = (this.state.page - 1) * pageSize;
        const takeTo = this.state.page * pageSize;

        return (
            <div>
                <ReactPaginate
                    previousLabel={gettext('prev')}
                    nextLabel={gettext('next')}
                    pageCount={getPageCount(this.state.items)}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={5}
                    onPageChange={({selected}) => {
                        this.setState({page: selected + 1});
                    }}
                    forcePage={this.state.page - 1}
                    containerClassName="bs-pagination"
                    activeClassName="active"
                />

                <div className="vocabulary-items__button-bar">
                    <button
                        id="add-new-btn"
                        className="btn btn--primary"
                        onClick={() => {
                            this.props.addItem();

                            // using a timeout to wait for this.state.items to update after adding an item
                            // in case adding an item causes page count to increase
                            setTimeout(() => {
                                this.setState({page: getPageCount(this.state.items)});
                            });
                        }}
                    >
                        <i className="icon-plus-sign"></i>
                        <span>{gettext('Add Item')}</span>
                    </button>
                </div>

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
                            this.state.items.slice(takeFrom, takeTo).map((item, i) => {
                                const absoluteIndex = takeFrom + i;

                                return (
                                    <tr key={absoluteIndex}>
                                        {this.props.schemaFields.map((field) => (
                                            <td key={field.key}>
                                                {this.inputField(field, item, absoluteIndex)}
                                            </td>
                                        ))}
                                        <td>
                                            <span className="vocabularyStatus">
                                                <input type="checkbox"
                                                    checked={!!item.is_active}
                                                    onChange={
                                                        () => this.props.update(item, 'is_active', !item.is_active)
                                                    }
                                                />
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="icn-btn"
                                                onClick={() => this.props.remove(absoluteIndex)}
                                            >
                                                <i className="icon-close-small" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        }
                    </tbody>
                </table>
            </div>
        );
    }
}
