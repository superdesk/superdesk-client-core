import React from 'react';
import {IconButton, Spacer} from 'superdesk-ui-framework/react';
import {ContentBlock, ContentState, EditorState} from 'draft-js';
import {IEditorDragDropArticleEmbed} from 'core/editor3/reducers/editor3';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {Card} from 'core/ui/components/Card';
import {gettext} from 'core/utils';

interface IProps {
    block: ContentBlock;
    contentState: ContentState;
    editorState: EditorState;
    readOnly: boolean;
}

export class ArticleEmbed extends React.Component<IProps> {
    render() {
        const {block, contentState} = this.props;
        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);
        const {id, name, html} = entity.getData() as IEditorDragDropArticleEmbed['data'];

        const heading = (
            <Spacer h gap="32" justifyContent="space-between" noWrap>
                <div>
                    {gettext('Embedding from:')}
                    &nbsp;
                    <strong>{name}</strong>
                </div>

                <div style={{flexShrink: 0}}>
                    <IconButton
                        icon="external"
                        ariaValue={gettext('open in a new window')}
                        size="small"
                        onClick={() => {
                            openArticle(id, 'edit-new-window');
                        }}
                    />
                </div>
            </Spacer>
        );

        return (
            <Card heading={heading} width="100%">
                <div className="article-embed">
                    <div dangerouslySetInnerHTML={{__html: html}} />
                </div>
            </Card>

        );
    }
}
