import React from 'react';

import {ItemUrgency, TypeIcon} from 'apps/search/components';
import {TimeElem} from 'apps/search/components/TimeElem';

import {IDesk, IStage} from 'superdesk-api';
import {gettext} from 'core/utils';
import {dataApi} from 'core/helpers/CrudManager';
import {IMasterDeskViews} from '../MasterDesk';

import {CardComponent} from './CardComponent';
import {CardListComponent} from './CardListComponent';

interface IProps {
    desks: Array<IDesk>;
    stages: Array<IStage>;
    deskFilter: string;
    filters: object;
    currentView: IMasterDeskViews;
    onViewChange(newView: any): void;
    onFilterChange(filters: any): void;
}

interface IState {
    stagesCount: Array<any>;
    filteredDesks: Array<IDesk>;
    selectedDesk: IDesk;
    view: IMasterDeskViews;
}

export class OverviewComponent extends React.Component<IProps, IState> {
    private hashColors: Array<string> = ['#FF9800', '#028AC7', '#E91E63', '#4CAF50',
        '#607D8B', '#B09E00', '#00BBD4', '#9C27B0', '#B6C423', '#006A78', '#009688', '#402471'];

    constructor(props) {
        super(props);

        this.state = {
            stagesCount: null,
            filteredDesks: [],
            selectedDesk: null,
            view: IMasterDeskViews.card,
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
        const hasFilters = this.hasFilters();

        if (this.props.currentView !== prevProps.currentView) {
            if (this.props.currentView === prevProps.currentView) {
                return;
            }

            if (this.props.currentView === IMasterDeskViews.card) {
                this.props.onFilterChange([]);
                this.componentDidMount();
            }

            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({view: this.props.currentView});
        }

        if (hasFilters) {
            if (this.props.filters === prevProps.filters) {
                return;
            }

            dataApi.create('desks/all/overview/stages', {
                filters: this.props.filters,
            }).then((res) => {
                this.setState({stagesCount: res['_items']});

                if (this.props.currentView === IMasterDeskViews.card) {
                    this.setView(IMasterDeskViews.detailed);
                }
            });
        } else if (this.state.view === IMasterDeskViews.detailed) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setView(IMasterDeskViews.card);
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

    setView(view: IMasterDeskViews) {
        this.setState({view});
        this.props.onViewChange(view);
    }

    hasFilters() {
        return Object.keys(this.props.filters).some((item: any) =>
            this.props.filters[item] && this.props.filters[item].length);
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

    getSingleDesk(desk: IDesk) {
        dataApi.create(`desks/${desk._id}/overview/stages`, {
            filters: this.hasFilters() ?
                this.props.filters : {'slugline': []},
        }).then((res) => {
            this.setState({
                selectedDesk: desk,
                stagesCount: res['_items'],
            });

            this.setView(IMasterDeskViews.singleView);
        });
    }

    listStageItems(stage: IStage) {
        return (
            this.getStageItems(stage).map((item, key) => (
                <li className="content-item" key={key}>
                    <div className="content-item__type">
                        <TypeIcon
                            type={item.type}
                            highlight={item.highlight}
                        />
                    </div>
                    <div className="content-item__urgency-field">
                        <ItemUrgency
                            urgency={item.urgency}
                            language={item.language}
                        />
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
            ))
        );
    }

    render() {
        if (this.state.view === IMasterDeskViews.detailed) {
            return (
                <div className="sd-kanban-list sd-padding-x--2 sd-padding-t--2">
                    {this.state.filteredDesks.map((desk, index) =>
                        this.getDeskTotal(desk) > 0 ? (
                            <div className="sd-board" key={index}>
                                <div
                                    className="sd-board__header sd-board__header--clickable"
                                    onClick={() => this.getSingleDesk(desk)}
                                >
                                    <h3 className="sd-board__header-title">{desk.name}</h3>
                                </div>
                                <div className="sd-board__content sd-padding-t--1">
                                    {(this.props.stages?.[desk._id] ?? []).map((stage) => (
                                        <React.Fragment key={stage._id}>
                                            <div className="sd-board__subheader">
                                                <h5 className="sd-board__subheader-title">{stage.name}</h5>
                                            </div>
                                            <ul className="sd-list-item-group sd-shadow--z2 inline-content-items">
                                                {this.listStageItems(stage)}
                                            </ul>
                                        </React.Fragment>
                                    ),
                                    )}
                                </div>
                            </div>
                        ) : null,
                    )}
                </div>
            );
        } else if (this.state.view === 'single-view') {
            return (
                <div className="sd-kanban-list sd-padding-x--2 sd-padding-t--2">
                    {(this.props.stages?.[this.state.selectedDesk._id] ?? []).map((stage, index) =>
                        this.getStageTotal(stage) > 0 ? (
                            <div className="sd-board" key={index}>
                                <div className="sd-board__header">
                                    <h3 className="sd-board__header-title">{stage.name}</h3>
                                </div>
                                <div className="sd-board__content sd-padding-t--1">
                                    <ul className="sd-list-item-group sd-shadow--z2 inline-content-items">
                                        {this.listStageItems(stage)}
                                    </ul>
                                </div>
                            </div>
                        ) : null,
                    )}
                </div>
            );
        } else {
            return (
                <div className="sd-grid-list sd-grid-list--medium sd-grid-list--gap-xl sd-margin-x--5">
                    {this.state.filteredDesks.map((desk, index) => (
                        <CardComponent
                            key={index}
                            desk={desk}
                            total={this.getDeskTotal(desk)}
                            donutData={this.getDonutData(desk)}
                            label={gettext('items in production')}
                            onDeskSelect={(singleDesk) => this.getSingleDesk(singleDesk)}
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
            );
        }
    }
}
