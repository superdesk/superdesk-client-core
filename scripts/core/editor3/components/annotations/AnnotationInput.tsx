import React from 'react';
import PropTypes from 'prop-types';
import {Dropdown, NavTabs} from 'core/ui/components';
import {connect} from 'react-redux';

import {convertToRaw, ContentState, SelectionState, EditorState, RawDraftContentState, convertFromRaw} from 'draft-js';
import {highlightsConfig} from '../../highlightsConfig';
import {getAuthorInfo} from '../../actions';
import {connectPromiseResults} from 'core/helpers/ReactRenderAsync';
import {hidePopups} from '../../actions';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {Editor3Standalone} from 'core/editor3/react';
import {getContentStateFromHtml} from 'core/editor3/html/from-html';
import {getRangeAndTextForStyle} from 'core/editor3/helpers/highlights';
import {extensions} from 'core/extension-imports.generated';
import {flatMap} from 'lodash';
import {IEditor3AnnotationInputTab} from 'superdesk-api';

interface IProps {
    editorState: EditorState;
    extensionPoints: any;
    data: {
        selection?: SelectionState; // only provided when adding a new annotation
        highlightId?: string; // only provided when editing an existing annotation
        annotation?: any; // only provided when editing an existing annotation
    };
    highlightsManager: any;
    annotationTypes: Array<any>;
    language: string;
    hidePopups(): void;

}

interface IState {
    body: any;
    type: any;
    isEmpty: boolean;
    loaded: boolean;
    activeTabInitial?: number;
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
    tabsRef: NavTabs;
    annotationInputTabsFromExtensions: Array<IEditor3AnnotationInputTab>;

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

        this.state = {
            body: body != null ? body : convertToRaw(ContentState.createFromText('')),
            type: type,
            isEmpty: isEmpty,
            loaded: false,
        };

        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onSelect = this.onSelect.bind(this);
        this.deleteAnnotation = this.deleteAnnotation.bind(this);
        this.getAnnotatedText = this.getAnnotatedText.bind(this);
        this.getAnnotationInputMode = this.getAnnotationInputMode.bind(this);

        this.annotationInputTabsFromExtensions = flatMap(
            Object.values(extensions).map(({activationResult}) => activationResult),
            (activationResult) =>
                activationResult.contributions != null
                && activationResult.contributions.editor3 != null
                && activationResult.contributions.editor3.annotationInputTabs != null
                    ? activationResult.contributions.editor3.annotationInputTabs
                    : [],
        );
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

    onChange(rawDraftContentState: RawDraftContentState, callback?) {
        this.setState({
            body: rawDraftContentState,
            isEmpty: rawDraftContentState == null || !convertFromRaw(rawDraftContentState).hasText(),
        }, callback);
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

        const text = this.getAnnotatedText();

        Promise.all(
            this.annotationInputTabsFromExtensions.map(({selectedByDefault}) =>
                selectedByDefault(text, this.getAnnotationInputMode())),
        ).then((result) => {
            let active;

            for (let i = 0; i < result.length; i++) {
                if (result[i] === true) {
                    active = i + 1;
                    break;
                }
            }

            this.setState({
                loaded: true,
                activeTabInitial: active,
            });
        });
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

    getAnnotatedText(): string {
        const {data} = this.props;

        let text = '';

        if (data.selection != null) { // annotation is being added
            const selection: SelectionState = data.selection;
            const blockKey = data.selection.getStartKey();
            const contentState = this.props.editorState.getCurrentContent();
            const block = contentState.getBlockForKey(blockKey);

            text = block.getText().slice(selection.getStartOffset(), selection.getEndOffset());
        } else { // annotation already exists
            text = getRangeAndTextForStyle(this.props.editorState, data.highlightId).highlightedText;
        }

        return text;
    }

    getAnnotationInputMode(): 'edit' | 'create' {
        const {data} = this.props;

        if (data.selection == null) {
            return 'edit';
        } else {
            return 'create';
        }
    }

    render() {
        if (this.state.loaded !== true) {
            return null;
        }

        const {data, language, annotationTypes} = this.props;
        const _hidePopups = this.props.hidePopups;
        const {annotation} = data;
        const {type, isEmpty} = this.state;

        const annotationTypeSelect = annotationTypes == null ? null : (
            <div className="sd-line-input sd-line-input--is-select">
                <label className="sd-line-input__label">{gettext('Annotation Type')}</label>
                <select className="sd-line-input__select" onChange={this.onSelect} value={type}>
                    {annotationTypes.map((annotationType) =>
                        <option key={annotationType.qcode} value={annotationType.qcode}>
                            {annotationType.name}
                        </option>,
                    )}
                </select>
            </div>
        );

        const annotationInputComponent = (
            <div style={{paddingTop: 20}}>
                {annotationTypeSelect}
                <div className="sd-line-input">
                    <label className="sd-line-input__label">{gettext('Annotation Body')}</label>
                    <Editor3Standalone
                        onChange={this.onChange}
                        editorFormat={['bold', 'italic', 'underline', 'link']}
                        rawDraftContentState={this.state.body}
                        language={language}
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
                    {
                        this.annotationInputTabsFromExtensions.length > 0
                            ? (
                                <NavTabs
                                    tabs={[
                                        {
                                            label: gettext('New annotation'),
                                            render: () => annotationInputComponent,
                                        },
                                        ...this.annotationInputTabsFromExtensions.map((tab) => {
                                            const Component = tab.component;

                                            return {
                                                label: tab.label,
                                                render: () => (
                                                    <Component
                                                        annotationText={this.getAnnotatedText()}
                                                        onCancel={_hidePopups}
                                                        annotationTypeSelect={annotationTypeSelect}
                                                        annotationInputComponent={annotationInputComponent}
                                                        mode={this.getAnnotationInputMode()}
                                                        onApplyAnnotation={(html: string) => {
                                                            this.onChange(
                                                                convertToRaw(getContentStateFromHtml(html)),
                                                                this.onSubmit,
                                                            );
                                                        }}
                                                    />
                                                ),

                                            };
                                        }),
                                    ]}
                                    active={this.state.activeTabInitial}
                                    ref={(r) => {
                                        this.tabsRef = r;
                                    }}
                                />
                            )
                            : <div>{annotationInputComponent}</div>
                    }
                </Dropdown>
            </div>
        );
    }
}

AnnotationInputBody.propTypes = {
    hidePopups: PropTypes.func,
    data: PropTypes.object,
    language: PropTypes.string,
    highlightsManager: PropTypes.object.isRequired,
    annotationTypes: PropTypes.array.isRequired,
};

const mapStateToProps = (state) => ({
    language: state.item.language,
});

const AnnotationInputBodyWithDependenciesLoaded = connectPromiseResults(() => ({
    annotationTypes: ng.get('metadata').initialize()
        .then(() => ng.get('metadata').values.annotation_types),
    extensionPoints: ng.getService('extensionPoints'),
}))(AnnotationInputBody);

export const AnnotationInput: any = connect(mapStateToProps, {
    hidePopups,
})(AnnotationInputBodyWithDependenciesLoaded);
