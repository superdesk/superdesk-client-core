
/**
* Module with tests for the sdDeskeditPeople directive
*
* @module sdDeskeditPeople directive tests
*/
describe('sdDeskeditPeople directive', () => {
    let scope,
        $compile,
        $rootScope,
        desks;

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    beforeEach(inject((_$compile_, _$rootScope_, _desks_, $q) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        desks = _desks_;

        spyOn(desks, 'fetchUsers').and.returnValue($q.when([]));
        spyOn(desks, 'save').and.returnValue($q.when([]));
    }));

    /**
     * Compiles the directive under test and links it with a new scope
     * containing the provided scope values.
     *
     * @function compileDirective
     * @param {Object} scopeValues - values in the current scope of the DOM
     *   element the directive will be applied to
     * @return {Object} - the root DOM node of the compiled directive element
     */
    function compileDirective(scopeValues) {
        let html,
            newScope,
            $element;

        newScope = $rootScope.$new();
        angular.extend(newScope, scopeValues);

        html = '<div sd-deskedit-people></div>';

        $element = $compile(html)(newScope);
        newScope.$digest();

        return $element;
    }

    it('cannot add duplicate desks members ', () => {
        var scopeValues,
            $element;

        scopeValues = {
            desk: {
                edit: {
                    _id: 'foo',
                    name: 'foo',
                    members: [],
                },
            },
            deskMembers: [],
            users: [],
            message: null,
        };

        $element = compileDirective(scopeValues);
        scope = $element.scope();
        scope.$digest();
        expect(scope.deskMembers).toEqual([]);
        scope.add({_id: 1, name: 'one'});
        expect(scope.deskMembers).toEqual([{_id: 1, name: 'one'}]);
        scope.add({_id: 1, name: 'one'});
        expect(scope.deskMembers).toEqual([{_id: 1, name: 'one'}]);
    });

    it('can remove the desk member ', () => {
        var scopeValues,
            $element;

        scopeValues = {
            desk: {
                edit: {
                    _id: 'foo',
                    name: 'foo',
                    members: [],
                },
            },
            deskMembers: [],
            users: [],
            message: null,
        };

        $element = compileDirective(scopeValues);
        scope = $element.scope();
        scope.$digest();
        expect(scope.deskMembers).toEqual([]);
        scope.add({_id: 1, name: 'one'});
        expect(scope.deskMembers).toEqual([{_id: 1, name: 'one'}]);
        scope.remove({_id: 1, name: 'one'});
        expect(scope.deskMembers).toEqual([]);
    });

    it('save the desk members ', () => {
        var scopeValues,
            $element;

        scopeValues = {
            desk: {
                edit: {
                    _id: 'foo',
                    name: 'foo',
                    members: [],
                },
            },
            deskMembers: [],
            users: [],
            message: null,
        };

        $element = compileDirective(scopeValues);
        scope = $element.scope();
        scope.$digest();
        expect(scope.deskMembers).toEqual([]);
        scope.add({_id: 1, name: 'one'});
        expect(scope.deskMembers).toEqual([{_id: 1, name: 'one'}]);
        scope.add({_id: 1, name: 'one'});
        expect(scope.deskMembers).toEqual([{_id: 1, name: 'one'}]);
        scope.save();
        expect(desks.save).toHaveBeenCalledWith(
            {
                _id: 'foo',
                name: 'foo',
                members: [],
            },
            {members: [{user: 1}]}
        );
    });
});
