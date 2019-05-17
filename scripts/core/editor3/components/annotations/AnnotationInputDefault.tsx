import React from 'react';
import {IPropsAnnotationInputComponent} from 'superdesk-api';

export class AnnotationInputDefault extends React.Component<IPropsAnnotationInputComponent> {
    render() {
        return this.props.annotationInputComponent;
    }
}
