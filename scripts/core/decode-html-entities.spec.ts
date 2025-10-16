import {decodeHtmlEntities} from './decode-html-entities';

it('decodes HTML entities and keeps HTML tags', () => {
    expect(decodeHtmlEntities('<h1>hello world &sect;<h1>')).toBe('<h1>hello world §<h1>');
});
