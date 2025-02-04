import React from 'react';

import {IDataProvider, IDataRequestParams, IDesk, IStage} from 'superdesk-api';
import {gettext} from 'core/utils';
import {dataApi} from 'core/helpers/CrudManager';
import {IMasterDeskViews} from '../MasterDesk';

import {CardComponent} from './CardComponent';
import {CardListComponent} from './CardListComponent';
import {assertNever} from 'core/helpers/typescript-helpers';
import {ListItemsComponent} from './ListItemsComponent';
import {IFilter} from './FilterPanelComponent';

interface IProps {
    desks: Array<IDesk>;
    stages: Array<IStage>;
    deskFilter: string;
    filters: object;
    selectedDesk: IDesk;
    onFilterChange(filters: IFilter): void;
    onDeskChange(desk: IDesk): void;
}

interface IState {
    stagesCount: Array<any>;
    view: IMasterDeskViews;
}

export class OverviewComponent extends React.Component<IProps, IState> {
    private hashColors: Array<string> = ['#FF9800', '#028AC7', '#E91E63', '#4CAF50',
        '#607D8B', '#B09E00', '#00BBD4', '#9C27B0', '#B6C423', '#006A78', '#009688', '#402471'];

    private data: IDataProvider;

    constructor(props) {
        super(props);

        this.queryFactory = this.queryFactory.bind(this);

        this.state = {
            stagesCount: [],
            view: IMasterDeskViews.card,
        };
    }

    componentDidMount() {
        this.data = dataApi.createProvider(
            this.queryFactory,
            (res) => {
                if (this.data == null) {
                    return;
                }

                // eslint-disable-next-line react/no-did-update-set-state
                this.setState({stagesCount: res['_items']});
            },
            {
                archive: {
                    create: true,
                    update: [
                        'state',
                        'task.desk',
                        'task.stage',
                        'slugline',
                        'headline',
                        'priority',
                        'urgency',
                        'versioncreated',
                    ],
                },
            },
        );
    }

    queryFactory() {
        const query: IDataRequestParams = {
            method: 'POST',
            endpoint: 'desks/all/overview/stages',
            data: {filters: this.props.filters},
            params: {},
        };

        if (this.props.selectedDesk != null) {
            query.endpoint = `desks/${this.props.selectedDesk._id}/overview/stages`;
            query.params = {with_docs: 1};
        }

        return query;
    }

    componentDidUpdate(prevProps: IProps) {
        const shouldUpdate = (
            this.props.filters !== prevProps.filters ||
            this.props.selectedDesk !== prevProps.selectedDesk
        );

        if (shouldUpdate) {
            this.data.update();
        }
    }

    componentWillUnmount() {
        this.data.stop();
        this.data = null;
        this.props.onFilterChange({});
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
            return [];
        }

        let findStage = this.state.stagesCount.find((count) => count.stage === stage._id);

        return findStage?.docs ?? [];
    }

    getDonutData(desk: IDesk) {
        let labels = [];
        let dataSet = {
            data: [],
            backgroundColor: [],
            borderColor: 'transparent',
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
        if (this.props.selectedDesk != null) {
            return (
                <div className="sd-kanban-list sd-padding-x--2 sd-padding-t--2">
                    {(this.props.stages?.[this.props.selectedDesk._id] ?? []).map((stage, index) => (
                        <div className="sd-board" key={index}>
                            <div className="sd-board__header">
                                <h3 className="sd-board__header-title">{stage.name}</h3>
                                <span className="stage-header__number label-total">{this.getStageTotal(stage)}</span>
                            </div>
                            <div className="sd-board__content sd-padding-t--1">
                                <ul className="sd-list-item-group sd-shadow--z2 inline-content-items">
                                    <ListItemsComponent
                                        items={this.getStageItems(stage)}
                                        total={this.getStageTotal(stage)}
                                    />
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        const desks = this.props.desks.filter(
            (desk) => this.props.deskFilter == null || desk.name.toLowerCase().includes(this.props.deskFilter),
        );

        switch (this.state.view) {
        case IMasterDeskViews.detailed:
            return (
                <div className="sd-kanban-list sd-padding-x--2 sd-padding-t--2">
                    {desks.map((desk, index) =>
                        this.getDeskTotal(desk) > 0 ? (
                            <div className="sd-board" key={desk._id}>
                                <a
                                    className="sd-board__header sd-board__header--clickable"
                                    onClick={() => this.props.onDeskChange(desk)}
                                >
                                    <h3 className="sd-board__header-title">{desk.name}</h3>
                                </a>
                                <div className="sd-board__content sd-padding-t--1">
                                    {(this.props.stages?.[desk._id] ?? []).map((stage) => (
                                        <React.Fragment key={stage._id}>
                                            <div className="sd-board__subheader">
                                                <h5 className="sd-board__subheader-title">{stage.name}</h5>
                                            </div>
                                            <ul className="sd-list-item-group sd-shadow--z2 inline-content-items">
                                                <ListItemsComponent
                                                    items={this.getStageItems(stage)}
                                                    total={this.getStageTotal(stage)}
                                                />
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

        case IMasterDeskViews.card:
            return (
                <div className="sd-grid-list sd-grid-list--medium sd-grid-list--gap-xl sd-margin-x--5">
                    {desks.map((desk, index) => (
                        <CardComponent
                            key={desk._id}
                            desk={desk}
                            total={this.getDeskTotal(desk)}
                            donutData={this.getDonutData(desk)}
                            label={gettext('items in production')}
                            onDeskSelect={(singleDesk) => this.props.onDeskChange(singleDesk)}
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

        case IMasterDeskViews.singleView:
            // handled before, but required for assertNever
            return null;

        default:
            return assertNever(this.state.view);
        }
    }
}
