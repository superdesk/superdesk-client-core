import React from 'react';

export class DragHandle extends React.PureComponent {
    render() {
        return (
            <div style={{display: 'flex', opacity: 0.4, cursor: 'grab'}}>
                <div className="drag-and-drop--handle" />
                <div className="drag-and-drop--handle" />
            </div>
        );
    }
}
