import * as React from "react";
import { ISuperdesk } from "superdesk-api";
import { ToggleBoxNext } from "superdesk-ui-framework";

interface Tag {
  title: string;
  type: string;
  pubStatus: boolean;
  weight: number;
}

interface Image {
  imageUrl: string;
  thumbnailUrl: string;
  id?: string;
  headline?: string;
  caption?: string;
  credit?: string;
  byline?: string;
  source?: string;
  dateCreated?: string;
  archivedTime?: string;
}

interface ServerResponse {}

interface Props {
  superdesk: ISuperdesk;
  data: any;
  style?: React.CSSProperties;
}

const gridContainerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "3fr 1fr",
  gridColumnGap: "4px",
  maxHeight: "320px",
  overflow: "hidden",
};

const gridItemLeftStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  maxHeight: "inherit",
};

const gridItemRightStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  maxHeight: "inherit",
};

const imageContentStyle: React.CSSProperties = {
  width: "100%",
  maxHeight: "inherit",
  overflowY: "auto",
  display: "grid",
  gridRowGap: "4px",
};

const imageStyle: React.CSSProperties = {
  width: "100%",
  height: "auto",
};

const imageWrapperStyle: React.CSSProperties = {
  cursor: "pointer",
  maxHeight: "100%",
};

const selectedCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden",
  boxShadow: "1px 3px 6px 0 rgba(0,0,0,0.2)",
  width: "100%",
  borderRadius: "4px",
};

const cardStyle: React.CSSProperties = {
  boxShadow: "1px 3px 6px 0 rgba(0,0,0,0.2)",
  width: "100%",
  borderRadius: "2px",
};

let isMounted: boolean = false;

const ImageTaggingComponent = (props: Props) => {
  const { superdesk, data, style } = props;
  const { httpRequestJsonLocal } = superdesk;

  const [showImages] = React.useState<boolean>(true);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [fetchError, setFetchError] = React.useState<boolean>(false);
  const [selectedImage, setSelectedImage] = React.useState<Image | null>(null);
  const [images, setImages] = React.useState<Image[]>([]);

  const fetchImages = async (item: Tag[], signal: AbortSignal) => {
    setIsLoading(true);
    httpRequestJsonLocal({
      abortSignal: signal,
      method: "POST",
      path: "/ai_image_suggestions/",
      payload: {
        service: "imatrics",
        item,
      },
    })
      .then((data: any) => {
        if (isMounted) {
          setFetchError(false);
          try {
            setSelectedImage(data.result[0]);
            setImages(data.result ?? []);
          } catch {
            setSelectedImage(null);
            setImages([]);
          }
        }
      })
      .catch(() => {
        setFetchError(true);
      })
      .finally(() => isMounted && setIsLoading(false));
  };

  const formatTags = (concepts: any) => {
    let res: Tag[] = [];
    for (const key in concepts) {
      if (key === "subject") {
        concepts[key].forEach((concept: any) => {
          res.push({
            title: concept.name,
            type: "category",
            pubStatus: true,
            weight: 1,
          });
        });
      } else {
        concepts[key].forEach((concept: any) => {
          res.push({
            title: concept.name,
            type: key,
            pubStatus: true,
            weight: 1,
          });
        });
      }
    }
    return res;
  };

  const handleClickImage = (image: Image) => {
    setSelectedImage(image);
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    image: any
  ) => {
    try {
      event.dataTransfer.setData(
        "application/superdesk.item.picture",
        JSON.stringify({
          _id: image.id ?? "",
          guid: image.id ?? "",
          description_text: image.caption ?? "",
          headline: image.headline ?? "",
          original_source: image.source ?? "",
          source: image.source ?? "",
          versioncreated: image.archivedTime ?? "",
          firstcreated: image.dateCreated ?? "",
          pubstatus: "usable",
          _type: "externalsource",
          fetch_endpoint: "scanpix",
          mimetype: "image/jpeg",
          type: "picture",
          renditions: {
            thumbnail: {
              href: image.thumbnailUrl ?? "",
            },
            viewImage: {
              href: image.imageUrl ?? "",
            },
            baseImage: {
              href: image.imageUrl ?? "",
            },
          },
          byline: image.byline ?? "",
          _created: image.dateCreated ?? "",
        })
      );
    } catch {}
  };

  React.useEffect(() => {
    const currentTags = data;
    const formattedTags = formatTags(currentTags);
    const controller = new AbortController();
    fetchImages(formattedTags, controller.signal);
    return () => controller.abort();
  }, [data]);

  React.useEffect(() => {
    isMounted = true;
    return () => {
      isMounted = false;
    };
  }, []);

  return isMounted ? (
    <ToggleBoxNext
      title={`image suggestions ${
        isLoading ? "(...)" : fetchError ? "(error)" : `(${images.length})`
      }`}
      style="circle"
      isOpen={showImages}
      key="image-suggestion"
    >
      <div style={style}>
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div className="spinner-big" />
          </div>
        ) : images?.length > 0 ? (
          <div style={gridContainerStyle}>
            <div style={gridItemLeftStyle}>
              <figure style={selectedCardStyle}>
                <div style={{ maxHeight: "72%" }}>
                  <img
                    style={imageStyle}
                    alt=""
                    src={selectedImage?.imageUrl}
                    onDragStart={(e) => handleDragStart(e, selectedImage)}
                  />
                </div>
                <figcaption
                  style={{
                    padding: "4px",
                    overflow: "auto",
                    color: "#000",
                    backgroundColor: "rgba(255,255,255,0.75)",
                    height: "100%",
                  }}
                >
                  {selectedImage?.caption}
                </figcaption>
              </figure>
            </div>
            <div style={gridItemRightStyle}>
              <div style={imageContentStyle}>
                {images.map((image: Image, i: number) => (
                  <div key={i} style={cardStyle}>
                    <div style={imageWrapperStyle}>
                      <img
                        style={imageStyle}
                        key={i}
                        alt=""
                        src={image.imageUrl}
                        onClick={() => {
                          handleClickImage(image);
                        }}
                        onDragStart={(e) => handleDragStart(e, image)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ToggleBoxNext>
  ) : null;
};

export default ImageTaggingComponent;
