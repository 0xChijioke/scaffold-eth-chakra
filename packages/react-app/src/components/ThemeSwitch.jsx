import { Button, useColorMode, Flex } from "@chakra-ui/react";
import { BsSun, BsMoonStarsFill } from "react-icons/bs";

export default function ThemeSwitcher() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Flex >
      <Button onClick={toggleColorMode}>{colorMode === "light" ? <BsMoonStarsFill /> : <BsSun />}</Button>
    </Flex>
  );
}
