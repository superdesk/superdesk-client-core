import React from 'react';
import {NavTabs} from 'core/ui/components';
import {AnnotationsSelect} from './AnnotationsSelect';
import {RawDraftContentState} from 'draft-js';
import {IKnowledgeBaseItem} from 'apps/knowledge-base/knowledge-base-page';
import {connectCrudManager, ICrudManager} from 'core/helpers/CrudManager';

interface IProps {
    annotationText: string;
    annotationInputComponent: React.ReactElement<any>;
    annotationTypeSelect: JSX.Element;
    onCancel(): void;
    onApplyAnnotation(rawDraftContentState: RawDraftContentState): void;

    // connected
    conceptItems?: ICrudManager<IKnowledgeBaseItem>;
}

class AnnotationInputFidelyComponent extends React.Component<IProps> {
    private tabsRef: NavTabs;

    componentDidMount() {
        this.props.conceptItems.read(1, null, {'name': this.props.annotationText})
            .then(() => {
                if (this.props.conceptItems._meta.total < 1) {
                    this.tabsRef.selectTabByIndex(1);
                }
            });
    }

    render() {
        if (this.props.conceptItems._items == null) {
            return null; // loading
        }

        const tabs = [
            {
                label: gettext('Annotation library'),
                render: () => (
                    <AnnotationsSelect
                        annotationText={this.props.annotationText}
                        onApplyAnnotation={this.props.onApplyAnnotation}
                        annotationTypeSelect={this.props.annotationTypeSelect}
                        onCancel={this.props.onCancel}
                        conceptItems={this.props.conceptItems}
                    />
                ),
            },
            {
                label: gettext('New annotation'),
                render: () => <div style={{marginTop: 15}}>{this.props.annotationInputComponent}</div>,
            },
        ];

        return (
            <NavTabs
                tabs={tabs}
                active={0}
                ref={(r) => {
                    this.tabsRef = r;
                }}
            />
        );
    }
}

export const AnnotationInputFidely = connectCrudManager<IProps, IKnowledgeBaseItem>(
    AnnotationInputFidelyComponent,
    'conceptItems',
    'concept_items',
);
