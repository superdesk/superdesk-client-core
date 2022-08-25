/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import {IRundown, IRundownItem, IRundownItemBase, IRundownItemTemplateInitial} from '../../interfaces';
import {Button, ButtonGroup, IconButton, Input, SubNav} from 'superdesk-ui-framework/react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';

interface IProps {
    rundownId: string;
    readOnly: boolean;
    onClose(): void;
}

interface IState {
    rundown: IRundown | null;
    rundownWithChanges: IRundown | null;
    createOrEditRundownItem: ICreate | IEdit | null;
}

import {superdesk} from '../../superdesk';

import {ManageRundownItems} from './manage-rundown-items';
import {ICreate, IEdit} from './template-edit';
import {prepareForCreation, prepareForEditing} from './prepare-create-edit';
import {CreateValidators, WithValidation} from '@superdesk/common';
import {stringNotEmpty} from '../../form-validation';
import {isEqual, noop} from 'lodash';
import {syncDurationWithEndTime} from './sync-duration-with-end-time';
import {rundownTemplateItemStorageAdapter} from './rundown-template-item-storage-adapter';
import {LANGUAGE} from '../../constants';
const {gettext} = superdesk.localization;
const {httpRequestJsonLocal} = superdesk;
const {getAuthoringComponent, WithLiveResources} = superdesk.components;
const {generatePatch} = superdesk.utilities;

const AuthoringReact = getAuthoringComponent<IRundownItemTemplateInitial>();

const rundownValidator: CreateValidators<Partial<IRundown>> = {
    title: stringNotEmpty,
};

export class RundownViewEditComponent extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            rundown: null,
            rundownWithChanges: null,
            createOrEditRundownItem: null,
        };

        this.setRundownField = this.setRundownField.bind(this);
        this.initiateCreation = this.initiateCreation.bind(this);
        this.initiateEditing = this.initiateEditing.bind(this);
        this.save = this.save.bind(this);
        this.close = this.close.bind(this);
    }

    setRundownField(data: Partial<IRundown>) {
        const {rundownWithChanges} = this.state;

        if (rundownWithChanges == null) {
            throw new Error('invalid operation');
        }

        this.setState({
            rundownWithChanges: {
                ...rundownWithChanges,
                ...data,
            },
        });
    }

    save() {
        if (this.state.rundownWithChanges == null || this.state.rundown == null) {
            throw new Error('invalid state'); // TODO: log error ?
        }

        httpRequestJsonLocal<IRundown>({
            method: 'PATCH',
            path: `/rundowns/${this.props.rundownId}`,
            payload: generatePatch(this.state.rundown, this.state.rundownWithChanges),
            headers: {
                'If-Match': this.state.rundown._etag,
            },
        }).then((rundown) => {
            this.setState({
                rundown: rundown,
                rundownWithChanges: rundown,
            });
        });
    }

    close() {
        if (!isEqual(this.state.rundown, this.state.rundownWithChanges)) {
            superdesk.ui.confirm(gettext('Discard unsaved changes?')).then((confirmed) => {
                if (confirmed) {
                    this.props.onClose();
                }
            });
        } else {
            this.props.onClose();
        }
    }

    initiateCreation() {
        this.setState({
            createOrEditRundownItem: prepareForCreation((val) => {
                if (!this.props.readOnly) {
                    const itemWithDuration: Partial<IRundownItemBase> = {
                        ...val.data,
                        duration: val.data.planned_duration, // TODO: copied code, move into function?
                    };

                    /**
                     * start/end times are generated from duration
                     * they are present in the form only for making it easier for users to enter duration
                     */
                    delete itemWithDuration['start_time'];
                    delete itemWithDuration['end_time'];

                    // TODO: remove test data & adjust back-end to allow saving `rawContentState`
                    itemWithDuration.content = 'test content';

                    const {rundown, rundownWithChanges} = this.state;

                    if (rundown == null || rundownWithChanges == null) {
                        return;
                    }

                    httpRequestJsonLocal<IRundownItem>({
                        method: 'POST',
                        path: '/rundown_items',
                        payload: itemWithDuration,
                    }).then((res) => {
                        httpRequestJsonLocal<IRundown>({
                            method: 'PATCH',
                            path: `/rundowns/${this.props.rundownId}`,
                            payload: {
                                items: (rundown.items ?? []).concat({_id: res._id}),
                            },
                            headers: {
                                'If-Match': rundown._etag,
                            },
                        }).then((rundownNext) => {
                            this.setState({
                                rundown: {
                                    ...rundown,
                                    items: rundownNext.items,
                                    _etag: rundownNext._etag,
                                },
                                rundownWithChanges: {
                                    ...rundownWithChanges,
                                    items: rundownNext.items,
                                    _etag: rundownNext._etag,
                                },
                            });
                        });
                    });
                }
            }),
        });
    }

    initiateEditing(item: IRundownItemBase) {
        this.setState({
            createOrEditRundownItem: prepareForEditing(item, (val) => {
                if (!this.props.readOnly) {
                    // this.setRundownField({
                    //     rundown_items: this.getRundownItems().map((_item) => _item === item ? val : _item),
                    // });

                    // eslint-disable-next-line no-console
                    console.log(val); // TODO: implement saving changes
                }
            }),
        });
    }

    componentDidMount() {
        httpRequestJsonLocal<IRundown>({
            method: 'GET',
            path: `/rundowns/${this.props.rundownId}`,
        }).then((rundown) => {
            this.setState({
                rundown: rundown,
                rundownWithChanges: rundown,
            });
        });
    }

    render() {
        const rundown = this.state.rundownWithChanges;

        if (rundown == null) {
            return null;
        }

        return (
            <WithValidation validators={rundownValidator}>
                {(validate, validationErrors) => (
                    <Layout.LayoutContainer>
                        <Layout.HeaderPanel>
                            <SubNav>
                                <ButtonGroup align="end" padded>
                                    {
                                        this.props.readOnly
                                            ? (
                                                <Button
                                                    text={gettext('Edit')}
                                                    onClick={noop}
                                                    type="primary"
                                                />
                                            )
                                            : (
                                                <React.Fragment>
                                                    <Button
                                                        text={gettext('Cancel')}
                                                        onClick={this.close}
                                                    />

                                                    <Button
                                                        text={gettext('Save')}
                                                        onClick={() => {
                                                            const valid = validate(rundown);

                                                            if (valid) {
                                                                this.save();
                                                            }
                                                        }}
                                                        type="primary"
                                                    />
                                                </React.Fragment>
                                            )
                                    }
                                </ButtonGroup>
                            </SubNav>
                        </Layout.HeaderPanel>

                        <Layout.MainPanel padding="none">
                            <Layout.AuthoringMain headerPadding="medium">
                                <div>
                                    <Input
                                        type="text"
                                        value={rundown.title}
                                        onChange={(val) => {
                                            this.setRundownField({title: val});
                                        }}
                                        label={gettext('Headline')}
                                        labelHidden
                                        inlineLabel
                                        size="large"
                                        boxedStyle
                                        error={validationErrors.title ?? undefined}
                                        invalid={validationErrors.title != null}
                                    />

                                    <WithLiveResources
                                        resources={[
                                            {
                                                resource: 'rundown_items',
                                                ids: rundown.items.map(({_id: id}) => id),
                                            },
                                        ]}
                                    >
                                        {(res) => {
                                            const rundownItems: Array<IRundown> = res[0]._items;

                                            return (
                                                <ManageRundownItems
                                                    readOnly={this.props.readOnly}
                                                    items={rundownItems}
                                                    createOrEdit={this.state.createOrEditRundownItem}
                                                    initiateCreation={this.initiateCreation}
                                                    initiateEditing={this.initiateEditing}
                                                    onChange={(val) => {
                                                        this.setRundownField({
                                                            items: val.map(({_id}) => ({_id: _id})),
                                                        });
                                                    }}
                                                />
                                            );
                                        }}
                                    </WithLiveResources>
                                </div>
                            </Layout.AuthoringMain>
                        </Layout.MainPanel>

                        <Layout.RightPanel open={this.state.createOrEditRundownItem != null}>
                            <Layout.Panel side="right" background="grey">
                                <Layout.PanelContent>
                                    {
                                        this.state.createOrEditRundownItem != null && (
                                            <AuthoringReact
                                                // ID is not needed because authoringStorage is operating on array items
                                                // and not on database items via HTTP API
                                                itemId=""
                                                onClose={() => {
                                                    this.setState({createOrEditRundownItem: null});
                                                }}
                                                fieldsAdapter={{}}
                                                authoringStorage={this.state.createOrEditRundownItem.authoringStorage}
                                                storageAdapter={rundownTemplateItemStorageAdapter}
                                                getLanguage={() => LANGUAGE}
                                                getInlineToolbarActions={({save, discardChangesAndClose}) => {
                                                    return {
                                                        readOnly: false,
                                                        toolbarBgColor: 'var(--sd-colour-bg__sliding-toolbar)',
                                                        actions: [
                                                            {
                                                                label: gettext('Apply'),
                                                                availableOffline: false,
                                                                group: 'end',
                                                                priority: 0.1,
                                                                component: () => (
                                                                    <Button
                                                                        text={gettext('Apply')}
                                                                        onClick={() => {
                                                                            save();
                                                                        }}
                                                                        type="primary"
                                                                    />
                                                                ),
                                                            },
                                                            {
                                                                label: gettext('Close'),
                                                                availableOffline: true,
                                                                group: 'start',
                                                                priority: 0.1,
                                                                component: () => (
                                                                    <IconButton
                                                                        ariaValue={gettext('Close')}
                                                                        icon="close-small"
                                                                        onClick={() => {
                                                                            discardChangesAndClose();
                                                                        }}
                                                                    />
                                                                ),
                                                            },
                                                        ],
                                                    };
                                                }}
                                                getAuthoringTopBarWidgets={() => []}
                                                topBar2Widgets={[]}
                                                onFieldChange={syncDurationWithEndTime}
                                            />
                                        )
                                    }
                                </Layout.PanelContent>
                            </Layout.Panel>
                        </Layout.RightPanel>
                    </Layout.LayoutContainer>
                )}
            </WithValidation>
        );
    }
}

// wrap it and use key so the component re-mounts if rundownId changes
export const RundownViewEdit: React.ComponentType<IProps> =
    (props) => <RundownViewEditComponent {...props} key={props.rundownId} />;
