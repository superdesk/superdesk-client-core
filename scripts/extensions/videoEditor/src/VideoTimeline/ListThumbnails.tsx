import * as React from 'react';

type ListThumbnailsProps = {
    thumbnails: Array<ThumbnailObject>;
    widthPic: number;
    numberThumbnails: number;
    videoDuration: number;
    videoUrl: string;
};

type ListThumbnailsState = {
    thumbnailsRender: Array<ThumbnailObject>;
};

type ThumbnailObject = {
    url: string;
    isExist: boolean;
    isLoaded: boolean;
};

export class ListThumbnails extends React.Component<ListThumbnailsProps, ListThumbnailsState> {
    constructor(props: ListThumbnailsProps) {
        super(props);
        this.state = {
            thumbnailsRender: [],
        };
    }
    componentDidMount() {
        let thumbnailsRender: Array<ThumbnailObject> = [];
        const per_delta_image =
            this.props.thumbnails.length > 1
                ? (this.props.thumbnails.length - 1) / this.props.numberThumbnails
                : this.props.videoDuration / this.props.numberThumbnails;
        for (let i = 0; i <= this.props.numberThumbnails; i++) {
            let thumnail: ThumbnailObject;
            if (this.props.thumbnails && this.props.thumbnails.length > 0) {
                thumnail = this.props.thumbnails[Math.round(i * per_delta_image)];
                thumnail.isExist = true;
                thumnail.isLoaded = true;
                thumbnailsRender.push(thumnail);
            } else {
                thumnail = {
                    url: this.props.videoUrl + '#t=' + i * per_delta_image,
                    isExist: false,
                    isLoaded: false,
                };
                thumbnailsRender.push(thumnail);
                //Loading thumbnail one by one, if we call all api at same time, browser will lag.
                setTimeout(
                    function(this: any) {
                        //Start the timer
                        thumnail.isLoaded = true;
                        this.setState({
                            thumbnailsRender: thumbnailsRender,
                        });
                    }.bind(this),
                    500 * i
                );
            }
        }
        this.setState({
            thumbnailsRender: thumbnailsRender,
        });
    }
    render() {
        return (
            <div className="md-frames md-frames-thumbs">
                <div className="md-frames inner">
                    {this.state.thumbnailsRender.map((item: ThumbnailObject) =>
                        item.isExist
                            ? item.isLoaded && <video poster={item.url} width={this.props.widthPic} height="50" />
                            : item.isLoaded && (
                                  <video src={item.url} width={this.props.widthPic} height="50" preload="metadata" />
                              )
                    )}
                </div>
            </div>
        );
    }
}
