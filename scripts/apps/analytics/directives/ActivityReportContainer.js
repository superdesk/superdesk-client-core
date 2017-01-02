/**
 * @ngdoc directive
 * @module superdesk.apps.analytics
 * @name sdActivityReportContainer
 * @description Container directive
 */
export function ActivityReportContainer() {
    return {
        controller: ['gettext', 'pageTitle',
            function ActivityReportContainerController(gettext, pageTitle) {
                pageTitle.setUrl(gettext('Activity Report'));
            }
        ]
    };
}
