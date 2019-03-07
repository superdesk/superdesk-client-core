import React from 'react';
import PropTypes from 'prop-types';
import 'whatwg-fetch';
import {get} from 'lodash';
import {gettext} from 'core/utils';

import {Row, LineInput, Label, TextArea} from './';
import {IconButton} from '../';

import './style.scss';

/**
 * @ngdoc react
 * @name LinkInput
 * @description Component to attach links as input
 */
export class LinkInput extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    errorTitle: any;

    constructor(props) {
        super(props);
        this.state = {title: props.value};
        this.errorTitle = gettext('Could not load title');
    }

    componentWillMount() {
        this.setTitle(this.props.value);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.value !== this.props.value) {
            this.setTitle(nextProps.value);
        }
    }

    extractHostname(link) {
        let hostname;

        // Find & remove protocol (http, ftp, etc.) and get hostname
        if (link.indexOf('://') > -1) {
            hostname = link.split('/')[2];
        } else {
            hostname = link.split('/')[0];
        }

        // Find & remove port number
        hostname = hostname.split(':')[0];

        // Find & remove "?"
        hostname = hostname.split('?')[0];

        return hostname.replace('www.', '');
    }

    getAbsoulteURL(link) {
        let hostname = this.extractHostname(link);
        const protocol = link.indexOf('://') > -1 ? link.split('/')[0] : 'http:';
        const resource = link.substr(link.indexOf(hostname) + hostname.length);

        // Only add 'www.' back in if the original link has 'www.' in it
        if (link.indexOf('://www.') > -1) {
            hostname = 'www.' + hostname;
        }

        return `${protocol}//${hostname}${resource}`;
    }

    setTitle(link) {
        if (!link) {
            return;
        }

        if (!this.props.iframelyKey) {
            this.setState({title: 'www.' + this.extractHostname(link)});
            return;
        }

        const url = 'https://iframe.ly/api/iframely?url=' + link + '&api_key=' + this.props.iframelyKey;

        fetch(url).then((response) => {
            // Need to do HTTP response status check manually for whatwg-fetch
            // refer: https://www.npmjs.com/package/whatwg-fetch
            if (response.status >= 200 && response.status < 300) {
                return response.json();
            } else {
                this.setState({title: this.errorTitle});
            }
        })
            .then((json) => {
                this.setState({title: json.meta.title});
            })
            .catch(() => {
            // This is in cases of network failure issues
            // refer: https://www.npmjs.com/package/whatwg-fetch
                this.setState({title: this.errorTitle});
            });
    }

    render() {
        const {value, field, remove, onChange, label, readOnly, iframelyKey, onFocus, ...props} = this.props;

        const showLink = this.state.title &&
            !props.message &&
            get(value, 'length', 0) > 0;

        return readOnly ? (
            <Row>
                <LineInput noMargin={true}>
                    <Label text={this.state.title} />
                    <a href={this.getAbsoulteURL(value)} target="_blank" rel="noopener noreferrer">{value}</a>
                </LineInput>
            </Row>
        ) : (
            <Row className="link-input">
                <LineInput {...props} readOnly={readOnly} noMargin>
                    <Label text={label} />

                    <TextArea
                        field={field}
                        value={value}
                        onChange={onChange}
                        placeholder="Paste link"
                        readOnly={readOnly}
                        paddingRight60={true}
                        autoFocus
                        tabIndex={0}
                        multiLine={false}
                        onFocus={onFocus}
                    />

                    {showLink && iframelyKey && (
                        <a
                            href={this.getAbsoulteURL(value)}
                            target="_blank" rel="noopener noreferrer"
                        >
                            {this.state.title}
                        </a>
                    )}

                    <span className="sd-line-input__icon-bottom-right">
                        {showLink && (
                            <IconButton
                                href={this.getAbsoulteURL(value)}
                                target="_blank"
                                icon="icon-link"
                            />
                        )}

                        <IconButton
                            onClick={remove}
                            tabIndex={0}
                            icon="icon-trash"
                            enterKeyIsClick={true}
                        />
                    </span>
                </LineInput>
            </Row>
        );
    }
}

LinkInput.propTypes = {
    remove: PropTypes.func,
    field: PropTypes.string,
    value: PropTypes.string,
    label: PropTypes.string,
    onChange: PropTypes.func,
    iframelyKey: PropTypes.string,
    readOnly: PropTypes.bool,
    message: PropTypes.string,
    onFocus: PropTypes.func,
};

LinkInput.defaultProps = {
    readOnly: false,
    value: '',
};
