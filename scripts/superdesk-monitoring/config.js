Monitoring.$inject = ['superdeskProvider'];
export function Monitoring(superdesk) {
    superdesk
        .activity('/workspace/monitoring', {
            label: gettext('Monitoring'),
            priority: 100,
            templateUrl: 'scripts/superdesk-monitoring/views/monitoring.html',
            topTemplateUrl: 'scripts/superdesk-dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html'
        });
}

SpikeMonitoring.$inject = ['superdeskProvider'];
export function SpikeMonitoring(superdesk) {
    superdesk
        .activity('/workspace/spike-monitoring', {
            label: gettext('Spike Monitoring'),
            priority: 100,
            templateUrl: 'scripts/superdesk-monitoring/views/spike-monitoring.html',
            topTemplateUrl: 'scripts/superdesk-dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html'
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
            templateUrl: 'scripts/superdesk-monitoring/views/personal.html',
            topTemplateUrl: 'scripts/superdesk-dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html'
        });
}
