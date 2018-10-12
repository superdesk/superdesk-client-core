describe('desk select directive', () => {
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    var scope, elem, iscope;

    beforeEach(inject(($rootScope, $compile) => {
        scope = $rootScope.$new();

        scope.desks = [
            {_id: 'foo', name: 'Foo'},
            {_id: 'sports', name: 'Sports'},
            {_id: 'fin', name: 'Finance'},
        ];

        scope.selectDesk = function(desk) {
            scope.selectedDesk = desk;
        };

        elem = $compile(`<div sd-desk-select
            data-desks="desks"
            data-on-change="selectDesk(desk)"
            data-selected-desk="selectedDesk"
            ></div>`)(scope);

        $rootScope.$digest();

        iscope = elem.isolateScope();
    }));

    function keydown(key) {
        var event = new $.Event('keydown');

        event.which = typeof key === 'number' ? key : key.charCodeAt(0);
        event.key = typeof key === 'number' ? 'unknown' : key;
        elem.triggerHandler(event);
    }

    it('can use keyboard to filter out desks', inject((Keys) => {
        iscope.isOpen = true;
        scope.$apply();
        expect(iscope.isOpen).toBe(true);
        expect(iscope.desks.length).toBe(3);

        keydown('s');
        scope.$apply();
        expect(iscope.filter).toBe('s');
        expect(iscope.desks.length).toBe(1);

        keydown('t');
        scope.$apply();
        expect(iscope.filter).toBe('st');
        expect(iscope.desks.length).toBe(0);

        keydown(Keys.backspace);
        scope.$apply();
        expect(iscope.filter).toBe('s');
        expect(iscope.desks.length).toBe(1);

        keydown(Keys.backspace);
        scope.$apply();
        expect(iscope.filter).toBe('');
        expect(iscope.desks.length).toBe(3);

        keydown(Keys.enter);
        scope.$apply();
        expect(scope.selectedDesk._id).toBe('foo');

        keydown(Keys.up);
        scope.$apply();
        expect(iscope.ctrl.active._id).toBe('foo');

        keydown(Keys.down);
        scope.$apply();
        expect(iscope.ctrl.active._id).toBe('sports');

        keydown(Keys.down);
        keydown(Keys.down);
        scope.$apply();
        expect(iscope.ctrl.active._id).toBe('fin');

        keydown(Keys.up);
        scope.$apply();
        expect(iscope.ctrl.active._id).toBe('sports');

        keydown(Keys.enter);
        scope.$apply();
        expect(scope.selectedDesk._id).toBe('sports');
    }));
});
