import * as React from 'react';
import VideoEditorContext from '../VideoEditorContext';

interface IProps {
    videoRef: React.RefObject<HTMLVideoElement>;
}
export class VideoPreviewThumbnail extends React.Component<IProps> {
    static contextType = VideoEditorContext;
    constructor(props: IProps) {
        super(props);
    }

    handleClick = () => {};

    render() {
        const { getClass } = this.context;
        return (
            <div className={`sd-photo-preview__thumbnail-edit`}>
                <div className={getClass('thumbnail-edit__container')}>
                    {/* <canvas></canvas> */}
                    <button className="btn btn--icon-only-circle btn--large btn--hollow" onClick={this.handleClick}>
                        <i className="icon-photo icon--white"></i>
                    </button>
                    <form>
                        <label className="btn btn--icon-only-circle btn--large btn--hollow">
                            <input type="file" style={{ display: 'none' }} />
                            <i className="icon-upload icon--white"></i>
                        </label>
                    </form>
                </div>
            </div>
        );
    }
}
