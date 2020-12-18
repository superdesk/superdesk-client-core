import React from 'react';

import {IDesk} from 'superdesk-api';

import {DonutChart} from 'superdesk-ui-framework/react';

interface IProps {
    desk: IDesk;
    label: string;
    total: number;
    donutData?: any;
}

export class CardComponent extends React.Component<IProps, {}> {
    private chartOptions: any = {
        legend: false,
        tooltips: false,
    };

    render() {
        return (
            <div className="sd-board" >
                <div className="sd-board__header">
                    <h3 className="sd-board__header-title">{this.props.desk.name}</h3>
                </div>
                <div className="sd-board__content sd-padding-t--1">
                    <div className="sd-board__content-block">
                        <ul className="sd-board__list">
                            <li className="sd-board__list-item">
                                <span className="sd-board__item-count--large">
                                    {this.props.total}
                                </span>
                                <p className="sd-board__count-label">{this.props.label}</p>
                                { this.props.donutData ? (
                                    <div className="sd-board__doughnut-chart">
                                        <DonutChart
                                            width="40px"
                                            height="40px"
                                            data={this.props.donutData}
                                            options={this.chartOptions}
                                        />

                                        <span className="sd-board__doughnut-chart-number">{this.props.total}</span>
                                    </div>
                                )
                                    : null }
                            </li>
                            {this.props.children}
                        </ul>
                    </div>
                </div>
            </div >
        );
    }
}
