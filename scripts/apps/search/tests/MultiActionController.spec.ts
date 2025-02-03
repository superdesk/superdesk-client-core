import {registerExtensions} from 'core/register-extensions';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {noop} from 'lodash';
import {getMultiActions} from '../controllers/get-multi-actions';

describe('Multi Action Bar', () => {
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.apps.archive'));
    beforeEach(window.module('superdesk.apps.search'));
    beforeEach(window.module('superdesk.apps.authoring'));
});
