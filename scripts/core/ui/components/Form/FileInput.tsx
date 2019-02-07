import React from 'react';
import PropTypes from 'prop-types';
import {Row, LineInput, Label, Input, TextArea} from './';
import {IconButton} from '../';
import {onEventCapture} from '../utils';
import {gettext} from 'core/utils';
import {get} from 'lodash';
import './style.scss';

/**
 * @ngdoc react
 * @name FileInput
 * @description Component to sattach files as input
 */
export class FileInput extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    dom: any;

    constructor(props) {
        super(props);
        this.dom = {fileInput: null};
        this.onAdd = this.onAdd.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.getComponent = this.getComponent.bind(this);
        this.onBrowseClick = this.onBrowseClick.bind(this);
        this.onRemove = this.onRemove.bind(this);
        this.onDragEnter = this.onDragEnter.bind(this);
    }

    onBrowseClick() {
        if (this.dom.fileInput) {
            this.handleOnFocus();
            this.dom.fileInput.click();
        }
    }

    onDragEnter(e) {
        e.dataTransfer.dropEffect = 'copy';
    }

    handleOnFocus() {
        if (this.props.onFocus) {
            this.props.onFocus();
        }
    }

    onDrop(event) {
        onEventCapture(event);
        if (get(event, 'dataTransfer.files')) {
            this.handleOnFocus();
            this.onAdd(null, event.dataTransfer.files);
        }
    }

    onAdd(field, fileList) {
        const files = Array.from(fileList).map((f) => [f]);

        this.props.onChange(this.props.field,
            [...this.props.value, ...files]);
    }

    onRemove(index) {
        this.handleOnFocus();
        this.props.value.splice(index, 1);
        this.props.onChange(this.props.field,
            [...this.props.value]);
    }

    getComponent(val, index = 0) {
        const {readOnly, onFocus, field, createLink} = this.props;

        return readOnly ? (
            <Row key={index} noPadding>
                {get(val, 'media') && (<LineInput noMargin={true}>
                    <Label text={`${val.media.content_type} (${Math.round(val.media.length / 1024)}kB)`} />
                    <a href={createLink(val)} target="_blank" rel="noopener noreferrer">
                        {val.media.name}
                    </a>
                </LineInput>)}
            </Row>
        ) : (
            <Row className="file-input" key={index} noPadding>
                {get(val, 'media') && (
                    <LineInput>
                        <a className="icn-btn sd-line-input__icon-right" onClick={this.onRemove.bind(null, index)}>
                            <i className="icon-trash" />
                        </a>
                        <a href={createLink(val)} target="_blank" rel="noopener noreferrer" onFocus={onFocus}>
                            {val.media.name}&nbsp;
                            ({Math.round(val.media.length / 1024)}kB)
                        </a>
                    </LineInput>
                ) ||
                (
                    <LineInput readOnly={readOnly} noMargin>
                        <TextArea
                            field={field}
                            value={get(val, 'name')}
                            readOnly={true}
                            paddingRight60={true}
                            autoFocus
                            tabIndex={0}
                            multiLine={false}
                            onFocus={onFocus}
                        />

                        <span className="sd-line-input__icon-bottom-right">
                            <IconButton
                                onClick={this.onRemove.bind(null, index)}
                                tabIndex={0}
                                icon="icon-trash"
                                enterKeyIsClick={true}
                            />
                        </span>
                    </LineInput>
                )}
            </Row>
        );
    }

    render() {
        const {field, value, readOnly, onFocus} = this.props;

        return (<Row>
            {value && Array.isArray(value) &&
                (value.map((val, index) => (this.getComponent(get(val, '[0]', val), index)))) ||
                (value && (this.getComponent(value)))}
            {!readOnly && <div onDrop={this.onDrop} onDragEnter={this.onDragEnter} className="basic-drag-block">
                <i className="big-icon--upload-alt" />
                <span className="basic-drag-block__text">{gettext('Drag files here or ')}</span>
                <a className="text-link link" onClick={this.onBrowseClick}>&nbsp;{gettext('browse')}
                    <Input
                        className="file-input--hidden"
                        field={field}
                        onChange={this.onAdd}
                        type="file"
                        onFocus={onFocus}
                        autoFocus
                        refNode={(node) => {
                            this.dom.fileInput = node;
                        }} />
                </a>
            </div>}
        </Row>);
    }
}

FileInput.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.array,
    onChange: PropTypes.func,
    createLink: PropTypes.func,
    onFocus: PropTypes.func,
    readOnly: PropTypes.bool,
};
