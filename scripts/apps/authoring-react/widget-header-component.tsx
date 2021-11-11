import React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import classNames from 'classnames';
import {IWidgetIntegrationComponentProps} from 'apps/authoring/widgets/widgets';

export class WidgetHeaderComponent extends React.PureComponent<IWidgetIntegrationComponentProps> {
    render() {
        const {
            widget,
            pinned,
            pinWidget,
        } = this.props;

        return (
            <Layout.PanelHeader
                title={this.props.widgetName}
            >
                <button
                    className={
                        classNames(
                            'sd-widget-pin icn-btn',
                            {
                                'sd-widget-pinned': pinned,
                                'active': pinned,
                            },
                        )
                    }
                    onClick={() => {
                        pinWidget(widget);
                    }}
                >
                    <i className="icon-pin" />
                </button>

                {
                    this.props.editMode && (
                        <Layout.PanelHeaderSlidingToolbar right>
                            {this.props.children}
                        </Layout.PanelHeaderSlidingToolbar>
                    )
                }
            </Layout.PanelHeader>
        );
    }
}
