import * as React from 'react';
import {noop} from 'lodash';
import {Dropdown, CreateButton} from 'superdesk-ui-framework/react';

import {superdesk} from './superdesk';
import {CreateShowModal} from './create-show';

const {gettext} = superdesk.localization;

export class Page extends React.PureComponent {
    render() {
        return (
            <div style={{marginTop: 'var(--top-navigation-height)'}}>
                <Dropdown
                    header={[]}
                    items={[]}
                    footer={[
                        {
                            type: 'group',
                            items: [
                                {
                                    icon: 'rundown',
                                    label: 'Create new Show',
                                    onSelect: () => {
                                        superdesk.ui.showModal(CreateShowModal);
                                    },
                                },
                            ],
                        },
                    ]}
                >

                    <CreateButton
                        ariaValue={gettext('Create')}
                        onClick={noop}
                    />
                </Dropdown>
            </div>
        );
    }
}
