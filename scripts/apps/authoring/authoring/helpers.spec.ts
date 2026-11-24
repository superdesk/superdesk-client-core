import * as helpers from 'apps/authoring/authoring/helpers';

describe('authoring helpers', () => {
    it('cleanHTML - preserv multiple spaces', inject(() => {
        expect(helpers.cleanHtml('<b>c  c</b>')).toBe('c  c');
    }));

    describe('cutoffPreviousRenditions', () => {
        it('preserves the preview when replacing a gallery with its individual picture', () => {
            const previewHref = 'https://example.com/picture:800x800';
            const origItem = {
                associations: {
                    related_images: {
                        _id: 'gallery',
                        renditions: {
                            original: {href: previewHref},
                            thumbnail: {href: previewHref},
                            viewImage: {href: previewHref},
                            baseImage: {href: previewHref},
                        },
                    },
                },
            };
            const renditions = {
                original: {href: 'https://example.com/picture:1800x650'},
                thumbnail: {href: 'https://example.com/picture:600x140'},
                viewImage: {href: previewHref},
                baseImage: {href: 'https://example.com/picture:1800x650'},
            };
            const update = {
                associations: {related_images: {_id: 'picture', renditions}},
            };
            const expectedRenditions = {...renditions};

            helpers.cutoffPreviousRenditions(update, origItem);

            expect(renditions).toEqual(expectedRenditions);
        });

        it('preserves default renditions and removes only unchanged custom crops when the image changes', () => {
            const origRenditions = {
                original: {href: 'old-original'},
                baseImage: {href: 'base-image'},
                thumbnail: {href: 'thumbnail'},
                viewImage: {href: 'preview'},
                staleCrop: {href: 'old-crop'},
                updatedCrop: {href: 'old-updated-crop'},
            };
            const renditions: {[key: string]: {href: string}} = {
                ...origRenditions,
                original: {href: 'new-original'},
                updatedCrop: {href: 'new-updated-crop'},
            };
            const {staleCrop, ...expectedRenditions} = renditions;

            helpers.cutoffPreviousRenditions(
                {associations: {featuremedia: {renditions}}},
                {associations: {featuremedia: {renditions: origRenditions}}},
            );

            expect(renditions).toEqual(expectedRenditions);
        });

        it('preserves custom crops when the original image is unchanged', () => {
            const renditions = {
                original: {href: 'original'},
                customCrop: {href: 'custom-crop'},
            };
            const expectedRenditions = {...renditions};

            helpers.cutoffPreviousRenditions(
                {associations: {featuremedia: {renditions}}},
                {associations: {featuremedia: {renditions: {...renditions}}}},
            );

            expect(renditions).toEqual(expectedRenditions);
        });
    });
});
