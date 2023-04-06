import React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {IWidgetIntegrationComponentProps, widgetReactIntegration} from 'apps/authoring/widgets/widgets';
import {IconButton} from 'superdesk-ui-framework';

export class WidgetHeaderComponent extends React.PureComponent<IWidgetIntegrationComponentProps, {pinned: boolean}> {

    constructor(props) {
        super(props);
        this.state = {
            pinned: false,
        }
    }

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
                        //rotate={this.state.pinned && '90'}
                        onClick={() => {
                            //debugger;
                            pinWidget(widget);
                            this.setState({pinned: true});
                            console.log(this.state.pinned);
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
