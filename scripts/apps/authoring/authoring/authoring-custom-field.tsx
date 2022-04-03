import React from 'react';
import {get, throttle, Cancelable} from 'lodash';

import {getField} from 'apps/fields';
import {IArticle, IVocabulary, ITemplate} from 'superdesk-api';
import ng from 'core/services/ng';
import {preferences} from 'api/preferences';
import {AUTHORING_FIELD_PREFERENCES} from 'core/constants';

interface IProps {
    item: IArticle;
    field: IVocabulary;
    editable: boolean;
    onChange: (field: IVocabulary, value: any) => any;
    template?: ITemplate;
}

// IProps['onChange'] updates the item asynchronously
// it causes input lag and in some cases input components lose their internal state
// and can't work properly. See https://jsfiddle.net/kcLd4y57/
// Internal state is used to fix this.
interface IState {
    value: any;
    preferences: {};
}

function getValue(props: IProps) {
    return get(props.item.extra, props.field._id);
}

export class AuthoringCustomField extends React.PureComponent<IProps, IState> {
    onChangeThrottled: ((field: IVocabulary, value: any) => void) & Cancelable;

    // IProps['item'] is mutated when updating so prevProps from `componentDidUpdate`
    // can't be used to compare the previous value. This property is used instead.
    lastPropsValue: any;

    constructor(props: IProps) {
        super(props);

        this.state = {
            value: getValue(props),
            preferences: ng.get('preferencesService').getSync(),
        };

        this.lastPropsValue = this.state.value;

        this.onChangeThrottled = throttle((field: IVocabulary, value: any) => {
            this.props.onChange(field, value);
        }, 300, {leading: false});

        this.setValue = this.setValue.bind(this);
    }

    setValue(value) {
        this.setState({value}, () => {
            this.onChangeThrottled(this.props.field, value);
        });
    }

    componentDidUpdate() {
        const propsValue = getValue(this.props);
        const propsValueChanged = JSON.stringify(propsValue) !== JSON.stringify(this.lastPropsValue);

        if (propsValueChanged && JSON.stringify(propsValue) !== JSON.stringify(this.state.value)) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({value: propsValue});
        }

        this.lastPropsValue = propsValue;
    }

    render() {
        const {item, field, editable} = this.props;
        const FieldType = getField(field.custom_field_type);

        if (FieldType == null) {
            return null;
        }

        const preferencesForFields = this.state.preferences[AUTHORING_FIELD_PREFERENCES] ?? {};

        return (
            <div>
                {this.props.template != null && FieldType.templateEditorComponent != null ?
                    (
                        <FieldType.templateEditorComponent
                            language={item.language}
                            value={this.state.value}
                            setValue={(value) => this.setValue(value)}
                            readOnly={!editable}
                            config={field.custom_field_config}
                        />
                    ) :
                    (
                        <FieldType.editorComponent
                            editorId={field._id}
                            language={item.language}
                            value={this.state.value}
                            onChange={(value) => this.setValue(value)}
                            readOnly={!editable}
                            config={field.custom_field_config}
                            userPreferences={preferencesForFields[field._id]}
                            onUserPreferencesChange={(val) => {
                                const nextFieldPreferences = {
                                    ...preferencesForFields,
                                    [field._id]: val,
                                };

                                preferences.update(AUTHORING_FIELD_PREFERENCES, nextFieldPreferences);

                                this.setState({
                                    preferences: {
                                        ...this.state.preferences,
                                        [AUTHORING_FIELD_PREFERENCES]: nextFieldPreferences,
                                    },
                                });
                            }}
                            getVocabularyItems={() => []} // only used in authoring-react
                        />
                    )
                }
            </div>
        );
    }
}
