import React from 'react';
import {IArticle} from 'superdesk-api';
import {PanelContent} from '../panel/panel-content';
import {PanelFooter} from '../panel/panel-footer';
import {FetchToAction} from './fetch-to-action';

interface IProps {
    items: Array<IArticle>;
    closeFetchToView(): void;
    markupV2: boolean;
    handleUnsavedChanges(items: Array<IArticle>): Promise<Array<IArticle>>;
}

/**
 * Fetch To Tab - composes the FetchToAction into the panel layout.
 */
export class FetchToTab extends React.PureComponent<IProps> {
    render() {
        const {items, markupV2, closeFetchToView, handleUnsavedChanges} = this.props;

        return (
            <FetchToAction
                items={items}
                closeFetchToView={closeFetchToView}
                handleUnsavedChanges={handleUnsavedChanges}
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
            </FetchToAction>
        );
    }
}
