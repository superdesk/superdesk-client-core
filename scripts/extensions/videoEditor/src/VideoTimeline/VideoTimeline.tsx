import * as React from 'react';
import { debounce, isEmpty } from 'lodash';
import { BarIcon } from './BarIcon';
import { ListThumbnails } from './ListThumbnails';
import VideoEditorContext from '../VideoEditorContext';
import { IThumbnail } from '../interfaces';

interface IProps {
    video: React.RefObject<HTMLVideoElement>;
    thumbnails: Array<IThumbnail>;
    trim: {
        start: number;
        end: number;
    };
    onTrim: (start: number, end: number, runCheckIsDirty: boolean) => void;
}
interface IState {
    currentTime: number;
    thumnailsRender: Array<IThumbnail>;
}

export class VideoTimeline extends React.Component<IProps, IState> {
    static contextType = VideoEditorContext;
    private wrapper: React.RefObject<HTMLDivElement>;
    private controlbar: React.RefObject<HTMLDivElement>;
    private intervalTimer: number;
    private PositionX: any;

    constructor(props: IProps) {
        super(props);
        this.state = {
            currentTime: 0,
            thumnailsRender: [],
        };
        this.wrapper = React.createRef();
        this.controlbar = React.createRef();
        this.intervalTimer = 0;
    }

    componentDidMount() {
        // call tick every 100ms to update current time state
        this.intervalTimer = window.setInterval(this.tick, 100);
        document.addEventListener('dragover', this.handledragover);
        this.setState({
            thumnailsRender: this.getRenderThumbnails(),
        });
    }
    componentDidUpdate(prevProps: any) {
        if (JSON.stringify(prevProps.thumbnails) !== JSON.stringify(this.props.thumbnails)) {
            this.setState({
                thumnailsRender: this.getRenderThumbnails(),
            });
        }
    }

    componentWillUnmount() {
        clearInterval(this.intervalTimer);
    }

    handledragover = (e: any) => {
        if (e.clientX) {
            this.PositionX = e.clientX;
        }
    };

    getRenderThumbnails = () => {
        const thumbnails = this.props.thumbnails;
        //get list thumbnail render in list thumbnails get from server
        const video = this.props.video.current!;
        let widthPic = 0;
        if (isEmpty(thumbnails)) {
            widthPic = video && (50 * video.clientWidth) / video.clientHeight;
        } else {
            widthPic = thumbnails[0].width;
        }
        const numberThumbnails =
            this.controlbar.current! && Math.floor(this.controlbar.current!.offsetWidth / widthPic);
        const duration = this.props.video.current! ? this.props.video.current!.duration : 0;
        let thumbnailsRender: Array<IThumbnail> = [];
        const per_delta_image =
            thumbnails.length > 1 ? (thumbnails.length - 1) / numberThumbnails : duration / numberThumbnails;
        for (let i = 0; i <= numberThumbnails; i++) {
            let thumbnail: IThumbnail = {
                url: '',
                width: widthPic,
                height: 50,
            };
            if (this.props.thumbnails && this.props.thumbnails.length > 0) {
                thumbnail = this.props.thumbnails[Math.round(i * per_delta_image)];
                thumbnail.url = thumbnail.url + `?t=${Math.random()}`;
            }
            thumbnailsRender.push(thumbnail);
        }
        return thumbnailsRender;
    };
    tick = () => {
        // updates the current time state
        if (this.props.video.current) {
            let currentTime = this.props.video.current!.currentTime;
            currentTime <= this.props.trim.end
                ? this.setState({ currentTime: currentTime })
                : this.props.trim.end > 0 && this.props.video.current!.pause();
        }
    };
    videoLoadedData = () => {
        //Set trim data when video loaded
        this.props.onTrim(0, this.props.video.current!.duration, false);
    };
    // drag and drop left and right bar.
    handleDragStart(e: React.DragEvent<HTMLDivElement>) {
        // hide drag ghost image
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
        e.dataTransfer.setDragImage(img, 0, 0);
        e.dataTransfer.setData('text/plain', '');
    }

    handleDrag = debounce((type: string) => {
        let time = this.getPositionInBar(this.PositionX) * this.props.video.current!.duration;
        if (type == 'left') {
            this.props.onTrim(time, this.props.trim.end, false);
        }
        if (type == 'right') {
            this.props.onTrim(this.props.trim.start, time, false);
        }
    }, 5);

    handleDragEnd = () => {
        this.setVideoCurrentTime(this.PositionX);
        this.props.onTrim(this.props.trim.start, this.props.trim.end, true);
    };

    getPositionInBar = (pX: number) => {
        const controlbar = this.controlbar.current!;
        var position = (pX - controlbar.getBoundingClientRect().left) / controlbar.offsetWidth;
        if (position > 1) {
            position = 1;
        }
        if (position < 0) {
            position = 0;
        }
        position = Math.floor(position * 1000) / 1000;
        return position;
    };

    controlbarsClick = (e: React.MouseEvent) => {
        let time = this.setVideoCurrentTime(e.clientX);
        if (time < this.props.trim.start) {
            this.props.onTrim(time, this.props.trim.end, false);
        }
        if (time > this.props.trim.end) {
            this.props.onTrim(this.props.trim.start, time, false);
        }
    };

    setVideoCurrentTime = (pX: number) => {
        let time = this.getPositionInBar(pX) * this.props.video.current!.duration;
        if (time < this.props.trim.start) {
            time = this.props.trim.start;
        }
        if (time > this.props.trim.end) {
            time = this.props.trim.end;
        }
        this.props.video.current!.currentTime = time;
        this.setState({ currentTime: time });
        return time;
    };

    getStrTime(s: number) {
        let mins: number = Math.floor(s / 60);
        let secs: number = Math.floor(s % 60);
        let li = Math.floor((s * 10) % 10);
        return (mins < 10 ? '0' + mins : mins) + ':' + (secs < 10 ? '0' + secs : secs) + '.' + li;
    }

    render() {
        const { getClass } = this.context.superdesk.utilities.CSS;
        const video = this.props.video.current!;
        //set state for control left, right bar
        const left = video ? `${(this.props.trim.start / video.duration) * 100}%` : '0%';
        const right = video ? `${(1 - this.props.trim.end / video.duration) * 100}%` : '0%';
        return (
            <div className={getClass('timeline-controls')}>
                <ListThumbnails thumbnails={this.state.thumnailsRender} />
                <div className={`${getClass('controlbars')}`} ref={this.controlbar} onClick={this.controlbarsClick}>
                    <div
                        className={`${getClass('controlbars__mask')} ${getClass('controlbars__mask--left')}`}
                        style={{
                            width: left,
                        }}
                    ></div>
                    <div
                        className={`${getClass('controlbars__mask')} ${getClass('controlbars__mask--right')}`}
                        style={{
                            width: right,
                        }}
                    ></div>
                    <div
                        className={getClass('controlbars__progress-output')}
                        style={{
                            left: video ? `${(this.state.currentTime / video.duration) * 100}%` : '0%',
                        }}
                    >
                        <div className={getClass('controlbars__progress-output__content')}>
                            <BarIcon />
                            <div className={getClass('controlbars__progress-output__content__inner')}>
                                {this.getStrTime(this.state.currentTime)}
                            </div>
                        </div>
                        <div className={getClass('controlbars__progress-output__progress-line')}></div>
                    </div>
                    <div
                        ref={this.wrapper}
                        className={`${getClass('controlbars__wrapper-out')}`}
                        style={{
                            left: left,
                            right: right,
                        }}
                    >
                        <div
                            className={`${getClass('controlbars__wrapper')} ${getClass('controlbars__wrapper--left')}`}
                            draggable={true}
                            onDragStart={this.handleDragStart}
                            onDrag={() => this.handleDrag('left')}
                            onDragEnd={this.handleDragEnd}
                            data-content={this.getStrTime(this.props.trim.start)}
                        ></div>
                        <div
                            className={`${getClass('controlbars__wrapper')} ${getClass('controlbars__wrapper--right')}`}
                            draggable={true}
                            onDragStart={this.handleDragStart}
                            onDrag={() => this.handleDrag('right')}
                            onDragEnd={this.handleDragEnd}
                            data-content={this.getStrTime(this.props.trim.end)}
                        ></div>
                    </div>
                </div>
            </div>
        );
    }
}
