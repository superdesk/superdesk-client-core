import * as React from 'react';
import flatten from 'flat';
import {unflatten} from 'flat';
import {Button} from 'superdesk-ui-framework';

import {gettext} from 'core/utils';
import {getInstanceConfigSchema} from 'instance-settings.generated';
import {FormViewEdit} from 'core/ui/components/generic-form/from-group';
import {Dictionary, IFormGroup} from 'superdesk-api';
import {getValidationErrors, IGenericFormValidationErrors} from 'core/ui/components/generic-form/validation';
import {jsonSchemaToFormConfig} from './adapter';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {notify} from 'core/notify/notify';
import {merge} from 'lodash';
import {defaultInstanceSettings} from 'instance-settings';

type IProps = {};

type IFormData = Dictionary<string, any>;

interface IState {
    formData: IFormData | 'loading';
    issues: IGenericFormValidationErrors;
}

export class InstanceConfigurationSettings extends React.PureComponent <IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            formData: 'loading',
            issues: {},
        };

        this.handleSaving = this.handleSaving.bind(this);
        this.validateRequiredFields = this.validateRequiredFields.bind(this);
    }

    validateRequiredFields(formConfig: IFormGroup, formData: IFormData): boolean {
        const validationErrors = getValidationErrors(formConfig, formData);

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

    handleSaving(formConfig: IFormGroup, formData: IFormData) {
        if (this.validateRequiredFields(formConfig, formData)) {
            return httpRequestJsonLocal({
                method: 'POST',
                path: '/config',
                payload: {
                    _id: 'instance-settings',
                    val: unflatten(this.state.formData, {safe: true}), // `safe` option preserves arrays
                },
            }).then(() => {
                notify.success(gettext('Saved successfully'));
            });
        }
    }

    componentDidMount() {
        httpRequestJsonLocal({
            method: 'GET',
            path: '/config/instance-settings',
        }).then(({val}) => {
            this.setState({formData: flatten(merge(defaultInstanceSettings, val), {safe: true})}); // `safe` option preserves arrays
        });
    }

    render() {
        const {formData} = this.state;

        if (formData === 'loading') {
            return null;
        }

        const formConfig = jsonSchemaToFormConfig(getInstanceConfigSchema(gettext) as any, [], {} as any, undefined);

        return (
            <div style={{padding: 40, maxWidth: 600}}>

                <h1>{gettext('Instance configuration')}</h1>

                <br />

                { // for debugging only
                    false && (
                        <pre>
                            {JSON.stringify(formData, null, 4)}
                        </pre>
                    )
                }

                <div
                    onBlur={() => {
                        if (Object.keys(this.state.issues).length > 0) {
                            /**
                             * After revalidating, error messages may appear or disappear
                             * it can in turn alter the position of a button that caused the blur
                             * and the click might not get registered.
                             */
                            setTimeout(() => {
                                this.validateRequiredFields(formConfig, formData);
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

                <br />

                <div>
                    <Button
                        text={gettext('Save')}
                        onClick={() => {
                            this.handleSaving(formConfig, formData);
                        }}
                        type="primary"
                    />
                </div>
            </div>
        );
    }
}
