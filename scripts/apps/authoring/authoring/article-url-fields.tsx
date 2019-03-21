import React from 'react';
import {gettext} from 'core/utils';

interface IUrl {
    url: string;
    description: string;
}

interface IProps {
    label: string;
    urls: Array<IUrl>;
    helperText: string;
    fieldId: string;
    onChange: (fieldId: string, urls: Array<IUrl>) => void;
    editable: boolean;
}

interface IState {
    urls: Array<IUrl>;
}

export class ArticleUrlFields extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        // local state is used, because onChange is debounced
        this.state = {
            urls: Array.isArray(props.urls) && props.urls.length > 0 ? props.urls : [],
        };
    }
    removeUrl(index) {
        this.setState({
            urls: this.state.urls.filter((_, i) => i !== index),
        }, () => {
            this.props.onChange(this.props.fieldId, this.state.urls);
        });
    }
    addUrl() {
        this.setState({
            urls: this.state.urls.concat({url: 'https://', description: ''}),
        }, () => {
            this.props.onChange(this.props.fieldId, this.state.urls);
        });
    }
    handleChange(index, field: keyof IUrl, event) {
        const nextUrls = this.state.urls.map((currentValue, i) => {
            if (i === index) {
                return {...currentValue, [field]: event.target.value};
            } else {
                return currentValue;
            }
        });

        this.setState({
            urls: nextUrls,
        }, () => {
            this.props.onChange(this.props.fieldId, this.state.urls);
        });
    }
    render() {
        const {label, helperText, editable} = this.props;

        return (
            <div>
                <label className="field__label">{label}</label>

                {this.state.urls.map((item, i) => (
                    <div key={i}>
                        <div className="space-between">
                            <input disabled={!editable}
                                type="text" value={item.url}
                                onChange={this.handleChange.bind(this, i, 'url')} />
                            <button disabled={!editable} type="button" onClick={() => this.removeUrl(i)}>
                                <i className="icon-remove-sign" style={{display: 'block'}} />
                            </button>
                        </div>
                        <textarea
                            style={{marginTop: 0.5 + 'em'}}
                            disabled={!editable}
                            className="sd-editor__default-input"
                            placeholder={gettext('Description')}
                            value={item.description}
                            onChange={this.handleChange.bind(this, i, 'description')} />
                    </div>
                ))}

                <div>
                    <button
                        disabled={!editable}
                        className="btn btn--primary"
                        onClick={() => this.addUrl()}
                        style={{marginTop: 10}}>{gettext('Add URL')}</button>
                </div>

                {
                    helperText == null ? null : <div className="sd-editor__info-text">{helperText}</div>
                }
            </div>
        );
    }
}
