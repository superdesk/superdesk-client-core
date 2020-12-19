import React from 'react';

import {ItemUrgency, TypeIcon} from 'apps/search/components';
import {TimeElem} from 'apps/search/components/TimeElem';

import {IDesk, IStage} from 'superdesk-api';
import {gettext} from 'core/utils';
import {dataApi} from 'core/helpers/CrudManager';

import {CardComponent} from './CardComponent';
import {CardListComponent} from './CardListComponent';

interface IProps {
    desks: Array<IDesk>;
    stages: Array<IStage>;
    deskFilter: string;
    filters: object;
    onFilterChange(filters: any): void;
}

interface IState {
    stagesCount: Array<any>;
    filteredDesks: Array<IDesk>;
    view: 'card' | 'list';
}

export class OverviewComponent extends React.Component<IProps, IState> {
    private hashColors: Array<string> = ['#FF9800', '#028AC7', '#E91E63', '#4CAF50',
        '#607D8B', '#B09E00', '#00BBD4', '#9C27B0', '#B6C423', '#006A78', '#009688', '#402471'];

    constructor(props) {
        super(props);

        this.state = {
            stagesCount: null,
            filteredDesks: [],
            view: 'card',
        };
    }

    componentDidMount() {
        dataApi.query('desks/all/overview/stages', 1, {field: '_id', direction: 'ascending'}, {})
            .then((res) => this.setState({
                stagesCount: res._items,
                filteredDesks: this.props.desks,
            }));
    }

    componentDidUpdate(prevProps: IProps) {
        const hasFilters = Object.keys(this.props.filters).some((item: any) =>
            this.props.filters[item] && this.props.filters[item].length);

        if (hasFilters) {
            if (this.props.filters === prevProps.filters) {
                return;
            }

            dataApi.create('desks/all/overview/stages', {
                filters: this.props.filters,
            }).then((res) => {
                this.setState({stagesCount: res['_items'], view: 'list'});
            });
        } else if (this.state.view === 'list') {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({view: 'card'});
        }

        // Filter items by desk name
        if (this.props.deskFilter !== prevProps.deskFilter) {
            let desks = this.props.desks;

            this.props.deskFilter ?
                desks = desks.filter((item) =>
                    item.name.toLowerCase().indexOf(
                        this.props.deskFilter.toLowerCase(),
                    ) !== -1) :
                desks = this.props.desks;

            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({filteredDesks: desks});
        }

        if (this.props.desks !== prevProps.desks) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({filteredDesks: this.props.desks});
        }
    }

    componentWillUnmount() {
        this.props.onFilterChange([]);
    }

    getDeskTotal(desk: IDesk) {
        let totalItemsInDesk = 0;

        (this.props.stages?.[desk._id] ?? []).map((item: IStage) => totalItemsInDesk += this.getStageTotal(item));

        return totalItemsInDesk;
    }

    getStageTotal(stage: IStage) {
        if (!this.state.stagesCount) {
            return 0;
        }

        let findStage = this.state.stagesCount.find((count) => count.stage === stage._id);

        return findStage ? findStage.count : 0;
    }

    getStageItems(stage: IStage) {
        if (!this.state.stagesCount) {
            return 0;
        }

        let findStage = this.state.stagesCount.find((count) => count.stage === stage._id);

        return findStage ? findStage.docs : [];
    }

    getDonutData(desk: IDesk) {
        let labels = [];
        let dataSet = {
            data: [],
            backgroundColor: [],
        };

        (this.props.stages?.[desk._id] ?? []).map((item: IStage, i: number) => {
            labels.push(item.name);
            dataSet.data.push(this.getStageTotal(item));
            dataSet.backgroundColor.push(this.hashColors[i]);

            return dataSet;
        });

        return {
            labels: labels,
            datasets: [dataSet],
        };
    }

    render() {
        return (
            this.state.view === 'list' ? (
                <div className="sd-kanban-list sd-pdding-x--2 sd-padding-t--2">
                    {this.state.filteredDesks.map((desk, index) =>
                        this.getDeskTotal(desk) > 0 ? (
                            <div className="sd-board" key={index}>
                                <div className="sd-board__header">
                                    <h3 className="sd-board__header-title">{desk.name}</h3>
                                </div>
                                <div className="sd-board__content sd-padding-t--1">
                                    {(this.props.stages?.[desk._id] ?? []).map((stage) => (
                                        this.getStageItems(stage).length ? (
                                            <React.Fragment key={stage._id}>
                                                <div className="sd-board__subheader">
                                                    <h5 className="sd-board__subheader-title">{stage.name}</h5>
                                                </div>
                                                <ul className="sd-list-item-group sd-shadow--z2 inline-content-items">
                                                    {this.getStageItems(stage).map((item, key) => (
                                                        <li className="content-item" key={key}>
                                                            <div className="content-item__type">
                                                                <TypeIcon
                                                                    type={item.type}
                                                                    highlight={item.highlight}
                                                                />
                                                            </div>
                                                            <div className="content-item__urgency-field">
                                                                <ItemUrgency item={item} />
                                                            </div>
                                                            <div className="content-item__text">
                                                                <span className="keywords">{item.slugline}</span>
                                                                <span id="title" className="headline">
                                                                    {item.headline}
                                                                </span>
                                                            </div>
                                                            <div className="content-item__date">
                                                                <TimeElem date={item.versioncreated} />
                                                            </div>
                                                        </li>
                                                    ),
                                                    )}
                                                </ul>
                                            </React.Fragment>
                                        ) : null
                                    ))}
                                </div>
                            </div>
                        ) : null,
                    )}
                </div>
            ) : (
                <div className="sd-grid-list sd-grid-list--medium sd-grid-list--gap-xl sd-margin-x--5">
                    {this.state.filteredDesks.map((desk, index) => (
                        <CardComponent
                            key={index}
                            desk={desk}
                            total={this.getDeskTotal(desk)}
                            donutData={this.getDonutData(desk)}
                            label={gettext('items in production')}
                        >
                            {
                                (this.props.stages?.[desk._id] ?? []).map((item, i) => (
                                    <CardListComponent
                                        key={i}
                                        name={item.name}
                                        color={this.hashColors[i]}
                                        total={this.getStageTotal(item)}
                                    />
                                ))
                            }
                        </CardComponent>
                    ))}
                </div>
            )
        );
    }
}
