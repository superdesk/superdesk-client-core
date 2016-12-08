var _ = require('lodash');

function getText(val) {
    try {
        return angular.element(val).text();
    } catch (err) {
        return val;
    }
}

AnsaSemanticsCtrl.$inject = ['$scope', 'api'];
function AnsaSemanticsCtrl($scope, api) {
    this.refresh = () => api.save('analysis', {
        lang: 'ENG',
        title: $scope.item.headline,
        text: getText($scope.item.body_html),
        abstract: getText($scope.item.abstract)
    }).then((result) => this.data = result.semantics);

    this.remove = (term, category) => {
        console.warn('remove', term, category);
        this.data[category] = _.without(this.data[category], term);
    };

    // init
    this.refresh();
}

angular.module('superdesk.apps.widgets', [])
    .controller('AnsaSemanticsCtrl', AnsaSemanticsCtrl)
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
    }]);
