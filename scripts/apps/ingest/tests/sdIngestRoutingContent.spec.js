
/**
* Module with tests for the sdIngestRoutingContent directive
*
* @module sdIngestRoutingContent directive tests
*/
describe('sdIngestRoutingContent directive', () => {
    var contentFilters,
        fakeGetFilters,
        fakeTzData,
        getTzDataDeferred,
        scope;

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.ingest'));
    beforeEach(window.module('superdesk.apps.content_filters'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    beforeEach(window.module(($provide) => {
        fakeTzData = {
            $promise: null,
            zones: {},
            links: {},
        };
        $provide.constant('tzdata', fakeTzData);
    }));

    beforeEach(inject(($compile, $rootScope, $q, _contentFilters_) => {
        var html;

        contentFilters = _contentFilters_;

        fakeGetFilters = $q.defer();
        spyOn(contentFilters, 'getAllContentFilters')
            .and.returnValue(fakeGetFilters.promise);

        getTzDataDeferred = $q.defer();
        fakeTzData.$promise = getTzDataDeferred.promise;

        scope = $rootScope.$new();
        html = '<div sd-ingest-routing-content></div>';
        $compile(html)(scope);
        scope.$digest();
    }));

    describe('on initialization', () => {
        it('retrieves all content filters', () => {
            expect(contentFilters.getAllContentFilters)
                .toHaveBeenCalledWith(1, []); // i.e. starting with page 1
        });

        it('stores content filters list in scope on retrieval', () => {
            var fetchedFilters = [{name: 'filter 1'}, {name: 'filter 2'}];

            scope.contentFilters = [];

            fakeGetFilters.resolve(fetchedFilters);
            scope.$digest();

            expect(scope.contentFilters).toEqual(fetchedFilters);
        });
    });

    describe('scope\'s editRule() method', () => {
        beforeEach(() => {
            scope.contentFilters = [
                {_id: 'filter_1', name: 'filter one'},
                {_id: 'filter_2', name: 'filter two'},
                {_id: 'filter_3', name: 'filter three'},
            ];
        });

        it('sets the rule object in scope to given object', () => {
            var ruleToEdit = {_id: 'rule_1', filter: null, schedule: {}};

            scope.rule = null;
            scope.editRule(ruleToEdit);

            expect(scope.rule).toEqual(ruleToEdit);
        });

        it('sets the scope\'s rule object\'s filter name to the name of the ' +
            'filter the rule references',
        () => {
            var scopeRule,
                ruleToEdit = {_id: 'rule_1', filter: 'filter_2', schedule: {}};

            scope.editRule(ruleToEdit);

            scopeRule = scope.rule || {};
            expect(scopeRule.filterName).toEqual('filter two');
        }
        );
    });
});
