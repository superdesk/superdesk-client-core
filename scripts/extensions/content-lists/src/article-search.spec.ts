import {IArticle} from 'superdesk-api';
import {searchArticles} from './article-search';
import {superdeskMock} from './tests/superdesk-mock';

function article(overrides: Partial<IArticle>): Partial<IArticle> {
    return {
        _id: 'article-1',
        guid: 'guid-1',
        headline: 'Headline',
        state: 'published' as IArticle['state'],
        _created: '2024-01-01T00:00:00+0000',
        _updated: '2024-01-02T00:00:00+0000',
        ...overrides,
    };
}

function respondWith(items: Array<Partial<IArticle>>, total: number): jasmine.Spy {
    return spyOn(superdeskMock, 'httpRequestJsonLocal').and.returnValue(
        Promise.resolve({
            _items: items,
            _meta: {total, page: 1, max_results: 20},
            _links: {},
        }),
    );
}

describe('searchArticles', () => {
    it('searches the published collection excluding superseded and killed versions', (done) => {
        const httpSpy = respondWith([], 0);

        searchArticles('published', '', 0).then(() => {
            expect(httpSpy).toHaveBeenCalledWith({
                method: 'GET',
                path: '/published',
                urlParams: {
                    source: {
                        query: {
                            bool: {
                                must: [{term: {type: 'text'}}],
                                must_not: [
                                    {term: {last_published_version: false}},
                                    {terms: {state: ['killed', 'recalled', 'scheduled']}},
                                ],
                            },
                        },
                        from: 0,
                        size: 20,
                        sort: [{versioncreated: 'desc'}],
                    },
                },
            });

            done();
        });
    });

    it('adds a query string filter and paging offset to published searches', (done) => {
        const httpSpy = respondWith([], 0);

        searchArticles('published', 'budget', 2).then(() => {
            const request = httpSpy.calls.mostRecent().args[0];
            const source = request.urlParams?.source as {
                from: number;
                query: {bool: {must: Array<{}>}};
            };

            expect(source.from).toBe(40);
            expect(source.query.bool.must).toContain({
                query_string: {
                    query: 'budget',
                    lenient: true,
                    default_operator: 'AND',
                },
            });

            done();
        });
    });

    it('searches the archive for in-progress articles', (done) => {
        const httpSpy = respondWith([], 0);

        searchArticles('in_progress', '', 0).then(() => {
            expect(httpSpy).toHaveBeenCalledWith({
                method: 'GET',
                path: '/search',
                urlParams: {
                    repo: 'archive',
                    source: {
                        query: {
                            bool: {
                                must: [{term: {state: 'in_progress'}}, {term: {type: 'text'}}],
                            },
                        },
                        from: 0,
                        size: 20,
                        sort: [{versioncreated: 'desc'}],
                    },
                },
            });

            done();
        });
    });

    it('adds a query string filter to archive searches', (done) => {
        const httpSpy = respondWith([], 0);

        searchArticles('in_progress', 'sports', 1).then(() => {
            const request = httpSpy.calls.mostRecent().args[0];
            const source = request.urlParams?.source as {
                from: number;
                query: {bool: {must: Array<{}>}};
            };

            expect(source.from).toBe(20);
            expect(source.query.bool.must).toContain({term: {state: 'in_progress'}});
            expect(source.query.bool.must).toContain({
                query_string: {
                    query: 'sports',
                    lenient: true,
                    default_operator: 'AND',
                },
            });

            done();
        });
    });

    it('searches the published collection for scheduled articles', (done) => {
        const httpSpy = respondWith([], 0);

        searchArticles('scheduled', '', 0).then(() => {
            expect(httpSpy).toHaveBeenCalledWith({
                method: 'GET',
                path: '/published',
                urlParams: {
                    source: {
                        query: {
                            bool: {
                                must: [{term: {type: 'text'}}, {term: {state: 'scheduled'}}],
                                must_not: [{term: {last_published_version: false}}],
                            },
                        },
                        from: 0,
                        size: 20,
                        sort: [{versioncreated: 'desc'}],
                    },
                },
            });

            done();
        });
    });

    it('maps articles to list entries', (done) => {
        respondWith(
            [article({
                associations: {
                    featuremedia: {
                        renditions: {
                            thumbnail: {href: 'https://example.com/thumb.jpg'},
                            viewImage: {href: 'https://example.com/view.jpg'},
                        },
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any,
                },
                anpa_category: [{name: 'News', qcode: 'n'}],
                publish_schedule: '2030-01-01T00:00:00+0000',
            })],
            7,
        );

        searchArticles('published', '', 0).then((result) => {
            expect(result.total).toBe(7);
            expect(result.entries).toEqual([{
                uid: 'guid-1',
                contentId: 'guid-1',
                title: 'Headline',
                state: 'published',
                category: 'News',
                updated: '2024-01-02T00:00:00+0000',
                created: '2024-01-01T00:00:00+0000',
                publishSchedule: '2030-01-01T00:00:00+0000',
                thumbnailUrl: 'https://example.com/thumb.jpg',
                sticky: false,
                stickyPosition: null,
                dangling: false,
            }]);

            done();
        });
    });

    it('falls back to _id, viewImage rendition and version dates', (done) => {
        respondWith(
            [article({
                guid: undefined,
                headline: undefined,
                _created: undefined,
                _updated: undefined,
                firstcreated: '2024-03-01T00:00:00+0000',
                versioncreated: '2024-03-02T00:00:00+0000',
                associations: {
                    featuremedia: {
                        renditions: {
                            viewImage: {href: 'https://example.com/view.jpg'},
                        },
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any,
                },
            })],
            1,
        );

        searchArticles('published', '', 0).then((result) => {
            const entry = result.entries[0];

            expect(entry.uid).toBe('article-1');
            expect(entry.contentId).toBe('article-1');
            expect(entry.title).toBe('');
            expect(entry.created).toBe('2024-03-01T00:00:00+0000');
            expect(entry.updated).toBe('2024-03-02T00:00:00+0000');
            expect(entry.thumbnailUrl).toBe('https://example.com/view.jpg');

            done();
        });
    });
});
