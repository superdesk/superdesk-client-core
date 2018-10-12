Monitoring.$inject = ['superdeskProvider', 'workspaceMenuProvider'];
export function Monitoring(superdesk, workspaceMenuProvider) {
    superdesk
        .activity('/workspace/monitoring', {
            label: gettext('Monitoring'),
            priority: 100,
            templateUrl: 'scripts/apps/monitoring/views/monitoring.html',
            topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
        });

    workspaceMenuProvider.item(
        {
            icon: 'view',
            href: '/workspace/monitoring',
            label: gettext('Monitoring'),
            shortcut: 'alt+m',
            order: 200,
        },
    );
}

SpikeMonitoring.$inject = ['superdeskProvider', 'workspaceMenuProvider'];
export function SpikeMonitoring(superdesk, workspaceMenuProvider) {
    superdesk
        .activity('/workspace/spike-monitoring', {
            label: gettext('Spike Monitoring'),
            priority: 100,
            templateUrl: 'scripts/apps/monitoring/views/spike-monitoring.html',
            topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
        });

    workspaceMenuProvider.item({
        href: '/workspace/spike-monitoring',
        label: gettext('Spike'),
        shortcut: 'ctrl+alt+k',
        icon: 'spike',
        order: 600,
    });
}

/**
 * Configure personal option from left menu
 */
Personal.$inject = ['superdeskProvider', 'workspaceMenuProvider'];
export function Personal(superdesk, workspaceMenuProvider) {
    superdesk
        .activity('/workspace/personal', {
            label: gettext('Personal'),
            priority: 100,
            templateUrl: 'scripts/apps/monitoring/views/personal.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
        });

    workspaceMenuProvider.item({
        href: '/workspace/personal',
        label: gettext('Personal'),
        shortcut: 'alt+p',
        icon: 'personal',
        order: 900,
        group: 'personal',
    });
}
