import {getNativeKey} from '../keyboard';

describe('keyboardManager', () => {
    beforeEach(window.module('superdesk.core.keyboard'));

    var km, elem, $timeout,
        options = {inputDisabled: false};

    function keydown(label) {
        var e = new $.Event('keydown');

        e.ctrlKey = false;
        e.altKey = false;
        e.shiftKey = false;

        e.key = getNativeKey(label);
        elem.trigger(e);
        km.keyboardEvent[label].callback(e);
        $timeout.flush(100);
    }

    function elemKeydown(key, ctrl?, shift?, target?) {
        var e = new $.Event('keydown');

        e.key = getNativeKey(key);
        e.ctrlKey = ctrl;
        e.shiftKey = shift;
        e.altKey = false;
        $(target || document.body).trigger(e);
    }

    beforeEach(inject(($injector) => {
        $timeout = $injector.get('$timeout');
        km = $injector.get('keyboardManager');
        elem = $('<input type="text" />');
    }));

    it('can bind and unbind', () => {
        var status = false;

        km.bind('up', () => {
            status = true;
        }, options);

        expect(status).toBe(false);

        keydown('up');

        expect(status).toBe(true);

        km.unbind('up');

        expect(km.keyboardEvent.up).toBe(undefined);
    });

    it('can push and pop an event', () => {
        var from;

        km.push('up', () => {
            from = '1';
        }, options);

        km.push('up', () => {
            from = '2';
        }, options);

        keydown('up');

        expect(from).toBe('2');

        km.pop('up');

        keydown('up');

        expect(from).toBe('1');

        km.pop('up');

        keydown('up');

        expect(from).toBe('1'); // no change
    });

    it('can broadcast keydown events', inject(($rootScope, $document) => {
        var handler = jasmine.createSpy('handler');

        $rootScope.$on('key:t', handler);

        elemKeydown('t');

        $rootScope.$digest();
        expect(handler).toHaveBeenCalled();
    }));

    it('can broadcast shortcut events', inject(($rootScope, $document) => {
        var handlerCtrl = jasmine.createSpy('handle');
        var handlerCtrlShift = jasmine.createSpy('handle');

        $rootScope.$on('key:ctrl:t', handlerCtrl);
        $rootScope.$on('key:ctrl:shift:t', handlerCtrlShift);

        elemKeydown('t', true);
        $rootScope.$digest();

        expect(handlerCtrl).toHaveBeenCalled();
        expect(handlerCtrlShift).not.toHaveBeenCalled();

        elemKeydown('t', true, true);
        $rootScope.$digest();

        expect(handlerCtrl.calls.count()).toBe(1);
        expect(handlerCtrlShift).toHaveBeenCalled();
    }));

    it('can catch ctrl+shift events', inject(($rootScope) => {
        var p = document.createElement('p');

        p.contentEditable = 'true';
        document.body.appendChild(p);
        elemKeydown('t', true, false, p);

        var handle = jasmine.createSpy('handle');

        $rootScope.$on('key:ctrl:shift:t', handle);

        elemKeydown('t', true, false, p);
        $rootScope.$digest();

        expect(handle).not.toHaveBeenCalled();

        elemKeydown('t', true, true, p);
        $rootScope.$digest();

        expect(handle).toHaveBeenCalled();
    }));
});
