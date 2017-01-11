
class MetasearchController {

    constructor($http, $location, config) {
        this.query = $location.search().query || '';
        this.openSearch = true; // active on start
        this.url = config.server.url.replace('api', 'metasearch') + '/';
        this.http = $http;
        this.location = $location;

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
    }

    search() {
        this.location.search('query', this.query || null);
        if (this.query) {
            this.items = null;
            this.loading = true;
            this.http.get(this.url, {params: {q: this.query, format: 'json', pageno: 1}})
                .then((response) => {
                    this.items = response.data.results || [];
                    this.loading = false;
                });
        }
    }
}

MetasearchController.$inject = ['$http', '$location', 'config'];

function AnsaMetasearchItem(config, $http, $sce) {
    var first = true;
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
                $http.get(config.server.url.replace('api', 'twitter/'), {params: {url: scope.item.url}, omit_script: first})
                    .then((response) => {
                        scope.html = $sce.trustAsHtml(response.data.html);
                    });

                first = false;
            }
        }
    };
}

AnsaMetasearchItem.$inject = ['config', '$http', '$sce'];

angular.module('ansa.superdesk', [])
    .controller('MetasearchCtrl', MetasearchController)
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
    ;
