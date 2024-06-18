import {authoringReactEnabledUserSelection, toggleAuthoringReact} from 'appConfig';
import {showOptionsModal} from 'core/ui/components/options-modal';
import {gettext} from 'core/utils';
import React from 'react';
import {Button} from 'superdesk-ui-framework/react';

export class AuthoringSwitch extends React.Component {
    render(): React.ReactNode {
        return (
            <Button
                icon="settings"
                shape="round"
                style="hollow"
                size="small"
                type="highlight"
                text={gettext('Switch authoring')}
                onClick={() => showOptionsModal(
                    gettext('Switch authoring?'),
                    gettext('The page needs to be reloaded in order to do that.'),
                    [
                        {
                            label: gettext('Cancel'),
                            onSelect: (closePromptFn) => {
                                closePromptFn();
                            },
                        },
                        {
                            label: gettext('Confirm'),
                            onSelect: (closePromptFn) => {
                                closePromptFn();
                                toggleAuthoringReact(!authoringReactEnabledUserSelection);
                                window.location.reload();
                            },
                            highlightOption: true,
                        },
                    ],
                )}
            />
        );
    }
}
