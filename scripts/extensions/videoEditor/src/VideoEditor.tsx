import * as React from 'react';
import { IArticle } from 'superdesk-api';
import { get } from 'lodash';

interface IArticleVideo extends IArticle {
    renditions?: {
        original: {
            hef: string,
            media: string,
            mimetype: string,
            version: number,
        }
    }
}

type VideoEditorProps = {
    article: IArticleVideo
}

export class VideoEditor extends React.Component<VideoEditorProps> {
    private ref: React.RefObject<HTMLVideoElement>;
    constructor(props: VideoEditorProps) {
        super(props);
        this.ref = React.createRef();
    }

    componentDidMount() {
        const node = this.ref.current!
        node.play();
    }

    render() {
        const videoSrc = get(this.props.article.renditions, 'original.href')
        return (
            <video ref={this.ref} src={videoSrc}></video>
        )
    }
}