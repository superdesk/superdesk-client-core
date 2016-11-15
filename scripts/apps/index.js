import 'apps/workspace';
import 'apps/dashboard';
import 'apps/users';
import 'apps/groups';
import 'apps/products';
import 'apps/publish';
import 'apps/templates';
import 'apps/profiling';
import 'apps/desks';
import 'apps/authoring';
import 'apps/search';
import 'apps/legal-archive';
import 'apps/stream';
import 'apps/packaging';
import 'apps/highlights';
import 'apps/translations';
import 'apps/content-filters';
import 'apps/dictionaries';
import 'apps/vocabularies';
import 'apps/archive';
import 'apps/monitoring';
import 'apps/settings';
import 'apps/ingest';
import 'apps/search-providers';

/* globals __SUPERDESK_CONFIG__: true */
const appConfig = __SUPERDESK_CONFIG__;
const withPublisher = typeof appConfig.publisher !== 'undefined';

if (withPublisher) {
    require('apps/web-publisher');
}

if (appConfig.features && appConfig.features.useTansaProofing) {
    require('apps/tansa');
}

export default angular.module('superdesk.apps', [
    'superdesk.apps.settings',
    'superdesk.apps.dashboard',
    'superdesk.apps.users',
    'superdesk.apps.users.import',
    'superdesk.apps.users.profile',
    'superdesk.apps.users.activity',
    'superdesk.apps.archive',
    'superdesk.apps.ingest',
    'superdesk.apps.desks',
    'superdesk.apps.groups',
    'superdesk.apps.products',
    'superdesk.apps.authoring',
    'superdesk.apps.packaging',
    'superdesk.apps.editor2',
    'superdesk.apps.spellcheck',
    'superdesk.apps.notification',
    'superdesk.apps.highlights',
    'superdesk.apps.translations',
    'superdesk.apps.content_filters',
    'superdesk.apps.dictionaries',
    'superdesk.apps.vocabularies',
    'superdesk.apps.searchProviders',
    'superdesk.apps.stream',
    'superdesk.apps.publish',
    'superdesk.apps.templates',
    'superdesk.apps.monitoring',
    'superdesk.apps.profiling',
    'superdesk.apps.analytics'
].concat(withPublisher ? 'superdesk.apps.web_publisher' : []));

