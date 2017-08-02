import React, {Component} from 'react';
import PropTypes from 'prop-types';

export class QumuWidget extends Component {
    componentDidMount() {
        KV.widget(this.props.code); // eslint-disable-line no-undef
    }

    render() {
        const {selector} = this.props.code;

        return <div id={selector.slice(1)} className="qumu-embed" />;
    }
}

QumuWidget.propTypes = {
    code: PropTypes.object
};
