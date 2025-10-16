import 'vendor';
import 'angular-mocks';
import 'core/tests/mocks';
import 'core';
import 'apps';

import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {DEFAULT_ENGLISH_TRANSLATIONS} from 'core/utils';
import {appConfig} from 'appConfig';
import {ISuperdeskGlobalConfig} from 'superdesk-api';

window.translations = DEFAULT_ENGLISH_TRANSLATIONS;

Enzyme.configure({adapter: new Adapter()});

const testConfig: Partial<ISuperdeskGlobalConfig> = {
    model: {
        timeformat: 'HH:mm:ss',
        dateformat: 'DD/MM/YYYY',
    },
    view: {
        timeformat: 'HH:mm',
        dateformat: 'MM/DD/YYYY',
    },
    features: {
        editFeaturedImage: true,
    },
    search: {
        useDefaultTimezone: true,
    },
    default_timezone: 'Europe/London',
    server: {
        url: 'http://localhost:5000',
        ws: undefined,
    },
};

beforeEach(() => { // reset config before each test
    Object.assign(appConfig, testConfig);
});

function runTests(context) {
    context.keys().forEach(context);
}

// selecting specific folders to avoid importing extensions
runTests(require.context('scripts/core', true, /.spec.(ts|tsx)$/));
runTests(require.context('scripts/apps', true, /.spec.(ts|tsx)$/));
