import {appConfig} from 'appConfig';
import {isContentExpiryValid} from '../directives/ContentExpiry';

const MAX_DAYS = 99999;
const MAX_MINUTES = (MAX_DAYS + 1) * 24 * 60 - 1;

describe('content expiry', () => {
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.spellcheck'));

    let elem;
    let originalMax;

    beforeEach(() => {
        originalMax = appConfig.max_content_expiry_minutes;
        appConfig.max_content_expiry_minutes = MAX_MINUTES;
    });

    afterEach(() => {
        appConfig.max_content_expiry_minutes = originalMax;
    });

    function setupElement(context, contentExpiry) {
        let scope, iscope;

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
        const scope = setupElement('System', 0);

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
        const scope = setupElement('System', 4320);

        $rootScope.$digest();
        expect(scope.contentExpiry.actualExpiry).toBe(null);
        expect(scope.contentExpiry.days).toBe(3);
        expect(scope.contentExpiry.hours).toBe(0);
        expect(scope.contentExpiry.minutes).toBe(0);
    }));

    it('expiry not set', inject(($rootScope, $compile) => {
        const scope = setupElement('', 0);

        scope.expiryMinutes = 0;
        scope.contentExpiry.expire = false;
        $rootScope.$digest();

        expect(scope.contentExpiry.actualExpiry.text).toBe('OFF');
        expect(scope.contentExpiry.actualExpiry.expiry).toBe(null);
    }));

    it('rejects more than the maximum number of days', inject(($rootScope) => {
        expect(isContentExpiryValid(null)).toBe(true);
        expect(isContentExpiryValid(-1)).toBe(true);
        expect(isContentExpiryValid(MAX_MINUTES)).toBe(true);
        expect(isContentExpiryValid(MAX_MINUTES + 1)).toBe(false);
        expect(isContentExpiryValid(NaN)).toBe(false);

        const scope = setupElement('System', MAX_DAYS * 24 * 60);
        const maxDaysError = () =>
            elem[0].querySelector('[data-test-id="content-expiry--max-days-error"]') != null;

        expect(maxDaysError()).toBe(false);

        scope.contentExpiry.days = MAX_DAYS + 1;
        $rootScope.$digest();
        expect(maxDaysError()).toBe(true);
    }));

    it('does not show the default expiry while the input is invalid', inject(($rootScope) => {
        const scope = setupElement('System', 0);

        scope.contentExpiry.days = undefined;
        $rootScope.$digest();
        expect(scope.contentExpiry.actualExpiry).toBe(null);
    }));

    it('applies no limit when the server does not send one', inject(($rootScope) => {
        appConfig.max_content_expiry_minutes = undefined;

        expect(isContentExpiryValid(MAX_MINUTES + 1)).toBe(true);

        const scope = setupElement('System', 0);

        scope.contentExpiry.days = MAX_DAYS + 1;
        $rootScope.$digest();
        expect(elem[0].querySelector('[data-test-id="content-expiry--max-days-error"]')).toBe(null);
    }));
});
