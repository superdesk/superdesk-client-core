import React from 'react';
import {IArticle} from 'superdesk-api';
import {InteractiveArticleActionsPanel} from './index-ui';
import {WithInteractiveArticleActionsPanel} from './index-hoc';

interface IProps {
    /**
     * Multiple instances of the component should be able to work at once.
     * `location` is added in order to be able to determine which one should be activated.
     */
    location: 'authoring' | 'list-view';
    handleUnsavedChanges?(items: Array<IArticle>): Promise<Array<IArticle>>;
    markupV2?: boolean;
}

export class InteractiveArticleActionsPanelCombined extends React.PureComponent<IProps> {
    render() {
        return (
            <WithInteractiveArticleActionsPanel location={this.props.location}>
                {(state, actions) => {
                    if (state.active === false) {
                        return null;
                    }

                    return (
                        <InteractiveArticleActionsPanel
                            items={state.items}
                            tabs={state.tabs}
                            activeTab={state.activeTab}
                            handleUnsavedChanges={this.props.handleUnsavedChanges}
                            markupV2={this.props.markupV2}
                            onClose={actions.closePanel}
                        />
                    );
                }}
            </WithInteractiveArticleActionsPanel>
        );
    }
}
