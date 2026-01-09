import {getMetadata} from 'apps/archive/parse-metadata';
import metadataImage from '../../../../fixtures/metadata.jpg';
import emptyImage from '../../../../fixtures/empty_metadata.jpg';
import metadataVideo from '../../../../fixtures/metadata.mov';
import emptyVideo from '../../../../fixtures/empty_metadata.mov';

const fetchFile = (filename: string): Promise<File> =>
    fetch(filename).then((res) =>
        res.blob().then((blob) => new File([blob], filename, {type: blob.type})),
    );

const timeout = 10000; // 10s

describe('process item metadata', () => {
    beforeEach(() => {
        const iframe = document.createElement('iframe');

        document.body.appendChild(iframe);
        const nativeFetch = iframe.contentWindow.fetch.bind(window);

        document.body.removeChild(iframe);

        spyOn(window, 'fetch').and.callFake((...args) => {
            return nativeFetch(...args);
        });
    });


    it('image metadata', async () => {
        const expected = {
            Keywords: ['Keyword1ref2014', 'Keyword2ref2014', 'Keyword3ref2014'],
            'By-line': 'Creator1 (ref2014)',
        };
        const file = await fetchFile(metadataImage);
        const result = await getMetadata(file);

        for (const [k, v] of Object.entries(expected)) expect(result[k]).toEqual(v);
    }, timeout);

    it('video metadata', async () => {
        const expected = {
            Headline: 'Your Headline 2',
            'By-line': ['Your Creator Name 6', 'Your Creator Name 6'],
        };
        const file = await fetchFile(metadataVideo);
        const result = await getMetadata(file);

        for (const [k, v] of Object.entries(expected)) expect(result[k]).toEqual(v);
    }, timeout);

    it('{} for item with no metadata', async () => {
        for (const filename of [emptyImage, emptyVideo]) {
            const file = await fetchFile(filename);
            const result = await getMetadata(file);

            expect(result).toEqual({});
        }
    }, timeout);
});
