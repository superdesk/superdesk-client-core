import React from 'react';
import {IArticle} from 'superdesk-api';
import {PanelContent} from '../panel/panel-content';
import {PanelFooter} from '../panel/panel-footer';
import {SendCorrectionAction} from './send-correction-action';

interface IProps {
    item: IArticle;
    closePublishView(): void;
    handleUnsavedChanges(): Promise<IArticle>;
    markupV2: boolean;
    onDataChange(changes: IArticle): void;
}

/**
 * Send Correction Tab - composes the SendCorrectionAction into the panel layout.
 */
export class SendCorrectionTab extends React.Component<IProps> {
    render() {
        const {item, markupV2, closePublishView, handleUnsavedChanges, onDataChange} = this.props;

        return (
            <SendCorrectionAction
                item={item}
                closePublishView={closePublishView}
                handleUnsavedChanges={handleUnsavedChanges}
                onDataChange={onDataChange}
            >
                {({body, footer}) => (
                    <>
                        <PanelContent markupV2={markupV2}>
                            {body}
                        </PanelContent>
                        <PanelFooter markupV2={markupV2}>
                            {footer}
                        </PanelFooter>
                    </>
                )}
            </SendCorrectionAction>
        );
    }
}
