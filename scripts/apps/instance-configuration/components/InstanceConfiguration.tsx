import * as React from 'react';
import {gettext} from 'core/utils';
import {getInstanceConfigSchema} from 'instance-settings';
import {FormViewEdit} from 'core/ui/components/generic-form/from-group';
import {IFormGroup} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework';
import {set} from 'lodash';
import {ICoreSettings} from 'core/core-config';
import {getValidationErrors, IGenericFormValidationErrors} from 'core/ui/components/generic-form/validation';
import {jsonSchemaToFormConfig} from './adapter';

type IProps = {};

interface IState {
    formData: Dictionary<string, any>;
    issues: IGenericFormValidationErrors;
}

const INSTANCE_CONFIG = 'INSTANCE_CONFIG';

function getConfigForEditing() {
    const configInStorage = localStorage.getItem(INSTANCE_CONFIG);
    const config = configInStorage == null ? {} : JSON.parse(configInStorage);

    return config;
}

function saveConfig(config) {
    localStorage.setItem(INSTANCE_CONFIG, JSON.stringify(config));
}

function getConfigUsable(): ICoreSettings {
    const forEditing = getConfigForEditing();

    const obj = {};

    for (const key in forEditing) {
        set(obj, key, forEditing[key]);
    }

    return obj as ICoreSettings;
}

export class InstanceConfigurationSettings extends React.PureComponent <IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            formData: getConfigForEditing(),
            issues: {},
        };

        this.handleSaving = this.handleSaving.bind(this);
        this.validateRequiredFields = this.validateRequiredFields.bind(this);
    }

    validateRequiredFields(formConfig: IFormGroup): boolean {
        const validationErrors = getValidationErrors(formConfig, this.state.formData);

        if (Object.keys(validationErrors).length > 0) {
            this.setState({
                issues: validationErrors,
            });

            return false;
        } else {
            if (Object.keys(this.state.issues).length > 0) {
                this.setState({issues: {}});
            }

            return true;
        }
    }

    handleSaving(formConfig: IFormGroup) {
        if (this.validateRequiredFields(formConfig)) {
            saveConfig(this.state.formData);
        }
    }

    render() {
        const {formData} = this.state;
        const formConfig = jsonSchemaToFormConfig(getInstanceConfigSchema(gettext) as any, [], {} as any, undefined);

        return (
            <div style={{padding: 40}}>

                <h1>{gettext('Instance configuration')}</h1>

                <pre>
                    {JSON.stringify(formData, null, 4)}
                </pre>

                <div
                    onBlur={() => {
                        if (Object.keys(this.state.issues).length > 0) {
                            /**
                             * After revalidating, error messages may appear or disappear
                             * it can in turn alter the position of a button that caused the blur
                             * and the click might not get registered.
                             */
                            setTimeout(() => {
                                this.validateRequiredFields(formConfig);
                            }, 200);
                        }
                    }}
                >
                    <FormViewEdit
                        formConfig={formConfig}
                        item={formData}
                        handleFieldChange={(field, value) => {
                            this.setState({
                                formData: {
                                    ...formData,
                                    [field]: value,
                                },
                            });
                        }}
                        issues={this.state.issues}
                        editMode={true}
                    />
                </div>

                <div>
                    <Button
                        text={gettext('Save')}
                        onClick={() => {
                            this.handleSaving(formConfig);
                        }}
                        type="primary"
                    />
                </div>
            </div>
        );
    }
}
