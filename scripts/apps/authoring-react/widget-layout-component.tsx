import React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {IAuthoringWidgetLayoutProps} from 'superdesk-api';

/**
 * Uses layout components from ui-framework. Is only meant to be used in {@link AuthoringReact}
 */
export class AuthoringWidgetLayoutComponent extends React.PureComponent<IAuthoringWidgetLayoutProps> {
    render() {
        const {header, body, footer, bodyPadding = 'medium'} = this.props;

        // Map bodyPadding values to PanelContentBlock padding values
        const paddingMap: Record<'none' | 'small' | 'medium', '0' | '1-5' | '3'> = {
            none: '0',
            small: '1-5',
            medium: '3',
        };

        return (
            <Layout.Panel
                side="right"
                open={true}
                size={this.props.width == null ? 'x-small' : {custom: this.props.width}}
                background={this.props.background ?? 'light'}
                theme={this.props.theme}
                data-test-id={this.props['data-test-id']}
            >
                {header && <React.Fragment>{header}</React.Fragment>}

                <Layout.PanelContent>
                    <Layout.PanelContentBlock
                        flex={bodyPadding === 'none'}
                        padding={paddingMap[bodyPadding]}
                        className={
                            this.props.fillBodyHeight === true
                                ? 'sd-authoring-widget-body--fill-height'
                                : undefined
                        }
                    >
                        {body}
                    </Layout.PanelContentBlock>
                </Layout.PanelContent>

                {footer && (<Layout.PanelFooter>{footer}</Layout.PanelFooter>)}
            </Layout.Panel>
        );
    }
}
