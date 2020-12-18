import {gettext} from 'core/utils';
import React from 'react';

interface IProps {
    filters: boolean;
    onFilterChange(filters: any): void;
}

export class FilterBarComponent extends React.Component<IProps, {}> {
    removeFilter(item: any): void {
        let filter = this.props.filters;

        filter[item] = [];
        this.props.onFilterChange(filter);
    }

    clearFilters(): void {
        this.props.onFilterChange([]);
    }

    checkIfIsNotEmpty(): boolean {
        let isNotEmpty = false;

        isNotEmpty = Object.keys(this.props.filters).some((item: any) =>
            this.props.filters[item] && this.props.filters[item].length);

        return isNotEmpty;
    }

    render() {
        return (
            this.checkIfIsNotEmpty() ? (
                <div className="sd-main-content-grid__content-filter-bar sd-search-tags__bar">
                    <ul className="sd-search-tags__tag-list">
                        {Object.keys(this.props.filters).map((item: any, index) =>
                            this.props.filters[item] && this.props.filters[item].length ? (
                                <li className="sd-search-tags__tag tag-label tag-label--highlight1" key={index}>
                                    {item}: ({this.props.filters[item]})
                                    <button className="tag-label__remove" onClick={() => this.removeFilter(item)}>
                                        <i className="icon-close-small" /></button>
                                </li>
                            ) : null,
                        )}
                    </ul>
                    <a className="text-link sd-margin-l--auto" onClick={() => this.clearFilters()}>
                        {gettext('Clear all filters')}
                    </a>
                </div>
            ) : null
        );
    }
}
