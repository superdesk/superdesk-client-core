import React from 'react';
import {IArticle} from 'superdesk-api';
import {Icon, Tooltip} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {useInlineToolbarContext} from './inline-toolbar-context';

// `NavButton` written out, because it takes neither a tooltip nor event handlers, and wrapping a
// plain child in `Tooltip` adds a `display: contents` element that the top bar's spacing rules
// cannot hang a margin on.
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
