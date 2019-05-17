import * as React from 'react';
import {AnnotationsSelect} from './AnnotationsSelect';
import {IKnowledgeBaseItem} from './interfaces';

import {
    ICrudManager,
    ISuperdesk,
    INavTabsComponent,
    IPageComponentProps,
    IPropsAnnotationInputComponent,
} from 'superdesk-api';
import {getFields} from './GetFields';

interface IProps extends IPropsAnnotationInputComponent {
    superdesk: ISuperdesk;
    annotationText: string;
    onApplyAnnotation(html: string): void;
    annotationTypeSelect: JSX.Element;
    onCancel(): void;
    annotationInputComponent: JSX.Element;
    // connected
    conceptItems: ICrudManager<IKnowledgeBaseItem>;
}

class AnnotationInputWithKnowledgeBaseComponent extends React.Component<IProps> {
    tabsRef: INavTabsComponent | null;

    constructor(props: IProps) {
        super(props);

        this.tabsRef = null;
    }

    componentDidMount() {
        const {generateFilterForServer} = this.props.superdesk.helpers;

        const {nameField} = getFields(this.props.superdesk);

        this.props.conceptItems.read(
            1,
            undefined,
            {name: generateFilterForServer(nameField.type, this.props.annotationText)},
        )
            .then(() => {
                if (this.props.conceptItems._meta.total < 1 && this.tabsRef != null) {
                    // go to new annotation tab if there aren't existing ones to select from
                    this.tabsRef.selectTabByIndex(1);
                }
            });
    }

    render() {
        if (this.props.conceptItems._items == null) {
            return null; // loading
        }

        const {NavTabs} = this.props.superdesk.helpers;
        const {gettext} = this.props.superdesk.localization;

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
                        superdesk={this.props.superdesk}
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
                ref={(r: INavTabsComponent | null) => {
                    this.tabsRef = r;
                }}
            />
        );
    }
}

export class AnnotationInputWithKnowledgeBase extends React.Component<IPageComponentProps> {
    render() {
        return this.props.superdesk.helpers.connectCrudManager<IProps, IKnowledgeBaseItem>(
            AnnotationInputWithKnowledgeBaseComponent,
            'conceptItems',
            'concept_items',
        );
    }
}
