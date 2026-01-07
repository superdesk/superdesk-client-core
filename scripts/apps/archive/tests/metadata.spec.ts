import {getMetadata} from 'apps/archive/parse-metadata';

const fetchFile = (filename: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open('GET', `/base/fixtures/${filename}`);
        xhr.responseType = 'blob';
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const file = new File([xhr.response], filename, {
                    type: xhr.getResponseHeader('Content-Type'),
                });

                resolve(file);
            } else {
                reject(new Error(`Failed to load file: ${xhr.status}`));
            }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send();
    });
};

const exiftoolFetchPolyfill = (url: string): Promise<Response> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open('GET', url);
        xhr.responseType = 'arraybuffer';

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = new Response(xhr.response, {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    headers: {
                        'Content-Type': 'application/wasm',
                    },
                });

                resolve(response);
            } else {
                reject(
                    new Error(`Failed to fetch ${url}: ${xhr.status} ${xhr.statusText}`),
                );
            }
        };

        xhr.onerror = () =>
            reject(new Error(`Network error while fetching ${url}`));
        xhr.send();
    });
};

const timeout = 10000; // 10s

xdescribe('process item metadata', () => {
    it('image metadata', async () => {
        const expected = {
            Keywords: ['Keyword1ref2014', 'Keyword2ref2014', 'Keyword3ref2014'],
            'By-line': 'Creator1 (ref2014)',
        };
        const file = await fetchFile('metadata.jpg');
        const result = await getMetadata(file, {
            fetch: exiftoolFetchPolyfill,
        });

        for (const [k, v] of Object.entries(expected)) expect(result[k]).toEqual(v);
    }, timeout);

    it('video metadata', async () => {
        const expected = {
            Headline: 'Your Headline 2',
            'By-line': ['Your Creator Name 6', 'Your Creator Name 6'],
        };
        const file = await fetchFile('metadata.mov');
        const result = await getMetadata(file, {
            fetch: exiftoolFetchPolyfill,
        });

        for (const [k, v] of Object.entries(expected)) expect(result[k]).toEqual(v);
    }, timeout);

    it('{} for item with no metadata', async () => {
        for (const filename of ['empty_metadata.jpg', 'empty_metadata.mov']) {
            const file = await fetchFile(filename);
            const result = await getMetadata(file, {
                fetch: exiftoolFetchPolyfill,
            });

            expect(result).toEqual({});
        }
    }, timeout);
});
