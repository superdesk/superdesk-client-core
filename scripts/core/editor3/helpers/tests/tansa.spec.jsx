import * as Setup from '../../reducers/tests/suggestion_setup';
import {getTansaHtml, setTansaHtml} from '../tansa';

describe('editor3.helpers.tansa', () => {
    it('should generate the tansa custom html', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };

        let editorState = Setup.getInitialEditorState(rawContent);

        expect(getTansaHtml(editorState)).toEqual(
            '<p id="text-4vu4i">paragraph1</p>\n<p id="text-9d99u">paragraph2</p>\n');
    });

    it('should update the text added', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };

        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = setTansaHtml(editorState,
            '<p id="text-4vu4i">para-graph-1</p>\n<p id="text-9d99u">para-graph-2</p>\n');

        const content = editorState.getCurrentContent();
        const firstBlock = content.getFirstBlock();
        const lastBlock = content.getLastBlock();

        expect(firstBlock.getText()).toEqual('para-graph-1');
        expect(lastBlock.getText()).toEqual('para-graph-2');
    });

    it('should update the text deleted', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };

        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = setTansaHtml(editorState, '<p id="text-4vu4i">pargrap1</p>\n<p id="text-9d99u">pargrap2</p>\n');

        const content = editorState.getCurrentContent();
        const firstBlock = content.getFirstBlock();
        const lastBlock = content.getLastBlock();

        expect(firstBlock.getText()).toEqual('pargrap1');
        expect(lastBlock.getText()).toEqual('pargrap2');
    });

    it('should generate the tansa custom html for media description', () => {
        const rawContent = {
            blocks: [
                {
                    key: '4vu4i', text: ' ', type: 'atomic',
                    entityRanges: [{key: 0, offset: 0, length: 1}],
                },
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {
                0: {
                    type: 'MEDIA',
                    mutability: 'MUTABLE',
                    data: {
                        media: {
                            description_text: 'description',
                            alt_text: 'alt',
                            headline: 'headline',
                        },
                    },
                },
            },
        };

        let editorState = Setup.getInitialEditorState(rawContent);

        const tansaHtml = '<p id="description-4vu4i">description</p>\n'
            + '<p id="alt-4vu4i">alt</p>\n'
            + '<p id="headline-4vu4i">headline</p>\n'
            + '<p id="text-9d99u">paragraph2</p>\n';

        expect(getTansaHtml(editorState)).toEqual(tansaHtml);
    });

    it('should update the description of media', () => {
        const rawContent = {
            blocks: [
                {
                    key: '4vu4i', text: ' ', type: 'atomic',
                    entityRanges: [{key: 0, offset: 0, length: 1}],
                },
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {
                0: {
                    type: 'MEDIA',
                    mutability: 'MUTABLE',
                    data: {
                        media: {
                            description_text: 'description',
                            alt_text: 'alt',
                            headline: 'headline',
                        },
                    },
                },
            },
        };

        let editorState = Setup.getInitialEditorState(rawContent);

        const tansaHtml = '<p id="description-4vu4i">paragraph1</p>\n'
            + '<p id="alt-4vu4i">paragraph2</p>\n'
            + '<p id="headline-4vu4i">paragraph3</p>\n'
            + '<p id="text-9d99u">paragraph4</p>\n';

        editorState = setTansaHtml(editorState, tansaHtml);

        const content = editorState.getCurrentContent();
        const block = content.getFirstBlock();

        expect(block.getText()).toEqual(' ');

        const entityKey = block.getEntityAt(0);
        const entity = content.getEntity(entityKey);
        const data = entity.getData();

        expect(data.media.description_text).toEqual('paragraph1');
        expect(data.media.alt_text).toEqual('paragraph2');
        expect(data.media.headline).toEqual('paragraph3');
    });
});
