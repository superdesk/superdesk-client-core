import * as testUtils from '../../components/tests/utils';
import {AtomicBlockParser} from '../to-html';
import {ContentState, convertToRaw} from 'draft-js';
import {BlockInlineStyleWrapper, BlockEntityWrapper} from '../to-html';
import {OrderedSet as OS} from 'immutable';

describe('core.editor3.html.to-html.AtomicBlockParser', () => {
    it('should correctly parse embeds', () => {
        const {block, contentState} = testUtils.embedBlockAndContent();
        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<div class="embed-block"><h1>Embed Title</h1></div>');
    });

    it('should correctly parse images', () => {
        const {block, contentState} = testUtils.imageBlockAndContent();
        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<div class="image-block"><img src="image_href" alt="image_alt_text" />' +
            '<span class="image-block__description">image_description</span></div>');
    });

    it('should correctly parse images without alt and description', () => {
        const {block, contentState} = testUtils.createBlockAndContent('IMAGE', {
            img: {renditions: {original: {href: 'image_href'}}}
        });

        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<div class="image-block"><img src="image_href" alt="" /></div>');
    });

    it('should correctly parse tables', () => {
        const cs = (txt) => convertToRaw(ContentState.createFromText(txt));
        const {contentState, block} = testUtils.createBlockAndContent('TABLE', {
            data: {
                numCols: 3,
                numRows: 2,
                cells: [
                    [cs('a'), undefined, cs('c')],
                    [cs('d'), cs('e'), cs('f')]
                ]
            }
        });

        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<table><tbody><tr><td><p>a</p></td><td><p></p></td><td><p>c</p></td></tr>' +
            '<tr><td><p>d</p></td><td><p>e</p></td><td><p>f</p></td></tr></tbody></table>');
    });

    it('should correctly parse empty tables', () => {
        const {contentState, block} = testUtils.createBlockAndContent('TABLE', {
            data: {
                numCols: 3,
                numRows: 2,
                cells: []
            }
        });

        const html = new AtomicBlockParser(contentState).parse(block);

        expect(html).toBe('<table><tbody><tr><td><p></p></td><td><p></p></td><td><p></p></td></tr>' +
            '<tr><td><p></p></td><td><p></p></td><td><p></p></td></tr></tbody></table>');
    });
});

describe('core.editor3.html.to-html.BlockInlineStyleWrapper', () => {
    it('should get correct tags', () => {
        const wrapper = new BlockInlineStyleWrapper();

        expect(wrapper.tags(OS([]))).toEqual('');
        expect(wrapper.tags(OS(['BOLD', 'ITALIC']))).toEqual('<b><i>');
        expect(wrapper.tags(OS(['BOLD', 'ITALIC']))).toEqual('');
        expect(wrapper.tags(OS(['ITALIC']))).toEqual('</b>');
        expect(wrapper.tags(OS(['ITALIC', 'UNDERLINE']))).toEqual('<u>');
        expect(wrapper.tags(OS(['UNDERLINE', 'BOLD']))).toEqual('</i><b>');
        expect(wrapper.tags(OS([]))).toEqual('</u></b>');
        expect(wrapper.tags(OS(['ITALIC', 'UNDERLINE']))).toEqual('<i><u>');

        expect(wrapper.flush()).toEqual('</u></i>');
        expect(wrapper.flush()).toEqual('');
    });
});

describe('core.editor3.html.to-html.BlockEntityWrapper', () => {
    it('should get correct tags', () => {
        const contentState = ContentState.createFromText('abcdefghijklmn');

        const ek = [ // entity keys
            contentState.createEntity('LINK', 'MUTABLE', {url: 'abc'}).getLastCreatedEntityKey(),
            contentState.createEntity('LINK', 'MUTABLE', {url: 'def'}).getLastCreatedEntityKey(),
            contentState.createEntity('LINK', 'MUTABLE', {url: 'jkl'}).getLastCreatedEntityKey()
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
