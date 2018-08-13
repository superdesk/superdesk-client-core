import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import ng from 'core/services/ng';
import {FileiconFilter, FilesizeFilter} from 'core/ui/ui';

export class AttachmentList extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        ng.get('attachments').byItem(this.props.item)
            .then((attachments) => {
                this.setState({attachments: attachments});
            });
    }

    render() {
        if (!this.state.attachments) {
            return <div />; // wait for attachments
        }

        const attachments = this.state.attachments.map((file) => {
            const fileicon = 'big-icon--' + FileiconFilter()(file.mimetype);
            const filesize = FilesizeFilter()(file.media.length);

            const className = classNames('sd-list-item', {
                'sd-list-item--active': file._id === this.props.selected,
            });

            return (
                <div key={file._id} className={className} onClick={() => this.props.onClick(file)}>
                    <div className="sd-list-item__column sd-list-item__column--no-border">
                        <i className={fileicon} />
                    </div>
                    <div className="sd-list-item__column sd-list-item__column--grow">
                        <div className="sd-list-item__row">
                            <h4>{file.title}</h4>
                        </div>
                        <div className="sd-list-item__row">
                            <h5>{file.filename} ({filesize})</h5>
                        </div>
                        <div className="sd-list-item__row">
                            <div className="description">{file.description}</div>
                        </div>
                    </div>
                </div>
            );
        });

        if (attachments.length) {
            return <div>{attachments}</div>;
        }

        return (
            <p style={{padding: 20, margin: 0}}>
                {gettext('There are no attachments yet. Upload some first using Attachments widget.')}
            </p>
        );
    }
}

AttachmentList.propTypes = {
    item: PropTypes.object.isRequired,
    selected: PropTypes.string,
    onClick: PropTypes.func,
};
