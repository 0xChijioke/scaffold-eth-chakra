import {
  Button,
  VStack,
  Divider,
  Input,
  HStack,
  Tooltip,
  InputGroup,
  InputRightAddon,
  Stack,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import React, { useState } from "react";
import Blockies from "react-blockies";

import { Transactor } from "../../helpers";
import { tryToDisplay, tryToDisplayAsText } from "./utils";

const { utils, BigNumber } = require("ethers");

const getFunctionInputKey = (functionInfo, input, inputIndex) => {
  const name = input?.name ? input.name : "input_" + inputIndex + "_";
  return functionInfo.name + "_" + name + "_" + input.type;
};

export default function FunctionForm({ contractFunction, functionInfo, provider, gasPrice, triggerRefresh }) {
  const [form, setForm] = useState({});
  const [txValue, setTxValue] = useState("");
  const [returnValue, setReturnValue] = useState();

  const tx = Transactor(provider, gasPrice);

  const inputs = functionInfo.inputs.map((input, inputIndex) => {
    const key = getFunctionInputKey(functionInfo, input, inputIndex);

    let buttons = "";
    if (input.type === "bytes32") {
      buttons = (
        <Tooltip label="to bytes32">
          <div
            style={{ cursor: "pointer" }}
            onClick={async () => {
              if (utils.isHexString(form[key])) {
                const formUpdate = { ...form };
                formUpdate[key] = utils.parseBytes32String(form[key]);
                setForm(formUpdate);
              } else {
                const formUpdate = { ...form };
                formUpdate[key] = utils.formatBytes32String(form[key]);
                setForm(formUpdate);
              }
            }}
          >
            #️⃣
          </div>
        </Tooltip>
      );
    } else if (input.type === "bytes") {
      buttons = (
        <Tooltip label="to hex">
          <div
            style={{ cursor: "pointer" }}
            onClick={async () => {
              if (utils.isHexString(form[key])) {
                const formUpdate = { ...form };
                formUpdate[key] = utils.toUtf8String(form[key]);
                setForm(formUpdate);
              } else {
                const formUpdate = { ...form };
                formUpdate[key] = utils.hexlify(utils.toUtf8Bytes(form[key]));
                setForm(formUpdate);
              }
            }}
          >
            #️⃣
          </div>
        </Tooltip>
      );
    } else if (input.type === "uint256") {
      buttons = (
        <Tooltip label="* 10 ** 18">
          <div
            style={{ cursor: "pointer" }}
            onClick={async () => {
              const formUpdate = { ...form };
              formUpdate[key] = utils.parseEther(form[key]);
              setForm(formUpdate);
            }}
          >
            ✴️
          </div>
        </Tooltip>
      );
    } else if (input.type === "address") {
      const possibleAddress = form[key] && form[key].toLowerCase && form[key].toLowerCase().trim();
      if (possibleAddress && possibleAddress.length === 42) {
        buttons = (
          <Tooltip label="blockie">
            <Blockies seed={possibleAddress} scale={3} />
          </Tooltip>
        );
      }
    }

    return (
      <div style={{ margin: 2 }} key={key}>
        <InputGroup>
          <Input
            size="lg"
            placeholder={input.name ? input.type + " " + input.name : input.type}
            autoComplete="off"
            value={form[key]}
            name={key}
            onChange={event => {
              const formUpdate = { ...form };
              formUpdate[event.target.name] = event.target.value;
              setForm(formUpdate);
            }}
          />
          {buttons && <InputRightAddon h={"auto"} children={buttons} />}
        </InputGroup>
      </div>
    );
  });
  const txValueInput = (
    <div style={{ margin: 2 }} key="txValueInput">
      <InputGroup>
        <Input value={txValue} onChange={e => setTxValue(e.target.value)} placeholder="transaction value" />
        <InputRightAddon
          children={
            <div>
              <HStack>
                <VStack>
                  <Tooltip label=" * 10^18 ">
                    <div
                      style={{ cursor: "pointer" }}
                      onClick={async () => {
                        const floatValue = parseFloat(txValue);
                        if (floatValue) setTxValue("" + floatValue * 10 ** 18);
                      }}
                    >
                      ✳️
                    </div>
                  </Tooltip>
                </VStack>
                <VStack>
                  <Tooltip label="number to hex">
                    <div
                      style={{ cursor: "pointer" }}
                      onClick={async () => {
                        setTxValue(BigNumber.from(txValue).toHexString());
                      }}
                    >
                      #️⃣
                    </div>
                  </Tooltip>
                </VStack>
              </HStack>
            </div>
          }
        />
      </InputGroup>
    </div>
  );

  if (functionInfo.payable) {
    inputs.push(txValueInput);
  }

  const handleForm = returned => {
    if (returned) {
      setForm({});
    }
  };

  const buttonIcon =
    functionInfo.type === "call" ? (
      <Button variant={"ghost"}>Read📡</Button>
    ) : (
      <Button variant={"ghost"}>Send💸</Button>
    );
  inputs.push(
    <div style={{ cursor: "pointer", margin: 2 }} key="goButton">
      <InputGroup>
        <Input
          onChange={e => setReturnValue(e.target.value)}
          defaultValue=""
          disabled
          border={"firebrick"}
          value={returnValue}
        />
        <InputRightAddon
          children={
            <div
              onClick={async () => {
                const args = functionInfo.inputs.map((input, inputIndex) => {
                  const key = getFunctionInputKey(functionInfo, input, inputIndex);
                  let value = form[key];
                  if (["array", "tuple"].includes(input.baseType)) {
                    value = JSON.parse(value);
                  } else if (input.type === "bool") {
                    if (
                      value === "true" ||
                      value === "1" ||
                      value === "0x1" ||
                      value === "0x01" ||
                      value === "0x0001"
                    ) {
                      value = 1;
                    } else {
                      value = 0;
                    }
                  }
                  return value;
                });

                let result;
                if (functionInfo.stateMutability === "view" || functionInfo.stateMutability === "pure") {
                  try {
                    const returned = await contractFunction(...args);
                    handleForm(returned);
                    result = tryToDisplayAsText(returned);
                  } catch (err) {
                    console.error(err);
                  }
                } else {
                  const overrides = {};
                  if (txValue) {
                    overrides.value = txValue; // ethers.utils.parseEther()
                  }
                  if (gasPrice) {
                    overrides.gasPrice = gasPrice;
                  }
                  // Uncomment this if you want to skip the gas estimation for each transaction
                  // overrides.gasLimit = hexlify(1200000);

                  // console.log("Running with extras",extras)
                  const returned = await tx(contractFunction(...args, overrides));
                  handleForm(returned);
                  result = tryToDisplay(returned);
                }

                console.log("SETTING RESULT:", result);
                setReturnValue(result);
                triggerRefresh(true);
              }}
            >
              {buttonIcon}
            </div>
          }
        />
      </InputGroup>
    </div>,
  );

  return (
    <div>
      <Grid templateColumns="repeat(2, 1fr)" gap={9}>
        <GridItem>{functionInfo.name}</GridItem>
        <GridItem>{inputs}</GridItem>
      </Grid>
      <Divider my={4} orientation="horizontal" />
    </div>
  );
}
