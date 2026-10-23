import React from 'react';
import {IArticle, IExtension, IExtensionActivationResult} from 'superdesk-api';

// No extension in this repository adds a widget to the Created/Modified row, so this one does.
// It stays inert unless a spec opts in.
export const TOPBAR2_WIDGET_ENABLED = 'e2e-topbar2-widget';

function Topbar2Widget({entity}: {entity: IArticle}) {
    return (
        <span data-test-id="e2e-topbar2-widget">{`Extension widget: ${entity.slugline}`}</span>
    );
}

const extension: IExtension = {
    activate: () => {
        const contributions: IExtensionActivationResult =
            localStorage.getItem(TOPBAR2_WIDGET_ENABLED) === 'true'
                ? {
                    contributions: {
                        authoringTopbar2Widgets: [{
                            component: Topbar2Widget,
                            availableOffline: true,
                            group: 'start',
                            priority: 2,
                        }],
                    },
                }
                : {};

        return Promise.resolve(contributions);
    },
};

export default extension;
