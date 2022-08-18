import React from "react";
import { Text, Heading } from "@chakra-ui/react";

// displays a page header

export default function Header({ link, title, subTitle, ...props }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "1.2rem" }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "start" }}>
        <a href={link} target="_blank" rel="noopener noreferrer">
          <Heading
            style={{ margin: "0 0.5rem 0 0" }}
            bgGradient="linear(to-l, #7928CA, #FF0080)"
            bgClip="text"
            fontSize={{ base: "xl", md: "4xl" }}
            fontWeight="extrabold"
          >
            {title}
          </Heading>
        </a>
        <Text align={"left"} fontSize={{ base: "sm", md: "md" }}>
          {subTitle}
        </Text>
      </div>
      {props.children}
    </div>
  );
}

Header.defaultProps = {
  link: "https://github.com/EngrGord/Schaffold-buidls/tree/composable-SVG",
  title: "HappiVerse",
  subTitle: "On-chain SVG NFT",
};
