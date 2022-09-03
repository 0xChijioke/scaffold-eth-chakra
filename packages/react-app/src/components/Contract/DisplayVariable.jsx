import { Box, Button, Divider, Flex, Grid, GridItem, Text } from "@chakra-ui/react";
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
      <Grid templateColumns="repeat(3, 1fr)" gap={6}>
        <GridItem
          style={{
            textAlign: "right",
            opacity: 0.333,
            paddingRight: 6,
            fontSize: 24,
          }}
        >
          {functionInfo.name}
        </GridItem>
        <GridItem>
          <Box>
            <h2>{tryToDisplay(variable, false, blockExplorer)}</h2>
          </Box>
        </GridItem>
        <GridItem>
          <h2>
            <Button variant={"link"} onClick={refresh}>
              🔄
            </Button>
          </h2>
        </GridItem>
      </Grid>
      <Divider my={4} orientation="horizontal" />
    </div>
  );
};

export default DisplayVariable;
