import * as React from 'react';
import {isEqual} from 'lodash';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {DatePickerISO, Input, TimePicker, Select, Option, Button, IconButton} from 'superdesk-ui-framework/react';
import {IRundownItemBase, IRundownItemTemplateInitial, IRundownTemplateBase} from '../../interfaces';
import {NumberInputTemp} from '../../number-input-temp';
import {superdesk} from '../../superdesk';
import {CreateValidators, stringNotEmpty} from '../../form-validation';
import {ManageRundownItems} from './manage-rundown-items';
import {computeStartEndTime} from '../../utils/compute-start-end-time';
import {getPartialDateFormat} from '../../utils/get-partial-date-format';
import {IAuthoringStorage} from 'superdesk-api';
import {prepareForCreation, prepareForEditing} from './prepare-create-edit';

import {syncDurationWithEndTime} from './sync-duration-with-end-time';
import {rundownTemplateItemStorageAdapter} from './rundown-template-item-storage-adapter';
import {LANGUAGE} from '../../constants';

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

export interface ICreate {
    type: 'create';
    item: IRundownItemTemplateInitial;
    authoringStorage: IAuthoringStorage<IRundownItemTemplateInitial>;
}

export interface IEdit {
    type: 'edit';
    item: IRundownItemTemplateInitial;
    authoringStorage: IAuthoringStorage<IRundownItemTemplateInitial>;
}

interface IPropsEditable {
    readOnly: false;
    templateFields: Partial<IRundownTemplateBase>;
    toolbar?: React.ReactNode;
    onChange(template: Partial<IRundownTemplateBase>): void;
    onCancel(): void;
    onSave(): void;
    saveButtonLabel: string;
}

interface IPropsReadOnly {
    readOnly: true;
    templateFields: Partial<IRundownTemplateBase>;
    initiateEditing(): void;
    toolbar?: React.ReactNode;
}

type IProps = IPropsEditable | IPropsReadOnly;

interface IState {
    createOrEditRundownItem: ICreate | IEdit | null;
}

const WithTemplateValidation = superdesk.components.getValidationHOC<Partial<IRundownTemplateBase>>();

const templateFieldsValidator: CreateValidators<Partial<IRundownTemplateBase>> = {
    name: stringNotEmpty,
    airtime_time: stringNotEmpty,
};

export class RundownTemplateViewEdit extends React.PureComponent<IProps, IState> {
    private templateFieldsInitial: Partial<IRundownTemplateBase>;
    
    constructor(props: IProps) {
        super(props);

        this.state = {
            createOrEditRundownItem: null,
        };

        this.handleChange = this.handleChange.bind(this);
        this.initiateCreation = this.initiateCreation.bind(this);
        this.initiateEditing = this.initiateEditing.bind(this);
        this.getRundownItems = this.getRundownItems.bind(this);
        this.handleCancelling = this.handleCancelling.bind(this);

        this.templateFieldsInitial = {};
    }

    getRundownItems() {
        return this.props.templateFields.rundown_items ?? [];
    }

    handleChange(value: Partial<IRundownTemplateBase>) {
        if (this.props.readOnly !== true) {
            this.props.onChange(value);
        }
    }

    initiateCreation() {
        this.setState({
            createOrEditRundownItem: prepareForCreation((val) => {
                if (!this.props.readOnly) {
                    const itemWithDuration: Partial<IRundownItemBase> = {
                        ...val.data,
                        duration: val.data.planned_duration,
                    };

                    this.props.onChange({
                        rundown_items: this.getRundownItems().concat(
                            // validated in authoring view using content profile
                            itemWithDuration as unknown as IRundownItemBase,
                        ),
                    });
                }
            }),
        });
    }

    initiateEditing(item: IRundownItemBase) {
        this.setState({
            createOrEditRundownItem: prepareForEditing(item, (val) => {
                if (!this.props.readOnly) {
                    this.props.onChange({
                        rundown_items: this.getRundownItems().map((_item) => _item === item ? val : _item),
                    });
                }
            }),
        });
    }

    handleCancelling() {
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

        const headline_template = this.props.templateFields.headline_template ?? {
            prefix: '',
            separator: '//',
            date_format: dateFormatOptions[0],
        };

        const rundownItems = this.getRundownItems();

        return (
            <WithTemplateValidation validators={templateFieldsValidator}>
                {(validate, validationErrors) => (
                    <Layout.LayoutContainer>
                        <Layout.HeaderPanel>
                            <div style={{display: 'flex', justifyContent: 'end', padding: '8px 16px'}}>
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
                                                <Spacer h gap="8" noGrow>
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
                                                </Spacer>
                                            );
                                        })()
                                }
                            </div>
                        </Layout.HeaderPanel>

                        <Layout.MainPanel padding="none">
                            <Layout.AuthoringMain
                                headerPadding="medium"
                                toolBar={this.props.toolbar}
                                authoringHeader={(
                                    <Spacer h gap="16" noGrow justifyContent="start">
                                        <Spacer v gap="4">
                                            <InputLabel text={gettext('Planned duration')} />

                                            <NumberInputTemp
                                                value={templateFields.planned_duration ?? null}
                                                onChange={(val) => {
                                                    this.handleChange({
                                                        ...templateFields,
                                                        planned_duration: val == null ? 0 : val,
                                                    });
                                                }}
                                                readOnly={readOnly}
                                            />
                                        </Spacer>

                                        <Spacer v gap="4">
                                            <InputLabel text={gettext('Air time')} />

                                            <TimePicker
                                                value={templateFields.airtime_time ?? ''}
                                                onChange={(val) => {
                                                    this.handleChange({
                                                        ...templateFields,
                                                        airtime_time: val,
                                                    });
                                                }}
                                                disabled={readOnly}
                                            />
                                        </Spacer>

                                        <Spacer v gap="4">
                                            <InputLabel text={gettext('Air date')} />

                                            <DatePickerISO
                                                dateFormat={superdesk.instance.config.view.dateformat}
                                                value={templateFields.airtime_date ?? ''}
                                                onChange={(val) => {
                                                    this.handleChange({
                                                        ...templateFields,
                                                        airtime_date: val,
                                                    });
                                                }}
                                                inlineLabel
                                                labelHidden
                                                disabled={readOnly}
                                            />
                                        </Spacer>
                                    </Spacer>

                                    // TODO: add schedule when frequency input is ready
                                )}
                            >
                                <div>
                                    <SpacerBlock v gap="16" />

                                    {/** spacing between fields */}
                                    <Spacer v gap="16">
                                        <Input
                                            label={gettext('Template name')}
                                            type="text"
                                            value={templateFields.name ?? ''}
                                            onChange={(val: string) => {
                                                this.handleChange({
                                                    ...templateFields,
                                                    name: val,
                                                });
                                            }}
                                            disabled={readOnly}
                                            error={validationErrors.name ?? undefined}
                                            invalid={validationErrors.name != null}
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
                                                                headline_template: {
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
                                                                headline_template: {
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
                                                                headline_template: {
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
                                                            readOnly={readOnly}
                                                            items={rundownItems}
                                                            createOrEdit={this.state.createOrEditRundownItem}
                                                            initiateCreation={this.initiateCreation}
                                                            initiateEditing={this.initiateEditing}
                                                            onChange={(val) => {
                                                                this.handleChange({
                                                                    rundown_items: computeStartEndTime(airTime, val),
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

                        <Layout.RightPanel open={this.state.createOrEditRundownItem != null}>
                            <Layout.Panel side="right" background="grey">
                                <Layout.PanelContent>
                                    {
                                        this.state.createOrEditRundownItem != null && (
                                            <AuthoringReact
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
            </WithTemplateValidation>
        );
    }
}
