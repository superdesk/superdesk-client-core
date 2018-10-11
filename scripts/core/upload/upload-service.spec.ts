
describe('upload service', () => {
    beforeEach(window.module('superdesk.core.upload'));

    beforeEach(window.module(($provide) => {
        $provide.service('$upload', ['$q', function($q) {
            // angular-file-upload api
            this.upload = function() {
                return $q.when();
            };
            this.http = function() { /* no-op */ };
        }]);
    }));

    it('can start uploading', inject((upload, Upload) => {
        var config = {url: 'test', method: 'POST', data: 'test'};

        spyOn(Upload, 'upload').and.callThrough();
        upload.start(config);
        expect(Upload.upload).toHaveBeenCalledWith(config);
    }));

    it('can restart uploading', inject((upload, Upload) => {
        var config = {url: 'test'};

        spyOn(Upload, 'http');
        upload.restart(config);
        expect(Upload.http).toHaveBeenCalledWith(config);
    }));

    it('should know that config after calling start is an upload', inject((upload) => {
        var config = {url: 'test'};

        upload.start(config);
        expect(upload.isUpload(config)).toBe(true);
    }));

    it('should know that config without using start is not an upload', inject((upload) => {
        expect(upload.isUpload({})).toBe(false);
    }));
});
