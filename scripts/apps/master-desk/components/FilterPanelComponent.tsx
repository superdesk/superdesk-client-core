import React from 'react';
import {gettext} from 'core/utils';
import {Button, ButtonGroup} from 'superdesk-ui-framework/react';

interface IProps {
    open: boolean;
    onDeskFilterChange(desk: string): void;
    onFilterChange(filters: object): void;
    filters: IFilter;
}

interface IState {
    desk: string;
    filter: IFilter;
}

export interface IFilter {
    slugline?: Array<string>;
    headline?: Array<string>;
    byline?: Array<string>;
}

export class FilterPanelComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            desk: '',
            filter: {
                slugline: props.filters.slugline || [],
                headline: props.filters.headline || [],
                byline: props.filters.byline || [],
            },
        };

        this.handleDeskChange = this.handleDeskChange.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.addFilter = this.addFilter.bind(this);
        this.clearDeskFilter = this.clearDeskFilter.bind(this);
        this.clearFilters = this.clearFilters.bind(this);
    }

    handleDeskChange(event) {
        this.setState({desk: event.target.value});

        this.props.onDeskFilterChange(event.target.value);
    }

    handleInputChange(event) {
        let filter = {
            slugline: this.state.filter.slugline,
            headline: this.state.filter.headline,
            byline: this.state.filter.byline,
        };

        filter[event.target.name] = [event.target.value];

        this.setState({filter: filter});
    }

    addFilter() {
        let filter = {
            slugline: this.state.filter.slugline,
            headline: this.state.filter.headline,
            byline: this.state.filter.byline,
        };

        this.setState({filter: filter});

        this.props.onFilterChange(filter);
    }

    clearDeskFilter() {
        this.setState({desk: ''});
        this.props.onDeskFilterChange('');
    }

    clearFilters() {
        const filter = {
            slugline: [],
            headline: [],
            byline: [],
        };

        this.setState({filter: filter});

        this.props.onFilterChange({});
    }

    render() {
        const showClearFiltersButton = Object.keys(this.props.filters)
            .some((key) => this.props.filters[key].length !== 0);

        return (
            <div className={'sd-main-content-grid__filter' + (this.props.open ? ' open-filters' : '')}>
                <div className="side-panel__container side-panel__container--small">
                    <div className="side-panel side-panel--shadow-left side-panel--bg-00">
                        <div className="side-panel__header side-panel__header--border-b">
                            <h3 className="side-panel__heading">Filters</h3>
                        </div>
                        <div className="side-panel__content">
                            <div className="side-panel__content-block">
                                <div className="form__group">
                                    <div className="form__item">
                                        <div className="sd-inset-search">
                                            <input
                                                className="sd-inset-search__input"
                                                type="text"
                                                placeholder="Search desk"
                                                value={this.state.desk}
                                                onChange={this.handleDeskChange}
                                            />
                                            <button
                                                className="sd-inset-search__cancel"
                                                onClick={() => this.clearDeskFilter()}
                                            >
                                                <i className="icon-remove-sign" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="form__group">
                                    <div className="form__item">
                                        <div className="sd-input">
                                            <label className="sd-input__label">{gettext('Slugline')}</label>
                                            <input
                                                className="sd-input__input"
                                                name="slugline"
                                                type="text"
                                                value={this.state.filter.slugline}
                                                onChange={this.handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form__group">
                                    <div className="form__item">
                                        <div className="sd-input">
                                            <label className="sd-input__label">{gettext('Headline')}</label>
                                            <input
                                                className="sd-input__input"
                                                name="headline"
                                                type="text"
                                                value={this.state.filter.headline}
                                                onChange={this.handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form__group">
                                    <div className="form__item">
                                        <div className="sd-input">
                                            <label className="sd-input__label">{gettext('Byline')}</label>
                                            <input
                                                className="sd-input__input"
                                                name="byline"
                                                type="text"
                                                value={this.state.filter.byline}
                                                onChange={this.handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="side-panel__footer side-panel__footer--button-box">
                            <ButtonGroup orientation="vertical">
                                <Button type="primary" onClick={this.addFilter} text={gettext('Apply Filters')} />

                                {
                                    showClearFiltersButton &&
                                    (
                                        <Button
                                            onClick={this.clearFilters}
                                            text={gettext('Clear Filters')}
                                        />
                                    )
                                }
                            </ButtonGroup>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
