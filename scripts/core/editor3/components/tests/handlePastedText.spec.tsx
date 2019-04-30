
import {EditorState, ContentState, SelectionState, convertFromRaw} from 'draft-js';
import {cursorAtEndPosition, cursorAtPosition} from './utils';
import {insertContentInState} from '../handlePastedText';
import {getAnnotationsFromContentState} from 'core/editor3/helpers/editor3CustomData';

describe('editor3.handlePastedText', () => {
    it('should insert text without selection', () => {
        const editorState = EditorState.createWithContent(
            ContentState.createFromText('paste before this'),
        );
        const pastedContent = ContentState.createFromText('some text ');

        const editorAfterPaste = insertContentInState(editorState, pastedContent, []);
        const [text] = editorAfterPaste.getCurrentContent().getBlocksAsArray()
            .map((b) => b.getText());

        expect(text).toBe('some text paste before this');
    });

    it('should insert text with selection at the end', () => {
        let editorState = EditorState.createWithContent(
            ContentState.createFromText('paste after this '),
        );
        const pastedContent = ContentState.createFromText('some text');

        editorState = cursorAtEndPosition(editorState);

        const editorAfterPaste = insertContentInState(editorState, pastedContent, []);
        const [text] = editorAfterPaste.getCurrentContent().getBlocksAsArray()
            .map((b) => b.getText());

        expect(text).toBe('paste after this some text');
    });

    it('should insert text with selection in the middle', () => {
        let editorState = EditorState.createWithContent(
            ContentState.createFromText('paste after this!'),
        );
        const pastedContent = ContentState.createFromText(' some text');

        editorState = cursorAtPosition(editorState, 16);

        const editorAfterPaste = insertContentInState(editorState, pastedContent, []);
        const [text] = editorAfterPaste.getCurrentContent().getBlocksAsArray()
            .map((b) => b.getText());

        expect(text).toBe('paste after this some text!');
    });

    it('should keep undo/redo history consistent', () => {
        let editorState = EditorState.createWithContent(
            ContentState.createFromText('paste after this'),
        );
        const pastedContent = ContentState.createFromText(' some text');

        editorState = cursorAtEndPosition(editorState);

        const editorAfterPaste = insertContentInState(editorState, pastedContent, []);
        const [text] = editorAfterPaste.getCurrentContent().getBlocksAsArray()
            .map((b) => b.getText());

        expect(text).toBe('paste after this some text');

        const cursorAfterPaste = editorAfterPaste.getSelection().getEndOffset();
        const editorAfterUndo = EditorState.undo(editorAfterPaste);

        const cursorAfterUndo = editorAfterUndo.getSelection().getEndOffset();
        const editorAfterRedo = EditorState.redo(EditorState.redo(editorAfterUndo));
        const cursorAfterRedo = editorAfterRedo.getSelection().getEndOffset();

        expect(cursorAfterPaste).toBe(26);
        expect(cursorAfterUndo).toBe(16);
        expect(cursorAfterRedo).toBe(26);
    });

    describe('insertContentInState', () => {
        it('should maintain the data stored on the first block after pasting', () => {
            // tslint:disable
            /* eslint-disable */
            const rawState: any = {"blocks":[{"key":"38k8j","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{"MULTIPLE_HIGHLIGHTS":{"lastHighlightIds":{"COMMENT":0,"ANNOTATION":1,"ADD_SUGGESTION":0,"DELETE_SUGGESTION":0,"TOGGLE_BOLD_SUGGESTION":0,"TOGGLE_ITALIC_SUGGESTION":0,"TOGGLE_UNDERLINE_SUGGESTION":0,"TOGGLE_SUBSCRIPT_SUGGESTION":0,"TOGGLE_SUPERSCRIPT_SUGGESTION":0,"TOGGLE_STRIKETHROUGH_SUGGESTION":0,"BLOCK_STYLE_SUGGESTION":0,"SPLIT_PARAGRAPH_SUGGESTION":0,"MERGE_PARAGRAPHS_SUGGESTION":0,"DELETE_EMPTY_PARAGRAPH_SUGGESTION":0,"ADD_LINK_SUGGESTION":0,"REMOVE_LINK_SUGGESTION":0,"CHANGE_LINK_SUGGESTION":0},"highlightsStyleMap":{"ANNOTATION-1":{"borderBottom":"4px solid rgba(100, 205, 0, 0.6)"}},"highlightsData":{"ANNOTATION-1":{"data":{"msg":"{\"blocks\":[{\"key\":\"67k35\",\"text\":\"test annotation\",\"type\":\"unstyled\",\"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}","annotationType":"regular","authorId":"5acb79292e03ed5d2a84bbd6","author":"John Doe","email":"a@a.com","date":"2019-04-05T10:41:55.672Z","avatar":null},"type":"ANNOTATION"}}}}},{"key":"eh526","text":"second line","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":7,"length":4,"style":"ANNOTATION-1"}],"entityRanges":[],"data":{}}],"entityMap":{}};

            const contentState = convertFromRaw(rawState);

            const selectionState = SelectionState.createEmpty(contentState.getFirstBlock().getKey()).merge({
                anchorOffset: 0,
                focusOffset: 0,
            }) as SelectionState;

            const editorState1 = EditorState.acceptSelection(
                EditorState.createWithContent(contentState),
                selectionState,
            );

            expect(
                getAnnotationsFromContentState(editorState1.getCurrentContent())[0].body,
            ).toBe('<p>test annotation</p>');

            const editorState2 = insertContentInState(editorState1, ContentState.createFromText('first line'), []);

            expect(
                getAnnotationsFromContentState(editorState2.getCurrentContent())[0].body,
            ).toBe('<p>test annotation</p>');
        });
    });
});
