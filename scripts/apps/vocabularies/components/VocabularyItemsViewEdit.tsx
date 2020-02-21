/* eslint-disable react/no-multi-comp */

import React from 'react';
import ReactPaginate from 'react-paginate';
import ObjectEditor from './ObjectEditor';
import {has, once} from 'lodash';
import {gettext} from 'core/utils';
import {ISortOption, IVocabularyItem} from 'superdesk-api';
import {assertNever} from 'core/helpers/typescript-helpers';
import {Dropdown} from 'core/ui/components';
import {Checkbox} from 'superdesk-ui-framework';

interface ISchemaField {
    key: string;
    label?: string;
    type?: 'object' | string;
}

interface IProps {
    items: Array<IVocabularyItem>;
    schemaFields: Array<ISchemaField>;
    newItemTemplate: any;
    setDirty(): void;
}

interface IState {
    items: Array<IVocabularyItem>;
    itemsSorted: Array<IVocabularyItem>;
    itemsValidation: Array<{[key: string]: any}>;
    page: number;
    searchTerm: string;
    searchExtended: boolean;
    sortDropdownOpen: boolean;
    sort: ISortOption | null;
}

const pageSize = 50;

function getPageCount(items: Array<IVocabularyItem>) {
    return Math.ceil(items.length / pageSize);
}

function sortItems(items: Array<IVocabularyItem>, sort: ISortOption): Array<IVocabularyItem> {
    return [...items].sort((a, b) => {
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

interface IPropsInputField {
    field: ISchemaField;
    item: IVocabularyItem;
    required: boolean;
    valid: boolean;
    update(item: any, key: string, value: any): void;
    setDirty: IProps['setDirty'];
}

interface IStateInputField {
    value: string;
}

class InputField extends React.Component<IPropsInputField, IStateInputField> {
    setDirtyOnce: () => void;

    constructor(props) {
        super(props);

        const {field, item} = this.props;

        this.state = {
            value: item[field.key] || '',
        };

        this.setDirtyOnce = once(this.props.setDirty);
    }
    componentDidUpdate(prevProps: IPropsInputField, prevState: IStateInputField) {
        if (prevState.value !== this.state.value) {
            this.setDirtyOnce();
        }
    }
    render() {
        const {field, item, required, valid} = this.props;
        const {value} = this.state;
        const disabled = !item.is_active;

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
                    onChange={() => this.props.update(item, field.key, !value)}
                />
            );

        case 'color':
            return (
                <input type="color"
                    value={value}
                    disabled={disabled}
                    onChange={(event) => this.props.update(item, field.key, event.target.value)}
                />
            );

        case 'short':
            return (
                <input type="text"
                    value={value}
                    disabled={disabled}
                    onChange={(event) => {
                        this.setState({value: event.target.value});
                    }}
                    onBlur={() => {
                        this.props.update(item, field.key, value);
                    }}
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
                        className={field.key === 'name' ? 'long-name sd-line-input__input' : 'sd-line-input__input'}
                        onChange={(event) => {
                            this.setState({value: event.target.value});
                        }}
                        onBlur={() => {
                            this.props.update(item, field.key, parseInt(value, 10));
                        }}
                    />
                </div>
            );

        default:
            return (
                <div className={className}>
                    <input type="text"
                        className={field.key === 'name' ? 'long-name sd-line-input__input' : 'sd-line-input__input'}
                        value={value}
                        disabled={disabled}
                        onChange={(event) => {
                            this.setState({value: event.target.value});
                        }}
                        onBlur={() => {
                            this.props.update(item, field.key, value);
                        }}
                    />
                </div>
            );
        }
    }
}

export class VocabularyItemsViewEdit extends React.Component<IProps, IState> {
    static propTypes: any;
    static defaultProps: any;
    getIndex: (item: IVocabularyItem) => number;
    sortFields: Array<string>;

    constructor(props) {
        super(props);

        this.getIndex = (item) => this.state.items.indexOf(item);

        this.sortFields = Object.keys(this.props.items[0]);

        const initialSortOption: ISortOption = {
            field: this.sortFields.includes('name') ? 'name' : this.sortFields[0],
            direction: 'ascending',
        };

        this.state = {
            items: this.props.items,
            itemsSorted: sortItems(this.props.items, initialSortOption),
            itemsValidation: [],
            page: 1,
            searchTerm: '',
            searchExtended: false,
            sortDropdownOpen: false,
            sort: initialSortOption,
        };

        this.updateItem = this.updateItem.bind(this);
        this.removeItem = this.removeItem.bind(this);
        this.addItem = this.addItem.bind(this);
        this.getItemsForSaving = this.getItemsForSaving.bind(this);
    }

    private updateItem(item: any, key: string, value: any) {
        this.setState({
            items: this.state.items.map((_item) => {
                if (item === _item) {
                    return {..._item, [key]: value};
                } else {
                    return _item;
                }
            }),
        });
    }

    private removeItem(item: any) {
        this.setState({
            items: this.state.items.filter((_item) => _item !== item),
        });
    }

    private addItem() {
        this.setState({
            items: [{...this.props.newItemTemplate}].concat(this.state.items),
        });
    }

    // tslint:disable-next-line: member-access
    public getItemsForSaving(): Array<IVocabularyItem> { // will be used from a ref
        return this.state.items;
    }

    componentDidUpdate(prevProps: IProps, prevState: IState) {
        const sortOptionChanged = prevState.sort !== this.state.sort;

        const itemCountChanged =
            this.state.items.length !== this.state.itemsSorted.length; // when adding an item for example

        if (sortOptionChanged || itemCountChanged) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                itemsSorted: sortItems(this.state.items, this.state.sort),
            });
        }
    }

    render() {
        const takeFrom = (this.state.page - 1) * pageSize;
        const takeTo = this.state.page * pageSize;
        const filteredItems = this.state.searchTerm.length < 1
            ? this.state.itemsSorted
            : this.state.itemsSorted.filter((item) => {
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
                                this.addItem();

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
                                                        update={this.updateItem}
                                                        setDirty={this.props.setDirty}
                                                    />
                                                </td>
                                            );
                                        })}
                                        <td>
                                            <span className="vocabularyStatus">
                                                <input type="checkbox"
                                                    checked={!!item.is_active}
                                                    onChange={
                                                        () => this.updateItem(item, 'is_active', !item.is_active)
                                                    }
                                                />
                                            </span>
                                        </td>
                                        <td>
                                            <button className="icn-btn"
                                                onClick={() => {
                                                    this.removeItem(item);
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
