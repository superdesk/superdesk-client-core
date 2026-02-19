import React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {IWidgetIntegrationComponentProps, widgetReactIntegration} from 'apps/authoring/widgets/widgets';
import {IconButton, Rotate, ButtonGroup} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

export class WidgetHeaderComponent extends React.PureComponent<IWidgetIntegrationComponentProps> {
    render() {
        const {
            pinned,
            pinWidget,
            customContent,
        } = this.props;
        const sidebarPinnedId = widgetReactIntegration.getPinnedWidget();

        if (customContent != null) {
            const iconButtons = widgetReactIntegration.disableWidgetPinning == null
                ? undefined
                : sidebarPinnedId != null && (sidebarPinnedId !== widgetReactIntegration.getActiveWidget()) ? [] : [
                    <Rotate degrees={pinned ? 90 : 0} key="noop">
                        <IconButton
                            icon="pin"
                            ariaValue={gettext('Pin')}
                            onClick={() => {
                                pinWidget();
                            }}
                        />
                    </Rotate>,
                ];

            return (
                <div className="side-panel__header side-panel__header--border-b side-panel__header--has-close">
                    <div className="side-panel__header-wrapper">
                        <div className="side-panel__header-inner">
                            {customContent}
                        </div>
                        <ButtonGroup align="end" spaces="no-space" className="side-panel__btn-group">
                            {iconButtons != null && iconButtons}
                            {!pinned && (
                                <IconButton icon="close-small" ariaValue="Close" onClick={() => this.props.closeWidget()} />
                            )}
                        </ButtonGroup>
                    </div>
                    {
                        this.props.editMode && (
                            <Layout.PanelHeaderSlidingToolbar right>
                                {this.props.children}
                            </Layout.PanelHeaderSlidingToolbar>
                        )
                    }
                </div>
            );
        }

        return (
            <Layout.PanelHeader
                title={this.props.widgetName}
                onClose={pinned ? undefined : () => this.props.closeWidget()}
                iconButtons={widgetReactIntegration.disableWidgetPinning == null
                    ? undefined
                    : sidebarPinnedId != null && (sidebarPinnedId !== widgetReactIntegration.getActiveWidget()) ? [] : [
                        <Rotate degrees={pinned ? 90 : 0} key="noop">
                            <IconButton
                                icon="pin"
                                ariaValue={gettext('Pin')}
                                onClick={() => {
                                    pinWidget();
                                }}
                            />
                        </Rotate>,
                    ]
                }
            >
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
