import * as React from 'react';
import {AnnotationsSelect} from './AnnotationsSelect';
import {IKnowledgeBaseItem} from './interfaces';

import {
    ICrudManager,
    IPropsAnnotationInputComponent,
    ISuperdesk,
} from 'superdesk-api';
import {getFields} from './GetFields';

interface IProps extends IPropsAnnotationInputComponent {
    // connected
    conceptItems: ICrudManager<IKnowledgeBaseItem>;
}

export function getAnnotationInputWithKnowledgeBase(superdesk: ISuperdesk) {
    class AnnotationInputWithKnowledgeBaseComponent extends React.Component<IProps> {
        componentDidMount() {
            const {generateFilterForServer} = superdesk.helpers;

            const {nameField} = getFields(superdesk);

            this.props.conceptItems.read(
                1,
                undefined,
                {name: generateFilterForServer(nameField.type, this.props.annotationText)},
            );
        }

        render() {
            if (this.props.conceptItems._items == null) {
                return null; // loading
            }

            return (
                <AnnotationsSelect
                    annotationText={this.props.annotationText}
                    onApplyAnnotation={this.props.onApplyAnnotation}
                    annotationTypeSelect={this.props.annotationTypeSelect}
                    onCancel={this.props.onCancel}
                    conceptItems={this.props.conceptItems}
                    superdesk={superdesk}
                />
            );
        }
    }

    return superdesk.helpers.connectCrudManager<IPropsAnnotationInputComponent, IKnowledgeBaseItem>(
        AnnotationInputWithKnowledgeBaseComponent,
        'conceptItems',
        'concept_items',
    );
}
