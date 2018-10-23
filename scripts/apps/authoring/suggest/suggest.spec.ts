const testItems = [
    {
        _id: 1,
        slugline: 'slugline',
        word_count: 10,
        firstcreated: 'ddmmyy',
        original_creator: 'john',
        headline: 'headline',
        duedate: 'due-ddmmyy',
        tasks: 'tasks',
        attachements: 'attachements',
        links: 'links',
        comments: ['a', 'b'],
        body_html: 'body',
    }, {
        _id: 2,
        slugline: 'slugline2',
        word_count: 11,
        firstcreated: 'ddmmyy2',
        original_creator: 'jim',
        headline: 'headline2',
        duedate: 'due-ddmmyy2',
        tasks: 'tasks2',
        attachements: 'attachements2',
        links: 'links2',
        comments: ['a2', 'b2'],
        body_html: 'body2',
    },
];

describe('suggest', () => {
    beforeEach(window.module('superdesk.core.api'));
    beforeEach(window.module('superdesk.apps.authoring.autosave'));
    beforeEach(window.module('superdesk.apps.authoring.suggest'));

    it('should initialize as inactive', inject((suggest) => {
        expect(suggest.active).toBe(false);
    }));

    it('should correctly set active state', inject((suggest) => {
        expect(suggest.active).toBe(false);
        suggest.setActive();
        expect(suggest.active).toBe(true);
    }));

    it('should not autosave on trigger when inactive', inject((suggest, autosave) => {
        spyOn(autosave, 'save');

        suggest.setActive(false);
        suggest.trigger(testItems[0], testItems[0]);

        expect(autosave.save).not.toHaveBeenCalled();
    }));

    it('should autosave on trigger when active', inject((suggest, autosave, $q) => {
        spyOn(autosave, 'save').and.returnValue($q.reject());

        suggest.setActive(true);
        suggest.trigger(testItems[0], testItems[1]);

        expect(autosave.save.calls.count()).toBe(1);
        expect(autosave.save).toHaveBeenCalledWith(testItems[0], testItems[1], 0);
    }));

    it('should get suggestions when triggered', inject((suggest, autosave, $q, api, $rootScope) => {
        const item = testItems[0];

        spyOn(autosave, 'save').and.returnValue($q.when(item));
        spyOn(api, 'get').and.returnValue($q.reject());

        suggest.setActive();
        suggest.trigger(item, item);

        $rootScope.$digest();

        expect(api.get.calls.count()).toBe(1);
        expect(api.get).toHaveBeenCalledWith(`suggestions/${item._id}`);
    }));

    it('should get suggestion of first item in array when triggered',
        inject((suggest, autosave, $q, api, $rootScope) => {
            const item = testItems[0];

            spyOn(autosave, 'save').and.returnValue($q.when(testItems));
            spyOn(api, 'get').and.returnValue($q.reject());

            suggest.setActive();
            suggest.trigger(item, item);

            $rootScope.$digest();

            expect(api.get.calls.count()).toBe(1);
            expect(api.get).toHaveBeenCalledWith(`suggestions/${item._id}`);
        }),
    );

    it('should trigger listeners on success', inject((suggest, autosave, $q, api, $rootScope) => {
        const item = testItems[0];
        let response = null;

        spyOn(autosave, 'save').and.returnValue($q.when(testItems));
        spyOn(api, 'get').and.returnValue($q.when('return value'));
        spyOn(suggest, 'onUpdate').and.callThrough();

        suggest.setActive();
        suggest.onUpdate((v) => {
            response = v;
        });
        suggest.trigger(item, item);

        $rootScope.$digest();

        expect(suggest.onUpdate.calls.count()).toBe(1);
        expect(response).toBe('return value');
    }));
});
