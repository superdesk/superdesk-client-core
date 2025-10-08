import React from 'react';

import {IDataProvider, IDesk, IStage} from 'superdesk-api';
import {gettext} from 'core/utils';
import {dataApi} from 'core/helpers/CrudManager';

import {CardComponent} from './CardComponent';
import {CardListComponent} from './CardListComponent';

interface IDeskExtra extends IDesk {
    data?: any;
}

interface IProps {
    desks: Array<IDesk | IDeskExtra>;
    stages: Array<IStage>;
}

interface IDeskData {
    [deskId: string]: Array<{
        state: string;
        count: number;
    }>;
}

interface IState {
    deskData: IDeskData;
}

interface IAssignmentStage {
    name: string;
    color: string;
    code: string;
    states: Array<string>;
}

export class AssignmentsComponent extends React.Component<IProps, IState> {
    private assignmentStages: Array<IAssignmentStage> = [
        {
            name: gettext('To Do'),
            color: '#c4170b',
            code: 'assigned',
            states: ['assigned', 'submitted'],
        },
        {
            name: gettext('In Progress'),
            color: '#d17d00',
            code: 'in_progress',
            states: ['in_progress'],
        },
        {
            name: gettext('Completed'),
            color: '#74a838',
            code: 'completed',
            states: ['completed', 'cancelled'],
        },
    ];

    private data: IDataProvider;

    constructor(props) {
        super(props);

        this.state = {
            deskData: {},
        };
    }

    componentDidMount() {
        this.data = dataApi.createProvider(
            () => ({
                method: 'POST',
                endpoint: 'desks/all/overview/assignments',
                data: {},
            }),
            (res) => {
                if (this.data == null) {
                    return;
                }

                const deskData: IDeskData = {};

                res._items.forEach((bucket: any) => {
                    deskData[bucket.desk] = bucket.sub.map((sub) => ({
                        state: sub['key'],
                        count: sub['count'],
                    }));
                });

                this.setState({deskData});
            },
            {
                assignments: {create: true, update: true, delete: true},
            },
        );
    }

    componentWillUnmount() {
        this.data.stop();
        this.data = null;
    }

    getDeskOverview(desk: IDesk | IDeskExtra) {
        return new Promise((resolve, reject) =>
            dataApi.query(`desks/${desk._id}/overview/assignments`, 1, {field: '_id', direction: 'ascending'}, {})
                .then((res) => resolve(res), (err) => reject(err)),
        );
    }

    getDeskTotal(desk: IDeskExtra) {
        let total = 0;

        if (this.state.deskData && this.state.deskData[desk._id]) {
            this.state.deskData[desk._id].forEach((item) => {
                let assignment = this.assignmentStages.find((stage) =>
                    stage.states.includes(item.state));

                if (assignment) {
                    total += item ? item.count : 0;
                }
            });
        }

        return total;
    }

    getStageTotal(desk: IDeskExtra, state: Array<string>) {
        if (this.state.deskData && this.state.deskData[desk._id]) {
            let data = this.state.deskData[desk._id].filter((item) =>
                state.includes(item.state));

            return data.reduce((total, item) => total + item.count, 0);
        }

        return 0;
    }

    getDonutData(desk: IDesk) {
        let labels = [];
        let dataSet = {
            data: [],
            backgroundColor: [],
        };

        this.assignmentStages.map((item: IAssignmentStage) => {
            labels.push(item.name);
            dataSet.data.push(this.getStageTotal(desk, item.states));
            dataSet.backgroundColor.push(item.color);

            return dataSet;
        });

        return {
            labels: labels,
            datasets: [dataSet],
        };
    }

    render() {
        return (
            <div className="sd-grid-list sd-grid-list--medium sd-grid-list--gap-xl sd-margin-x--5">
                {this.props.desks.map((desk, index) => (
                    <CardComponent
                        key={index}
                        desk={desk}
                        donutData={this.getDonutData(desk)}
                        total={this.getDeskTotal(desk)}
                        label={gettext('items in total')}
                    >
                        {this.assignmentStages.map((item: IAssignmentStage) => (
                            <CardListComponent
                                key={item.code}
                                name={item.name}
                                color={item.color}
                                total={this.getStageTotal(desk, item.states)}
                            />
                        ),
                        )}
                    </CardComponent>
                ))}
            </div>
        );
    }
}
