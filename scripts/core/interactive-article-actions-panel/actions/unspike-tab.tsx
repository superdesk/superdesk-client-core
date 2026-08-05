import React from 'react';
import {IArticle} from 'superdesk-api';
import {PanelContent} from '../panel/panel-content';
import {PanelFooter} from '../panel/panel-footer';
import {UnspikeAction} from './unspike-action';

interface IProps {
    items: Array<IArticle>;
    closeUnspikeView(): void;
}

/**
 * Unspike Tab - composes the UnspikeAction into the panel layout.
 */
export class UnspikeTab extends React.PureComponent<IProps> {
    render() {
        const {items, closeUnspikeView} = this.props;

        return (
            <UnspikeAction
                items={items}
                closeUnspikeView={closeUnspikeView}
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
            </UnspikeAction>
        );
    }
}
