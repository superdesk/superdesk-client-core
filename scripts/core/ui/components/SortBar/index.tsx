import React from 'react';
import {ISortOption} from 'superdesk-api';
import {DropdownTree} from '../dropdown-tree';
import {gettext} from 'core/utils';

export interface ISortFields {
    label: string;
    field: string;
}

interface IProps {
    sortOptions: Array<ISortFields>;
    selected: ISortOption;

    itemsCount: number;
    onSortOptionChange(nextSortOption: ISortOption): void;
}

export class SortBar extends React.Component<IProps, any> {
    render() {
        const currentSortOption = this.props.sortOptions.find(
            (option) => option.field === this.props.selected.field,
        );

        return (
            <div className="sortbar" data-test-id="sortbar">
                <span>{gettext('Total:')}</span>
                {' '}
                <span><span className="badge">{this.props.itemsCount}</span></span>
                {' '}
                <DropdownTree
                    getToggleElement={(isOpen, onClick) => (
                        <button
                            onClick={onClick}
                            className="dropdown__toggle"
                            data-test-id="sortbar--selected"
                        >
                            {currentSortOption.label}
                            <span className="dropdown__caret" />
                        </button>
                    )}
                    groups={[{render: () => null, items: this.props.sortOptions}]}
                    renderItem={(key, item, closeDropdown) => (
                        <button
                            key={key}
                            className="sd-dropdown-item"
                            onClick={() => {
                                closeDropdown();
                                this.props.onSortOptionChange({
                                    field: item.field,
                                    direction: 'ascending',
                                });
                            }}
                            data-test-id="sortbar--option"
                        >
                            {item.label}
                        </button>
                    )}
                    wrapperStyles={{paddingTop: 10, paddingBottom: 10}}
                />
                {
                    this.props.selected.direction === 'ascending'
                        ? (
                            <button
                                onClick={() => this.props.onSortOptionChange({
                                    ...this.props.selected, direction: 'descending',
                                })}
                                className="icn-btn direction"
                                title={gettext('Ascending')}
                                data-test-id="sortbar--sort-ascending"
                            >
                                <i className="icon-ascending" />
                            </button>
                        )
                        : (
                            <button
                                onClick={() => this.props.onSortOptionChange({
                                    ...this.props.selected, direction: 'ascending',
                                })}
                                className="icn-btn direction"
                                title={gettext('Descending')}
                                data-test-id="sortbar--sort-descending"
                            >
                                <i className="icon-descending" />
                            </button>
                        )
                }
            </div>
        );
    }
}
