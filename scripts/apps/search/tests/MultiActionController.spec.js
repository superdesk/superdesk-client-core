
import {MultiActionBarController} from '../controllers';

describe('Multi Action Bar', () => {
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.apps.archive'));
    beforeEach(window.module('superdesk.apps.search'));
    beforeEach(window.module('superdesk.apps.authoring'));

    beforeEach(window.module(($provide) => {
        $provide.constant('config', {
            model: {
                timeformat: 'HH:mm:ss',
                dateformat: 'DD/MM/YYYY'
            },
            view: {
                timeformat: 'HH:mm',
                dateformat: 'MM/DD/YYYY'
            },
            defaultTimezone: 'Europe/London',
            server: {url: undefined}
        });
    }));

    it('spike action prompts user of confirmation for in progress assignment',
        inject(($controller, $rootScope, privileges, multi, modal, $q, spike) => {
            privileges.privileges = {planning: 1};

            let itemlist = [
                {
                    _id: 'foo1',
                    _type: 'archive',
                    task: {desk: 'desk1', stage: 'stage1'},
                    type: 'text',
                    assignment_id: 'as1'
                },
                {
                    _id: 'foo2',
                    _type: 'archive',
                    task: {desk: 'desk1', stage: 'stage1'},
                    type: 'text'
                }
            ];

            spyOn(multi, 'getItems').and.returnValue(itemlist);
            spyOn(multi, 'reset');
            spyOn(modal, 'confirm').and.returnValue($q.when({}));
            spyOn(spike, 'spikeMultiple').and.returnValue($q.when({}));

            let ctrl = $controller(MultiActionBarController, {});

            ctrl.spikeItems();
            $rootScope.$digest();

            expect(multi.getItems).toHaveBeenCalled();
            expect(modal.confirm).toHaveBeenCalledWith('Some item/s are linked to in-progress ' +
                'planning coverage, spike anyway?');
            expect(spike.spikeMultiple).toHaveBeenCalled();
            expect(multi.reset).toHaveBeenCalled();
            expect(multi.getItems.calls.count()).toEqual(2);
        }));

    it('spike does prompt if planning component not activated',
        inject(($controller, $rootScope, privileges, multi, modal, $q, spike) => {
            let itemlist = [
                {
                    _id: 'foo1',
                    _type: 'archive',
                    task: {desk: 'desk1', stage: 'stage1'},
                    type: 'text'
                },
                {
                    _id: 'foo2',
                    _type: 'archive',
                    task: {desk: 'desk1', stage: 'stage1'},
                    type: 'text'
                }
            ];

            spyOn(multi, 'getItems').and.returnValue(itemlist);
            spyOn(multi, 'reset');
            spyOn(modal, 'confirm').and.returnValue($q.when({}));
            spyOn(spike, 'spikeMultiple').and.returnValue($q.when({}));

            let ctrl = $controller(MultiActionBarController, {});

            ctrl.spikeItems();
            $rootScope.$digest();

            expect(multi.getItems).toHaveBeenCalled();
            expect(modal.confirm).toHaveBeenCalled();
            expect(spike.spikeMultiple).toHaveBeenCalled();
            expect(multi.reset).toHaveBeenCalled();
            expect(multi.getItems.calls.count()).toEqual(1);
        }));
});
