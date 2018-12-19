var nav = require('./helpers/utils').nav,
    subscribers = require('./helpers/subscribers');

describe('subscribers', () => {
    describe('list subscriber', () => {
        beforeEach(() => {
            nav('/settings/publish');
        });

        it('list subscriber', () => {
            expect(subscribers.getCount()).toBe(1);
            expect(subscribers.getSubscriber('Public API').count()).toBe(1);
        });
    });

    describe('edit subscriber', () => {
        beforeEach(() => {
            nav('/settings/publish');
        });

        it('save button is disabled when subscriber type is changed', () => {
            subscribers.edit('Public API');

            expect(subscribers.saveSubscriberButton.isEnabled()).toBe(false);
            subscribers.setType('wire');
            subscribers.setDestinationFormat('nitf');
            expect(subscribers.saveSubscriberButton.isEnabled()).toBe(true);
            subscribers.cancel();
        });
    });
});
