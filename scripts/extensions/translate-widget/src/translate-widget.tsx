import * as React from "react";
import { ISuperdesk, IArticle } from "superdesk-api";
import { Input, Button, RadioButtonGroup } from "superdesk-ui-framework/react";

export const getTranslateWidgetComponent = (
  superdesk: ISuperdesk,
  label: string
) => {
  console.log("Translate widget activated with label:", label);
  interface TranslatingWidgetProps {
    article: IArticle; // Ensure this matches the IArticle interface
  }
  return class TranslatingWidget extends React.PureComponent<
    TranslatingWidgetProps,
    any
  > {
    constructor(props: TranslatingWidgetProps) {
      console.log("superdesk:", superdesk);
      super(props);
    }

    render() {
      return (
        <div className="translate-widget" style={{width: '50vw'}}>
          <header className="header" style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', margin: '24px'}}>
            <h1 style={{margin: '0', fontSize: '24px', fontWeight: 600, color: '#333'}}>Translate Widget</h1>
          </header>
          <div className="columns" style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
            <div className="input-column" style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '10px', marginRight: '10px'}}>
              <section className="language-selection">
                <RadioButtonGroup
                  group={{ groupLabel: "Input Languages" }}
                  options={[
                    { value: "en", label: "English" },
                    { value: "fr", label: "French" },
                    { value: "sp", label: "Spanish" },
                  ]}
                  value="en"
                  onChange={() => false}
                />
              </section>
              <section className="input-section">
                <Input
                  label="Headline"
                  value={""}
                  type="text"
                  disabled={true}
                  onChange={() => false}
                />
                <Input
                  label="Extended Headline"
                  value={""}
                  type="text"
                  disabled={true}
                  onChange={() => false}
                />
                <Input
                  label="Body HTML"
                  value={""}
                  type="text"
                  disabled={true}
                  onChange={() => false}
                />
              </section>
              <Button
                text="Translate Article"
                type="primary"
                onClick={() => false}
              />
            </div>
            <div className="output-column" style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '10px', marginLeft: '10px'}}>
              <section className="language-selection">
                <RadioButtonGroup
                  group={{ groupLabel: "Output Languages" }}
                  options={[
                    { value: "en", label: "English" },
                    { value: "fr", label: "French" },
                    { value: "sp", label: "Spanish" },
                  ]}
                  value="fr"
                  onChange={() => false}
                />
              </section>
              <section className="output-section">
                <Input
                  label=" Translated Headline"
                  value={""}
                  type="text"
                  disabled={true}
                  onChange={() => false}
                />
                <Input
                  label="Translated Extended Headline"
                  value={""}
                  type="text"
                  disabled={true}
                  onChange={() => false}
                />
                <Input
                  label="Translated Body HTML"
                  value={""}
                  type="text"
                  disabled={true}
                  onChange={() => false}
                />
              </section>
            </div>
          </div>
        </div>
      );
    }
  };
};
