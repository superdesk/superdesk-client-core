import htmlToConvertFrom from './from-html-spec.snapshot.html';
import expectedResultJson from './from-html-spec.snapshot.json';
import {getContentStateFromHtml} from 'core/editor3/html/from-html/index';
import {convertToRaw} from 'draft-js';

// be aware that it will exclude from comparison not only draft-keys, but everything which looks like it
// including the payload in entities and data on blocks

// It's useful to have it this way since we have nested draft-js states
// in the playload of blocks which are used for comments/annotations
const removeKeys = (rawContentStateJson) => rawContentStateJson.replace(/"key":"[a-z0-9]{1,5}",/g, '');

describe('core.editor3.html.from-html', () => {
    it('matches the snapshot', () => {
        const computedResult = removeKeys(JSON.stringify(convertToRaw(getContentStateFromHtml(htmlToConvertFrom))));

        expect(computedResult).toBe(removeKeys(JSON.stringify(expectedResultJson)));
    });
});

