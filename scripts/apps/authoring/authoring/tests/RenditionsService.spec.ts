import {appConfig} from 'appConfig';
import {ISuperdeskGlobalConfig} from 'superdesk-api';

describe('renditions service', () => {
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.apps.ingest'));

    beforeEach(() => {
        const testConfig: Partial<ISuperdeskGlobalConfig> = {
            features: {editFeaturedImage: true},
            server: {url: '', ws: undefined},
        };

        Object.assign(appConfig, testConfig);
    });

    it('can fetch external media', inject((renditions, api, desks, privileges, $q, $rootScope) => {
        const item = {
            guid: 'guid',
            _type: 'externalsource',
            fetch_endpoint: 'endpoint',
            ingest_provider: 'external',
        };

        spyOn(desks, 'getCurrentDeskId').and.returnValue('sports');
        spyOn(privileges, 'userHasPrivileges').and.returnValue(true);
        spyOn(api, 'save').and.returnValue($q.when({_id: 'ingested'}));
        spyOn(api, 'find').and.returnValue($q.when({}));

        renditions.ingest(item);
        $rootScope.$digest();

        expect(api.save).toHaveBeenCalledWith(
            item.fetch_endpoint,
            {guid: item.guid, desk: 'sports'},
            null,
            null,
            {repo: item.ingest_provider},
        );

        expect(api.find).toHaveBeenCalledWith('archive', 'ingested');
    }));
});
