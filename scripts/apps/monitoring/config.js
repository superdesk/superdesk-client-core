Monitoring.$inject = ['superdeskProvider'];
export function Monitoring(superdesk) {
    superdesk
        .activity('/workspace/monitoring', {
            label: gettext('Monitoring'),
            priority: 100,
            templateUrl: 'scripts/apps/monitoring/views/monitoring.html',
            topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html'
        });
}

SpikeMonitoring.$inject = ['superdeskProvider'];
export function SpikeMonitoring(superdesk) {
    superdesk
        .activity('/workspace/spike-monitoring', {
            label: gettext('Spike Monitoring'),
            priority: 100,
            templateUrl: 'scripts/apps/monitoring/views/spike-monitoring.html',
            topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html'
        });
}

/**
 * Configure personal option from left menu
 */
Personal.$inject = ['superdeskProvider'];
export function Personal(superdesk) {
    superdesk
        .activity('/workspace/personal', {
            label: gettext('Personal'),
            priority: 100,
            templateUrl: 'scripts/apps/monitoring/views/personal.html',
            topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html'
        });
}
