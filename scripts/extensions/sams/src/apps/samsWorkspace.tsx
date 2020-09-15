// External Modules
import * as React from 'react';

// Types
import {ISuperdesk} from 'superdesk-api';

// UI
import {Dropdown, ButtonGroup, SubNav, Button} from 'superdesk-ui-framework/react';
import {IMenuGroup} from 'superdesk-ui-framework/react/components/Dropdown';
import {HeaderPanel, LayoutContainer, MainPanel} from '../ui';
import {getShowManageSetsModalFunction} from '../components/sets/manageSetsModal';
import {getShowUploadAssetModalFunction} from '../components/assets/uploadAssetModal';

export function getSamsWorkspaceComponent(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;
    const showManageSetsModal = getShowManageSetsModalFunction(superdesk);
    const showUploadAssetModal = getShowUploadAssetModalFunction(superdesk);

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
                                    <ButtonGroup align="right">
                                        {subNavMenuActions.length === 0 ? null : (
                                            <Dropdown items={subNavMenuActions}>
                                                <button className="sd-navbtn">
                                                    <i className="icon-dots-vertical" />
                                                </button>
                                            </Dropdown>
                                        )}
                                        <Button
                                            type="primary"
                                            icon="upload"
                                            text="plus-large"
                                            shape="round"
                                            iconOnly={true}
                                            onClick={showUploadAssetModal}
                                        />
                                    </ButtonGroup>
                                </SubNav>
                                <SubNav zIndex={1} />
                            </HeaderPanel>
                            <MainPanel className="sd-padding--2">
                                <div className="sd-margin--1" />
                            </MainPanel>
                        </LayoutContainer>
                    </div>
                </React.Fragment>
            );
        }
    };
}
