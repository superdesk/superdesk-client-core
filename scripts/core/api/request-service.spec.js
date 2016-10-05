describe('request service', function() {
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.core.api'));
    beforeEach(window.module(function($provide) {
        $provide.service('$upload', ['$q', function($q) {
            this.upload = function() {
                return $q.when();
            };
        }]);
    }));
    beforeEach(window.module('superdesk.core.upload'));

    it('can resend $http request', inject(function(request, $httpBackend) {
        var config = {url: 'test', method: 'GET'};

        $httpBackend.expectGET('test').respond('data');

        var response;
        request.resend(config).then(function(_response) {
            response = _response;
        });

        $httpBackend.flush();

        expect(response.status).toBe(200);
    }));

    it('can resend upload request', inject(function(request, upload) {
        var config = {url: 'upload', method: 'POST'};
        upload.start(config);
        spyOn(upload, 'restart');
        request.resend(config);
        expect(upload.restart).toHaveBeenCalledWith(config);
    }));

    it('can check if request is upload', inject(function(request, upload) {
        var config = {};
        spyOn(upload, 'isUpload').and.returnValue(1);
        expect(request.isUpload(config)).toBe(1);
        expect(upload.isUpload).toHaveBeenCalledWith(config);
    }));
});
