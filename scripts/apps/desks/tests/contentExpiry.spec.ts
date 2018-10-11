describe('content expiry', () => {
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.templates-cache'));

    function setupElement(context, contentExpiry) {
        let scope, elem, iscope;

        inject(($rootScope, $compile) => {
            scope = $rootScope.$new();
            scope.expiryMinutes = 4320;
            scope.expiryContext = context;
            scope.item = {
                content_expiry: contentExpiry,
            };

            elem = $compile(`<div sd-content-expiry
                data-item="item"
                data-preview="false"
                data-expiryfield="content_expiry"
                data-header="Content Expiry"
                data-expiry-minutes="expiryMinutes"
                data-expiry-context="{{expiryContext}}"></div>`)(scope);

            $rootScope.$digest();
            iscope = elem.isolateScope();
        });

        return iscope;
    }

    it('expiry from system', inject(($rootScope, $compile) => {
        let scope = setupElement('System', 0);

        scope.contentExpiry.expire = false;

        $rootScope.$digest();
        expect(scope.contentExpiry.actualExpiry.text).toBe('Using System default');
        expect(scope.contentExpiry.actualExpiry.expiry).toBe('days:3 hr:0 min:0');

        scope.contentExpiry.expire = true;
        scope.contentExpiry.days = 3;
        $rootScope.$digest();
        expect(scope.contentExpiry.actualExpiry).toBe(null);
        expect(scope.contentExpiry.days).toBe(3);
        expect(scope.contentExpiry.hours).toBe(0);
        expect(scope.contentExpiry.minutes).toBe(0);
    }));

    it('expiry already set', inject(($rootScope, $compile) => {
        let scope = setupElement('System', 4320);

        $rootScope.$digest();
        expect(scope.contentExpiry.actualExpiry).toBe(null);
        expect(scope.contentExpiry.days).toBe(3);
        expect(scope.contentExpiry.hours).toBe(0);
        expect(scope.contentExpiry.minutes).toBe(0);
    }));

    it('expiry not set', inject(($rootScope, $compile) => {
        let scope = setupElement('', 0);

        scope.expiryMinutes = 0;
        scope.contentExpiry.expire = false;
        $rootScope.$digest();

        expect(scope.contentExpiry.actualExpiry.text).toBe('OFF');
        expect(scope.contentExpiry.actualExpiry.expiry).toBe(null);
    }));
});
