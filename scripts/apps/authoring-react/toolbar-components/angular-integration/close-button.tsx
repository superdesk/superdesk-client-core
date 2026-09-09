import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {useInlineToolbarContext} from './inline-toolbar-context';
import {CloseIconButtonComponent} from './close-icon-button';
import {useCompactToolbar} from './use-compact-toolbar';

/**
 * Shows the label while the top bar has room for it and the icon once it does not, which is what
 * authoring-angular does with the two spans inside its single close button.
 */
export const CloseButtonComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => {
    const {exposed} = useInlineToolbarContext<IArticle>();
    const ref = React.useRef<HTMLDivElement>(null);
    const compact = useCompactToolbar(ref);

    return (
        <div ref={ref} data-test-id="close">
            {
                compact ? <CloseIconButtonComponent entity={entity} /> : (
                    <Button
                        text={gettext('Close')}
                        style="hollow"
                        onClick={() => exposed?.initiateClosing()}
                    />
                )
            }
        </div>
    );
};
