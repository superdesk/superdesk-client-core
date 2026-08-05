import React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {IArticle, IExposedFromAuthoring} from 'superdesk-api';
import ng from 'core/services/ng';
import {ToolbarContextProvider} from '../toolbar-context';
import {HeaderGeneralInfoWidget} from '../header-general-info-widget';
import {HeaderStateLabels} from '../header-state-labels';
import {HeaderTranslations} from '../header-translations';
import {TRANSLATIONS_WIDGET_ID} from 'apps/authoring-react/article-widgets/translations/constants';

interface IAngularStubs {
    relatedItems?: Array<Partial<IArticle>>;
    action?: string;
    translationsEnabled?: boolean;
    translations?: Array<Partial<IArticle>> | null;
    masterItem?: Partial<IArticle> | null;
    broadcastSpy?: jasmine.Spy;
}

/**
 * The header sub-blocks reach for angular services in componentDidMount, and the karma bootstrap
 * never registers an $injector, so ng.get has to be stubbed or every mount throws.
 */
function stubAngular({
    relatedItems = [],
    action = 'edit',
    translationsEnabled = false,
    translations = null,
    masterItem = null,
    broadcastSpy = jasmine.createSpy('$broadcast'),
}: IAngularStubs = {}) {
    spyOn(ng, 'get').and.callFake((name: string) => {
        switch (name) {
            case 'archiveService':
                return {getRelatedItems: () => Promise.resolve({_items: relatedItems})};
            case 'authoringWorkspace':
                return {getAction: () => action};
            case 'TranslationService':
                return {
                    translationsEnabled: () => translationsEnabled,
                    getTranslations: () => translations == null
                        ? Promise.reject('translation_id is not present')
                        : Promise.resolve({_items: translations}),
                };
            case 'api':
                return {
                    find: () => masterItem == null
                        ? Promise.reject('not found')
                        : Promise.resolve(masterItem),
                };
            case '$rootScope':
                return {$broadcast: broadcastSpy};
            case 'notify':
                return {error: () => undefined};
            default:
                throw new Error(`unexpected ng.get('${name}') in test`);
        }
    });

    return broadcastSpy;
}

// The widget only reads exposed.getLatestItem() and exposed.toggleSideWidget();
// the rest of the interface is irrelevant here.
function makeExposed(
    getLatestItem: () => IArticle,
    toggleSideWidget: (id: string | null) => void = () => undefined,
): IExposedFromAuthoring<IArticle> {
    return {getLatestItem, toggleSideWidget} as IExposedFromAuthoring<IArticle>;
}

function renderWith(item: Partial<IArticle>, toggleSideWidget?: (id: string | null) => void) {
    return mount(
        <ToolbarContextProvider
            exposed={makeExposed(() => item as IArticle, toggleSideWidget)}
            authoringStorage={null}
        >
            <HeaderGeneralInfoWidget entity={item as IArticle} />
        </ToolbarContextProvider>,
    );
}

/** Lets the componentDidMount promises settle before asserting on async blocks. */
async function settle(wrapper: ReactWrapper) {
    await Promise.resolve();
    await Promise.resolve();
    wrapper.update();
}

describe('authoring-react header general info row', () => {
    describe('word count', () => {
        it('counts words in body_html the way the legacy header did (strips tags)', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text', body_html: '<p>one two three four</p>'});

            expect(wrapper.find('[data-test-id="authoring-header-word-count"]').prop('data-test-value')).toBe('4');
        });

        it('re-reads the latest item on re-render, so the count tracks live edits', () => {
            stubAngular();

            // entity stays stale on purpose: this is what makes the test discriminate, passing only
            // if the widget reads getLatestItem() rather than the entity prop.
            const staleEntity = {type: 'text', body_html: '<p>only two</p>'} as IArticle;
            let latest: Partial<IArticle> = {type: 'text', body_html: '<p>only two</p>'};

            const wrapper = mount(
                <ToolbarContextProvider
                    exposed={makeExposed(() => latest as IArticle)}
                    authoringStorage={null}
                >
                    <HeaderGeneralInfoWidget entity={staleEntity} />
                </ToolbarContextProvider>,
            );

            expect(wrapper.find('[data-test-id="authoring-header-word-count"]').prop('data-test-value')).toBe('2');

            latest = {type: 'text', body_html: '<p>one two three four</p>'};
            wrapper.setProps({children: <HeaderGeneralInfoWidget entity={staleEntity} />});

            expect(wrapper.find('[data-test-id="authoring-header-word-count"]').prop('data-test-value')).toBe('4');
        });

        it('renders a zero count for an empty body', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text', body_html: ''});

            expect(wrapper.find('[data-test-id="authoring-header-word-count"]').prop('data-test-value')).toBe('0');
        });

        it('renders no word count for non-text items', () => {
            stubAngular();
            const wrapper = renderWith({type: 'picture', body_html: '<p>ignored</p>'});

            expect(wrapper.find('[data-test-id="authoring-header-word-count"]').exists()).toBe(false);
        });
    });

    describe('source', () => {
        it('renders the source when present', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text', body_html: '<p>x</p>', source: 'AAP'});

            const source = wrapper.find('[data-test-id="authoring-header-source"]');

            expect(source.prop('data-test-value')).toBe('AAP');
            expect(source.text()).toContain('AAP');
        });

        it('hides the source block when there is no source', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text', body_html: '<p>x</p>'});

            expect(wrapper.find('[data-test-id="authoring-header-source"]').exists()).toBe(false);
        });

        // Legacy renders SOURCE with no ng-if on the item type, so suppressing it for pictures,
        // packages and the rest was a porting bug.
        it('renders the source for non-text items too', () => {
            stubAngular();
            const wrapper = renderWith({type: 'picture', source: 'Reuters'});

            expect(wrapper.find('[data-test-id="authoring-header-source"]').prop('data-test-value')).toBe('Reuters');
        });

        it('renders the source for composite items', () => {
            stubAngular();
            const wrapper = renderWith({type: 'composite', source: 'Superdesk'});

            expect(wrapper.find('[data-test-id="authoring-header-source"]').prop('data-test-value')).toBe('Superdesk');
        });
    });

    describe('signal', () => {
        it('renders the signal name when it has one', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text', signal: [{qcode: 'cwarn', name: 'Correction warning'}]});

            expect(wrapper.find('[data-test-id="authoring-header-signal"]').text()).toContain('Correction warning');
        });

        it('falls back to the signal qcode when there is no name', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text', signal: [{qcode: 'cwarn'}]});

            expect(wrapper.find('[data-test-id="authoring-header-signal"]').text()).toContain('cwarn');
        });

        it('renders every signal of a multi-signal item', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text', signal: [{qcode: 'cwarn'}, {qcode: 'update', name: 'Update'}]});

            const text = wrapper.find('[data-test-id="authoring-header-signal"]').text();

            expect(text).toContain('cwarn');
            expect(text).toContain('Update');
        });

        it('hides the signal block when the item has no signal', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text'});

            expect(wrapper.find('[data-test-id="authoring-header-signal"]').exists()).toBe(false);
        });
    });

    describe('correction sequence', () => {
        it('renders the correction sequence as the UPDATE value', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text', correction_sequence: 3});

            const update = wrapper.find('[data-test-id="authoring-header-correction-sequence"]');

            expect(update.prop('data-test-value')).toBe('3');
            expect(update.text()).toContain('3');
        });

        it('hides the UPDATE block for an item that has never been corrected', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text'});

            expect(wrapper.find('[data-test-id="authoring-header-correction-sequence"]').exists()).toBe(false);
        });
    });

    describe('state labels', () => {
        it('renders the legal label for an item marked for legal', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text', flags: {marked_for_legal: true}});

            expect(wrapper.find('[data-test-id="authoring-header-legal"]').exists()).toBe(true);
        });

        it('renders the sms label for an item marked for sms', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text', flags: {marked_for_sms: true}});

            expect(wrapper.find('[data-test-id="authoring-header-sms"]').exists()).toBe(true);
        });

        it('renders the not-for-publication label for an item marked as such', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text', flags: {marked_for_not_publication: true}});

            expect(wrapper.find('[data-test-id="authoring-header-not-for-publication"]').exists()).toBe(true);
        });

        it('renders the updated label for an item that has been rewritten', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text', rewritten_by: 'some-other-id'});

            expect(wrapper.find('[data-test-id="authoring-header-updated"]').exists()).toBe(true);
        });

        it('renders no state label row for an item with no flags and no rewrite', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text', flags: {}});

            expect(wrapper.find('[data-test-id="authoring-header-state-labels"]').exists()).toBe(false);
        });

        it('renders the missing link label when a same-slugline item exists', async () => {
            stubAngular({relatedItems: [{_id: 'sibling'}]});
            const wrapper = renderWith({type: 'text', slugline: 'a slugline', flags: {}});

            await settle(wrapper);

            expect(wrapper.find('[data-test-id="authoring-header-missing-link"]').exists()).toBe(true);
        });

        it('renders no missing link label when there are no same-slugline items', async () => {
            stubAngular({relatedItems: []});
            const wrapper = renderWith({type: 'text', slugline: 'a slugline', flags: {}});

            await settle(wrapper);

            expect(wrapper.find('[data-test-id="authoring-header-missing-link"]').exists()).toBe(false);
        });

        it('renders no missing link label for an item that is already part of a rewrite chain', async () => {
            stubAngular({relatedItems: [{_id: 'sibling'}]});
            const wrapper = renderWith({
                type: 'text',
                slugline: 'a slugline',
                rewrite_of: 'the-original',
                flags: {},
            });

            await settle(wrapper);

            expect(wrapper.find('[data-test-id="authoring-header-missing-link"]').exists()).toBe(false);
        });
    });

    describe('broadcast master', () => {
        it('renders the MASTER block for a broadcast item', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text', broadcast: {master_id: 'the-master'}});

            const master = wrapper.find('[data-test-id="authoring-header-broadcast-master"]');

            expect(master.exists()).toBe(true);
            expect(master.text()).toContain('MASTER');
        });

        it('hides the MASTER block for an item that is not a broadcast', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text'});

            expect(wrapper.find('[data-test-id="authoring-header-broadcast-master"]').exists()).toBe(false);
        });

        it('hides the MASTER block when broadcast carries no master_id', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text', broadcast: {status: 'Correction'}});

            expect(wrapper.find('[data-test-id="authoring-header-broadcast-master"]').exists()).toBe(false);
        });

        it('renders the status marker when the broadcast has a status', () => {
            stubAngular();
            const wrapper = renderWith({
                type: 'text',
                broadcast: {master_id: 'the-master', status: 'Correction'},
            });

            expect(wrapper.find('[data-test-id="authoring-header-broadcast-status"]').exists()).toBe(true);
        });

        it('renders the broadcast status as the label title', () => {
            stubAngular();
            const wrapper = renderWith({
                type: 'text',
                broadcast: {master_id: 'the-master', status: 'Correction'},
            });

            expect(
                wrapper.find('[data-test-id="authoring-header-broadcast-label"]').prop('title'),
            ).toBe('Correction');
        });

        it('renders no status marker when the broadcast status is empty', () => {
            stubAngular();
            const wrapper = renderWith({type: 'text', broadcast: {master_id: 'the-master', status: ''}});

            expect(wrapper.find('[data-test-id="authoring-header-broadcast-status"]').exists()).toBe(false);
        });

        it('broadcasts the fetched master story for preview when the link is clicked', async () => {
            const broadcastSpy = stubAngular({masterItem: {_id: 'the-master', headline: 'Master story'}});
            const wrapper = renderWith({type: 'text', broadcast: {master_id: 'the-master'}});

            wrapper.find('[data-test-id="authoring-header-preview-master"]').simulate('click');
            await settle(wrapper);

            expect(broadcastSpy).toHaveBeenCalledWith(
                'broadcast:preview',
                {item: {_id: 'the-master', headline: 'Master story'}},
            );
        });

        it('does not broadcast a preview when the master story cannot be loaded', async () => {
            const broadcastSpy = stubAngular({masterItem: null});
            const wrapper = renderWith({type: 'text', broadcast: {master_id: 'gone'}});

            wrapper.find('[data-test-id="authoring-header-preview-master"]').simulate('click');
            await settle(wrapper);

            expect(broadcastSpy).not.toHaveBeenCalled();
        });
    });

    describe('translations', () => {
        it('renders the Original pill and the translations count for a source item', async () => {
            stubAngular({
                translationsEnabled: true,
                translations: [
                    {_id: 'original', language: 'en'},
                    {_id: 'nl-version', language: 'nl', translated_from: 'original'},
                ],
            });
            const wrapper = renderWith({_id: 'original', type: 'text'});

            await settle(wrapper);

            expect(wrapper.find('[data-test-id="authoring-header-original"]').exists()).toBe(true);
            expect(
                wrapper.find('[data-test-id="authoring-header-translations-count"]').prop('data-test-value'),
            ).toBe('1');
        });

        it('renders the source language for an item that is itself a translation', async () => {
            stubAngular({
                translationsEnabled: true,
                translations: [
                    {_id: 'original', language: 'en'},
                    {_id: 'nl-version', language: 'nl', translated_from: 'original'},
                ],
            });
            const wrapper = renderWith({_id: 'nl-version', type: 'text', translated_from: 'original'});

            await settle(wrapper);

            expect(
                wrapper.find('[data-test-id="authoring-header-translated-from"]').prop('data-test-value'),
            ).toBe('en');
            expect(wrapper.find('[data-test-id="authoring-header-original"]').exists()).toBe(false);
        });

        it('opens the translations side widget when the count link is clicked', async () => {
            const toggleSideWidget = jasmine.createSpy('toggleSideWidget');

            stubAngular({
                translationsEnabled: true,
                translations: [{_id: 'original', language: 'en'}],
            });
            const wrapper = renderWith({_id: 'original', type: 'text'}, toggleSideWidget);

            await settle(wrapper);
            wrapper.find('[data-test-id="authoring-header-translations-count"]').simulate('click');

            expect(toggleSideWidget).toHaveBeenCalledWith(TRANSLATIONS_WIDGET_ID);
        });

        it('hides the translations block when the item is not part of a translation chain', async () => {
            stubAngular({translationsEnabled: true, translations: null});
            const wrapper = renderWith({type: 'text'});

            await settle(wrapper);

            expect(wrapper.find('[data-test-id="authoring-header-translations"]').exists()).toBe(false);
        });

        it('hides the translations block when translations are disabled for the instance', async () => {
            stubAngular({
                translationsEnabled: false,
                translations: [{_id: 'original', language: 'en'}],
            });
            const wrapper = renderWith({_id: 'original', type: 'text'});

            await settle(wrapper);

            expect(wrapper.find('[data-test-id="authoring-header-translations"]').exists()).toBe(false);
        });
    });

    // The header stays mounted while the open item changes, so both of these blocks can have a
    // request in flight for the previous item. They are mounted directly here because the switch
    // has to happen through props.
    describe('switching to another item while a request is in flight', () => {
        // The debounce on componentDidUpdate has to be driven forward. `mockDate` is required as
        // well as `install`: lodash compares `Date.now()` to decide whether to invoke, so with a
        // real clock it just reschedules and the call never lands.
        // Uninstalling in afterEach matters, because a clock left installed by a failing
        // assertion times out every later async spec in the run.
        beforeEach(() => {
            jasmine.clock().install();
            jasmine.clock().mockDate();
        });
        afterEach(() => jasmine.clock().uninstall());

        it('ignores a related-items response belonging to the previous item', async () => {
            const resolvers: Array<(value: {_items: Array<Partial<IArticle>>}) => void> = [];

            spyOn(ng, 'get').and.callFake((name: string) => {
                switch (name) {
                    case 'archiveService':
                        return {getRelatedItems: () => new Promise((resolve) => resolvers.push(resolve))};
                    case 'authoringWorkspace':
                        return {getAction: () => 'edit'};
                    default:
                        throw new Error(`unexpected ng.get('${name}') in test`);
                }
            });

            const wrapper = mount(
                <HeaderStateLabels item={{_id: 'first', type: 'text', slugline: 'one', flags: {}} as IArticle} />,
            );

            wrapper.setProps({item: {_id: 'second', type: 'text', slugline: 'two', flags: {}} as IArticle});
            jasmine.clock().tick(800);

            expect(resolvers.length).toBe(2);

            // the current item has a sibling, so the label shows
            resolvers[1]({_items: [{_id: 'sibling'}]});
            await settle(wrapper);
            expect(wrapper.find('[data-test-id="authoring-header-missing-link"]').exists()).toBe(true);

            // the previous item's request lands late with a different answer and must be discarded
            resolvers[0]({_items: []});
            await settle(wrapper);
            expect(wrapper.find('[data-test-id="authoring-header-missing-link"]').exists()).toBe(true);

            jasmine.clock().uninstall();
        });

        it('re-fetches translations for the new item instead of showing the previous count', async () => {
            const translationsByItem: {[id: string]: Array<Partial<IArticle>>} = {
                first: [{_id: 'a', translated_from: 'first'}],
                second: [{_id: 'b', translated_from: 'second'}, {_id: 'c', translated_from: 'second'}],
            };

            spyOn(ng, 'get').and.callFake((name: string) => {
                if (name !== 'TranslationService') {
                    throw new Error(`unexpected ng.get('${name}') in test`);
                }

                return {
                    translationsEnabled: () => true,
                    getTranslations: (item: IArticle) => Promise.resolve({_items: translationsByItem[item._id]}),
                };
            });

            const wrapper = mount(
                <HeaderTranslations
                    item={{_id: 'first', type: 'text'} as IArticle}
                    onOpenTranslationsWidget={() => undefined}
                />,
            );

            await settle(wrapper);
            expect(
                wrapper.find('[data-test-id="authoring-header-translations-count"]').prop('data-test-value'),
            ).toBe('1');

            wrapper.setProps({item: {_id: 'second', type: 'text'} as IArticle});
            await settle(wrapper);

            expect(
                wrapper.find('[data-test-id="authoring-header-translations-count"]').prop('data-test-value'),
            ).toBe('2');
        });
    });
});
