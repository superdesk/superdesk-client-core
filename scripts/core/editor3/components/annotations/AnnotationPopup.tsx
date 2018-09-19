import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {connect} from 'react-redux';
import {showPopup, PopupTypes} from '../../actions';
import {toHTML} from 'core/editor3';
import {convertFromRaw} from 'draft-js';
import ng from 'core/services/ng';
import {HighlightsPopupPresentation} from '../HighlightsPopupPresentation';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {connectPromiseResults} from 'core/helpers/ReactRenderAsync';

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
        const logger = ng.get('logger');
        const html = toHTML(convertFromRaw(JSON.parse(msg)), logger);
        const modal = ng.get('modal');

        const onEdit = () => _showPopup(PopupTypes.Annotation, {annotation, highlightId});
        const onDelete = () => modal
            .confirm(gettext('The annotation will be deleted. Are you sure?'))
            .then(() => {
                highlightsManager.removeHighlight(highlightId);
            });

        return (
            <HighlightsPopupPresentation
                editorNode={editorNode}
                isRoot={true}
                header={(
                    <div>
                        <UserAvatar displayName={author} pictureUrl={avatar} />
                        <p className="editor-popup__author-name">{author}</p>
                        <time className="editor-popup__time" title={relativeDateString}>{absoluteDateString}</time>
                    </div>
                )}
                availableActions={[
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
                ]}
                content={(
                    <div>
                        <div className="editor-popup__info-bar">
                            <span className="label">{gettext('Annotation')}</span>
                        </div>

                        <div><b>{gettext('Annotation type')}: </b>{type}</div>
                    </div>
                )}
                stickyFooter={null}
                scrollableContent={(
                    <div style={{background: '#fff', padding: '1.6rem', paddingBottom: '1rem'}}>
                        <div dangerouslySetInnerHTML={{__html: html}} />
                    </div>
                )}
            />
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

export const AnnotationPopup: React.StatelessComponent<any> = connect(
    () => ({}),
    {showPopup},
)(AnnotationWithDependenciesLoaded);
