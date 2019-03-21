import moment from 'moment';

describe('tasks', () => {
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.core.filters'));
    beforeEach(window.module('superdesk.core.ui'));
    beforeEach(window.module('superdesk.apps.workspace.tasks'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    describe('task controller', () => {
        var scope;
        var desk = {_id: '1', working_stage: 'working', incoming_stage: 'inbox'};

        beforeEach(inject(($rootScope, $controller, $q, desks, session) => {
            session.identity = {_id: 'user:1'};
            spyOn(desks, 'getCurrentDeskId').and.returnValue(1);
            spyOn(desks, 'fetchDesks').and.returnValue($q.when());
            spyOn(desks, 'fetchDeskStages').and.returnValue($q.when([]));
            spyOn(desks, 'getCurrentDesk').and.returnValue(desk);
            scope = $rootScope.$new();
            $controller('TasksController', {$scope: scope});
        }));

        it('can create task', inject(($rootScope, $controller, desks) => {
            expect(scope.newTask).toBeNull();
            scope.create();
            expect(scope.newTask.task.desk).toBe('1');
            expect(scope.newTask.task.due_date).not.toBeNull();
            expect(scope.newTask.task.due_time).not.toBeNull();
        }));

        describe('kanban', () => {
            var result = {_items: []};

            beforeEach(inject(($rootScope, $q, api) => {
                spyOn(api, 'query').and.returnValue($q.when(result));
                $rootScope.$digest();
            }));

            it('can get published', inject((api) => {
                expect(scope.published).toBe(result);
                var publishedArgs = api.query.calls.argsFor(0);

                expect(publishedArgs[0]).toBe('published');
                expect(publishedArgs[1].source.filter.bool.must.term).toEqual({'task.desk': 1});
            }));

            it('can get scheduled', inject((api) => {
                expect(scope.scheduled).toBe(result);
                var scheduledArgs = api.query.calls.argsFor(1);

                expect(scheduledArgs[0]).toBe('content_templates');
                expect(scheduledArgs[1].where.schedule_desk).toBe(1);
                expect(moment(scheduledArgs[1].where.next_run.$gte).unix()).toBeLessThan(moment().unix());
                expect(moment(scheduledArgs[1].where.next_run.$lte).unix()).toBeGreaterThan(moment().unix());
            }));

            it('can fetch tasks', inject((api, $timeout) => {
                $timeout.flush(500);
                var tasksArgs = api.query.calls.argsFor(2);

                expect(tasksArgs[0]).toBe('tasks');
            }));
        });
    });

    describe('pick task controller', () => {
        beforeEach(window.module('superdesk.apps.workspace.tasks'));

        it('can pick task', inject((superdesk) => {
            spyOn(superdesk, 'intent');
            var data = {item: {_id: 'foo'}};

            superdesk.start(superdesk.activity('pick.task'), {data: data});
            expect(superdesk.intent).toHaveBeenCalledWith('edit', 'item', data.item);
        }));
    });
});
