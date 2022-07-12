import * as React from 'react';
import {noop} from 'lodash';
import {Dropdown, CreateButton, IconButton} from 'superdesk-ui-framework/react';

import {ManageRundownTemplates} from './shows/rundowns/manage-rundown-templates';
import {CreateShowModal} from './shows/create-show';

import {superdesk} from './superdesk';
import {RundownItemsAuthoring} from './rundown-items-editing-demo';
const {gettext} = superdesk.localization;

const {Spacer} = superdesk.components;

export class Page extends React.PureComponent {
    render() {
        return (
            <div style={{marginTop: 'var(--top-navigation-height)', width: '100%', height: 'calc(100% - 32px)'}}>
                <Spacer h gap="32" justifyContent="space-between" noWrap style={{height: '100%'}}>
                    <div>
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

                        <IconButton
                            ariaValue={gettext('Manage show templates')}
                            icon="settings"
                            onClick={() => {
                                superdesk.ui.showModal(({closeModal}) => (
                                    <ManageRundownTemplates
                                        dialogTitle={gettext('Manage rundown templates')}
                                        closeModal={closeModal}
                                    />
                                ));
                            }}
                        />
                    </div>

                    <div style={{height: '100%', overflow: 'auto'}}>
                        <RundownItemsAuthoring itemId="abc" />
                    </div>
                </Spacer>
            </div>
        );
    }
}
