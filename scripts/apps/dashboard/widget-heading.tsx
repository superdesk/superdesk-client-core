
import React from 'react';
import classNames from 'classnames';
import {IPropsWidgetHeading} from 'superdesk-api';
import {widgetReactIntegration} from 'apps/authoring/widgets/widgets';

/**
 * This component is exposed to superdesk-api to enable extensions
 * to use a heading that supports sliding toolbar actions.
 *
 * It also encapsulates widget actions like pinning
 * without exposing the implementation details to extensions.
 */
export class WidgetHeading extends React.PureComponent<IPropsWidgetHeading> {
    render() {
        const widget = widgetReactIntegration.getActiveWidget();
        const {pinWidget} = widgetReactIntegration;

        return (
            <div className="widget-header">
                <div className="widget-title widget-heading--title">
                    <span>{this.props.widgetName}</span>
                    <span>
                        <button
                            className={
                                classNames(
                                    'sd-widget-pin icn-btn',
                                    {
                                        'sd-widget-pinned': widget.pinned,
                                        'active': widget.pinned,
                                    },
                                )
                            }
                            onClick={() => {
                                pinWidget(widget);
                            }}
                        >
                            <i className="icon-pin" />
                        </button>
                    </span>
                </div>

                {
                    this.props.editMode && (
                        <div
                            className="widget__sliding-toolbar widget__sliding-toolbar--right widget-heading--children"
                        >
                            {this.props.children}
                        </div>
                    )
                }
            </div>
        );
    }
}
