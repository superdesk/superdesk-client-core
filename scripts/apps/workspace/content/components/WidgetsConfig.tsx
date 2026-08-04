import React from 'react';
import ng from 'core/services/ng';
import {IWidget} from 'superdesk-interfaces/Widget';
import {IContentProfile} from 'superdesk-api';
import {gettext} from 'core/utils';
import {getCanonicalWidgetId} from 'apps/authoring/widgets/widget-id-compatibility';

interface IProps {
    initialWidgetsConfig: IContentProfile['widgets_config'];
    onUpdate: (widgetsConfig: IContentProfile['widgets_config']) => void;
}

interface IState {
    widgetsConfig: IContentProfile['widgets_config'];
}

export const isWidgetVisibleForContentProfile = (
    widgetsConfig: IContentProfile['widgets_config'],
    widgetId: IContentProfile['widgets_config'][0]['widget_id'],
) => {
    const defaultOption = true;

    if (widgetsConfig == null) {
        return defaultOption;
    }

    // An entry saved under a removed authoring-react id still applies: ignoring it would fall back
    // to the default and silently un-hide a widget an admin hid. Current id wins.
    const widgetConfig = widgetsConfig.find((config) => config.widget_id === widgetId)
        ?? widgetsConfig.find((config) => getCanonicalWidgetId(config.widget_id) === widgetId);

    return widgetConfig == null ? defaultOption : widgetConfig.is_displayed;
};

export class WidgetsConfig extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

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
    render() {
        const authoringWidgets: Array<IWidget> = ng.get('authoringWidgets');

        // registered once per implementation under the same id; one config entry covers both
        const uniqueWidgets = authoringWidgets.filter(
            (widget, i) => authoringWidgets.findIndex(({_id}) => _id === widget._id) === i,
        );

        return (
            <div>
                <div className="sd-alert sd-alert--hollow sd-alert--small" style={{marginBlockStart: 20}}>
                    {gettext('Show or hide the widgets in the right toolbar in the editor workspace.')}
                </div>
                <ul className="sd-list-item-group sd-shadow--z2">
                    {
                        uniqueWidgets.map((widget) => (
                            <li className="sd-list-item" key={widget._id}>
                                <span className="sd-list-item__column">
                                    <input
                                        type="checkbox"
                                        checked={isWidgetVisibleForContentProfile(this.state.widgetsConfig, widget._id)}
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
            </div>
        );
    }
}
