import React from "react";
import classNames from 'classnames';
import {connectServices} from "core/helpers/ReactRenderAsync";
import {IInputType} from "../interfaces/input-types";
import {IVocabulary} from "superdesk-interfaces/Vocabulary";

interface IProps extends IInputType<string> {
    vocabularies?: any;
}

interface IState {
    vocabulary: IVocabulary;
}

export class VocabularySingleValueComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            vocabulary: null,
        };
    }
    componentDidMount() {
        this.props.vocabularies.getVocabulary(this.props.formField.component_parameters.vocabulary_id)
            .then((res) => {
                this.setState({vocabulary: res});
            });
    }
    render() {
        if (this.state.vocabulary == null) {
            return null;
        }

        if (this.props.previewOuput) {
            let vocabularyItem = this.state.vocabulary.items.find((item) => item.qcode === this.props.value);

            return vocabularyItem == null ? <div>{this.props.value}</div> : <div>{vocabularyItem.name}</div>;
        }

        return (
            <div className={classNames('sd-line-input', {'sd-line-input--invalid': this.props.issues.length > 0})}>
                <label className="sd-line-input__label">{this.props.formField.label}</label>
                <select
                    disabled={this.props.disabled}
                    value={this.props.value}
                    className="sd-line-input__select"
                    onChange={(event) => {
                        if (event.target.value !== '') {
                            this.props.onChange(event.target.value);
                        }
                    }}
                >
                    <option value=""></option>
                    {
                        this.state.vocabulary.items.map(({qcode, name}, i) => (
                            <option key={i} value={qcode}>{name}</option>
                        ))
                    }
                </select>
                {
                    this.props.issues.map((str, i) => (
                        <div key={i} className="sd-line-input__message">{str}</div>
                    ))
                }
            </div>
        );
    }
}

export const VocabularySingleValue = connectServices<IProps>(
    VocabularySingleValueComponent,
    ['vocabularies'],
);
