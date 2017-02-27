var _ = require('lodash');

class MetasearchController {

    constructor($http, $location, $timeout, config, Keys) {
        this.query = $location.search().query || '';
        this.openSearch = true; // active on start
        this.url = config.server.url.replace('api', 'metasearch') + '/';
        this.http = $http;
        this.location = $location;
        this.timeout = $timeout;
        this.Keys = Keys;

        this.maxItems = 10;

        this.categories = [
            {_id: '', label: 'Superdesk'},
            {_id: 'general', label: 'General'},
            {_id: 'news', label: 'News'},
            {_id: 'social media', label: 'Social Media'},
            {_id: 'videos', label: 'Videos'}
        ];

        this.time_ranges = [
            {_id: '', label: 'Anytime'},
            {_id: 'day', label: 'Today'},
            {_id: 'week', label: 'Last Week'},
            {_id: 'month', label: 'Last Month'},
        ];

        // init
        this.search();
    }

    toggle() {
        this.openSearch = !this.openSearch;
    }

    reset() {
        this.query = '';
        this.items = null;
        this.location.search('query', null);
        this.location.search('categories', null);
        this.location.search('time_range', null);
    }

    setCategory(category) {
        this.location.search('categories', category || null);
        this.search();
    }

    setTime(time) {
        this.location.search('time_range', time || null);
        this.search();
    }

    search(event) {
        if (event && event.which !== this.Keys.enter) {
            return;
        }

        this.category = this.location.search().categories || '';
        this.time_range = this.location.search().time_range || '';

        this.location.search('query', this.query || null);
        if (this.query) {
            let params = {q: this.query, format: 'json', pageno: 1};

            this.items = null;
            this.loading = true;

            params.time_range = this.location.search().time_range || '';
            params.categories = this.location.search().categories || 'superdesk';

            this.http.get(this.url, {params: params})
                .then((response) => {
                    this.page = 1;
                    this.results = response.data.results || [];
                    this.items = this.results.slice(0, this.maxItems);
                    this.loading = false;
                    this.finished = false;
                    this.params = params;
                    this.updatePagination();
                });
        }
    }

    updatePagination() {
        this.hasPrev = this.page > 1;
        this.hasNext = this.page * this.maxItems + 1 < this.results.length;

        if (!this.hasNext && !this.finished) {
            this.items = null;
            this.loading = true;
            this.params.pageno++;
            this.http.get(this.url, {params: this.params})
                .then((response) => {
                    this.loading = false;

                    if (!response.data.results || !response.data.results.length) {
                        this.finished = true;
                    } else {
                        this.results = this.results.concat(response.data.results);
                    }

                    // re-render
                    this.goto(this.page);
                });
        }
    }

    goto(page) {
        let start;

        this.page = page || 1;

        start = (this.page - 1) * this.maxItems;
        this.items = null;

        this.timeout(() => {
            this.items = this.results.slice(start, start + this.maxItems);
            this.updatePagination();
        }, 200);
    }
}

MetasearchController.$inject = ['$http', '$location', '$timeout', 'config', 'Keys'];

function AnsaMetasearchItem(config, $http, $sce) {
    var firstTwitter = true;

    function getEmbedWidth(elem) {
        return Math.min(550, Math.floor(elem[0].getBoundingClientRect().width) - 50);
    }

    return {
        link: (scope, elem) => {
            elem.attr('draggable', true);

            // set item data on event
            elem.on('dragstart', (event) => {
                let dt = event.dataTransfer || event.originalEvent.dataTransfer;
                let link = document.createElement('a');

                link.href = scope.item.url;
                link.text = scope.item.title;
                dt.setData('text/html', link.outerHTML);
            });

            scope.$on('$destroy', () => {
                elem.off('dragstart');
            });

            if (scope.item.url.indexOf('https://twitter.com') === 0 && scope.item.url.indexOf('status') > 0) {
                scope.embed = true;
                $http.get(config.server.url.replace('api', 'twitter/'),
                    {params: {url: scope.item.url}, omit_script: !firstTwitter})
                    .then((response) => {
                        scope.html = $sce.trustAsHtml(response.data.html);
                    });

                firstTwitter = false;
            }

            if (scope.item.url.indexOf('https://www.youtube.com/watch?v=') === 0) {
                scope.embed = true;
                scope.iframe = $sce.trustAsResourceUrl(
                    scope.item.url.replace('watch?v=', 'embed/').replace('www.', '')
                );
                scope.width = getEmbedWidth(elem);
                scope.height = Math.floor(scope.width / 3 * 2);
            }
        }
    };
}

AnsaMetasearchItem.$inject = ['config', '$http', '$sce'];

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
        let namespace = (key) => 'semantics.' + key;

        keys.forEach((key) => {
            if (semantics[key] && semantics[key].length) {
                semantics[key].forEach((val) => {
                    let f = {};

                    f[namespace(key)] = val;
                    filters.push({term: f});
                });
            }
        });

        let query = {
            bool: {
                must_not: {term: {_id: $scope.item.guid}},
                should: [
                    {
                        bool: {
                            must: {terms: {'semantics.iptcCodes': semantics.iptcCodes}},
                            should: filters
                        }
                    },
                    {
                        bool: {
                            must: {term: {type: 'picture'}},
                            should: filters
                        }
                    }
                ]
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

angular.module('ansa.superdesk', [])
    .controller('MetasearchCtrl', MetasearchController)
    .controller('AnsaSemanticsCtrl', AnsaSemanticsCtrl)
    .controller('AnsaRelatedCtrl', AnsaRelatedCtrl)
    .directive('ansaMetasearchItem', AnsaMetasearchItem)
    .config(['superdeskProvider', (superdeskProvider) => {
        superdeskProvider.activity('/workspace/metasearch', {
            label: gettext('Metasearch'),
            priority: 100,
            templateUrl: 'scripts/apps/ansa/views/metasearch.html',
            topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html'
        });
    }])
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
    }])
    ;
