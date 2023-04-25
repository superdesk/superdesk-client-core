import React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {IWidgetIntegrationComponentProps, widgetReactIntegration} from 'apps/authoring/widgets/widgets';
import {IconButton} from 'superdesk-ui-framework';

export class WidgetHeaderComponent extends React.PureComponent<IWidgetIntegrationComponentProps, {pinned: boolean}> {

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
                iconButtons={widgetReactIntegration.disableWidgetPinning !== true && [
                    <IconButton 
                        key='pin'
                        icon='pin'
                        ariaValue='Pin'
                        rotate={pinned && '90'}
                        onClick={() => {
                            pinWidget(widget);
                        }}
                    />,
                ]}
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
