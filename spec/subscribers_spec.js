var openUrl = require('./helpers/utils').open,
    subscribers = require('./helpers/subscribers');

describe('subscribers', () => {
    describe('list subscriber', () => {
        beforeEach(() => {
            openUrl('/#/settings/publish');
        });

        it('list subscriber', () => {
            expect(subscribers.getCount()).toBe(1);
            expect(subscribers.getSubscriber('Public API').count()).toBe(1);
        });
    });

    describe('edit subscriber', () => {
        beforeEach(() => {
            openUrl('/#/settings/publish');
        });

        it('save button is disabled when subscriber type is changed', () => {
            subscribers.edit('Public API');

            expect(subscribers.saveSubscriberButton.isEnabled()).toBe(true);
            subscribers.setType('wire');
            expect(subscribers.saveSubscriberButton.isEnabled()).toBe(false);
            subscribers.cancel();
        });
    });
});
