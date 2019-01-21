import React from 'react';
import {connectServices} from 'core/helpers/ReactRenderAsync';

import {IWidget} from 'superdesk-interfaces/Widget';
import {IContentProfile} from 'superdesk-interfaces/ContentProfile';

interface IProps {
    authoringWidgets: Array<IWidget>;
    initialWidgetsConfig: IContentProfile['widgets_config'];
    onUpdate: (widgetsConfig: IContentProfile['widgets_config']) => void;
}

interface IState {
    widgetsConfig: IContentProfile['widgets_config'];
}

export class WidgetsConfigComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.isEnabled = this.isEnabled.bind(this);

        this.state = {
            widgetsConfig: this.props.initialWidgetsConfig || [],
        };
    }
    handleChange(id: string, nextValue: boolean) {
        const configForWidgetExists = this.state.widgetsConfig.find((widget) => widget.widget_id === id) != null;

        this.setState({
            widgetsConfig: configForWidgetExists
                ? this.state.widgetsConfig.map((config) =>
                    config.widget_id === id ? {...config, is_displayed: nextValue} : config)
                : this.state.widgetsConfig.concat({widget_id: id, is_displayed: nextValue}),
        }, () => {
            this.props.onUpdate(this.state.widgetsConfig);
        });
    }
    isEnabled(widgetId: string) {
        const widgetConfig = this.state.widgetsConfig.find((config) => config.widget_id === widgetId);

        return widgetConfig == null ? false : widgetConfig.is_displayed;
    }
    render() {
        return (
            <ul className="sd-list-item-group sd-shadow--z2">
                {
                    this.props.authoringWidgets.map((widget, i) => (
                        <li className="sd-list-item" key={i}>
                            <span className="sd-list-item__column">
                                <input
                                    type="checkbox"
                                    checked={this.isEnabled(widget._id)}
                                    onChange={(e) => this.handleChange(widget._id, e.target.checked)}
                                />
                            </span>
                            <span className="sd-list-item__column">
                                {widget.label}
                            </span>
                        </li>
                    ))
                }
            </ul>
        );
    }
}

export const WidgetsConfig = connectServices<IProps>(
    WidgetsConfigComponent,
    ['authoringWidgets'],
);
