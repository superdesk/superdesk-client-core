import React from 'react';
import {IArticle} from 'superdesk-api';
import {Icon, Tooltip} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {useInlineToolbarContext} from './inline-toolbar-context';

/**
 * The button `NavButton` would render, written out so the tooltip's handlers can sit on the button
 * itself: `NavButton` takes neither a tooltip nor event handlers, and the element `Tooltip` wraps a
 * plain child in is `display: contents`, which the top bar's spacing rules cannot hang a margin on.
 * `MoreActionsButton` (core/ui/components) is the same control written the same way.
 */
export const MinimizeButtonComponent: React.ComponentType<{entity: IArticle}> = () => {
    const {exposed} = useInlineToolbarContext<IArticle>();

    return (
        <Tooltip content={gettext('Minimize')}>
            {({attributes}) => (
                <button
                    {...attributes}
                    type="button"
                    className="sd-navbtn"
                    aria-label={gettext('Minimize')}
                    data-test-id="minimize"
                    onClick={() => exposed?.keepChangesAndClose()}
                >
                    <Icon name="minimize" size="big" />
                </button>
            )}
        </Tooltip>
    );
};
