import React from 'react';
import {ITopBarWidget} from '../authoring-react';

interface IProps<T> {
    entity: T;
    coreWidgets?: Array<ITopBarWidget<T>>;
    extraWidgets?: Array<ITopBarWidget<T>>;
}

export class AuthoringToolbar<T> extends React.PureComponent<IProps<T>> {
    render() {
        const topbarWidgets = (this.props.coreWidgets ?? []).concat(this.props.extraWidgets ?? []);

        const topbarWidgetsStart = topbarWidgets
            .filter(({group}) => group === 'start')
            .sort((a, b) => a.priority - b.priority);

        const topbarWidgetsMiddle = topbarWidgets
            .filter(({group}) => group === 'middle')
            .sort((a, b) => a.priority - b.priority);

        const topbarWidgetsEnd = topbarWidgets
            .filter(({group}) => group === 'end')
            .sort((a, b) => a.priority - b.priority);

        const toolbarGroups = [
            topbarWidgetsStart,
            topbarWidgetsMiddle,
            topbarWidgetsEnd,
        ];

        return (
            <div className="authoring-toolbar-1">
                {
                    toolbarGroups.map((items, i) => (
                        <div
                            key={i}
                        >
                            {
                                items.map((widget, _i) => {
                                    const Component = widget.component;

                                    return (
                                        <Component
                                            key={_i}
                                            entity={this.props.entity}
                                        />
                                    );
                                })
                            }
                        </div>
                    ))
                }
            </div>
        );
    }
}
