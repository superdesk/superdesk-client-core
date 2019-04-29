import {insertEntity} from './draftInsertEntity';
import {convertFromRaw, SelectionState, EditorState, RawDraftContentState, convertToRaw} from 'draft-js';

// removes keys from blocks and their entity ranges so resulting objects can be compared by value as JSON strings
function getRawContentStateWithoutBlockAndEntityKeys(
    rawContentState: RawDraftContentState,
): Partial<RawDraftContentState> {
    return {
        ...rawContentState,
        blocks: rawContentState.blocks.map((block) => {
            const nextBlock = {...block, entityRanges: block.entityRanges.map((range) => {
                const newRange = {...range};

                delete newRange.key;

                return newRange;
            })};

            delete nextBlock.key;

            return nextBlock;
        }),
    };
}

describe('draftInsertEntity', () => {
    it('inserting a block should not affect the content of existing blocks', () => {

        // It used to lose block's data when dragging an image above a table in the editor

        // tslint:disable-next-line:max-line-length whitespace
        const rawStateInitial = {"blocks":[{"key":"aglaa","text":"alpha","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"fj7f7","text":" ","type":"atomic","depth":0,"inlineStyleRanges":[],"entityRanges":[{"offset":0,"length":1,"key":0}],"data":{"data":"{\"numRows\":1,\"numCols\":2,\"cells\":[[{\"blocks\":[{\"key\":\"5870d\",\"text\":\"a\",\"type\":\"unstyled\",\"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}},{\"blocks\":[{\"key\":\"jbsj\",\"text\":\"b\",\"type\":\"unstyled\",\"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}]],\"withHeader\":false}"}},{"key":"3m10i","text":"bravo","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{"0":{"type":"TABLE","mutability":"MUTABLE","data":{"data":{"numRows":1,"numCols":2,"cells":[[{"blocks":[{"key":"5870d","text":"a","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}},{"blocks":[{"key":"jbsj","text":"b","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}]],"withHeader":false}}}}} as RawDraftContentState;
        const contentState = convertFromRaw(rawStateInitial);
        const selection = new SelectionState({
            "anchorKey": "fj7f7",
            "anchorOffset": 0,
            "focusKey": "fj7f7",
            "focusOffset": 1,
            "isBackward": false,
            "hasFocus": true,
        });
        const editorState = EditorState.acceptSelection(EditorState.createWithContent(contentState), selection);

        const editorStateAfterEntityInsertion = insertEntity(
            editorState,
            'MEDIA',
            'MUTABLE',
            {test: 'charlie'},
            'aglaa',
        );
        const rawStateAfterEntityInsertion = convertToRaw(editorStateAfterEntityInsertion.getCurrentContent());
        const rawStateAfterEntityInsertionWithoutTheNewBlock = {
            ...rawStateAfterEntityInsertion,
            blocks: rawStateAfterEntityInsertion.blocks.filter((block, i) => i !== 1),
        };

        expect(rawStateAfterEntityInsertion.blocks.length).toBe(rawStateInitial.blocks.length + 1);

        expect(
            JSON.stringify(
                getRawContentStateWithoutBlockAndEntityKeys(rawStateInitial).blocks,
            ),
        ).toBe(
            JSON.stringify(
                getRawContentStateWithoutBlockAndEntityKeys(rawStateAfterEntityInsertionWithoutTheNewBlock,
            ).blocks),
        );
    });
});
