import React from 'react';
import {IArticle} from 'superdesk-api';
import {PanelContent} from '../panel/panel-content';
import {PanelFooter} from '../panel/panel-footer';
import {IPanelError, IPropsHocInteractivePanelTab} from '../interfaces';
import {PublishAction} from './publish-action';

interface IProps extends IPropsHocInteractivePanelTab {
    item: IArticle;
    closePublishView(): void;
    handleUnsavedChanges(): Promise<IArticle>;
    markupV2: boolean;
    onError: (error: IPanelError) => void;
    onDataChange: (item: IArticle) => void;
    action?: 'publish' | 'correct';
}

/**
 * Publish Tab - composes the PublishAction into the panel layout.
 * This is a wrapper component that uses the render props pattern to provide
 * columnCount and content to the parent panel.
 */
export class WithPublishTab extends React.PureComponent<IProps> {
    render() {
        const {item, markupV2, closePublishView, handleUnsavedChanges, onError, onDataChange, action} = this.props;

        return (
            <PublishAction
                item={item}
                closePublishView={closePublishView}
                handleUnsavedChanges={handleUnsavedChanges}
                onError={onError}
                onDataChange={onDataChange}
                action={action}
            >
                {({body, footer, columnCount, loading}) => {
                    if (loading) {
                        return this.props.children({columnCount: 1, content: null});
                    }

                    return this.props.children({
                        columnCount,
                        content: (
                            <>
                                <PanelContent markupV2={markupV2}>
                                    {body}
                                </PanelContent>
                                <PanelFooter markupV2={markupV2}>
                                    {footer}
                                </PanelFooter>
                            </>
                        ),
                    });
                }}
            </PublishAction>
        );
    }
}
