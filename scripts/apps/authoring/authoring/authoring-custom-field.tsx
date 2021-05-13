import React from 'react';
import {get, throttle, Cancelable} from 'lodash';

import {getField} from 'apps/fields';
import {IArticle, IArticleField, ITemplate} from 'superdesk-api';

interface IProps {
    item: IArticle;
    field: IArticleField;
    editable: boolean;
    onChange: (field: IArticleField, value: any) => any;
    template?: ITemplate;
}

// IProps['onChange'] updates the item asynchronously
// it causes input lag and in some cases input components lose their internal state
// and can't work properly. See https://jsfiddle.net/kcLd4y57/
// Internal state is used to fix this.
interface IState {
    value: any;
}

function getValue(props: IProps) {
    return get(props.item.extra, props.field._id);
}

export class AuthoringCustomField extends React.PureComponent<IProps, IState> {
    onChangeThrottled: ((field: IArticleField, value: any) => void) & Cancelable;

    // IProps['item'] is mutated when updating so prevProps from `componentDidUpdate`
    // can't be used to compare the previous value. This property is used instead.
    lastPropsValue: any;

    constructor(props: IProps) {
        super(props);

        this.state = {
            value: getValue(props),
        };

        this.lastPropsValue = this.state.value;

        this.onChangeThrottled = throttle((field: IArticleField, value: any) => {
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

        return (
            <div>
                {this.props.template != null && FieldType.templateEditorComponent != null ?
                    (
                        <FieldType.templateEditorComponent
                            item={item}
                            value={this.state.value}
                            setValue={(value) => this.setValue(value)}
                            readOnly={!editable}
                            config={field.custom_field_config}
                            template={this.props.template}
                        />
                    ) :
                    (
                        <FieldType.editorComponent
                            item={item}
                            value={this.state.value}
                            setValue={(value) => this.setValue(value)}
                            readOnly={!editable}
                            config={field.custom_field_config}
                        />
                    )
                }
            </div>
        );
    }
}
