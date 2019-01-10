import React from 'react';

interface IProps {
    label: string;
    urls: Array<string>;
    helperText: string;
    fieldId: string;
    onChange: (fieldId: string, urls: Array<string>) => void;
}

interface IState {
    urls: Array<string>;
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
            urls: this.state.urls.concat('https://'),
        }, () => {
            this.props.onChange(this.props.fieldId, this.state.urls);
        });
    }
    handleChange(index, event) {
        const nextUrls = this.state.urls.map((currentValue, i) => {
            if (i === index) {
                return event.target.value;
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
        const {label, helperText} = this.props;

        return (
            <div>
                <label className="field__label">{label}</label>

                {this.state.urls.map((url, i) => (
                    <div key={i} className="space-between">
                        <input type="text" value={url} onChange={this.handleChange.bind(this, i)} />
                        <button type="button" onClick={() => this.removeUrl(i)}>
                            <i className="icon-remove-sign" style={{display: 'block'}} />
                        </button>
                    </div>
                ))}

                <div>
                    <button
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
