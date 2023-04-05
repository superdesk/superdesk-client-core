import {gettext} from 'core/utils';
import React from 'react';

import {IFilter} from './FilterPanelComponent';

interface IProps {
    filters: IFilter;
    removeFilter(id: string): void;
    removeAllFilters(): void;
}

export class FilterBarComponent extends React.Component<IProps, {}> {
    checkIfIsNotEmpty(): boolean {
        return Object.keys(this.props.filters).some((item: any) =>
            this.props.filters[item] && this.props.filters[item].length);
    }

    render() {
        return (
            this.checkIfIsNotEmpty() ? (
                <div className="sd-main-content-grid__content-filter-bar sd-search-tags__bar">
                    <ul className="sd-search-tags__tag-list">
                        {Object.keys(this.props.filters).map((item) =>
                            this.props.filters[item] && this.props.filters[item].length ? (
                                <li className="sd-search-tags__tag tag-label tag-label--highlight1" key={item}>
                                    {item}: ({this.props.filters[item]})
                                    <button className="tag-label__remove" onClick={() => this.props.removeFilter(item)}>
                                        <i className="icon-close-small" /></button>
                                </li>
                            ) : null,
                        )}
                    </ul>
                    <a className="text-link sd-margin-start--auto" onClick={() => this.props.removeAllFilters()}>
                        {gettext('Clear all filters')}
                    </a>
                </div>
            ) : null
        );
    }
}
