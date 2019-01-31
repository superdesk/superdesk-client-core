import 'apps/workspace';
import 'apps/dashboard';
import 'apps/users';
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
import 'apps/internal-destinations';
import 'apps/content-api';
import 'apps/extension-points';
import 'apps/contacts';
import 'apps/relations';
import 'apps/knowledge-base';

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
    'superdesk.apps.internal-destinations',
    'superdesk.apps.content-api',
    'superdesk.apps.extension-points',
    'superdesk.apps.contacts',
    'superdesk.apps.relations',
    'superdesk.apps.knowledge-base',
]);
