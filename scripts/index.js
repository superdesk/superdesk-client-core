/* globals __SUPERDESK_CONFIG__: true */
const appConfig = __SUPERDESK_CONFIG__;

// styles
import 'styles/index.less';

// vendor
import 'jquery-jcrop';

// core
import 'superdesk/gettext';
import 'superdesk/activity';
import 'superdesk/analytics';
import 'superdesk/api';
import 'superdesk/auth';
import 'superdesk/beta';
import 'superdesk/datetime';
import 'superdesk/error';
import 'superdesk/elastic';
import 'superdesk/filters';
import 'superdesk/services';
import 'superdesk/directives';
import 'superdesk/editor2';
import 'superdesk/features';
import 'superdesk/list';
import 'superdesk/keyboard';
import 'superdesk/privileges';
import 'superdesk/notification';
import 'superdesk/itemList';
import 'superdesk/menu';
import 'superdesk/notify';
import 'superdesk/ui';
import 'superdesk/upload';
import 'superdesk/lang';
import 'superdesk/superdesk';

// generated by grunt 'ngtemplates' task (empty on dev)
import 'templates-cache.generated';

// modules
import 'superdesk-workspace';
import 'superdesk-dashboard';
import 'superdesk-users';
import 'superdesk-groups';
import 'superdesk-products';
import 'superdesk-publish';
import 'superdesk-templates';
import 'superdesk-profiling';
import 'superdesk-desks';
import 'superdesk-authoring';
import 'superdesk-search';
import 'superdesk-legal-archive';
import 'superdesk-stream';
import 'superdesk-packaging';
import 'superdesk-highlights';
import 'superdesk-content-filters';
import 'superdesk-dictionaries';
import 'superdesk-vocabularies';
import 'superdesk-archive';
import 'superdesk/editor/spellcheck/spellcheck';
import 'superdesk-monitoring';
import 'superdesk-settings';
import 'superdesk-ingest';
import 'superdesk-search-providers';

// load spellcheckers
if (appConfig.features.useTansaProofing) {
    require('superdesk-tansa');
}

// don't bootstrap in unit tests
if (appConfig.buildParams.noBootstrap !== true) {
    require('superdesk/bootstrap');
}
