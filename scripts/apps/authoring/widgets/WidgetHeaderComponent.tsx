import React from 'react';
import classNames from 'classnames';
import {IWidgetIntegrationComponentProps} from './widgets';
import {gettext} from 'core/utils';

/**
 * Uses markup/styles from angular-based authoring and is intended to be rendered there.
 */
export class WidgetHeaderComponent extends React.PureComponent<IWidgetIntegrationComponentProps> {
    render() {
        const {
            widget,
            pinWidget,
            pinned,
        } = this.props;

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
                            disabled={pinned}
                            onClick={() => {
                                pinWidget(widget);
                            }}
                            aria-label={gettext('Pin/Unpin')}
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
