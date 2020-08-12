// External Modules
import * as React from 'react';

// Types
import {ISuperdesk} from 'superdesk-api';

// UI
import {Dropdown, ButtonGroup, SubNav} from 'superdesk-ui-framework/react';
import {IMenuGroup} from 'superdesk-ui-framework/react/components/Dropdown';
import {HeaderPanel, LayoutContainer, MainPanel} from '../ui';
import {getShowManageSetsModalFunction} from '../components/sets/manageSetsModal';

export function getSamsWorkspaceComponent(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;
    const showManageSetsModal = getShowManageSetsModalFunction(superdesk);

    return class SamsWorkspace extends React.PureComponent<{}> {
        getSubNavMenuActions(): Array<IMenuGroup> {
            const actions: Array<any> = [];

            if (superdesk.privileges.hasPrivilege('sams_manage')) {
                actions.push({
                    label: gettext('Manage Sets'),
                    icon: 'folder-open',
                    onSelect: showManageSetsModal,
                });
            }

            return actions.length === 0 ?
                [] :
                [{
                    type: 'group',
                    label: gettext('Actions'),
                    items: [
                        'divider',
                        ...actions,
                    ],
                }];
        }

        render() {
            const subNavMenuActions = this.getSubNavMenuActions();

            return (
                <React.Fragment>
                    <div className="sd-page">
                        <LayoutContainer>
                            <HeaderPanel>
                                <SubNav zIndex={2}>
                                    {subNavMenuActions.length === 0 ? null : (
                                        <ButtonGroup align="right">
                                            <Dropdown items={subNavMenuActions}>
                                                <button className="sd-navbtn">
                                                    <i className="icon-dots-vertical"/>
                                                </button>
                                            </Dropdown>
                                        </ButtonGroup>
                                    )}
                                </SubNav>
                                <SubNav zIndex={1}/>
                            </HeaderPanel>
                            <MainPanel className="sd-padding--2">
                                <div className="sd-margin--1"/>
                            </MainPanel>
                        </LayoutContainer>
                    </div>
                </React.Fragment>
            );
        }
    };
}
