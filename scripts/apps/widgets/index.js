var _ = require('lodash');

AnsaSemanticsCtrl.$inject = ['$scope', 'api'];
function AnsaSemanticsCtrl($scope, api) {
    let save = (result) => {
        $scope.item.semantics = result.semantics;

        if (result.place && _.isEmpty($scope.item.place)) {
            $scope.item.place = result.place;
        }

        if (result.subject && _.isEmpty($scope.item.subject)) {
            $scope.item.subject = result.subject;
        }

        if (result.slugline && _.isEmpty($scope.item.slugline)) {
            $scope.item.slugline = result.slugline;
        }

        $scope.autosave($scope.item);
    };

    let init = () => {
        if ($scope.item.semantics) {
            this.data = angular.extend({}, $scope.item.semantics);
        } else {
            this.refresh();
        }
    };

    let text = (val) => {
        try {
            return angular.element(val).text();
        } catch (err) {
            return val || '';
        }
    };

    this.refresh = () => api.save('analysis', {
        lang: $scope.item.language === 'en' ? 'ENG' : 'ITA',
        title: $scope.item.headline || '',
        text: [
            text($scope.item.abstract),
            text($scope.item.body_html),
            $scope.item.description_text || ''
        ].join('\n'),
        abstract: ''
    }).then((result) => {
        this.data = result.semantics;
        save(result);
    });

    this.remove = (term, category) => {
        this.data[category] = _.without(this.data[category], term);
        save({semantics: this.data});
    };

    init();
}

AnsaRelatedCtrl.$inject = ['$scope', 'api'];
function AnsaRelatedCtrl($scope, api) {
    let init = () => {
        if (!$scope.item.semantics || !$scope.item.semantics.iptcCodes) {
            this.items = [];
            return;
        }

        let filters = [];
        let semantics = $scope.item.semantics;
        let keys = ['persons', 'organizations'];
        let lower = (val) => val.toLowerCase();
        let namespace = (key) => 'semantics.' + key;

        keys.forEach((key) => {
            if (semantics[key] && semantics[key].length) {
                semantics[key].forEach((val) => {
                    let f = {};

                    if (val !== 'ANSA') {
                        f[namespace(key)] = val;
                        filters.push({term: f});
                    }
                });
            }
        });

        let query = {
            bool: {
                must: [
                    {terms: {'semantics.iptcCodes': semantics.iptcCodes.map(lower)}},
                    {term: {type: 'picture'}},
                ],
                must_not: {term: {_id: $scope.item.guid}},
                should: filters,
                minimum_should_match: 1
            }
        };

        api.query('archive', {source: {query: query, sort: ['_score']}}).then((response) => {
            this.items = response._items;
        }, (reason) => {
            this.items = [];
        });
    };

    init();
}

angular.module('superdesk.apps.widgets', [])
    .controller('AnsaSemanticsCtrl', AnsaSemanticsCtrl)
    .controller('AnsaRelatedCtrl', AnsaRelatedCtrl)
    .config(['authoringWidgetsProvider', (authoringWidgetsProvider) => {
        authoringWidgetsProvider.widget('ansa-semantics', {
            label: 'Semantics',
            icon: 'related',
            template: 'scripts/apps/widgets/ansa-semantics-widget/ansa-semantics-widget.html',
            order: 7,
            side: 'right',
            display: {authoring: true},
            configurable: false
        });

        authoringWidgetsProvider.widget('ansa-semantics', {
            label: 'Related Items',
            icon: 'related',
            template: 'scripts/apps/widgets/ansa-related-widget/ansa-related-widget.html',
            order: 7,
            side: 'right',
            display: {authoring: true},
            configurable: false
        });
    }]);
