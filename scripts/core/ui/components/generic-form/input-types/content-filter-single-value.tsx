import React from 'react';
import classNames from 'classnames';
import {connectServices} from 'core/helpers/ReactRenderAsync';
import {IInputType} from '../interfaces/input-types';
import {IRestApiResponse} from 'types/RestApi';
import {IContentFilter} from 'superdesk-interfaces/ContentFilter';

interface IProps extends IInputType<string> {
    api?: any;
}

interface IState {
    contentFilters: Array<IContentFilter>;
}

export class ContentFilterSingleValueComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            contentFilters: [],
        };
    }
    componentDidMount() {
        this.props.api('content_filters').query({max_results: 200}).then((res: IRestApiResponse<IContentFilter>) => {
            this.setState({
                contentFilters: res._items,
            });
        });
    }
    render() {
        if (this.state.contentFilters == null) {
            return null;
        }

        if (this.props.previewOuput) {
            let contentFilter = this.state.contentFilters.find((item) => item._id === this.props.value);

            return contentFilter == null ? <div>{this.props.value}</div> : <div>{contentFilter.name}</div>;
        }

        return (
            <div className={classNames('sd-line-input', {'sd-line-input--invalid': this.props.issues.length > 0})}>
                <label className="sd-line-input__label">{this.props.formField.label}</label>
                <select
                    disabled={this.props.disabled}
                    value={this.props.value}
                    className="sd-line-input__select"
                    onChange={(event) => {
                        this.props.onChange(event.target.value);
                    }}
                >
                    <option value="" />
                    {
                        this.state.contentFilters.map(({_id, name}, i) => (
                            <option key={i} value={_id}>{name}</option>
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

export const ContentFilterSingleValue = connectServices<IProps>(
    ContentFilterSingleValueComponent,
    ['api'],
);
