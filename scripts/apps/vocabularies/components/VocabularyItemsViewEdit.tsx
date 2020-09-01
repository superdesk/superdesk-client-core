/* eslint-disable react/no-multi-comp */

import React from 'react';
import ReactPaginate from 'react-paginate';
import ObjectEditor from './ObjectEditor';
import {once, debounce} from 'lodash';
import {gettext} from 'core/utils';
import {ISortOption, IVocabularyItem} from 'superdesk-api';
import {assertNever} from 'core/helpers/typescript-helpers';
import {Dropdown} from 'core/ui/components/Dropdown/Dropdown';
import {Menu} from 'core/ui/components/Dropdown/Menu';
import {dataApi} from 'core/helpers/CrudManager';
import {ILanguage} from 'superdesk-interfaces/Language';
import {ManageVocabularyItemTranslations} from '../ManageVocabularyItemTranslations';

interface ISchemaField {
    key: string;
    label?: string;
    type?: 'object' | string;
    required?: boolean;
}

interface IVocabularyItemWithId extends IVocabularyItem {
    id: string;
}

const pageSize = 50;

function getPageCount(items: Array<IVocabularyItemWithId>) {
    return Math.ceil(items.length / pageSize);
}

function sortItems(items: Array<IVocabularyItemWithId>, sort: ISortOption): Array<IVocabularyItemWithId> {
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
    item: IVocabularyItemWithId;
    required: boolean;
    update(item: any, key: string, value: any): void;
}

function isItemFieldValid(item: IVocabularyItemWithId, field: ISchemaField): boolean {
    if (!field.required) {
        return true;
    } else if (typeof item[field.key] === 'string') {
        return item[field.key].length > 0;
    } else {
        return item[field.key] != null;
    }
}

function containsInvalidItems(items: Array<IVocabularyItemWithId>, schemaFields: Array<ISchemaField>): boolean {
    return items.some((item) => {
        return schemaFields.some((field) => {
            const valid = isItemFieldValid(item, field);

            return !valid;
        });
    });
}

class InputField extends React.PureComponent<IPropsInputField> {
    render() {
        const {field, item, required} = this.props;
        const value = item[field.key] || '';
        const disabled = !item.is_active;

        let className = 'sd-line-input sd-line-input--no-margin sd-line-input--no-label sd-line-input--boxed';

        if (required) {
            className += ' sd-line-input--required';
        }
        if (!isItemFieldValid(item, field)) {
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
                        this.props.update(item, field.key, event.target.value);
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
                            this.props.update(item, field.key, parseInt(event.target.value, 10));
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
                            this.props.update(item, field.key, event.target.value);
                        }}
                        data-test-id={'field--' + field.key}
                    />
                </div>
            );
        }
    }
}

interface IProps {
    items: Array<IVocabularyItem>;
    schemaFields: Array<ISchemaField>;
    newItemTemplate: any;
    setDirty(): void;
    setItemsValid(valid: boolean): void;
}

interface IState {
    items: Array<IVocabularyItemWithId>;
    page: number;
    searchTerm: string;
    searchExtended: boolean;
    sortDropdownOpen: boolean;
    sort: ISortOption | null;
    errorMessage: string | null;
    languages: Array<ILanguage> | null;
}

export class VocabularyItemsViewEdit extends React.Component<IProps, IState> {
    static propTypes: any;
    static defaultProps: any;
    sortFields: Array<string>;
    lastId: number;
    generateId: () => string;
    setDirtyOnce: () => void;
    setValidItemsDebounced: () => void;

    constructor(props: IProps) {
        super(props);

        this.sortFields = this.props.schemaFields.map((field) => field.key);
        this.lastId = 0;
        this.generateId = () => (this.lastId++).toString();

        const initialSortOption: ISortOption = {
            field: this.sortFields.includes('name') ? 'name' : this.sortFields[0],
            direction: 'ascending',
        };

        this.state = {
            items: sortItems(
                props.items.map((item) => ({...item, id: this.generateId()})),
                initialSortOption,
            ),
            page: 1,
            searchTerm: '',
            searchExtended: false,
            sortDropdownOpen: false,
            sort: initialSortOption,
            errorMessage: null,
            languages: null,
        };

        this.updateItem = this.updateItem.bind(this);
        this.removeItem = this.removeItem.bind(this);
        this.addItem = this.addItem.bind(this);
        this.getItemsForSaving = this.getItemsForSaving.bind(this);
        this.setErrorMessage = this.setErrorMessage.bind(this);

        this.setDirtyOnce = once(this.props.setDirty);
        this.setValidItemsDebounced = debounce(
            () => {
                this.props.setItemsValid(!containsInvalidItems(this.state.items, this.props.schemaFields));
            },
            200,
        );
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
            items: [{...this.props.newItemTemplate, id: this.generateId()}].concat(this.state.items),
        });
    }

    // tslint:disable-next-line: member-access
    public getItemsForSaving(): Array<IVocabularyItem> { // will be used from a ref
        return this.state.items.map((item) => {
            const nextItem = {...item};

            delete nextItem['id'];

            return nextItem;
        });
    }

    // tslint:disable-next-line: member-access
    public setErrorMessage(message: string | null) {
        this.setState({errorMessage: message});
    }

    componentDidMount() {
        this.setValidItemsDebounced();

        dataApi.query<ILanguage>(
            'languages',
            1,
            {field: 'language', direction: 'ascending'},
            {},
        ).then((res) => {
            this.setState({languages: res._items});
        });
    }

    componentDidUpdate(prevProps: IProps, prevState: IState) {
        const sortOptionChanged = prevState.sort !== this.state.sort;

        if (sortOptionChanged) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                items: sortItems(this.state.items, this.state.sort),
            });
        }

        if (this.state.items !== prevState.items) {
            this.setDirtyOnce();
            this.setValidItemsDebounced();
        }
    }

    render() {
        const {languages} = this.state;

        if (languages == null) {
            return null;
        }

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
                            <Dropdown
                                isOpen={this.state.sortDropdownOpen}
                            >
                                <button className="dropdown__toggle"
                                    onClick={() => this.setState({sortDropdownOpen: !this.state.sortDropdownOpen})}>
                                    {this.state.sort.field}
                                    <span className="dropdown__caret" />
                                </button>
                                <Menu
                                    isOpen={this.state.sortDropdownOpen}
                                >
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
                                </Menu>
                            </Dropdown>
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
                        previousLabel={gettext('prev')}
                        nextLabel={gettext('next')}
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
                    <table data-test-id="vocabulary-items-view-edit">
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
                                    <React.Fragment key={item.id}>
                                        <tr className="no-bottom-border add-border-top">
                                            {this.props.schemaFields.map((field) => {
                                                return (
                                                    <td key={field.key}>
                                                        <InputField
                                                            field={field}
                                                            item={item}
                                                            required={field.required}
                                                            update={this.updateItem}
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
                                                    }}
                                                    data-test-id="remove"
                                                >
                                                    <i className="icon-close-small" />
                                                </button>
                                            </td>
                                        </tr>
                                        <tr className="no-bottom-border">
                                            <td>
                                                <ManageVocabularyItemTranslations
                                                    item={item}
                                                    update={(field, value) => {
                                                        this.updateItem(item, field, value);
                                                    }}
                                                    languages={languages}
                                                />
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>

                    {
                        this.state.errorMessage == null ? null : (
                            <div className="sd-line-input sd-line-input--invalid">
                                <p className="sd-line-input__message">{this.state.errorMessage}</p>
                            </div>
                        )
                    }
                </div>
            </React.Fragment>
        );
    }
}
