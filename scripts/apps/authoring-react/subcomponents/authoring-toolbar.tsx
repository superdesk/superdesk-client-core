import React from 'react';
import {ITopBarWidget} from 'superdesk-api';

interface IProps<T> {
    entity: T;
    widgets?: Array<ITopBarWidget<T>>;
    backgroundColor?: React.CSSProperties['backgroundColor'];
}

export class AuthoringToolbar<T> extends React.PureComponent<IProps<T>> {
    render() {
        const {widgets} = this.props;

        const topbarWidgetsStart = widgets
            .filter(({group}) => group === 'start')
            .sort((a, b) => a.priority - b.priority);

        const topbarWidgetsMiddle = widgets
            .filter(({group}) => group === 'middle')
            .sort((a, b) => a.priority - b.priority);

        const topbarWidgetsEnd = widgets
            .filter(({group}) => group === 'end')
            .sort((a, b) => a.priority - b.priority);

        const toolbarGroups = [
            topbarWidgetsStart,
            topbarWidgetsMiddle,
            topbarWidgetsEnd,
        ];

        return (
            <div className="authoring-toolbar-1" style={{backgroundColor: this.props.backgroundColor}}>
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
