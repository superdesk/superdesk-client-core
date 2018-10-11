
describe('packaging', () => {
    beforeEach(window.module('superdesk.apps.packaging'));
    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(window.module('superdesk.apps.vocabularies'));

    describe('package-items-edit directive', () => {
        // ignore template
        beforeEach(inject(($templateCache) => {
            $templateCache.put('scripts/apps/packaging/views/sd-package-items-edit.html', '');
        }));

        it('listens to package:addItems event', inject(($compile, $rootScope) => {
            var scope = $rootScope.$new();

            scope.autosave = jasmine.createSpy('autosave');
            scope.groups = [{id: 'root', refs: [{idRef: 'main'}]}, {id: 'main', refs: [], items: []}];
            $compile('<div sd-package-items-edit ng-model="groups"></div>')(scope);
            scope.$digest();

            expect(scope.groups[1].refs.length).toBe(0);

            var item = {_id: 'foo'};

            addItem(item);

            expect(scope.groups[1].refs.length).toBe(1);
            expect(scope.groups[1].refs[0].residRef).toBe(item._id);
            expect(scope.autosave).toHaveBeenCalled();

            addItem(item);
            expect(scope.groups[1].refs.length).toBe(1);

            function addItem(i) {
                scope.$broadcast('package:addItems', {
                    group: 'main',
                    items: [i],
                });
            }
        }));
    });

    describe('package-item-preview directive', () => {
        // ignore template
        beforeEach(inject(($templateCache) => {
            $templateCache.put('scripts/apps/packaging/views/sd-package-item-preview.html', '');
        }));

        var scope, item;

        beforeEach(inject(($rootScope, $compile) => {
            var parentScope = $rootScope.$new();

            parentScope.item = {_id: 'foo'};
            item = {_id: 'bar'};
            var elem = $compile('<div sd-package-item-preview data-item="item"></div>')(parentScope);

            parentScope.$digest();
            scope = elem.isolateScope();
        }));

        it('can preview item', inject(($rootScope, $q, superdesk) => {
            spyOn(superdesk, 'intent').and.returnValue($q.when());
            scope.preview(item);
            $rootScope.$apply();
            expect(superdesk.intent).toHaveBeenCalledWith('preview', 'item', item);
        }));

        it('can open item', inject(($rootScope, $q, authoringWorkspace) => {
            spyOn(authoringWorkspace, 'open').and.returnValue($q.when());
            scope.open(item);
            $rootScope.$apply();
            expect(authoringWorkspace.open).toHaveBeenCalledWith(item);
        }));
    });
});
