import React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {IWidgetIntegrationComponentProps, widgetReactIntegration} from 'apps/authoring/widgets/widgets';
import {IconButton, Rotate} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

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
                iconButtons={widgetReactIntegration.disableWidgetPinning == null
                    ? undefined
                    : [
                        <Rotate degrees={pinned ? 90 : 0} key="noop">
                            <IconButton
                                icon="pin"
                                ariaValue={gettext('Pin')}
                                onClick={() => {
                                    pinWidget(widget);
                                }}
                            />
                        </Rotate>,
                    ]
                }
            >
                {customContent ?? null}

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
