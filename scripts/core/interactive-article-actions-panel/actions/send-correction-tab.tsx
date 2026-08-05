import React from 'react';
import {IArticle} from 'superdesk-api';
import {PanelContent} from '../panel/panel-content';
import {PanelFooter} from '../panel/panel-footer';
import {SendCorrectionAction} from './send-correction-action';

interface IProps {
    item: IArticle;
    closePublishView(): void;
    handleUnsavedChanges(): Promise<IArticle>;
    onDataChange(changes: IArticle): void;
}

/**
 * Send Correction Tab - composes the SendCorrectionAction into the panel layout.
 */
export class SendCorrectionTab extends React.Component<IProps> {
    render() {
        const {item, closePublishView, handleUnsavedChanges, onDataChange} = this.props;

        return (
            <SendCorrectionAction
                item={item}
                closePublishView={closePublishView}
                handleUnsavedChanges={handleUnsavedChanges}
                onDataChange={onDataChange}
            >
                {({body, footer}) => (
                    <>
                        <PanelContent>
                            {body}
                        </PanelContent>
                        <PanelFooter>
                            {footer}
                        </PanelFooter>
                    </>
                )}
            </SendCorrectionAction>
        );
    }
}
