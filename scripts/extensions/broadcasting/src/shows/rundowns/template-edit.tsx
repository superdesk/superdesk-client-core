import * as React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {DatePickerISO, Input, TimePicker, Select, Option, Button} from 'superdesk-ui-framework/react';
import {IRundownTemplateBase} from '../../interfaces';
import {NumberInputTemp} from '../../number-input-temp';
import {superdesk} from '../../superdesk';
import {CreateValidators, stringNotEmpty} from '../../form-validation';

const {gettext} = superdesk.localization;

const {
    SpacerBlock,
    Spacer,
    InputLabel,
} = superdesk.components;

function getPartialDateFormat(parts: {year?: boolean; month?: boolean; day?: boolean}) {
    const separator = superdesk.instance.config.view.dateformat
        .replace('YYYY', '')
        .replace('MM', '')
        .replace('DD', '')[0];

    const removeSegment = (dateFormat: string, segment: 'YYYY' | 'MM' | 'DD'): string => {
        const segmentIndex = dateFormat.indexOf(segment);
        const separatorBefore: boolean = dateFormat[segmentIndex - 1] === separator;
        const separatorAfter: boolean = dateFormat[segmentIndex + segment.length] === separator;

        const toRemove = dateFormat.slice(
            segmentIndex + (separatorBefore ? -1 : 0),
            segmentIndex + segment.length + (separatorAfter ? 1 : 0),
        );

        return dateFormat.replace(toRemove, '');
    };

    let result = superdesk.instance.config.view.dateformat;

    if (parts.year !== true) {
        result = removeSegment(result, 'YYYY');
    }

    if (parts.month !== true) {
        result = removeSegment(result, 'MM');
    }

    if (parts.day !== true) {
        result = removeSegment(result, 'DD');
    }

    return result;
}

const dateFormatOptions = [
    getPartialDateFormat({year: true, month: true, day: true}),
    getPartialDateFormat({year: true, month: true}),
    getPartialDateFormat({month: true, day: true}),
];

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

const WithTemplateValidation = superdesk.components.getValidationHOC<Partial<IRundownTemplateBase>>();

const templateFieldsValidator: CreateValidators<Partial<IRundownTemplateBase>> = {
    name: stringNotEmpty,
};

export class RundownTemplateViewEdit extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(value: Partial<IRundownTemplateBase>) {
        if (this.props.readOnly !== true) {
            this.props.onChange(value);
        }
    }

    render() {
        const {templateFields, readOnly} = this.props;

        const headline_template = this.props.templateFields.headline_template ?? {
            prefix: '',
            separator: '//',
            date_format: dateFormatOptions[0],
        };

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
                                                        onClick={this.props.onCancel}
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
                                    </Spacer>
                                </div>
                            </Layout.AuthoringMain>
                        </Layout.MainPanel>
                    </Layout.LayoutContainer>
                )}
            </WithTemplateValidation>
        );
    }
}
