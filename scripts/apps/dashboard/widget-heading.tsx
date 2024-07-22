
import React from 'react';
import {IPropsWidgetHeading} from 'superdesk-api';
import {widgetReactIntegration} from 'apps/authoring/widgets/widgets';

/**
 * This component is exposed to superdesk-api to enable extensions
 * to use a heading that supports sliding toolbar actions.
 *
 * It also encapsulates widget actions like pinning
 * without exposing the implementation details to extensions.
 *
 * !!! Can't use React.PureComponent because it gets props from outside
 */
export class AuthoringWidgetHeading extends React.Component<IPropsWidgetHeading> {
    render() {
        const widget = widgetReactIntegration.getActiveWidget();
        const pinned = widgetReactIntegration.getPinnedWidget() === this.props.widgetId;
        const {pinWidget, WidgetHeaderComponent} = widgetReactIntegration;

        return (
            <WidgetHeaderComponent
                pinWidget={pinWidget}
                pinned={pinned}
                widget={widget}
                widgetName={this.props.widgetName}
                editMode={this.props.editMode}
                closeWidget={() => widgetReactIntegration.closeActiveWidget()}
                customContent={this.props.customContent}
            >
                {this.props.children}
            </WidgetHeaderComponent>
        );
    }
}
