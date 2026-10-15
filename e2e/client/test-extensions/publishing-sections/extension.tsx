import React from 'react';
import {IArticle, IExtension, IExtensionActivationResult} from 'superdesk-api';

/**
 * Stands in for a deployment that contributes extra columns to the publishing panel.
 * No extension in this repository does, so without one the panel's `columnCount` is
 * always 1 and its adaptive width cannot be exercised at all.
 *
 * It stays inert unless a spec opts in, because the number of contributed sections
 * changes the panel width for every other spec in the suite.
 */
export const PUBLISHING_SECTIONS_ENABLED = 'e2e-publishing-sections';

function ExtraPublishingSection({item}: {item: IArticle}) {
    return (
        <div data-test-id="extra-publishing-section" style={{height: '100%'}}>
            <h4>Extra publishing section</h4>

            <div data-test-id="extra-publishing-section--slugline">{item.slugline}</div>
        </div>
    );
}

const extension: IExtension = {
    activate: () => {
        const contributions: IExtensionActivationResult =
            localStorage.getItem(PUBLISHING_SECTIONS_ENABLED) === 'true'
                ? {contributions: {publishingSections: [{component: ExtraPublishingSection}]}}
                : {};

        return Promise.resolve(contributions);
    },
};

export default extension;
