import {reactToAngular1} from 'superdesk-ui-framework';
import {TranslationsWidget} from './translationsWidget';

angular.module('superdesk.apps.authoring.translations', [
    'superdesk.apps.authoring.widgets',
])
    .config(['authoringWidgetsProvider', function(authoringWidgetsProvider) {
        authoringWidgetsProvider
            .widget('translations', {
                icon: 'web',
                label: gettext('Translations'),
                template: 'scripts/apps/authoring/translations/views/translations-widget.html',
                order: 7,
                side: 'right',
                hideWhenTranslationsDisabled: true,
                display: {
                    authoring: true,
                    packages: true,
                    killedItem: true,
                    legalArchive: true,
                    archived: true,
                    picture: true,
                    personal: true,
                },
            });
    }])
    .component('translationsWidget', reactToAngular1(TranslationsWidget, ['item']));