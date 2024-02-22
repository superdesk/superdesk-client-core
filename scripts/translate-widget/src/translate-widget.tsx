import * as React from 'react';
import { ISuperdesk } from "superdesk-api";
import { Input, Button, RadioButtonGroup } from "superdesk-ui-framework/react";
import "./TranslateWidget.css";


const TranslateWidget = (superdesk: ISuperdesk, label: string) => {
  return class TranslatingWidget extends React.PureComponent<any, any> {
    render() {
      <div className="translate-widget">
        <header className="header">
          {/* Application title or logo goes here */}
          <h1>Translate Widget</h1>
        </header>
        <div className="input-column">
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
        <div className="output-column">
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
      </div>;
    }
  };
};

export default TranslateWidget;
