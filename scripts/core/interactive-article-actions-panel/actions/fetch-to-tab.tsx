import React from 'react';
import {IArticle} from 'superdesk-api';
import {PanelContent} from '../panel/panel-content';
import {PanelFooter} from '../panel/panel-footer';
import {FetchToAction} from './fetch-to-action';

interface IProps {
    items: Array<IArticle>;
    closeFetchToView(): void;
    handleUnsavedChanges(items: Array<IArticle>): Promise<Array<IArticle>>;
}

/**
 * Fetch To Tab - composes the FetchToAction into the panel layout.
 */
export class FetchToTab extends React.PureComponent<IProps> {
    render() {
        const {items, closeFetchToView, handleUnsavedChanges} = this.props;

        return (
            <FetchToAction
                items={items}
                closeFetchToView={closeFetchToView}
                handleUnsavedChanges={handleUnsavedChanges}
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
            </FetchToAction>
        );
    }
}
