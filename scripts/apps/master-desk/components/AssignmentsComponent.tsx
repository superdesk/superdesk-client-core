import React from 'react';

import {IDesk, IStage} from 'superdesk-api';
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
    apiService: any;
}

interface IState {
    deskData: Array<any>;
}

export class AssignmentsComponent extends React.Component<IProps, IState> {
    private hashColors: Array<string> = ['#c4170b', '#d17d00', '#74a838'];

    constructor(props) {
        super(props);

        this.state = {
            deskData: [],
        };
    }

    componentDidMount() {
        this.props.desks.forEach((desk) => this.getDeskOverview(desk).then((data: any) => {
            let deskData = this.state.deskData;

            deskData[desk._id] = data._items;

            this.setState({deskData: deskData});
        }));
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
            this.state.deskData[desk._id].forEach((item) => total += item ? item.count : 0);
        }

        return total;
    }

    getStageTotal(desk: IDeskExtra, state: string) {
        let total = 0;

        if (this.state.deskData && this.state.deskData[desk._id]) {
            let data = this.state.deskData[desk._id].find((item) => item.state === state);

            total = data ? data.count : 0;
        }

        return total;
    }

    render() {
        return (
            <div className="sd-grid-list sd-grid-list--medium sd-grid-list--gap-xl sd-margin-x--5">
                {this.props.desks.map((desk, index) => (
                    <CardComponent
                        key={index}
                        desk={desk}
                        total={this.getDeskTotal(desk)}
                        label={gettext('items in total')}
                    >

                        <CardListComponent
                            name={gettext('To Do')}
                            color={this.hashColors[0]}
                            total={this.getStageTotal(desk, 'assigned')}
                        />

                        <CardListComponent
                            name={gettext('In Progress')}
                            color={this.hashColors[1]}
                            total={this.getStageTotal(desk, 'in_progress')}
                        />

                        <CardListComponent
                            name={gettext('Completed')}
                            color={this.hashColors[2]}
                            total={this.getStageTotal(desk, 'completed')}
                        />

                    </CardComponent>
                ))}
            </div>
        );
    }
}
