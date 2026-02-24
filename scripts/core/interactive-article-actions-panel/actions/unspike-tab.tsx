import React from 'react';
import {IArticle} from 'superdesk-api';
import {PanelContent} from '../panel/panel-content';
import {PanelFooter} from '../panel/panel-footer';
import {UnspikeAction} from './unspike-action';

interface IProps {
    items: Array<IArticle>;
    closeUnspikeView(): void;
    markupV2: boolean;
}

/**
 * Unspike Tab - composes the UnspikeAction into the panel layout.
 */
export class UnspikeTab extends React.PureComponent<IProps> {
    render() {
        const {items, markupV2, closeUnspikeView} = this.props;

        return (
            <UnspikeAction
                items={items}
                closeUnspikeView={closeUnspikeView}
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
            </UnspikeAction>
        );
    }
}
