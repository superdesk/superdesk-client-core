import React from "react";
import {IInputType} from "../interfaces/input-types";

export class TextSingleLine extends React.Component<IInputType<string>> {
    render() {
        return (
            <div className="sd-line-input">
                <label className="sd-line-input__label">{this.props.formField.label}</label>
                <input
                    type="text"
                    disabled={this.props.disabled}
                    value={this.props.value}
                    onChange={(event) => this.props.onChange(event.target.value)}
                    className="sd-line-input__input"
                />
            </div>
        );
    }
}
