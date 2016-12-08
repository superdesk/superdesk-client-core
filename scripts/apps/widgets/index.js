
AnsaSemanticsCtrl.$inject = ['$scope', 'api'];
function AnsaSemanticsCtrl($scope, api) {
    this.data = {
        "newsDomains": [
            "News"
        ],
        "places": [
            "Sudan"
        ],
        "organizations": [
            "Internal Displacement Monitoring Center"
        ],
        "mainGroups": [
            "erratic rainfall",
            "irregular rain",
            "Sudan's temperature",
            "hotter climate",
            "flood-related disaster"
        ],
        "mainLemmas": [
            "rain",
            "Sudan",
            "drought",
            "climate change",
            "crop",
            "temperature",
            "Internal Displacement Monitoring Center",
            "climate",
            "arable land",
            "country",
            "agriculture",
            "village",
            "cultivation",
            "flood",
            "disaster",
            "people"
        ],
        "mainSenteces": [
            "Sudan's temperature is expected to increase significantly.",
            "As a result of hotter climate and erratic rainfall, much of Sudan has become progressively unsuitable for agriculture and villages.",
            "Irregular rain has ruined crops, and the country is experiencing both droughts and floods -- making arable land unsuitable for cultivation and displacing more than 600,000 people due to flood-related disasters since 2013, according to the Internal Displacement Monitoring Center (IDMC)."
        ],
        "mood": -18.488033,
        "isMOODnegative": false,
        "isMOODneutral": true,
        "isMOODpositive": false
    };

    this.refresh = () => api.save('keywords', {
        headline: $scope.item.headline,
        abstract: $scope.item.abstract,
        content: $scope.item.body_html
    }).then((result) => this.data = result);
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
