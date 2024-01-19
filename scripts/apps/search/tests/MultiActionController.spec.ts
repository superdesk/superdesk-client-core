import {registerExtensions} from 'core/register-extensions';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {ISuperdeskGlobalConfig} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {noop} from 'lodash';
import {getMultiActions} from '../controllers/get-multi-actions';

describe('Multi Action Bar', () => {
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.apps.archive'));
    beforeEach(window.module('superdesk.apps.search'));
    beforeEach(window.module('superdesk.apps.authoring'));

    beforeEach(() => {
        const testConfig: Partial<ISuperdeskGlobalConfig> = {
            model: {
                timeformat: 'HH:mm:ss',
                dateformat: 'DD/MM/YYYY',
            },
            view: {
                timeformat: 'HH:mm',
                dateformat: 'MM/DD/YYYY',
            },
            default_timezone: 'Europe/London',
            server: {url: undefined, ws: undefined},
        };

        Object.assign(appConfig, testConfig);
    });
});
