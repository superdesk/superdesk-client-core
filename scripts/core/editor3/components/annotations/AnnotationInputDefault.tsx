import React from 'react';
import {IPropsAnnotationInputComponent} from './AnnotationInput';

export class AnnotationInputDefault extends React.Component<IPropsAnnotationInputComponent> {
    render() {
        return this.props.annotationInputComponent;
    }
}
