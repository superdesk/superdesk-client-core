import React from 'react';
import {IMonitoringFilter, IDesk} from 'superdesk-api';
import {extensions} from 'appConfig';
import {flattenDeep} from 'lodash';
import {dataApiByEntity} from 'core/helpers/CrudManager';
import {Badge, Button} from 'superdesk-ui-framework';

interface IProps {
    deskId: IDesk['_id'];
    isFilterActive(button: IMonitoringFilter): boolean;
    toggleFilter(button: IMonitoringFilter): void;

    // `activeFilters` isn't meant to be read
    // it's only required so angular re-renders the component when filters change
    activeFilters: never;
}

interface IButtonWithResultCount extends IMonitoringFilter {
    count: number;
}

interface IState {
    buttons?: Array<IButtonWithResultCount>;
}

export class MonitoringFilterinButtons extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {};
    }
    componentDidMount() {
        Promise.all(
            Object.values(extensions)
                .map(
                    (extension) =>
                        extension.activationResult?.contributions?.monitoring?.getFilteringButtons?.()
                            ?.then((buttons) => {
                                return Promise.all(
                                    buttons.map(
                                        (button) => dataApiByEntity.article.query({
                                            page: {from: 0, size: 0},
                                            sort: [{'_updated': 'desc'}],
                                            filterValues: {'task.desk': [this.props.deskId], ...button.query},
                                            aggregations: false,
                                        }).then((res) => {
                                            const buttonWithCount: IButtonWithResultCount = {
                                                ...button,
                                                count: res._meta.total,
                                            };

                                            return buttonWithCount;
                                        }),
                                    ),
                                );
                            }),
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
                {this.state.buttons.map((button) => {
                    const active = this.props.isFilterActive(button);

                    return (
                        <Badge key={button.label} text={button.count.toString()}>
                            <Button
                                text={button.label}
                                type={active ? 'primary' : 'default'}
                                style={active ? 'filled' : 'hollow'}
                                size="small"
                                onClick={() => this.props.toggleFilter(button)}
                            />
                        </Badge>
                    );
                })}
            </div>
        );
    }
}
