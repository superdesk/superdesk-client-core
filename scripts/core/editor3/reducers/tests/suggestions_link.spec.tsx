import * as Highlights from '../../helpers/highlights';
import * as Setup from './suggestion_setup';

describe('editor3.reducers.suggestion.LINK_SUGGESTIONS', () => {
    it('should add new suggestion when link is created', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 0, 6);
        editorState = Setup.addLinkSuggestion(editorState, date);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1');
        expect(selection.getStartOffset()).toEqual(4);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(6);
        expect(selection.getEndKey()).toEqual(content.getFirstBlock().getKey());

        const entity = content.getEntity(content.getLastCreatedEntityKey());

        expect(entity.getType()).toBe('LINK');
        expect(entity.getData().link.href).toBe('http://wwww.sourcefabric.org');

        const block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            if (i < 4 || i >= 6) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['ADD_LINK_SUGGESTION-1']);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'ADD_LINK_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            link: {href: 'http://wwww.sourcefabric.org'},
            type: 'ADD_LINK_SUGGESTION',
        });
    });

    it('should add a new suggestion when link is changed', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 0, 6);
        editorState = Setup.addLink(editorState);

        let content = editorState.getCurrentContent();
        const key = content.getLastCreatedEntityKey();
        let entity = content.getEntity(key);

        editorState = Setup.applySelection(editorState, 0, 4, 0, 6);
        editorState = Setup.changeLinkSuggestion(editorState, entity, date);
        content = editorState.getCurrentContent();
        entity = content.getEntity(key);

        expect(entity.getType()).toBe('LINK');
        expect(entity.getData().link.href).toBe('http://dev.sourcefabric.org');

        const block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            if (i < 4 || i >= 6) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['CHANGE_LINK_SUGGESTION-1']);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'CHANGE_LINK_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            to: {href: 'http://dev.sourcefabric.org'},
            from: 'http://www.sourcefabric.org',
            type: 'CHANGE_LINK_SUGGESTION',
        });
    });

    it('should add a new suggestion when link is removed', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 0, 6);
        editorState = Setup.addLink(editorState);

        let content = editorState.getCurrentContent();
        const key = content.getLastCreatedEntityKey();
        let entity = content.getEntity(key);

        editorState = Setup.applySelection(editorState, 0, 4, 0, 6);
        editorState = Setup.removeLinkSuggestion(editorState, date);
        content = editorState.getCurrentContent();
        entity = content.getEntity(key);

        expect(entity.getType()).toBe('LINK');
        expect(entity.getData().link).toBe('http://www.sourcefabric.org');

        const block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            if (i < 4 || i >= 6) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['REMOVE_LINK_SUGGESTION-1']);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'REMOVE_LINK_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'REMOVE_LINK_SUGGESTION',
        });
    });
});
