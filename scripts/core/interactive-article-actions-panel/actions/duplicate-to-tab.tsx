import React from 'react';
import {IArticle} from 'superdesk-api';
import {PanelContent} from '../panel/panel-content';
import {PanelFooter} from '../panel/panel-footer';
import {DuplicateToAction} from './duplicate-to-action';

interface IProps {
    items: Array<IArticle>;
    closeDuplicateToView(): void;
}

/**
 * Duplicate To Tab - composes the DuplicateToAction into the panel layout.
 */
export class DuplicateToTab extends React.PureComponent<IProps> {
    render() {
        const {items, closeDuplicateToView} = this.props;

        return (
            <DuplicateToAction
                items={items}
                closeDuplicateToView={closeDuplicateToView}
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
            </DuplicateToAction>
        );
    }
}
