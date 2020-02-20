/* eslint-disable react/no-multi-comp */

import React from 'react';
import ReactPaginate from 'react-paginate';
import ObjectEditor from './ObjectEditor';
import {has} from 'lodash';
import {gettext} from 'core/utils';
import {ISortOption} from 'superdesk-api';
import {assertNever} from 'core/helpers/typescript-helpers';
import {Dropdown} from 'core/ui/components';
import {Checkbox} from 'superdesk-ui-framework';

interface ISchemaField {
    key: string;
    label?: string;
    type?: 'object' | string;
}

interface IProps {
    schemaFields: Array<ISchemaField>;
    update(item, key, value): void;
    remove(index): void;
    addItem(): void;
}

interface IState {
    targetInput: any;
    items: Array<{qcode?: string; name?: string; is_active?: boolean}>;
    itemsValidation: Array<{[key: string]: any}>;
    caretPosition: any;
    page: number;
    searchTerm: string;
    searchExtended: boolean;
    sortDropdownOpen: boolean;
    sort: ISortOption | null;
}

const pageSize = 50;

function getPageCount(items: IState['items']) {
    return Math.ceil(items.length / pageSize);
}

function sortItems(items: IState['items'], sort: ISortOption) {
    return items.sort((a, b) => {
        if (sort.direction === 'ascending') {
            if (a[sort.field] < b[sort.field]) {
                return -1;
            } else if (a[sort.field] > b[sort.field]) {
                return 1;
            } else {
                return 0;
            }
        } else if (sort.direction === 'descending') {
            if (a[sort.field] < b[sort.field]) {
                return 1;
            } else if (a[sort.field] > b[sort.field]) {
                return -1;
            } else {
                return 0;
            }
        } else {
            return assertNever(sort.direction);
        }
    });
}

class InputField extends React.PureComponent<{
    field: ISchemaField;
    item: IState['items'][0];
    required: boolean;
    valid: boolean;
    update: IProps['update'];
}> {
    render() {
        const {field, item, required, valid} = this.props;
        const value = item[field.key] || '';
        const disabled = !item.is_active;
        const update = (event) => {
            const _value = field.type === 'integer' ? parseInt(event.target.value, 10) : event.target.value;

            const caretPosition = event.target.selectionStart;
            const targetInput = event.target;

            this.setState({targetInput, caretPosition});
            this.props.update(item, field.key, _value);
        };
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
}

export default class ItemsTableComponent extends React.Component<IProps, IState> {
    static propTypes: any;
    static defaultProps: any;
    getIndex: (item: IState['items'][0]) => number;
    sortFields: Array<string>;
    receiveStateCount: number;

    constructor(props) {
        super(props);
        this.state = {
            items: [],
            itemsValidation: [],
            caretPosition: '',
            targetInput: '',
            page: 1,
            searchTerm: '',
            searchExtended: false,
            sortDropdownOpen: false,
            sort: null,
        };

        this.getIndex = (item) => this.state.items.indexOf(item);
        this.sortFields = [];
        this.receiveStateCount = 0;
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

        let nextState: Partial<IState> = {
            items: items,
            itemsValidation: itemsValidation,

            // if items are removed, the page needs to be updated so it doesn't point to a page that no longer exists
            page: Math.min(this.state.page, pageCount),
        };

        // sort only the first time after receiving data
        if (this.receiveStateCount === 0) {
            this.sortFields = Object.keys(items[0]);

            const initialSortOption: ISortOption = {
                field: this.sortFields.includes('name') ? 'name' : this.sortFields[0],
                direction: 'ascending',
            };

            nextState = {
                ...nextState,
                sort: initialSortOption,
                items: sortItems(nextState.items, initialSortOption),
            };
        }

        this.setState(nextState as any);

        this.receiveStateCount++;
    }

    render() {
        const takeFrom = (this.state.page - 1) * pageSize;
        const takeTo = this.state.page * pageSize;
        const filteredItems = this.state.searchTerm.length < 1
            ? this.state.items
            : this.state.items.filter((item) => {
                return item.qcode?.toLocaleLowerCase().includes(this.state.searchTerm)
                    || item.name?.toLocaleLowerCase().includes(this.state.searchTerm);
            });

        return (
            <React.Fragment>
                <div className="subnav">
                    <div className={'flat-searchbar' + (this.state.searchExtended ? ' extended' : '')}>
                        <div className="search-handler">
                            <label
                                className="trigger-icon"
                                onClick={() => {
                                    this.setState({searchExtended: !this.state.searchExtended});
                                }}
                            >
                                <i className="icon-search" />
                            </label>
                            <input type="text" value={this.state.searchTerm}
                                placeholder={gettext('Search')} onChange={(event) => {
                                    this.setState({searchTerm: event.target.value, page: 1});
                                }} />
                            <button className="search-close"><i className="icon-close-small" /></button>
                        </div>
                    </div>

                    <div className="sortbar sd-margin-l--auto">
                        {this.state.sort == null ? null : (
                            <div className="dropdown">
                                <button className="dropdown__toggle"
                                    onClick={() => this.setState({sortDropdownOpen: !this.state.sortDropdownOpen})}>
                                    {this.state.sort.field}
                                    <span className="dropdown__caret" />
                                </button>
                                <Dropdown open={this.state.sortDropdownOpen}>
                                    {this.sortFields.map((field) => {
                                        return (
                                            <li key={field}>
                                                <button onClick={() => {
                                                    this.setState({
                                                        sort: {...this.state.sort, field},
                                                        sortDropdownOpen: false,
                                                    });
                                                }}>
                                                    {field}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </Dropdown>
                            </div>
                        )}

                        {this.state.sort == null ? null : (
                            <button className="icn-btn direction" onClick={() => {
                                const nextSortOption: ISortOption = {
                                    ...this.state.sort,
                                    direction: this.state.sort.direction === 'ascending'
                                        ? 'descending'
                                        : 'ascending',
                                };

                                this.setState({
                                    sort: nextSortOption,
                                    items: sortItems(this.state.items, nextSortOption),
                                });
                            }}>
                                {this.state.sort.direction === 'ascending'
                                    ? <i className="icon-descending" />
                                    : <i className="icon-ascending" />
                                }
                            </button>
                        )}

                        <button className="btn btn--primary" onClick={() => {
                            // clearing search before adding an item so it doesn't get filtered
                            this.setState({searchTerm: ''}, () => {
                                this.props.addItem();

                                // using a timeout to wait for this.state.items to update after adding an item
                                // in case adding an item causes page count to increase
                                setTimeout(() => {
                                    this.setState({page: 1});
                                });
                            });
                        }}>
                            <i className="icon-plus-sign" />
                            <span>{gettext('Add Item')}</span>
                        </button>
                    </div>
                </div>

                <div className="subnav pagination--rounded">
                    <ReactPaginate
                        previousLabel={''}
                        nextLabel={''}
                        pageCount={getPageCount(filteredItems)}
                        marginPagesDisplayed={2}
                        pageRangeDisplayed={5}
                        onPageChange={({selected}) => {
                            this.setState({page: selected + 1});
                        }}
                        forcePage={this.state.page - 1}
                        containerClassName="bs-pagination"
                        activeClassName="active"
                    />
                </div>

                <div className="sd-padding-x--3 table-list">
                    <table>
                        <thead>
                            <tr>
                                {this.props.schemaFields.map((field) => (
                                    <th key={field.key}>
                                        <label>{field.label || field.key}</label>
                                    </th>
                                ))}
                                <th>
                                    <label>{gettext('Active')}</label>
                                </th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.slice(takeFrom, takeTo).map((item) => {
                                return (
                                    <tr key={this.getIndex(item)}>
                                        {this.props.schemaFields.map((field) => {
                                            const index = this.getIndex(item);
                                            const required = this.state.itemsValidation.length
                                                && has(this.state.itemsValidation[index], field.key);

                                            return (
                                                <td key={field.key}>
                                                    <InputField
                                                        field={field}
                                                        item={item}
                                                        required={required}
                                                        valid={
                                                            !required || this.state.itemsValidation[index][field.key]
                                                        }
                                                        update={this.props.update}
                                                    />
                                                </td>
                                            );
                                        })}
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
                                            <button className="icn-btn"
                                                onClick={() => {
                                                    this.props.remove(this.getIndex(item));
                                                }}>
                                                <i className="icon-close-small" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </React.Fragment>
        );
    }
}
