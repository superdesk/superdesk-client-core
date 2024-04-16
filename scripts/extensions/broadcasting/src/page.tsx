import * as React from 'react';
import {noop} from 'lodash';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';

import {
    ButtonGroup,
    NavButton,
    SubNav,
    Dropdown,
    CreateButton,
    Button,
    SearchBar,
    Modal,
} from 'superdesk-ui-framework/react';

import {ManageRundownTemplates} from './rundown-templates/manage-rundown-templates';
import {CreateShowModal} from './shows/create-show-modal';

import {classnames, showModal} from '@superdesk/common';

import {CreateRundownFromTemplate} from './rundowns/create-rundown-from-template';
import {RundownsList} from './rundowns/rundowns-list';
import {IRundownAction, RundownViewEdit} from './rundowns/rundown-view-edit';
import {IRundown, IRundownFilters} from './interfaces';
import {FilteringInputs} from './rundowns/components/filtering-inputs';
import {AppliedFilters} from './rundowns/components/applied-filters';

import {superdesk} from './superdesk';
import {ManageShows} from './shows/manage-shows';
import {IRundownItemActionNext, prepareForPreview} from './rundowns/prepare-create-edit-rundown-item';
import {events, IBroadcastingEvents} from './events';
import {IPage} from 'superdesk-api';

const {gettext} = superdesk.localization;
const {isLockedInCurrentSession} = superdesk.utilities;
const {tryLocking, tryUnlocking} = superdesk.helpers;

type IProps = React.ComponentProps<IPage['component']>;

interface IState {
    rundownAction: IRundownAction;
    rundownItemAction: IRundownItemActionNext;
    searchString: string;
    filtersOpen: boolean;
    filters: IRundownFilters;
    filtersApplied: IRundownFilters;
}

export class RundownsPage extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            rundownAction: null,
            rundownItemAction: null,
            searchString: '',
            filtersOpen: false,
            filters: {},
            filtersApplied: {},
        };

        this.updateFullWidthCapability = this.updateFullWidthCapability.bind(this);
        this.setFilter = this.setFilter.bind(this);
        this.prepareRundownEditing = this.prepareRundownEditing.bind(this);
        this.prepareNextRundownItemAction = this.prepareNextRundownItemAction.bind(this);
        this.openRundownItemEventHandler = this.openRundownItemEventHandler.bind(this);
    }

    private updateFullWidthCapability(options?: {disable: true}) {
        if (options?.disable === true) {
            this.props.setupFullWidthCapability({enabled: false});
            return;
        }

        const {rundownAction} = this.state;

        if (rundownAction == null) {
            this.props.setupFullWidthCapability({enabled: true, allowed: false});
        } else {
            this.props.setupFullWidthCapability({
                enabled: true,
                allowed: true,
                onToggle: (val) => {
                    this.setState({
                        rundownAction: {
                            ...rundownAction,
                            fullWidth: val,
                        },
                    });
                },
            });
        }
    }

    private setFilter(filters: Partial<IState['filters']>) {
        this.setState({
            filters: {
                ...this.state.filters,
                ...filters,
            },
        });
    }

    private prepareRundownEditing(id: IRundown['_id']): Promise<IState['rundownAction']> {
        return tryLocking<IRundown>('/rundowns', id).then(({success}) => {
            if (success) {
                return {mode: 'edit', id, fullWidth: this.state.rundownAction?.fullWidth ?? false};
            } else {
                return {mode: 'view', id, fullWidth: this.state.rundownAction?.fullWidth ?? false};
            }
        });
    }

    private prepareNextRundownItemAction(actionNext: IRundownItemActionNext): Promise<IState['rundownItemAction']> {
        if (actionNext != null && actionNext.type === 'edit') {
            return tryLocking('/rundown_items', actionNext.itemId).then(() => {
                return actionNext;
            });
        } else {
            return Promise.resolve(actionNext);
        }
    }

    private openRundownItemEventHandler(event: CustomEvent<IBroadcastingEvents['openRundownItem']>): void {
        const {rundownId, rundownItemId, sidePanel} = event.detail;

        Promise.all([
            this.prepareRundownEditing(rundownId),
            this.prepareNextRundownItemAction(prepareForPreview(this.state.rundownItemAction, rundownItemId)),
        ]).then(([rundownViewEditNext, rundownItemActionNext]) => {
            const _rundownItemActionNext =
                rundownItemActionNext == null || sidePanel == null
                    ? rundownItemActionNext
                    : {
                        ...rundownItemActionNext,
                        sideWidget: {
                            name: sidePanel,
                            pinned: false,
                        },
                    };

            this.setState({
                rundownAction: rundownViewEditNext,
                rundownItemAction: _rundownItemActionNext,
            });
        });
    }

    componentDidMount(): void {
        events.addListener('openRundownItem', this.openRundownItemEventHandler);
        events.dispatchEvent('broadcastingPageDidLoad', true);

        this.updateFullWidthCapability();
    }

    componentDidUpdate(): void {
        this.updateFullWidthCapability();
    }

    componentWillUnmount(): void {
        events.removeListener('openRundownItem', this.openRundownItemEventHandler);

        this.updateFullWidthCapability({disable: true});
    }

    render() {
        const {rundownAction} = this.state;
        const rundownItemOpen = rundownAction != null && this.state.rundownItemAction != null;
        const rundownsListVisible = rundownAction?.fullWidth !== true && !rundownItemOpen;

        return (
            <div
                style={{
                    marginBlockStart: 'var(--top-navigation-height)',
                    width: '100%',
                    height: 'calc(100% - var(--top-navigation-height))',
                }}
            >
                <div
                    className={classnames(
                        'sd-content sd-content-wrapper',
                        {'sd-content-wrapper--editor-full': rundownsListVisible !== true},
                    )}
                >
                    {
                        rundownsListVisible && (
                            <React.Fragment>
                                <Layout.LayoutContainer>
                                    <Layout.HeaderPanel>
                                        <SubNav zIndex={2}>
                                            <SearchBar
                                                placeholder={gettext('Search')}
                                                value={this.state.searchString}
                                                onSubmit={(val) => {
                                                    if (typeof val === 'number') {
                                                        throw new Error('invalid state');
                                                    }

                                                    this.setState({
                                                        searchString: val,
                                                    });
                                                }}
                                            />

                                            <ButtonGroup align="end" spaces="no-space">
                                                <Dropdown
                                                    items={[
                                                        {
                                                            type: 'group',
                                                            label: gettext('Settings'),
                                                            items: [
                                                                'divider',
                                                                {
                                                                    icon: 'switches',
                                                                    label: gettext('Manage Rundown Templates'),
                                                                    onSelect: () => {
                                                                        showModal(({closeModal}) => (
                                                                            <ManageRundownTemplates
                                                                                dialogTitle={
                                                                                    gettext('Manage rundown templates')
                                                                                }
                                                                                closeModal={closeModal}
                                                                            />
                                                                        ));
                                                                    },
                                                                },
                                                                {
                                                                    icon: 'switches',
                                                                    label: gettext('Manage Shows'),
                                                                    onSelect: () => {
                                                                        showModal(({closeModal}) => (
                                                                            <Modal
                                                                                visible
                                                                                headerTemplate={gettext('Manage Shows')}
                                                                                contentBg="medium"
                                                                                contentPadding="none"
                                                                                size="large"
                                                                                onHide={() => {
                                                                                    closeModal();
                                                                                }}
                                                                                zIndex={1050}
                                                                            >
                                                                                <ManageShows />
                                                                            </Modal>
                                                                        ));
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                    ]}
                                                >
                                                    <NavButton icon="settings" onClick={() => false} />
                                                </Dropdown>

                                                <Dropdown
                                                    header={[
                                                        {
                                                            type: 'group',
                                                            label: gettext('Create new'),
                                                            items: [
                                                                {
                                                                    icon: 'rundown',
                                                                    label: gettext('Rundown'),
                                                                    onSelect: () => {
                                                                        showModal(({closeModal}) => (
                                                                            <CreateRundownFromTemplate
                                                                                onClose={closeModal}
                                                                            />
                                                                        ));
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                    ]}
                                                    items={[]}
                                                    footer={[
                                                        {
                                                            type: 'group',
                                                            items: [
                                                                {
                                                                    icon: 'rundown',
                                                                    label: gettext('Create new Show'),
                                                                    onSelect: () => {
                                                                        showModal(CreateShowModal);
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
                                            </ButtonGroup>
                                        </SubNav>
                                        <SubNav zIndex={1}>
                                            <ButtonGroup align="start">
                                                <NavButton
                                                    icon="filter-large"
                                                    onClick={() => {
                                                        this.setState({
                                                            filtersOpen: !this.state.filtersOpen,
                                                        });
                                                    }}
                                                />

                                                <div>
                                                    <AppliedFilters
                                                        filters={this.state.filtersApplied}
                                                        onChange={(val) => {
                                                            this.setState({
                                                                filters: val,
                                                                filtersApplied: val,
                                                            });
                                                        }}
                                                    />
                                                </div>
                                            </ButtonGroup>
                                        </SubNav>
                                    </Layout.HeaderPanel>

                                    <Layout.LeftPanel open={this.state.filtersOpen}>
                                        <Layout.Panel side="left" background="grey">
                                            <Layout.PanelHeader
                                                title="Advanced filters"
                                                onClose={() => {
                                                    this.setState({filtersOpen: false});
                                                }}
                                            />

                                            <Layout.PanelContent>
                                                <Layout.PanelContentBlock>
                                                    <FilteringInputs
                                                        filters={this.state.filters}
                                                        onChange={this.setFilter}
                                                    />
                                                </Layout.PanelContentBlock>
                                            </Layout.PanelContent>
                                            <Layout.PanelFooter>
                                                <Button
                                                    text={gettext('Clear')}
                                                    style="hollow"
                                                    onClick={() => {
                                                        this.setState({
                                                            filters: {},
                                                            filtersApplied: {},
                                                        });
                                                    }}
                                                />

                                                <Button
                                                    text={gettext('Filter')}
                                                    type="primary"
                                                    onClick={() => {
                                                        this.setState({filtersApplied: this.state.filters});
                                                    }}
                                                />
                                            </Layout.PanelFooter>
                                        </Layout.Panel>
                                    </Layout.LeftPanel>

                                    <Layout.MainPanel>
                                        <RundownsList
                                            rundownAction={rundownAction}
                                            preview={(id) => {
                                                this.setState({
                                                    rundownAction: {
                                                        mode: 'view',
                                                        fullWidth: this.state.rundownAction?.fullWidth ?? false,
                                                        id,
                                                    },
                                                });
                                            }}
                                            onEditModeChange={(id, rundownItemAction) => {
                                                Promise.all([
                                                    this.prepareRundownEditing(id),
                                                    this.prepareNextRundownItemAction(rundownItemAction ?? null),
                                                ]).then(([rundownViewEditNext, rundownItemActionNext]) => {
                                                    this.setState({
                                                        rundownAction: rundownViewEditNext,
                                                        rundownItemAction: rundownItemActionNext,
                                                    });
                                                });
                                            }}
                                            searchString={this.state.searchString}
                                            filters={this.state.filtersApplied}
                                            rundownItemAction={this.state.rundownItemAction}
                                        />
                                    </Layout.MainPanel>

                                    <Layout.OverlayPanel />
                                </Layout.LayoutContainer>

                                <Layout.ContentSplitter visible={true} disabled />
                            </React.Fragment>
                        )
                    }
                    <Layout.AuthoringContainer open={rundownAction != null}>
                        {
                            rundownAction != null && (
                                <RundownViewEdit
                                    key={rundownAction.id + rundownAction.mode}
                                    rundownAction={rundownAction}
                                    rundownId={rundownAction.id}
                                    onClose={(rundown: IRundown) => {
                                        const doUnlock = isLockedInCurrentSession(rundown)
                                            ? tryUnlocking('/rundowns', rundown._id)
                                            : Promise.resolve();

                                        doUnlock.finally(() => {
                                            this.setState({rundownAction: null, rundownItemAction: null});
                                        });
                                    }}
                                    readOnly={rundownAction == null || rundownAction.mode === 'view'}
                                    rundownItemAction={this.state.rundownItemAction}
                                    onRundownActionChange={(actionNext) => {
                                        this.setState({rundownAction: actionNext});
                                    }}
                                    onRundownItemActionChange={(rundownItemAction) => {
                                        this.prepareNextRundownItemAction(rundownItemAction).then((next) => {
                                            this.setState({rundownItemAction: next});
                                        });
                                    }}
                                />
                            )
                        }
                    </Layout.AuthoringContainer>
                </div>
            </div>
        );
    }
}
