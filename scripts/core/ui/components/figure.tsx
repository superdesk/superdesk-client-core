import React from 'react';

interface IProps {
    caption: string;
    onRemove?: () => void;
}

export const Figure: React.StatelessComponent<IProps> = (props) => {
    const editable = props.onRemove != null;

    return (
        <div className={editable ? 'sd-media-carousel__content' : ''}>
            <figure className="item-association item-association--preview" style={{margin: 0, height: 'inherit'}}>
                {editable && (
                    <button className="item-association__remove-item" onClick={() => props.onRemove()}>
                        <i className="icon-close-small" />
                    </button>
                )}
                <div className="item-association__image-container">
                    <div className="item-association__image-overlay" />
                    {props.children}
                </div>
            </figure>
            <div className={editable ? 'sd-media-carousel__media-caption' : ''}>{props.caption}</div>
        </div>
    );
}
