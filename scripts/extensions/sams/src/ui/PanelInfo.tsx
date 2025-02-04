import * as React from 'react';

interface IProps {
    heading?: string;
    description?: string;
    icon?: string;
}

export class PanelInfo extends React.PureComponent<IProps> {
    render() {
        return (
            <div className="panel-info">
                {this.props.icon && (
                    <div className="panel-info__icon">
                        <i className={this.props.icon} />
                    </div>
                )}
                {this.props.heading && (
                    <div className="panel-info__heading">
                        {this.props.heading}
                    </div>
                )}
                {this.props.description && (
                    <div className="panel-info__description">
                        {this.props.description}
                    </div>
                )}
            </div>
        );
    }
}
