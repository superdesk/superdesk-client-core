import * as React from 'react';
import {AnnotationsSelect} from './AnnotationsSelect';
import {IKnowledgeBaseItem} from './interfaces';

import {
    ICrudManager,
    IPropsAnnotationInputComponent,
    ISuperdesk,
} from 'superdesk-api';
import {getFields} from './GetFields';

interface IPropsConnected {
    conceptItems: ICrudManager<IKnowledgeBaseItem>;
}

export function getAnnotationInputWithKnowledgeBase(superdesk: ISuperdesk) {
    class AnnotationInputWithKnowledgeBaseComponent
    extends React.Component<IPropsAnnotationInputComponent & IPropsConnected> {
        componentDidMount() {
            const {generateFilterForServer} = superdesk.forms;

            const {nameField} = getFields(superdesk);

            this.props.conceptItems.read(
                1,
                {field: 'name', direction: 'ascending'},
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

    // IPropsAnnotationInputComponent
    return superdesk.components.connectCrudManager<any, IKnowledgeBaseItem>(
        AnnotationInputWithKnowledgeBaseComponent,
        'conceptItems',
        'concept_items',
    );
}
