import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {connect} from 'react-redux';
import {showPopup, PopupTypes} from '../../actions';
import {toHTML} from 'core/editor3';
import {convertFromRaw} from 'draft-js';
import ng from 'core/services/ng';
import {HighlightsPopupPositioner} from '../HighlightsPopupPositioner';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {connectPromiseResults} from 'core/helpers/ReactRenderAsync';
import {EditorHighlightsHeader} from '../../editorPopup/EditorHighlightsHeader';
import {FluidRows} from '../../fluid-flex-rows/fluid-rows';
import {FluidRow} from '../../fluid-flex-rows/fluid-row';
import {gettext} from 'core/utils';

class Annotation extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    render() {
        const {annotation, editorNode, highlightId, highlightsManager, annotationTypes} = this.props;
        const _showPopup = this.props.showPopup;
        const {author, avatar, date, msg, annotationType} = annotation.data;
        const {name: type} = annotationTypes.find((t) => t.qcode === annotationType);
        const relativeDateString = moment(date).calendar();
        const absoluteDateString = moment(date).format('MMMM Do YYYY, h:mm:ss a');
        const html = toHTML(convertFromRaw(JSON.parse(msg)));
        const modal = ng.get('modal');

        const onEdit = () => _showPopup(PopupTypes.Annotation, {annotation, highlightId});
        const onDelete = () => modal
            .confirm(gettext('The annotation will be deleted. Are you sure?'))
            .then(() => {
                highlightsManager.removeHighlight(highlightId);
            });

        const availableActions = [
            {
                text: gettext('Edit'),
                icon: 'icon-pencil',
                onClick: onEdit,
            },
            {
                text: gettext('Delete'),
                icon: 'icon-trash',
                onClick: onDelete,
            },
        ];

        return (
            <HighlightsPopupPositioner editorNode={editorNode}>
                <FluidRows>
                    <FluidRow scrollable={false}>
                        <EditorHighlightsHeader availableActions={availableActions}>
                            <UserAvatar displayName={author} pictureUrl={avatar} />
                            <p className="editor-popup__author-name">{author}</p>
                            <time className="editor-popup__time" title={relativeDateString}>{absoluteDateString}</time>
                        </EditorHighlightsHeader>

                        <div className="editor-popup__content-block">
                            <div className="editor-popup__info-bar">
                                <span className="label">{gettext('Annotation')}</span>
                            </div>

                            <div><b>{gettext('Annotation type')}: </b>{type}</div>
                        </div>
                    </FluidRow>

                    <FluidRow scrollable={true} className="editor-popup__secondary-content">
                        <div style={{background: '#fff', padding: '1.6rem', paddingBottom: '1rem'}}>
                            <div dangerouslySetInnerHTML={{__html: html}} />
                        </div>
                    </FluidRow>
                </FluidRows>
            </HighlightsPopupPositioner>
        );
    }
}

Annotation.propTypes = {
    showPopup: PropTypes.func,
    annotation: PropTypes.object,
    highlightsManager: PropTypes.object.isRequired,
    highlightId: PropTypes.string,
    editorNode: PropTypes.object,
    annotationTypes: PropTypes.array.isRequired,
};

const AnnotationWithDependenciesLoaded = connectPromiseResults(() => ({
    annotationTypes: ng.get('metadata').initialize()
        .then(() => ng.get('metadata').values.annotation_types),
}))(Annotation);

export const AnnotationPopup = connect(
    () => ({}),
    {showPopup},
)(AnnotationWithDependenciesLoaded);
