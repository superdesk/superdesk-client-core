import React from 'react';
import {widgetReactIntegration} from 'apps/authoring/widgets/widgets';
import {IAuthoringWidgetLayoutProps} from 'superdesk-api';

export class AuthoringWidgetLayout extends React.PureComponent<IAuthoringWidgetLayoutProps> {
    render() {
        const {WidgetLayoutComponent} = widgetReactIntegration;

        return (
            <WidgetLayoutComponent {...this.props} />
        );
    }
}
