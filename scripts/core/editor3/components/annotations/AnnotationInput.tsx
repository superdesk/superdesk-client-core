import React from 'react';
import PropTypes from 'prop-types';
import {Dropdown} from 'core/ui/components';
import {connect} from 'react-redux';

import {convertToRaw, ContentState, SelectionState, EditorState, RawDraftContentState, convertFromRaw} from 'draft-js';
import {highlightsConfig} from '../../highlightsConfig';
import {getAuthorInfo} from '../../actions';
import {connectPromiseResults} from 'core/helpers/ReactRenderAsync';
import {hidePopups} from '../../actions';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {Editor3Standalone} from 'core/editor3/react';
import { AnnotationInputWrapper } from './AnnotationInputWrapper';
import { AnnotationInputFidely } from './AnnotationsInputFidelity';

interface IProps {
    editorState: EditorState;
    data: {
        highlightId: any;
        selection: SelectionState;
        annotation: any;
    };
    highlightsManager: any;
    spellcheckerEnabled: boolean;
    annotationTypes: Array<any>;
    language: string;
    hidePopups(): void;

}

interface IState {
    body: any;
    type: any;
    isEmpty: boolean;
}

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @param {Function} hidePopups
 * @description AnnotationInput is the popup containing the fields needed to fill in information
 * about an annotation.
 */
class AnnotationInputBody extends React.Component<IProps, IState> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);

        const {data, annotationTypes} = props;
        const editing = typeof data.annotation === 'object';

        let body = null;
        let isEmpty = true;
        let type = annotationTypes && annotationTypes.length > 0 ? annotationTypes[0].qcode : '';

        if (editing) {
            ({annotationType: type, msg: body} = data.annotation.data);
            body = JSON.parse(body);
            isEmpty = false;
        }

        this.state = {body: body != null ? body : convertToRaw(ContentState.createFromText('')), type, isEmpty};

        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onSelect = this.onSelect.bind(this);
        this.deleteAnnotation = this.deleteAnnotation.bind(this);
    }

    /**
     * @ngdoc method
     * @name AnnotationInput#onSubmit
     * @description onSubmit is called when the user clicks the Submit button in the UI.
     * Consequently, it calls the `onSubmit` prop, passing it the value of the text input.
     */
    onSubmit() {
        const {body, type} = this.state;
        const _hidePopups = this.props.hidePopups;
        const {highlightId} = this.props.data;

        if (body !== '') {
            const msg = JSON.stringify(body);
            const annotationType = type;

            if (highlightId === undefined) {
                this.props.highlightsManager.addHighlight(
                    highlightsConfig.ANNOTATION.type,
                    {
                        data: {
                            msg,
                            annotationType,
                            ...getAuthorInfo(),
                        },
                    },
                );
            } else {
                const highlightData = this.props.highlightsManager.getHighlightData(highlightId);
                const date = new Date();

                this.props.highlightsManager.updateHighlightData(
                    highlightId,
                    {...highlightData, data: {...highlightData.data, msg, annotationType, date}},
                );
            }

            _hidePopups();
        }
    }

    onChange(rawDraftContentState: RawDraftContentState) {
        this.setState({
            body: rawDraftContentState,
            isEmpty: rawDraftContentState == null || !convertFromRaw(rawDraftContentState).hasText(),
        });
    }

    /**
     * @ngdoc method
     * @name AnnotationInput#onSelect
     * @param {Event} e
     * @description onSelect is triggered when the annotation type is toggled.
     */
    onSelect({target}) {
        this.setState({type: target.value});
    }

    componentDidMount() {
        $('.annotation-input textarea').focus();
    }

    deleteAnnotation() {
        const {highlightsManager} = this.props;
        const _hidePopups = this.props.hidePopups;
        const {highlightId} = this.props.data;

        ng.get('modal')
            .confirm(gettext('The annotation will be deleted. Are you sure?'))
            .then(() => {
                highlightsManager.removeHighlight(highlightId);
            });

        _hidePopups();
    }

    render() {
        const {data, spellcheckerEnabled, language, annotationTypes} = this.props;
        const _hidePopups = this.props.hidePopups;
        const {annotation} = data;
        const {type, isEmpty} = this.state;

        const selection: SelectionState = data.selection;
        const blockKey = data.selection.getStartKey();
        const contentState = this.props.editorState.getCurrentContent();
        const block = contentState.getBlockForKey(blockKey);
        const text = block.getText().slice(selection.getStartOffset(), selection.getEndOffset());

        const annotationInputComponent = (
            <div>
                {annotationTypes &&
                    <div className="sd-line-input sd-line-input--is-select">
                        <label className="sd-line-input__label">Annotation Type</label>
                        <select className="sd-line-input__select" onChange={this.onSelect} value={type}>
                            {annotationTypes.map((annotationType) =>
                                <option key={annotationType.qcode} value={annotationType.qcode}>
                                    {annotationType.name}
                                </option>,
                            )}
                        </select>
                    </div>
                }
                <div className="sd-line-input">
                    <label className="sd-line-input__label">Annotation Body</label>
                    <Editor3Standalone
                        onChange={this.onChange}
                        editorFormat={['bold', 'italic', 'underline', 'link']}
                        rawDraftContentState={this.state.body}
                        language={language}
                        disableSpellchecker={!spellcheckerEnabled}
                        scrollContainer={'body'}
                    />
                </div>
                <div className="pull-right">
                    {typeof annotation === 'object' &&
                        <button
                            className="btn btn--cancel"
                            onClick={this.deleteAnnotation}>
                            {gettext('Delete')}
                        </button>}
                    <button className="btn btn--cancel" onClick={_hidePopups}>
                        {gettext('Cancel')}
                    </button>
                    <button className="btn btn--primary" onClick={this.onSubmit} disabled={isEmpty}>
                        {gettext('Submit')}
                    </button>
                </div>
            </div>
        );

        return (
            <div className="annotation-input">
                <Dropdown open={true} scrollable={false}>
                    <AnnotationInputFidely
                        annotationText={text}
                        annotationInputComponent={annotationInputComponent}
                        onApplyAnnotation={(contentPlainText) => {
                            // this.setState({
                            //     body: convertToRaw(content),
                            //     isEmpty: content == null || !content.hasText(),
                            // });
                        }}
                    />
                </Dropdown>
            </div>
        );
    }
}

AnnotationInputBody.propTypes = {
    hidePopups: PropTypes.func,
    data: PropTypes.object,
    language: PropTypes.string,
    spellcheckerEnabled: PropTypes.bool,
    highlightsManager: PropTypes.object.isRequired,
    annotationTypes: PropTypes.array.isRequired,
};

const mapStateToProps = (state) => ({
    language: state.item.language,
    spellcheckerEnabled: state.spellcheckerEnabled,
});

const AnnotationInputBodyWithDependenciesLoaded = connectPromiseResults(() => ({
    annotationTypes: ng.get('metadata').initialize()
        .then(() => ng.get('metadata').values.annotation_types),
}))(AnnotationInputBody);

export const AnnotationInput: React.StatelessComponent<any> = connect(mapStateToProps, {
    hidePopups,
})(AnnotationInputBodyWithDependenciesLoaded);
