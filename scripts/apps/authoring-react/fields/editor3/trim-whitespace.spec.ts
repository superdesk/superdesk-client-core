import {ContentState, convertFromRaw, convertToRaw} from 'draft-js';
import {CustomEditor3Entity} from 'core/editor3/constants';
import {editor3StateToHtml} from 'core/editor3/html/to-html/editor3StateToHtml';
import {createBlockAndContent, blocksWithText} from 'core/editor3/components/tests/utils';
import {trimWhitespaceForStorage} from './trim-whitespace';

function textOfBlocks(contentState: ContentState): Array<string> {
    return contentState.getBlocksAsArray().map((block) => block.getText());
}

function atomicEntityTypes(contentState: ContentState): Array<string> {
    return contentState.getBlocksAsArray()
        .filter((block) => block.getType() === 'atomic')
        .map((block) => {
            const entityKey = block.getEntityAt(0);

            return entityKey == null ? null : contentState.getEntity(entityKey).getType();
        });
}

describe('authoring-react editor3 trimWhitespaceForStorage', () => {
    beforeEach(window.module('superdesk.apps.spellcheck'));

    it('trims leading and trailing whitespace of text blocks', () => {
        const result = trimWhitespaceForStorage(
            blocksWithText([
                ['unstyled', 0, '   leading'],
                ['unstyled', 0, 'trailing   '],
                ['header-one', 0, '  both  '],
            ]),
        );

        expect(textOfBlocks(result)).toEqual(['leading', 'trailing', 'both']);
    });

    it('replaces multiple spaces inside a text block with a single space', () => {
        const result = trimWhitespaceForStorage(
            blocksWithText([['unstyled', 0, 'a    b']]),
        );

        expect(textOfBlocks(result)).toEqual(['a b']);
    });

    // regression: SDESK-7821. An atomic block's only character is a placeholder space carrying
    // the entity, so trimming it dropped the entity and the block's content was lost on save.
    [
        CustomEditor3Entity.TABLE,
        CustomEditor3Entity.MEDIA,
        CustomEditor3Entity.EMBED,
        CustomEditor3Entity.MULTI_LINE_QUOTE,
        CustomEditor3Entity.CUSTOM_BLOCK,
        CustomEditor3Entity.ARTICLE_EMBED,
    ].forEach((entityType) => {
        it(`keeps the entity of an atomic ${entityType} block`, () => {
            const {contentState} = createBlockAndContent(entityType, {data: {}});

            expect(atomicEntityTypes(contentState)).toEqual([entityType]);

            const result = trimWhitespaceForStorage(contentState);

            expect(atomicEntityTypes(result)).toEqual([entityType]);
        });
    });

    it('trims text blocks that sit next to an atomic block', () => {
        const contentState = convertFromRaw({
            blocks: [
                {
                    key: 'atomic1',
                    text: ' ',
                    type: 'atomic',
                    depth: 0,
                    inlineStyleRanges: [],
                    entityRanges: [{offset: 0, length: 1, key: 0}],
                    data: {},
                },
                {
                    key: 'text1',
                    text: '  padded  ',
                    type: 'unstyled',
                    depth: 0,
                    inlineStyleRanges: [],
                    entityRanges: [],
                    data: {},
                },
            ],
            entityMap: {
                0: {type: CustomEditor3Entity.TABLE, mutability: 'MUTABLE', data: {data: {}}},
            },
        } as any);

        const result = trimWhitespaceForStorage(contentState);

        expect(textOfBlocks(result)).toEqual([' ', 'padded']);
        expect(atomicEntityTypes(result)).toEqual([CustomEditor3Entity.TABLE]);
    });

    it('exports a table to html after trimming instead of an empty figure', () => {
        const cell = (text: string) => convertToRaw(ContentState.createFromText(text));
        const {contentState} = createBlockAndContent(CustomEditor3Entity.TABLE, {
            data: {
                numRows: 1,
                numCols: 2,
                cells: [[cell('cell text'), cell('')]],
            },
        });

        const html = editor3StateToHtml(trimWhitespaceForStorage(contentState));

        expect(html).toContain(
            '<table><tbody><tr><td><p>cell text</p></td><td></td></tr></tbody></table>',
        );
        expect(html).not.toContain('<figure>');
    });
});
