import * as React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {isEqual} from 'lodash';
import {
    Input,
    Select,
    Option,
    Button,
    IconButton,
    SubNav,
    ButtonGroup,
    Checkbox,
    DurationInput,
} from 'superdesk-ui-framework/react';
import {arrayInsertAtIndex, CreateValidators, WithValidation} from '@superdesk/common';
import {IRRule, IRundownItemBase, IRundownItemTemplateInitial, IRundownTemplateBase} from '../interfaces';
import {superdesk} from '../superdesk';
import {stringNotEmpty} from '../form-validation';
import {ManageRundownItems} from '../rundowns/manage-rundown-items';
import {getPartialDateFormat, toPythonDateFormat, toSuperdeskDateFormat} from '../utils/get-partial-date-format';
import {IAuthoringStorage, ITopBarWidget} from 'superdesk-api';
import {prepareForCreation, prepareForEditing, prepareForPreview} from '../rundowns/prepare-create-edit';

import {rundownTemplateItemStorageAdapter} from './rundown-template-item-storage-adapter';
import {LANGUAGE} from '../constants';
import {FrequencySimple} from '../rundowns/components/FrequencySimple';
import {handleUnsavedRundownChanges} from '../utils/handle-unsaved-rundown-changes';
import {AiringInfoBlock} from '../rundowns/components/airing-info-block';
import {prepareRundownItemForSaving} from '../rundowns/rundown-view-edit';
import {rundownItemContentProfile} from '../rundown-items/content-profile';

const {getAuthoringComponent} = superdesk.components;
const {assertNever} = superdesk.helpers;

const AuthoringReact = getAuthoringComponent<IRundownItemTemplateInitial>();

const {gettext} = superdesk.localization;

const {
    SpacerBlock,
    Spacer,
    InputLabel,
} = superdesk.components;

const dateFormatOptions = [
    getPartialDateFormat({year: true, month: true, day: true}),
    getPartialDateFormat({year: true, month: true}),
    getPartialDateFormat({month: true, day: true}),
];

export interface IWithAuthoringReactKey {
    /**
     * authoring-react doesn't remount if `authoringStorage` changes
     * key is used to instruct authoring-react when to remount
     */
    authoringReactKey: number;
}

export interface ICreate extends IWithAuthoringReactKey {
    type: 'create';
    item: IRundownItemTemplateInitial;
    authoringStorage: IAuthoringStorage<IRundownItemTemplateInitial>;
}

export interface IEdit extends IWithAuthoringReactKey {
    type: 'edit';
    item: IRundownItemTemplateInitial;
    authoringStorage: IAuthoringStorage<IRundownItemTemplateInitial>;
}

export interface IPreview extends IWithAuthoringReactKey {
    type: 'preview';
    item: IRundownItemTemplateInitial;
    authoringStorage: IAuthoringStorage<IRundownItemTemplateInitial>;
}

interface IPropsEditable {
    readOnly: false;
    templateFields: Partial<IRundownTemplateBase>;
    rundownItemAction: IRundownItemAction;
    onRundownItemActionChange(action: IRundownItemAction): void;
    toolbar?: React.ReactNode;
    onChange(template: Partial<IRundownTemplateBase>): void;
    onCancel(): void;
    onSave(): void;
    saveButtonLabel: string;
}

interface IPropsReadOnly {
    readOnly: true;
    templateFields: Partial<IRundownTemplateBase>;
    rundownItemAction: IRundownItemAction;
    onRundownItemActionChange(action: IRundownItemAction): void;
    initiateEditing(): void;
    toolbar?: React.ReactNode;
}

type IProps = IPropsEditable | IPropsReadOnly;

interface IState {
    sideWidget: null | {
        name: string;
        pinned: boolean;
    };
}

export type IRundownItemAction = ICreate | IEdit | IPreview | null;

const templateFieldsValidator: CreateValidators<Partial<IRundownTemplateBase>> = {
    title: stringNotEmpty,
    airtime_time: stringNotEmpty,
};

const contentProfile = rundownItemContentProfile;
const allFields = contentProfile.header.merge(contentProfile.content);
const readOnlyFields = allFields.filter((field) => field.fieldConfig.readOnly === true);

/**
 * Remove read-only fields to avoid getting an error from the server when saving.
 */
function dropReadOnlyFields(item: IRundownItemBase): IRundownItemBase {
    const shallowCopy = {...item};

    readOnlyFields.toArray().forEach((field) => {
        delete (shallowCopy as {[key: string]: any})[field.id];
    });

    return shallowCopy;
}

export class RundownTemplateViewEdit extends React.PureComponent<IProps, IState> {
    private templateFieldsInitial: Partial<IRundownTemplateBase>;

    constructor(props: IProps) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.initiateCreation = this.initiateCreation.bind(this);
        this.initiateEditing = this.initiateEditing.bind(this);
        this.initiatePreview = this.initiatePreview.bind(this);
        this.getRundownItems = this.getRundownItems.bind(this);
        this.handleCancelling = this.handleCancelling.bind(this);

        this.templateFieldsInitial = {};

        this.state = {
            sideWidget: null,
        };
    }

    private getRundownItems() {
        return this.props.templateFields.items ?? [];
    }

    private handleChange(value: Partial<IRundownTemplateBase>) {
        if (this.props.readOnly !== true) {
            this.props.onChange(value);
        }
    }

    private initiateCreation(
        initialData: Partial<IRundownItemBase>,
        insertAtIndex?: number,
        skipUnsavedChangesCheck?: boolean,
    ) {
        handleUnsavedRundownChanges(this.props.rundownItemAction, skipUnsavedChangesCheck ?? false, () => {
            this.props.onRundownItemActionChange(
                prepareForCreation(this.props.rundownItemAction, initialData, (val) => {
                    if (!this.props.readOnly) {
                        const currentItems = this.getRundownItems();

                        this.props.onChange({
                            items: arrayInsertAtIndex(
                                currentItems,
                                dropReadOnlyFields(val.data as unknown as IRundownItemBase),
                                insertAtIndex ?? currentItems.length,
                            ),
                        });
                    }

                    // need to exit creation mode so saving again wouldn't create another item
                    this.initiateEditing(val.data as unknown as IRundownItemBase, true);

                    return Promise.resolve(val);
                }),
            );
        });
    }

    private initiateEditing(item: IRundownItemBase, skipUnsavedChangesCheck?: boolean) {
        /**
         * It's tricky to compare `IRundownItemBase` since it doesn't have an ID.
         * Simple referential comparison doesn't work
         * because start_time / end_time are autogenerated and are present in one item and not in another.
         */
        const rundownItemsAreEqual = (r1: IRundownItemBase, r2: IRundownItemBase) => isEqual(
            prepareRundownItemForSaving(r1),
            prepareRundownItemForSaving(r2),
        );

        handleUnsavedRundownChanges(this.props.rundownItemAction, skipUnsavedChangesCheck ?? false, () => {
            this.props.onRundownItemActionChange(
                prepareForEditing(this.props.rundownItemAction, null, item, (val) => {
                    if (!this.props.readOnly) {
                        this.props.onChange({
                            items: this.getRundownItems()
                                .map((_item) => rundownItemsAreEqual(_item, item) ? dropReadOnlyFields(val) : _item),
                        });
                    }

                    this.initiateEditing(val, true);

                    return Promise.resolve(val);
                }),
            );
        });
    }

    private initiatePreview(item: IRundownItemBase, skipUnsavedChangesCheck?: boolean) {
        handleUnsavedRundownChanges(this.props.rundownItemAction, skipUnsavedChangesCheck ?? false, () => {
            this.props.onRundownItemActionChange(prepareForPreview(this.props.rundownItemAction, null, item));
        });
    }

    private handleCancelling() {
        if (!this.props.readOnly) {
            const {onCancel} = this.props;
            const unsavedChangesPresent = !isEqual(this.templateFieldsInitial, this.props.templateFields);

            if (unsavedChangesPresent) {
                superdesk.ui.confirm(gettext('Discard unsaved changes?')).then((confirmed) => {
                    if (confirmed) {
                        onCancel();
                    }
                });
            } else {
                onCancel();
            }
        }
    }

    componentDidMount() {
        this.templateFieldsInitial = this.props.templateFields;
    }

    render() {
        const {templateFields, readOnly} = this.props;

        const headline_template = this.props.templateFields.title_template ?? {
            prefix: '',
            separator: '//',
            date_format: dateFormatOptions[0],
        };

        const rundownItems = this.getRundownItems();
        const {rundownItemAction} = this.props;

        return (
            <WithValidation validators={templateFieldsValidator}>
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
                                                    onClick={this.props.initiateEditing}
                                                    type="primary"
                                                />
                                            )
                                            : (() => {
                                                const onSave = this.props.onSave;

                                                return (
                                                    <React.Fragment>
                                                        <Button
                                                            text={gettext('Cancel')}
                                                            onClick={this.handleCancelling}
                                                        />

                                                        <Button
                                                            text={this.props.saveButtonLabel}
                                                            onClick={() => {
                                                                if (validate(templateFields)) {
                                                                    onSave();
                                                                }
                                                            }}
                                                            type="primary"
                                                        />
                                                    </React.Fragment>
                                                );
                                            })()
                                    }
                                </ButtonGroup>
                            </SubNav>
                        </Layout.HeaderPanel>

                        <Layout.MainPanel padding="none">
                            <Layout.AuthoringMain
                                headerPadding="medium"
                                toolBar={this.props.toolbar}
                                authoringHeader={(
                                    <React.Fragment>
                                        <AiringInfoBlock
                                            value={templateFields}
                                            onChange={this.handleChange}
                                            readOnly={readOnly}
                                            validationErrors={validationErrors}
                                        />

                                        <Spacer v gap="16" justifyContent="start" noWrap>
                                            <Checkbox
                                                checked={templateFields.schedule != null}
                                                label={{text: gettext('Create rundowns automatically')}}
                                                onChange={(val) => {
                                                    if (val === true) {
                                                        const initialValue: IRRule = {
                                                            freq: 'WEEKLY',
                                                            interval: 1,
                                                            by_day: [0, 1, 2, 3, 4], // weekdays
                                                        };

                                                        this.handleChange({
                                                            ...templateFields,
                                                            repeat: true,
                                                            schedule: initialValue,
                                                        });
                                                    } else {
                                                        this.handleChange({
                                                            ...templateFields,
                                                            repeat: false,
                                                            schedule: null,
                                                        });
                                                    }
                                                }}
                                                disabled={this.props.readOnly}
                                            />

                                            {
                                                templateFields.schedule != null && (
                                                    <Spacer v gap="16" noGrow>
                                                        <FrequencySimple
                                                            value={templateFields.schedule}
                                                            onChange={(val) => {
                                                                this.handleChange({
                                                                    ...templateFields,
                                                                    schedule: val,
                                                                });
                                                            }}

                                                            // firstDayOfWeek starts from Monday
                                                            // - config.startingDay from Sunday
                                                            firstDayOfWeek={superdesk.instance.config.startingDay - 1}
                                                            readOnly={this.props.readOnly}
                                                        />

                                                        <DurationInput
                                                            label={gettext('Before airtime')}
                                                            seconds={templateFields.autocreate_before_seconds ?? 0}
                                                            onChange={(val) => {
                                                                this.handleChange({
                                                                    ...templateFields,
                                                                    autocreate_before_seconds: val,
                                                                });
                                                            }}
                                                            disabled={this.props.readOnly}
                                                        />
                                                    </Spacer>
                                                )
                                            }
                                        </Spacer>
                                    </React.Fragment>
                                )}
                            >
                                <div>
                                    <SpacerBlock v gap="16" />

                                    {/** spacing between fields */}
                                    <Spacer v gap="16">
                                        <Input
                                            label={gettext('Template name')}
                                            type="text"
                                            value={templateFields.title ?? ''}
                                            onChange={(val: string) => {
                                                this.handleChange({
                                                    ...templateFields,
                                                    title: val,
                                                });
                                            }}
                                            disabled={readOnly}
                                            error={validationErrors.title ?? undefined}
                                        />

                                        <div>
                                            <InputLabel
                                                text={gettext('Generated name for created rundowns')}
                                            />

                                            <SpacerBlock v gap="4" />

                                            {/** spacing for generated rundown name */}
                                            <Spacer h gap="16" justifyContent="start" noWrap>
                                                <div>
                                                    <Input
                                                        label=""
                                                        inlineLabel
                                                        labelHidden
                                                        type="text"
                                                        value={headline_template.prefix ?? ''}
                                                        onChange={(val: string) => {
                                                            this.handleChange({
                                                                ...templateFields,
                                                                title_template: {
                                                                    ...headline_template,
                                                                    prefix: val,
                                                                },
                                                            });
                                                        }}
                                                        disabled={readOnly}
                                                    />
                                                </div>

                                                <div style={{width: 50}}>
                                                    <Input
                                                        label=""
                                                        inlineLabel
                                                        labelHidden
                                                        type="text"
                                                        value={headline_template.separator}
                                                        onChange={(val) => {
                                                            this.handleChange({
                                                                ...templateFields,
                                                                title_template: {
                                                                    ...headline_template,
                                                                    separator: val,
                                                                },
                                                            });
                                                        }}
                                                        disabled={readOnly}
                                                    />
                                                </div>

                                                <div>
                                                    <Select
                                                        value={toSuperdeskDateFormat(headline_template.date_format)}
                                                        onChange={(val) => {
                                                            this.handleChange({
                                                                ...templateFields,
                                                                title_template: {
                                                                    ...headline_template,
                                                                    date_format: toPythonDateFormat(val),
                                                                },
                                                            });
                                                        }}
                                                        label=""
                                                        labelHidden
                                                        inlineLabel
                                                        disabled={readOnly}
                                                    >
                                                        {
                                                            dateFormatOptions.map((format) => (
                                                                <Option key={format}>{format}</Option>
                                                            ))
                                                        }
                                                    </Select>
                                                </div>
                                            </Spacer>
                                        </div>

                                        {
                                            templateFields.airtime_time != null && (() => {
                                                return (
                                                    <div>
                                                        <ManageRundownItems
                                                            rundown={null}
                                                            readOnly={readOnly}
                                                            items={rundownItems}
                                                            initiateCreation={(initialData, insertAtIndex) => {
                                                                this.initiateCreation(
                                                                    initialData,
                                                                    insertAtIndex,
                                                                );
                                                            }}
                                                            initiateEditing={this.initiateEditing}
                                                            initiatePreview={this.initiatePreview}
                                                            onChange={(val) => {
                                                                this.handleChange({
                                                                    items: val,
                                                                });
                                                            }}
                                                            onDelete={(item) => {
                                                                this.handleChange({
                                                                    items: rundownItems.filter(
                                                                        (_item) => _item !== item,
                                                                    ),
                                                                });
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            })()
                                        }
                                    </Spacer>
                                </div>
                            </Layout.AuthoringMain>
                        </Layout.MainPanel>

                        <Layout.RightPanel open={rundownItemAction != null}>
                            <Layout.Panel side="right" background="grey">
                                <Layout.PanelContent>
                                    {
                                        rundownItemAction != null && (
                                            <AuthoringReact
                                                key={rundownItemAction.authoringReactKey + rundownItemAction.type}
                                                itemId=""
                                                resourceNames={[]} // isn't applicable to embedded items
                                                onClose={() => {
                                                    this.props.onRundownItemActionChange(null);
                                                }}
                                                fieldsAdapter={{}}
                                                authoringStorage={rundownItemAction.authoringStorage}
                                                storageAdapter={rundownTemplateItemStorageAdapter}
                                                getLanguage={() => LANGUAGE}
                                                getSidebarWidgetsCount={() => 0}
                                                sideWidget={this.state.sideWidget}
                                                onSideWidgetChange={(sideWidget) => {
                                                    this.setState({sideWidget});
                                                }}
                                                getInlineToolbarActions={({
                                                    hasUnsavedChanges,
                                                    save,
                                                    initiateClosing,
                                                }) => {
                                                    const actions: Array<ITopBarWidget<IRundownItemTemplateInitial>> = [
                                                        {
                                                            availableOffline: true,
                                                            group: 'start',
                                                            priority: 0.1,
                                                            component: () => (
                                                                <IconButton
                                                                    ariaValue={gettext('Close')}
                                                                    icon="close-small"
                                                                    onClick={() => {
                                                                        initiateClosing();
                                                                    }}
                                                                />
                                                            ),
                                                        },
                                                    ];

                                                    if (
                                                        rundownItemAction.type === 'edit'
                                                        || rundownItemAction.type === 'create') {
                                                        actions.push({
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
                                                                    disabled={hasUnsavedChanges() !== true}
                                                                />
                                                            ),
                                                        });
                                                    } else if (rundownItemAction.type === 'preview') {
                                                        actions.push({
                                                            availableOffline: false,
                                                            group: 'end',
                                                            priority: 0.1,
                                                            component: () => (
                                                                <Button
                                                                    text={gettext('Edit')}
                                                                    onClick={() => {
                                                                        const {data} = rundownItemAction.item;

                                                                        this.initiateEditing(data as IRundownItemBase);
                                                                    }}
                                                                    type="primary"
                                                                />
                                                            ),
                                                        });
                                                    } else {
                                                        assertNever(rundownItemAction);
                                                    }

                                                    return {
                                                        readOnly:
                                                            rundownItemAction.type !== 'edit'
                                                            && rundownItemAction.type !== 'create',
                                                        toolbarBgColor: 'var(--sd-colour-bg__sliding-toolbar)',
                                                        actions,
                                                    };
                                                }}
                                                getSideWidgetNameAtIndex={() => ''}
                                                getAuthoringPrimaryToolbarWidgets={() => []}
                                                secondaryToolbarWidgets={[]}
                                                disableWidgetPinning
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
