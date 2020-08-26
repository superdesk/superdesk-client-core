/* eslint-disable react/no-multi-comp */

import React from 'react';
import {IMonitoringFilter, IDesk} from 'superdesk-api';
import {extensions} from 'appConfig';
import {flattenDeep, get} from 'lodash';
import {dataApiByEntity} from 'core/helpers/CrudManager';
import {Badge, Button} from 'superdesk-ui-framework/react';

interface IProps {
    deskId: IDesk['_id'];
    isFilterActive(button: IMonitoringFilter): boolean;
    toggleFilter(button: IMonitoringFilter): void;
    setFilter(button: IMonitoringFilter): void;
    addResourceUpdatedEventListener: any;

    // `activeFilters` isn't meant to be read
    // it's only required so angular re-renders the component when filters change
    activeFilters: never;
}

interface IState {
    matchingItemsCount?: number;
    currentItems?: {[key: string]: {[key: string]: any}};
}

interface IPropsFilterButton extends IProps {
    button: IMonitoringFilter;
}

class FilterButton extends React.PureComponent<IPropsFilterButton, IState> {
    getFilters: () => {[key: string]: any};

    constructor(props: IPropsFilterButton) {
        super(props);

        this.state = {};

        this.getFilters = () => ({'task.desk': [this.props.deskId], ...this.props.button.query});

        this.fetchItems = this.fetchItems.bind(this);
    }
    fetchItems() {
        const filters = this.getFilters();

        if (Object.keys(this.state).length > 0) {
            this.setState({matchingItemsCount: undefined, currentItems: undefined});
        }

        dataApiByEntity.article.query({
            page: {from: 0, size: 200},
            sort: [{'_updated': 'desc'}],
            filterValues: filters,
            aggregations: false,
        }).then((res) => {
            this.setState({
                matchingItemsCount: res._meta.total,
                currentItems: res._items.reduce((accumulator, item) => {
                    accumulator[item._id] = {};

                    Object.keys(filters).forEach((key) => {
                        accumulator[item._id][key] = get(item, key); // using lodash.get to support multi-level keys
                    });

                    return accumulator;
                }, {}),
            });
        });
    }
    componentDidMount() {
        this.fetchItems();

        this.props.addResourceUpdatedEventListener((data) => {
            if (
                (data.resource === 'archive' || data.resource === 'archive_publish')
                && Object.keys(this.getFilters()).some((key) => data.fields[key] != null)
            ) {
                this.fetchItems();
            }
        });

        const {button} = this.props;
        const active = this.props.isFilterActive(button);

        if (active) {
            // Filters depend on a selected desk.
            // Run filters again to ensure that the latest filtering data is being applied.

            // After switching a desk, this component is reloaded, but the variable holding
            // custom filters doesn't refresh automatically.
            this.props.setFilter(button);
        }
    }
    render() {
        if (this.state.matchingItemsCount == null) {
            return null;
        }

        const {button} = this.props;
        const active = this.props.isFilterActive(button);

        return (
            <Badge
                key={button.label}
                text={this.state.matchingItemsCount.toString()}
                data-test-id={'monitoring-filtering-item--' + button.label}
            >
                <Button
                    text={button.label}
                    type={active ? 'primary' : 'default'}
                    style={active ? 'filled' : 'hollow'}
                    size="small"
                    onClick={() => {
                        this.props.toggleFilter(button);
                    }}
                    data-test-id="toggle-button"
                />
            </Badge>
        );
    }
}

class MonitoringFilteringButtonsComponent extends React.PureComponent<IProps, {buttons?: Array<IMonitoringFilter>}> {
    constructor(props: IProps) {
        super(props);

        this.state = {};
    }
    componentDidMount() {
        Promise.all(
            Object.values(extensions)
                .map(
                    (extension) =>
                        extension.activationResult?.contributions?.monitoring?.getFilteringButtons?.(this.props.deskId),
                )
                .filter((p) => p != null),
        ).then((res) => {
            this.setState({buttons: flattenDeep(res)});
        });
    }
    render() {
        if (this.state.buttons == null) {
            return null;
        }

        return (
            <div>
                {this.state.buttons.map((button) => (
                    <FilterButton
                        key={button.label}
                        button={button}
                        {...this.props}
                    />
                ))}
            </div>
        );
    }
}

export class MonitoringFilteringButtons extends React.PureComponent<IProps> {
    render() {
        return (
            <MonitoringFilteringButtonsComponent
                {...this.props}
                key={this.props.deskId} // re-mount when deskId changes
            />
        );
    }
}
