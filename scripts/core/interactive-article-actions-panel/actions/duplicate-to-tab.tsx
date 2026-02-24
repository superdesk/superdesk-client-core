import React from 'react';
import {IArticle} from 'superdesk-api';
import {PanelContent} from '../panel/panel-content';
import {PanelFooter} from '../panel/panel-footer';
import {DuplicateToAction} from './duplicate-to-action';

interface IProps {
    items: Array<IArticle>;
    closeDuplicateToView(): void;
    markupV2: boolean;
}

/**
 * Duplicate To Tab - composes the DuplicateToAction into the panel layout.
 */
export class DuplicateToTab extends React.PureComponent<IProps> {
    render() {
        const {items, markupV2, closeDuplicateToView} = this.props;

        return (
            <DuplicateToAction
                items={items}
                closeDuplicateToView={closeDuplicateToView}
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
            </DuplicateToAction>
        );
    }
}
