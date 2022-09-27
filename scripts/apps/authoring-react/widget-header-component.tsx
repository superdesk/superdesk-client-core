import React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import classNames from 'classnames';
import {IWidgetIntegrationComponentProps, widgetReactIntegration} from 'apps/authoring/widgets/widgets';
import {ButtonGroup} from 'superdesk-ui-framework';

export class WidgetHeaderComponent extends React.PureComponent<IWidgetIntegrationComponentProps> {
    render() {
        const {
            widget,
            pinned,
            pinWidget,
            customContent,
        } = this.props;

        return (
            <Layout.PanelHeader
                title={customContent == null ? this.props.widgetName : ''}
                onClose={() => this.props.closeWidget()}
            >
                {customContent ?? null}

                {
                    widgetReactIntegration.disableWidgetPinning !== true && (
                        <ButtonGroup align="end">
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
                        </ButtonGroup>
                    )
                }

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
