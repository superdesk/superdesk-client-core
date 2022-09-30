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
} from 'superdesk-ui-framework/react';
import {CreateValidators, WithValidation} from '@superdesk/common';
import {IRRule, IRundownItemBase, IRundownItemTemplateInitial, IRundownTemplateBase} from '../../interfaces';
import {superdesk} from '../../superdesk';
import {stringNotEmpty} from '../../form-validation';
import {ManageRundownItems} from './manage-rundown-items';
import {computeStartEndTime} from '../../utils/compute-start-end-time';
import {getPartialDateFormat} from '../../utils/get-partial-date-format';
import {IAuthoringStorage} from 'superdesk-api';
import {prepareForCreation, prepareForEditing, prepareForPreview} from './prepare-create-edit';

import {syncDurationWithEndTime} from './sync-duration-with-end-time';
import {rundownTemplateItemStorageAdapter} from './rundown-template-item-storage-adapter';
import {LANGUAGE} from '../../constants';
import {FrequencySimple} from './components/FrequencySimple';
import {handleUnsavedRundownChanges} from '../../utils/handle-unsaved-rundown-changes';
import {AiringInfoBlock} from './components/airing-info-block';

const {getAuthoringComponent} = superdesk.components;

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

interface IWithAuthoringReactKey {
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

export type IRundownItemAction = ICreate | IEdit | IPreview | null;

const templateFieldsValidator: CreateValidators<Partial<IRundownTemplateBase>> = {
    title: stringNotEmpty,
    airtime_time: stringNotEmpty,
};

export class RundownTemplateViewEdit extends React.PureComponent<IProps> {
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
    }

    private getRundownItems() {
        return this.props.templateFields.items ?? [];
    }

    private handleChange(value: Partial<IRundownTemplateBase>) {
        if (this.props.readOnly !== true) {
            this.props.onChange(value);
        }
    }

    private initiateCreation(initialData: Partial<IRundownItemBase>, skipUnsavedChangesCheck?: boolean) {
        handleUnsavedRundownChanges(this.props.rundownItemAction, skipUnsavedChangesCheck ?? false, () => {
            this.props.onRundownItemActionChange(
                prepareForCreation(this.props.rundownItemAction, initialData, (val) => {
                    if (!this.props.readOnly) {
                        const itemWithDuration: Partial<IRundownItemBase> = {
                            ...val.data,
                            duration: val.data.planned_duration,
                        };

                        this.props.onChange({
                            items: this.getRundownItems().concat(
                                // validated in authoring view using content profile
                                itemWithDuration as unknown as IRundownItemBase,
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
        handleUnsavedRundownChanges(this.props.rundownItemAction, skipUnsavedChangesCheck ?? false, () => {
            this.props.onRundownItemActionChange(
                prepareForEditing(this.props.rundownItemAction, null, item, (val) => {
                    if (!this.props.readOnly) {
                        this.props.onChange({
                            items: this.getRundownItems().map((_item) => _item === item ? val : _item),
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

                                        <Spacer h gap="16" justifyContent="start" alignItems="center" noWrap>
                                            <Checkbox
                                                checked={templateFields.schedule != null}
                                                label={{text: gettext('Repeat')}}
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
                                                    <div>
                                                        <FrequencySimple
                                                            value={templateFields.schedule}
                                                            onChange={(val) => {
                                                                this.handleChange({
                                                                    ...templateFields,
                                                                    schedule: val,
                                                                });
                                                            }}
                                                            firstDayOfWeek={superdesk.instance.config.startingDay}
                                                            readOnly={this.props.readOnly}
                                                        />
                                                    </div>
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
                                            invalid={validationErrors.title != null}
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
                                                        inlineLabel
                                                        labelHidden
                                                        disabled={readOnly}
                                                    />
                                                </div>

                                                <div style={{width: 50}}>
                                                    <Input
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
                                                        inlineLabel
                                                        labelHidden
                                                        disabled={readOnly}
                                                    />
                                                </div>

                                                <div>
                                                    <Select
                                                        value={headline_template.date_format}
                                                        onChange={(val) => {
                                                            this.handleChange({
                                                                ...templateFields,
                                                                title_template: {
                                                                    ...headline_template,
                                                                    date_format: val,
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
                                                const airTime = templateFields.airtime_time;

                                                return (
                                                    <div>
                                                        <ManageRundownItems
                                                            rundown={null}
                                                            readOnly={readOnly}
                                                            items={
                                                                computeStartEndTime(
                                                                    templateFields.airtime_time,
                                                                    rundownItems,
                                                                )
                                                            }
                                                            createOrEdit={this.props.rundownItemAction}
                                                            initiateCreation={this.initiateCreation}
                                                            initiateEditing={this.initiateEditing}
                                                            initiatePreview={this.initiatePreview}
                                                            onChange={(val) => {
                                                                this.handleChange({
                                                                    items: computeStartEndTime(airTime, val),
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

                        <Layout.RightPanel open={this.props.rundownItemAction != null}>
                            <Layout.Panel side="right" background="grey">
                                <Layout.PanelContent>
                                    {
                                        this.props.rundownItemAction != null && (
                                            <AuthoringReact
                                                key={this.props.rundownItemAction.authoringReactKey}
                                                itemId=""
                                                onClose={() => {
                                                    this.props.onRundownItemActionChange(null);
                                                }}
                                                fieldsAdapter={{}}
                                                authoringStorage={this.props.rundownItemAction.authoringStorage}
                                                storageAdapter={rundownTemplateItemStorageAdapter}
                                                getLanguage={() => LANGUAGE}
                                                getInlineToolbarActions={({
                                                    hasUnsavedChanges,
                                                    save,
                                                    discardChangesAndClose,
                                                }) => {
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
                                                                        disabled={hasUnsavedChanges() !== true}
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
