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
        <div className="translate-widget" style={{width: '90%', margin: '0 auto', height: '90vh'}}>
          <header className="header" style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', margin: '24px'}}>
            <h1 style={{margin: '0', fontSize: '24px', fontWeight: 600, color: '#333'}}>Translate Widget</h1>
          </header>
          <div className="columns" style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', height: '90%'}}>
            <div className="input-column" style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', padding: '10px', gap: '32px', marginRight: '10px', height: '100%', borderRight: '1px solid #ddd'}}>
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
              <section className="input-section" style={{display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', height: '75vh', paddingLeft: '24px', paddingRight: '8px'}}>
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
                className="width: 100%"
                type="primary"
                onClick={() => false}
              />
            </div>
            <div className="output-column" style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', padding: '10px', gap: '32px', marginLeft: '10px', height: '100%'}}>
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
              <section className="output-section" style={{display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', paddingLeft: '24px', paddingRight: '8px'}}>
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
