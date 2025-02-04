import React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {IAuthoringWidgetLayoutProps} from 'superdesk-api';

/**
 * Uses layout components from ui-framework. Is only meant to be used in {@link AuthoringReact}
 */
export class AuthoringWidgetLayoutComponent extends React.PureComponent<IAuthoringWidgetLayoutProps> {
    render() {
        const {header, body, footer} = this.props;

        return (
            <Layout.Panel side="right" open={true} size="x-small" background={this.props.background ?? 'light'}>
                {header && <React.Fragment>{header}</React.Fragment>}

                <Layout.PanelContent>
                    <Layout.PanelContentBlock>
                        {body}
                    </Layout.PanelContentBlock>
                </Layout.PanelContent>

                {footer && (<Layout.PanelFooter>{footer}</Layout.PanelFooter>)}
            </Layout.Panel>
        );
    }
}
