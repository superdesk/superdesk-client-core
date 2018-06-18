import React, {Component} from 'react';
import PropTypes from 'prop-types';
import json5 from 'json5';
import ng from 'core/services/ng';
import {uuid} from 'core/helpers/uuid';

// String identifying embed codes that are Qumu widgets.
const QumuString = 'KV.widget';

function getQumuData(html) {
    const configString = getQumuConfigString(html);

    return _.extend(
        json5.parse(configString),
        {
            selector: `#qumu-${uuid()}`,
        }
    );
}

export const isQumuWidget = (html) => ng.get('config').features.qumu && html.includes(QumuString);
const getQumuConfigString = (html) => html.slice(html.indexOf('{'), html.lastIndexOf('}') + 1);

export function postProccessQumuEmbed(html) {
    const data = getQumuData(html);
    const configString = getQumuConfigString(html);
    const htmlWithDataReplaced = html.replace(configString, JSON.stringify(data));

    return htmlWithDataReplaced + `<div id="${data.selector.slice(1)}"></div>`;
}

export class QumuWidget extends Component {
    shouldComponentUpdate(nextProps) {
        return this.props.html !== nextProps.html;
    }
    componentDidMount() {
        KV.widget(this.qumuData); // eslint-disable-line no-undef
    }
    componentDidUpdate() {
        KV.widget(this.qumuData); // eslint-disable-line no-undef
    }
    render() {
        this.qumuData = getQumuData(this.props.html);

        return <div id={this.qumuData.selector.slice(1)} className="qumu-embed" />;
    }
}

QumuWidget.propTypes = {
    html: PropTypes.string.isRequired,
};
