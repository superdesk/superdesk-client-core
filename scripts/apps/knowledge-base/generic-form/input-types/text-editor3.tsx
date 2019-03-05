import React from "react";
import classNames from 'classnames';
import {IInputType} from "../interfaces/input-types";
import {RawDraftContentState, convertFromRaw, ContentState, convertToRaw} from "draft-js";
import {Editor3Standalone} from "core/editor3/react";
import {HTMLGenerator} from "core/editor3/html/to-html/HTMLGenerator";
import {UserHtmlSingleLine} from "core/helpers/UserHtmlSingleLine";

export interface IEditor3State {
    rawDraftContentState: RawDraftContentState;
    html: string;
}

type IProps =  IInputType<IEditor3State>;

export class TextEditor3 extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
    }
    handleChange(rawDraftContentState: RawDraftContentState): void {
        this.props.onChange({
            rawDraftContentState: rawDraftContentState,
            html: new HTMLGenerator(convertFromRaw(rawDraftContentState)).html()},
        );
    }
    render() {
        if (this.props.previewOuput) {
            return <UserHtmlSingleLine html={this.props.value.html} />;
        }

        const rawDraftContentState = this.props.value != null
            ? this.props.value.rawDraftContentState
            : convertToRaw(ContentState.createFromText(''));

        return (
            <div className={classNames('sd-line-input', {'sd-line-input--invalid': this.props.issues.length > 0})}>
                <label className="sd-line-input__label">{this.props.formField.label}</label>
                <Editor3Standalone
                    scrollContainer={'window'}
                    onChange={this.handleChange}
                    editorFormat={['bold', 'italic', 'underline', 'link']}
                    rawDraftContentState={rawDraftContentState}
                    disableSpellchecker={true}
                    readOnly={this.props.disabled}
                />
                {
                    this.props.issues.map((str, i) => (
                        <div key={i} className="sd-line-input__message">{str}</div>
                    ))
                }
            </div>
        );
    }
}
