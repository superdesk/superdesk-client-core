import React, {useEffect} from 'react';
import moment from 'moment';
import {connect} from 'react-redux';
import {showPopup, PopupTypes} from '../../actions';
import {convertFromRaw} from 'draft-js';
import ng from 'core/services/ng';
import {HighlightsPopupPositioner} from '../HighlightsPopupPositioner';
import {UserAvatarFromUserId} from 'apps/users/components/UserAvatarFromUserId';
import {connectPromiseResults} from 'core/helpers/ReactRenderAsync';
import {EditorHighlightsHeader} from '../../editorPopup/EditorHighlightsHeader';
import {FluidRows} from '../../fluid-flex-rows/fluid-rows';
import {FluidRow} from '../../fluid-flex-rows/fluid-row';
import {gettext} from 'core/utils';
import {editor3StateToHtml} from 'core/editor3/html/to-html/editor3StateToHtml';
import {notify} from 'core/notify/notify';
import {noop} from 'lodash';

interface IAnnotationType {
    qcode: string;
    name: string;
}

interface IAnnotationData {
    author: string;
    authorId: string;
    date: string;
    msg: string;
    annotationType: string;
}

interface IAnnotation {
    data: IAnnotationData;
}

interface IHighlightsManager {
    removeHighlight: (highlightId: string) => void;
}

interface IAnnotationProps {
    annotation: IAnnotation;
    editorNode: HTMLElement;
    highlightId: string;
    highlightsManager: IHighlightsManager;
    annotationTypes: Array<IAnnotationType>;
    close: () => void;
    showPopup: (type: typeof PopupTypes.Annotation, data: {annotation: IAnnotation; highlightId: string}) => void;
}

interface IPromiseAnnotationTypes {
    annotationTypes: Array<IAnnotationType>;
}

const Annotation: React.FC<IAnnotationProps> = ({
    annotation,
    editorNode,
    highlightId,
    highlightsManager,
    annotationTypes,
    close,
    showPopup,
}) => {
    const {author, authorId, date, msg, annotationType} = annotation.data;

    useEffect(() => {
        if (!annotationTypes || annotationTypes.length === 0) {
            notify.warning(gettext('Annotation Types information is not available. ' +
                'Please check your metadata configuration.'));
            console.warn('Annotation types not available or empty', {annotationType});
        }
    }, []);

    const foundType = annotationTypes.find((t) => t.qcode === annotationType);
    const type = foundType?.name ?? gettext('Unknown Type ({{qcode}})', {qcode: annotationType});
    const relativeDateString = moment(date).calendar();
    const absoluteDateString = moment(date).format('MMMM Do YYYY, h:mm:ss a');
    const html = editor3StateToHtml(convertFromRaw(JSON.parse(msg)));
    const modal = ng.get('modal');

    const onEdit = () => {
        showPopup(PopupTypes.Annotation, {annotation, highlightId});
        close();
    };

    const onDelete = () => modal
        .confirm(gettext('The annotation will be deleted. Are you sure?'))
        .then(() => {
            highlightsManager.removeHighlight(highlightId);
        }).catch(noop);

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
                        <div className="sd-display--flex sd-gap--small">
                            <UserAvatarFromUserId userId={authorId} />
                            <div>
                                <p className="editor-popup__author-name">{author}</p>
                                <time className="editor-popup__time" title={relativeDateString}>
                                    {absoluteDateString}
                                </time>
                            </div>
                        </div>
                    </EditorHighlightsHeader>

                    <div className="editor-popup__content-block">
                        <div className="editor-popup__info-bar">
                            <span className="label">{gettext('Annotation')}</span>
                        </div>

                        <div><b>{gettext('Annotation type')}: </b>{type}</div>
                    </div>
                </FluidRow>

                <FluidRow scrollable={true} className="editor-popup__secondary-content">
                    <div className="editor-popup__content-block">
                        <div dangerouslySetInnerHTML={{__html: html}} />
                    </div>
                </FluidRow>
            </FluidRows>
        </HighlightsPopupPositioner>
    );
};

const AnnotationWithDependenciesLoaded = connectPromiseResults<IPromiseAnnotationTypes>(() => ({
    annotationTypes: ng.get('metadata').initialize()
        .then(() => ng.get('metadata').values.annotation_types ?? []),
}))(Annotation);

interface IDispatchProps {
    showPopup: (type: typeof PopupTypes.Annotation, data: {annotation: IAnnotation; highlightId: string}) => void;
}

type IConnectedProps = Omit<IAnnotationProps, keyof IDispatchProps | keyof IPromiseAnnotationTypes>;

export const AnnotationPopup: React.ComponentType<IConnectedProps> = connect<{}, IDispatchProps, IConnectedProps>(
    () => ({}),
    {showPopup},
)(AnnotationWithDependenciesLoaded);
