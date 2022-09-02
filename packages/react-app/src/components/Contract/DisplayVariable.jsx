import { Button, VStack, Divider, HStack } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";

import { tryToDisplay } from "./utils";

const DisplayVariable = ({ contractFunction, functionInfo, refreshRequired, triggerRefresh, blockExplorer }) => {
  const [variable, setVariable] = useState("");

  const refresh = useCallback(async () => {
    try {
      const funcResponse = await contractFunction();
      setVariable(funcResponse);
      triggerRefresh(false);
    } catch (e) {
      console.log(e);
    }
  }, [setVariable, contractFunction, triggerRefresh]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshRequired, contractFunction]);

  return (
    <div>
      <HStack>
        <VStack
          span={8}
          style={{
            textAlign: "right",
            opacity: 0.333,
            paddingRight: 6,
            fontSize: 24,
          }}
        >
          {functionInfo.name}
        </VStack>
        <VStack span={14}>
          <h2>{tryToDisplay(variable, false, blockExplorer)}</h2>
        </VStack>
        <VStack span={2}>
          <h2>
            <Button type="link" onClick={refresh} icon="🔄" />
          </h2>
        </VStack>
      </HStack>
      <Divider />
    </div>
  );
};

export default DisplayVariable;
