import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';
import {UserHtmlSingleLine} from 'core/helpers/UserHtmlSingleLine';
import {RICH_FORMATTING_OPTION} from 'superdesk-api';
import {Editor3Html} from '../../../../editor3/Editor3Html';

interface IProps extends IInputType<string> {
    // Editor format options that are enabled and should be displayed
    // in the toolbar.
    editorFormat?: Array<RICH_FORMATTING_OPTION>;
}

export class TextEditor3 extends React.PureComponent<IProps> {
    render() {
        if (this.props.previewOutput) {
            return <UserHtmlSingleLine html={this.props.value} showAsPlainText={!!this.props.showAsPlainText} />;
        }

        return (
            <div
                className={
                    classNames(
                        'sd-line-input',
                        {
                            'sd-line-input--invalid': this.props.issues.length > 0,
                            'sd-line-input--required': this.props.formField.required === true,
                        },
                    )
                }
            >
                <label className="sd-line-input__label">{this.props.formField.label}</label>
                <Editor3Html
                    value={this.props.value}
                    scrollContainer={'window'}
                    onChange={this.props.onChange}
                    editorFormat={this.props.editorFormat ?? ['bold', 'italic', 'underline', 'link']}
                    readOnly={this.props.disabled}
                />

                {
                    this.props.issues.map((str, i) => (
                        <div key={i} className="sd-line-input__message">{str}</div>
                    ))
                }

                { // Design does not allow showing errors and description at the same
                    this.props.issues.length < 1 && this.props.formField.description && (
                        <span className="sd-line-input__hint">{this.props.formField.description}</span>
                    )
                }
            </div>
        );
    }
}
