import React from "react";
import { Text, Heading } from "@chakra-ui/react";

// displays a page header

export default function Header({ link, title, subTitle, ...props }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "1.2rem" }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "start" }}>
        <a href={link} target="_blank" rel="noopener noreferrer">
          <Heading style={{ margin: "0 0.5rem 0 0" }}>
            {title}
          </Heading>
        </a>
        <Text style={{ textAlign: "left" }}>{subTitle}</Text>
      </div>
      {props.children}
    </div>
  );
}

Header.defaultProps = {
  link: "https://github.com/austintgriffith/scaffold-eth",
  title: "LoogieVerse",
  subTitle: "Combosable SVG",
};
