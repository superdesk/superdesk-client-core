import * as testUtils from '../../components/tests/utils';
import {AtomicBlockParser} from '../to-html';
import {ContentState, convertToRaw, convertFromRaw} from 'draft-js';
import {BlockInlineStyleWrapper, BlockEntityWrapper, HTMLGenerator} from '../to-html';
import {OrderedSet as OS} from 'immutable';

describe('core.editor3.html.to-html.HTMLGenerator', () => {
    it('should correctly parse lists', () => {
        const contentState = testUtils.blocksWithText([
            // style, depth, text
            ['unordered-list-item', 0, '1'],
            ['unordered-list-item', 0, '2'],
            ['unordered-list-item', 1, '11'],
            ['unordered-list-item', 1, '22'],
            ['unordered-list-item', 1, '3'],
            ['unordered-list-item', 2, '4'],
            ['unordered-list-item', 2, '5'],
            ['unordered-list-item', 3, '6'],
            ['unordered-list-item', 3, '6.5'],
            ['unordered-list-item', 2, 'x'],
            ['unordered-list-item', 1, '7'],
            ['unordered-list-item', 1, '33'],
            ['unordered-list-item', 0, '8'],
        ]);

        const result = new HTMLGenerator(contentState).html();

        expect(result).toBe(`
            <ul>
                <li>1</li>
                <li>2
                    <ul>
                        <li>11</li>
                        <li>22</li>
                        <li>3
                            <ul>
                                <li>4</li>
                                <li>5
                                    <ul>
                                        <li>6</li>
                                        <li>6.5</li>
                                    </ul>
                                </li>
                                <li>x</li>
                            </ul>
                        </li>
                        <li>7</li>
                        <li>33</li>
                    </ul>
                </li>
                <li>8</li>
            </ul>`.replace(/[\n\r\s]+/g, ''));
    });

    it('should correctly parse abruptly ending lists', () => {
        const contentState = testUtils.blocksWithText([
            // style, depth, text
            ['unordered-list-item', 0, '1'],
            ['unordered-list-item', 1, '2'],
            ['unordered-list-item', 2, '3'],
            ['unordered-list-item', 3, '4'],
            ['unstyled', 0, 'abc'],
        ]);

        const result = new HTMLGenerator(contentState).html();

        expect(result).toBe(`
            <ul>
                <li>
                    1
                    <ul>
                        <li>2
                            <ul>
                                <li>
                                    3
                                    <ul><li>4</li></ul>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </li>
            </ul><p>abc</p>`.replace(/[\n\r\s]+/g, ''));
    });

    it('should add anotation to HTML', () => {
        const rawContentState = {
            entityMap: {},
            blocks: [{
                inlineStyleRanges: [{
                    length: 5,
                    style: 'ANNOTATION-1',
                    offset: 6,
                }, {
                    length: 5,
                    style: 'ANNOTATION-2',
                    offset: 12,
                }],
                data: {
                    MULTIPLE_HIGHLIGHTS: {
                        lastHighlightIds: {ANNOTATION: 2},
                        highlightsData: {
                            'ANNOTATION-1': {
                                data: {
                                    email: 'admin@admin.ro',
                                    date: '2018-03-30T14:57:53.172Z',
                                    msg: '{"blocks":[{"key":"ejm11","text":"Annotation 1","type":"unstyled",' +
                                        '"depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],' +
                                        '"entityMap":{}}',
                                    author: 'admin',
                                    annotationType: 'regular',
                                },
                                type: 'ANNOTATION',
                            },
                            'ANNOTATION-2': {
                                data: {
                                    email: 'admin@admin.ro',
                                    date: '2018-03-30T14:58:20.876Z',
                                    msg: '{"blocks":[{"key":"9i73f","text":"Annotation 2","type":"unstyled",' +
                                        '"depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},' +
                                        '{"key":"d3vb3","text":"Line 2","type":"unstyled","depth":0,' +
                                        '"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
                                    author: 'admin',
                                    annotationType: 'regular',
                                },
                                type: 'ANNOTATION',
                            },
                        },
                    },
                },
                text: 'lorem ipsum dolor',
                type: 'unstyled',
                depth: 0,
                key: '2sso6',
                entityRanges: [],
            }],
        };
        const result = new HTMLGenerator(convertFromRaw(rawContentState)).html();

        expect(result).toBe('<p>lorem ' +
            '<span annotation-id="1">ipsum</span> ' +
            '<span annotation-id="2">dolor</span></p>');
    });
});

describe('core.editor3.html.to-html.AtomicBlockParser', () => {
    it('should correctly parse embeds', () => {
        const {block, contentState} = testUtils.embedBlockAndContent();
        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<div class="embed-block"><h1>Embed Title</h1></div>');
    });

    it('should correctly parse images', () => {
        const {block, contentState} = testUtils.imageBlockAndContent();
        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<div class="media-block"><img src="image_href" alt="image_alt_text" />' +
            '<span class="media-block__description">image_description</span></div>');
    });

    it('should correctly parse images without alt and description', () => {
        const {block, contentState} = testUtils.createBlockAndContent('MEDIA', {
            media: {renditions: {original: {href: 'image_href'}}},
        });

        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<div class="media-block"><img src="image_href" alt="" /></div>');
    });

    it('should correctly parse tables', () => {
        const cs = (txt) => convertToRaw(ContentState.createFromText(txt));
        const {contentState, block} = testUtils.createBlockAndContent('TABLE', {
            data: {
                numCols: 3,
                numRows: 2,
                cells: [
                    [cs('a'), undefined, cs('c')],
                    [cs('d'), cs('e'), cs('f')],
                ],
            },
        });

        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<table><tbody><tr><td><p>a</p></td><td></td><td><p>c</p></td></tr>' +
            '<tr><td><p>d</p></td><td><p>e</p></td><td><p>f</p></td></tr></tbody></table>');
    });

    it('should correctly parse single row tables', () => {
        const cs = (txt) => convertToRaw(ContentState.createFromText(txt));
        const {contentState, block} = testUtils.createBlockAndContent('TABLE', {
            data: {
                numCols: 3,
                numRows: 1,
                cells: [[cs('a'), cs('b'), cs('c')]],
            },
        });

        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<table><tbody><tr><td><p>a</p></td><td><p>b</p></td><td><p>c</p></td></tr></tbody></table>');
    });

    it('should correctly parse tables with headers', () => {
        const cs = (txt) => convertToRaw(ContentState.createFromText(txt));
        const {contentState, block} = testUtils.createBlockAndContent('TABLE', {
            data: {
                numCols: 3,
                numRows: 3,
                withHeader: true,
                cells: [
                    [cs('a'), undefined, cs('c')],
                    [cs('d'), cs('e'), cs('f')],
                    [cs('g'), cs('h'), cs('i')],
                ],
            },
        });

        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<table><thead><tr><th><p>a</p></th><th></th><th><p>c</p></th></tr></thead>' +
            '<tbody><tr><td><p>d</p></td><td><p>e</p></td><td><p>f</p></td></tr>' +
            '<tr><td><p>g</p></td><td><p>h</p></td><td><p>i</p></td></tr></tbody></table>');
    });

    it('should correctly parse single row tables with headers', () => {
        const cs = (txt) => convertToRaw(ContentState.createFromText(txt));
        const {contentState, block} = testUtils.createBlockAndContent('TABLE', {
            data: {
                numCols: 3,
                numRows: 1,
                withHeader: true,
                cells: [[cs('a'), cs('b'), cs('c')]],
            },
        });

        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<table><thead><tr><th><p>a</p></th><th><p>b</p></th><th><p>c</p></th></tr></thead></table>');
    });

    it('should correctly parse empty tables', () => {
        const {contentState, block} = testUtils.createBlockAndContent('TABLE', {
            data: {
                numCols: 3,
                numRows: 2,
                cells: [],
            },
        });

        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<table><tbody><tr><td></td><td></td><td></td></tr>' +
            '<tr><td></td><td></td><td></td></tr></tbody></table>');
    });
});

describe('core.editor3.html.to-html.BlockInlineStyleWrapper', () => {
    it('should get correct tags', () => {
        const wrapper = new BlockInlineStyleWrapper();

        expect(wrapper.tags(OS([]))).toEqual('');
        expect(wrapper.tags(OS(['BOLD', 'ITALIC']))).toEqual('<b><i>');
        expect(wrapper.tags(OS(['BOLD', 'ITALIC']))).toEqual('');
        expect(wrapper.tags(OS(['ITALIC']))).toEqual('</i></b><i>');
        expect(wrapper.tags(OS(['ITALIC', 'UNDERLINE']))).toEqual('<u>');
        expect(wrapper.tags(OS(['UNDERLINE', 'BOLD']))).toEqual('</u></i><u><b>');
        expect(wrapper.tags(OS([]))).toEqual('</b></u>');
        expect(wrapper.tags(OS(['ITALIC', 'UNDERLINE']))).toEqual('<i><u>');

        expect(wrapper.flush()).toEqual('</u></i>');
        expect(wrapper.flush()).toEqual('');

        expect(wrapper.tags(OS(['SUBSCRIPT']))).toEqual('<sub>');
        expect(wrapper.tags(OS(['SUPERSCRIPT']))).toEqual('</sub><sup>');
        expect(wrapper.tags(OS(['STRIKETHROUGH']))).toEqual('</sup><s>');
    });
});

describe('core.editor3.html.to-html.BlockEntityWrapper', () => {
    it('should get correct tags', () => {
        const contentState = ContentState.createFromText('abcdefghijklmn');

        const ek = [ // entity keys
            contentState.createEntity('LINK', 'MUTABLE', {url: 'abc'}).getLastCreatedEntityKey(),
            contentState.createEntity('LINK', 'MUTABLE', {url: 'def'}).getLastCreatedEntityKey(),
            contentState.createEntity('LINK', 'MUTABLE', {url: 'jkl'}).getLastCreatedEntityKey(),
        ];

        const wrapper = new BlockEntityWrapper(contentState);

        expect(wrapper.tags(ek[0])).toEqual('<a href="abc">');
        expect(wrapper.tags(ek[1])).toEqual('</a><a href="def">');
        expect(wrapper.tags(ek[1])).toEqual('');
        expect(wrapper.tags(ek[1])).toEqual('');
        expect(wrapper.tags()).toEqual('</a>');
        expect(wrapper.tags(ek[2])).toEqual('<a href="jkl">');
        expect(wrapper.tags(ek[2])).toEqual('');

        expect(wrapper.flush()).toEqual('</a>');
        expect(wrapper.flush()).toEqual('');
    });
});
