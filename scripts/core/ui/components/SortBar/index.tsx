import React from "react";

interface IProps {
    sortOptions: Array<{id: string; label: string}>;
    selectedSortOptionId: string;
    direction: 'ascending' | 'descending';
    itemsCount: number;
    onSortOptionChange(id: string): void;
    onSortDirectionChange(nextDirection: IProps['direction']): void;
}

export class SortBar extends React.Component<IProps, any> {
    render() {
        const currentSortOption = this.props.sortOptions.find(
            (option) => option.id === this.props.selectedSortOptionId,
        );

        return (
            <div className="sortbar">
                <span>{gettext('Total:')}</span>
                {' '}
                <span className="label-total">{this.props.itemsCount}</span>
                {' '}
                <div className="dropdown dropdown--hover">
                    <button className="dropdown__toggle">
                        {currentSortOption.label}
                        <span className="dropdown__caret" />
                    </button>
                    <ul className="dropdown__menu dropdown--align-right" >
                        {
                            this.props.sortOptions.map((option, i) => (
                                <li key={i}>
                                    <button
                                        onClick={() => this.props.onSortOptionChange(option.id)}
                                    >
                                        {option.label}
                                    </button>
                                </li>
                            ))
                        }
                    </ul>
                </div>

                {
                    this.props.direction === 'ascending'
                        ? (
                            <button
                                onClick={() => this.props.onSortDirectionChange('ascending')}
                                className="icn-btn direction"
                                title={gettext('Ascending')}
                            >
                                <i className="icon-ascending" />
                            </button>
                        )
                        : (
                            <button
                                onClick={() => this.props.onSortDirectionChange('descending')}
                                className="icn-btn direction"
                                title={gettext('Descending')}
                            >
                                <i className="icon-descending" />
                            </button>
                        )
                }
            </div>
        );
    }
}
