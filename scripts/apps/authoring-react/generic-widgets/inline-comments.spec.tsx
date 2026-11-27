import {ContentState, EditorState, SelectionState} from 'draft-js';
import * as Highlights from 'core/editor3/helpers/highlights';
import {getHighlightsConfig} from 'core/editor3/highlightsConfig';
import {getUnresolvedCommentsFromContentState} from './inline-comments';

describe('authoring-react inline comments widget', () => {
    it('lists unresolved comments with the text they were made on', () => {
        const contentState = ContentState.createFromText('alpha bravo');
        const blockKey = contentState.getFirstBlock().getKey();
        const selection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: 6,
            focusOffset: 11,
        }) as SelectionState;

        const editorState = Highlights.addHighlight(
            EditorState.acceptSelection(
                Highlights.initializeHighlights(EditorState.createWithContent(contentState)),
                selection,
            ),
            getHighlightsConfig().COMMENT.type,
            {data: {msg: 'first thoughts', replies: []}},
        );

        expect(getUnresolvedCommentsFromContentState(editorState.getCurrentContent())).toEqual([
            jasmine.objectContaining({msg: 'first thoughts', commentedText: 'bravo'}),
        ]);
    });
});
