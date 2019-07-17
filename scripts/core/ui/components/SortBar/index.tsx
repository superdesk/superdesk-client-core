import React from 'react';
import {ISortOption} from 'superdesk-api';

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
                <div className="dropdown dropdown--hover" style={{verticalAlign: 'middle'}}>
                    <button className="dropdown__toggle" data-test-id="sortbar--selected">
                        {currentSortOption.label}
                        <span className="dropdown__caret" />
                    </button>
                    <ul className="dropdown__menu dropdown--align-right" >
                        {
                            this.props.sortOptions.map((option, i) => (
                                <li key={i}>
                                    <button
                                        onClick={() => this.props.onSortOptionChange({
                                            field: option.field,
                                            direction: 'ascending',
                                        })}
                                        data-test-id="sortbar--option"
                                    >
                                        {option.label}
                                    </button>
                                </li>
                            ))
                        }
                    </ul>
                </div>

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
