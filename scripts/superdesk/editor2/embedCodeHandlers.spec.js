'use strict';
describe('Embed Code Handlers', function() {
    var ctrl, scope;

    beforeEach(window.module(function($provide) {
        $provide.constant('config', {server: {url: undefined}, iframely: {key: '123'}, editor: {}});
    }));

    beforeEach(window.module('superdesk.editor2'));

    beforeEach(inject(function($controller, $rootScope) {
        var element = angular.element('<div></div>');
        scope = $rootScope.$new();
        ctrl = $controller('SdAddEmbedController', {$scope: scope, $element: element});
    }));

    it('match a twitter url', inject(function ($httpBackend, config) {
        ctrl.input = 'https://twitter.com/letzi83/status/764062125996113921';
        $httpBackend
            .expectJSONP('https://iframe.ly/api/iframely?callback=JSON_CALLBACK&api_key=' +
            config.iframely.key + '&url=' + ctrl.input)
            .respond({
                meta: {site: 'Twitter'},
                html: 'embed'
            });
        ctrl.retrieveEmbed().then(function(d) {
            expect(d).toEqual({
                body: 'embed',
                provider: 'Twitter'
            });
        });
        $httpBackend.flush();
        scope.$digest();
    }));

    it('match a twitter embed', function () {
        ctrl.input = '<blockquote class="twitter-tweet" data-lang="fr"><p lang="en" dir="ltr">' +
        'A bit old, but I just got around to ready it: &quot;This Is What a Feminist Looks Like&quot;' +
        ' according to <a href="https://twitter.com/hashtag/Obama?src=hash">#Obama</a>: <a href="' +
        'https://t.co/GLm1YW1U0o">https://t.co/GLm1YW1U0o</a></p>&mdash; Letizia Gambini (@letzi83) ' +
        '<a href="https://twitter.com/letzi83/status/764062125996113921">12 août 2016</a></blockquote>' +
        '<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>';
        ctrl.retrieveEmbed().then(function(d) {
            expect(d).toEqual({
                body: ctrl.input,
                provider: 'Twitter'
            });
        });
        scope.$digest();
    });

    it('match a vidible embed', inject(function (config, $httpBackend) {
        ctrl.input = '<div class="vdb_player vdb_56bb474de4b0568f54a23ed7538612f0e4b00fbb8e898655">' +
        '<script type="text/javascript" src="//delivery.vidible.tv/jsonp/pid=56bb474de4b0568f54a23ed7/' +
        '538612f0e4b00fbb8e898655.js"></script></div>';
        // retrieve embed with Vidible disabled
        ctrl.retrieveEmbed().then(function(d) {
            expect(d).toEqual({
                body: ctrl.input,
                provider: 'Custom'
            });
        });
        scope.$digest();
        // retrieve embed with Vidible enabled
        config.editor.vidible = true;
        var apiResponse = {
            'height': 360,
            'mimeType': 'video/ogg',
            'size': 2004079,
            'type': 'video',
            'url': 'http://delivery.vidible.tv/video/redirect/56bb4688e4b0b6448ed479dd' +
            '?bcid=538612f0e4b00fbb8e898655&w=640&h=360',
            'width': 640
        };
        $httpBackend
            .expectGET(config.server.url + '/vidible/bcid/538612f0e4b00fbb8e898655/pid/56bb474de4b0568f54a23ed7')
            .respond(apiResponse);
        ctrl.retrieveEmbed().then(function(d) {
            expect(d).toEqual({
                body: ctrl.input,
                provider: 'Vidible',
                association: apiResponse
            });
        });
        $httpBackend.flush();
        scope.$digest();
    }));

});
