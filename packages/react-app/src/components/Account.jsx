import { Button, Flex } from "@chakra-ui/react";
import React from "react";

import Address from "./Address";
import Balance from "./Balance";

/**
  ~ What it does? ~
  Displays an Address, Balance, and Wallet as one Account component,
  also allows users to log in to existing accounts and log out
  ~ How can I use? ~
  <Account
    useBurner={boolean}
    address={address}
    localProvider={localProvider}
    userProvider={userProvider}
    mainnetProvider={mainnetProvider}
    price={price}
    web3Modal={web3Modal}
    loadWeb3Modal={loadWeb3Modal}
    logoutOfWeb3Modal={logoutOfWeb3Modal}
    blockExplorer={blockExplorer}
    isContract={boolean}
  />
  ~ Features ~
  - Provide address={address} and get balance corresponding to the given address
  - Provide localProvider={localProvider} to access balance on local network
  - Provide userProvider={userProvider} to display a wallet
  - Provide mainnetProvider={mainnetProvider} and your address will be replaced by ENS name
              (ex. "0xa870" => "user.eth")
  - Provide price={price} of ether and get your balance converted to dollars
  - Provide web3Modal={web3Modal}, loadWeb3Modal={loadWeb3Modal}, logoutOfWeb3Modal={logoutOfWeb3Modal}
              to be able to log in/log out to/from existing accounts
  - Provide blockExplorer={blockExplorer}, click on address and get the link
              (ex. by default "https://etherscan.io/" or for xdai "https://blockscout.com/poa/xdai/")
**/

export default function Account({
  useBurner,
  address,
  userSigner,
  localProvider,
  mainnetProvider,
  price,
  minimized,
  web3Modal,
  loadWeb3Modal,
  logoutOfWeb3Modal,
  blockExplorer,
  isContract,
}) {
  let accountButton;
  if (web3Modal?.cachedProvider) {
    accountButton = { name: "Disconnect", action: logoutOfWeb3Modal };
  } else {
    accountButton = { name: "Connect", action: loadWeb3Modal };
  }

  return (
    <>
      <div style={{ display: "flex", align: "center" }}>
        <Flex align={"center"} justify={"center"} border={1} spacing={3}>
          <Balance address={address} provider={localProvider} price={price} size={"1rem"} />

          {address && (
            <Address
              address={address}
              ensProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              blockieSize={8}
              fontSize={16}
            />
          )}
        </Flex>
      </div>
      <Button
        m={3}
        colorScheme="white.500"
        borderColor={"gray"}
        size={"md"}
        variant="outline"
        onClick={accountButton.action}
      >
        {accountButton.name}
      </Button>
    </>
  );
}
