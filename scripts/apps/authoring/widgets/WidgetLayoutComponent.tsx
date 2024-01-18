import React from 'react';
import {IAuthoringWidgetLayoutProps} from 'superdesk-api';

/**
 * Uses markup/styles from angular-based authoring and is intended to be rendered there.
 */
export class WidgetLayoutComponent extends React.PureComponent<IAuthoringWidgetLayoutProps> {
    render() {
        const {header, body, footer} = this.props;

        return (
            <React.Fragment>
                {header && <React.Fragment>{header}</React.Fragment>}

                <div className="widget-content sd-padding-all--2">
                    {body}

                    {footer && (<div className="widget-content__footer">{footer}</div>)}
                </div>
            </React.Fragment>
        );
    }
}
