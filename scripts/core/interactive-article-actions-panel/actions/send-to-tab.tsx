import React from 'react';
import {IArticle} from 'superdesk-api';
import {Text} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {PanelContent} from '../panel/panel-content';
import {PanelFooter} from '../panel/panel-footer';
import {SendToAction} from './send-to-action';

interface IProps {
    items: Array<IArticle>;
    closeSendToView(): void;
    handleUnsavedChanges(items: Array<IArticle>): Promise<Array<IArticle>>;
}

/**
 * Send To Tab - composes the SendToAction into the panel layout.
 */
export class SendToTab extends React.PureComponent<IProps> {
    render() {
        const {items, closeSendToView, handleUnsavedChanges} = this.props;

        return (
            <SendToAction
                items={items}
                closeSendToView={closeSendToView}
                handleUnsavedChanges={handleUnsavedChanges}
            >
                {({body, footer, noDestinationsAvailable}) => {
                    if (noDestinationsAvailable) {
                        return (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text size="medium" align="center" weight="medium">
                                    {gettext('No destinations are available.')}
                                </Text>
                            </div>
                        );
                    }

                    return (
                        <>
                            <PanelContent>
                                {body}
                            </PanelContent>
                            <PanelFooter>
                                {footer}
                            </PanelFooter>
                        </>
                    );
                }}
            </SendToAction>
        );
    }
}
