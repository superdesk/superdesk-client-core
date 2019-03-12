function NoopTracking() {
    this.track = angular.noop;
}

function PiwikTracking(config) {
    window._paq = window._paq || [];

    (function() {
        window._paq.push(['setSiteId', config.id]);
        window._paq.push(['setTrackerUrl', config.url + '/piwik.php']);
        var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];

        g.type = 'text/javascript';
        g.defer = true;
        g.async = true;
        g.src = config.url + '/piwik.js';
        s.parentNode.insertBefore(g, s);
    })();

    this.track = function(activity) {
        window._paq.push(['trackPageView', activity.label]);
    };
}

function GoogleTracking(config) {
    (function(i, s, o, g, r, a, m) {
        let el = a;
        let tag = m;

        i.GoogleAnalyticsObject = r;
        i[r] = i[r] || function() {
            (i[r].q = i[r].q || []).push(arguments);
        };
        i[r].l = 1 * Number(new Date());
        el = s.createElement(o);
        tag = s.getElementsByTagName(o)[0];
        el.async = 1;
        el.src = g;
        tag.parentNode.insertBefore(el, tag);
    })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

    window.ga('create', config.id, 'sourcefabric.org');

    this.track = function(activity) {
        window.ga('send', 'pageview', {
            page: activity._id,
            title: activity.label,
        });
    };
}

/**
 * @ngdoc module
 * @module superdesk.core.analytics
 * @name superdesk.core.analytics
 * @packageName superdesk.core
 * @description Superdesk core analytics functions.
 */
angular.module('superdesk.core.analytics', [])

    .service('analytics', ['config', function(config) {
        if (config.analytics.piwik.url) {
            PiwikTracking.call(this, config.analytics.piwik);
        } else if (config.analytics.ga.id) {
            GoogleTracking.call(this, config.analytics.ga);
        } else {
            NoopTracking.call(this);
        }
    }])

    .run(['$rootScope', 'analytics', function($rootScope, analytics) {
        $rootScope.$on('$routeChangeSuccess', (ev, route) => {
            if (angular.isDefined(route)) {
                analytics.track(route);
            }
        });
    }]);
