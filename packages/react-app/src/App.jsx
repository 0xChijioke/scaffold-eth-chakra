import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  Input,
  List,
  ListItem,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  usePoller,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import { useEventListener } from "eth-hooks/events";
import React, { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch, useLocation } from "react-router-dom";
import "./App.css";
import {
  Account,
  Address,
  AddressInput,
  //Contract,
  //Faucet,
  GasGauge,
  Header,
  Ramp,
  ThemeSwitch,
  NetworkDisplay,
  FaucetHint,
  //NetworkSwitch,
} from "./components";
import { NETWORKS, ALCHEMY_KEY } from "./constants";
import externalContracts from "./contracts/external_contracts";
// contracts
import deployedContracts from "./contracts/hardhat_contracts.json";
import { Transactor, Web3ModalSetup } from "./helpers";
import { useStaticJsonRPC } from "./hooks";

const { ethers } = require("ethers");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Alchemy.com & Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const initialNetwork = NETWORKS.rinkeby; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = false;
const NETWORKCHECK = true;
const USE_BURNER_WALLET = true; // toggle burner wallet feature
const USE_NETWORK_SELECTOR = false;

const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  "https://rpc.scaffoldeth.io:48544",
];

function App(props) {
  // specify all the chains your app is available on. Eg: ['localhost', 'mainnet', ...otherNetworks ]
  // reference './constants.js' for other networks
  const networkOptions = [initialNetwork.name, "mainnet", "rinkeby"];

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const location = useLocation();

  /// 📡 What chain are your contracts deployed to?
  const targetNetwork = NETWORKS[selectedNetwork]; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);
  const mainnetProvider = useStaticJsonRPC(providers);

  if (DEBUG) console.log(`Using ${selectedNetwork} network`);

  // 🛰 providers
  if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider, USE_BURNER_WALLET);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // const contractConfig = useContractConfig();

  const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // call every 1500 seconds.
  usePoller(() => {
    updateHappi();
  }, 1500000);

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]);

  // keep track of a variable from the contract in the local React state:
  const smileBalance = useContractReader(readContracts, "Smile", "balanceOf", [address]);
  console.log("🤗 Smile balance:", smileBalance);

  const happiBalance = useContractReader(readContracts, "Happi", "balanceOf", [address]);
  console.log("🤗 Happi balance:", happiBalance);

  // 📟 Listen for broadcast events
  const smileTransferEvents = useEventListener(readContracts, "Smile", "Transfer", localProvider, 1);
  console.log("📟 Smile Transfer events:", smileTransferEvents);

  const happiTankTransferEvents = useEventListener(readContracts, "Happi", "Transfer", localProvider, 1);
  console.log("📟 Happi Transfer events:", happiTankTransferEvents);

  //
  // 🧠 This effect will update yourCollectibles by polling when your balance changes
  //
  const yourSmileBalance = smileBalance && smileBalance.toNumber && smileBalance.toNumber();
  const [yourSmile, setYourSmile] = useState();

  const yourHappiBalance = happiBalance && happiBalance.toNumber && happiBalance.toNumber();
  const [yourHappi, setYourHappi] = useState();

  async function updateHappi() {
    const happiUpdate = [];
    for (let tokenIndex = 0; tokenIndex < yourHappiBalance; tokenIndex++) {
      try {
        console.log("Getting token index", tokenIndex);
        const tokenId = await readContracts.Happi.tokenOfOwnerByIndex(address, tokenIndex);
        console.log("tokenId", tokenId);
        console.log(readContracts.Happi.tokenURI(tokenId));
        const tokenURI = await readContracts.Happi.tokenURI(tokenId);
        console.log("tokenURI", tokenURI);
        const jsonManifestString = atob(tokenURI.substring(29));
        console.log("jsonManifestString", jsonManifestString);

        try {
          const jsonManifest = JSON.parse(jsonManifestString);
          console.log("jsonManifest", jsonManifest);
          happiUpdate.push({ id: tokenId, uri: tokenURI, owner: address, ...jsonManifest });
        } catch (e) {
          console.log(e);
        }
      } catch (e) {
        console.log(e);
      }
    }
    setYourHappi(happiUpdate.reverse());
  }

  useEffect(() => {
    const updateYourCollectibles = async () => {
      const smileUpdate = [];
      for (let tokenIndex = 0; tokenIndex < yourSmileBalance; tokenIndex++) {
        try {
          console.log("Getting token index", tokenIndex);
          const tokenId = await readContracts.Smile.tokenOfOwnerByIndex(address, tokenIndex);
          console.log("tokenId", tokenId);
          const tokenURI = await readContracts.Smile.tokenURI(tokenId);
          console.log("tokenURI", tokenURI);
          const jsonManifestString = atob(tokenURI.substring(29));
          console.log("jsonManifestString", jsonManifestString);
          /*
          const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
          console.log("ipfsHash", ipfsHash);
          const jsonManifestBuffer = await getFromIPFS(ipfsHash);
        */
          try {
            const jsonManifest = JSON.parse(jsonManifestString);
            console.log("jsonManifest", jsonManifest);
            smileUpdate.push({ id: tokenId, uri: tokenURI, owner: address, ...jsonManifest });
          } catch (e) {
            console.log(e);
          }
        } catch (e) {
          console.log(e);
        }
      }
      setYourSmile(smileUpdate.reverse());
      updateHappi();
    };
    updateYourCollectibles();
  }, [address, yourSmileBalance, yourHappiBalance]);

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
  ]);

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;
  const [transferToAddresses, setTransferToAddresses] = useState({});
  const [transferToTankId, setTransferToTankId] = useState({});
  const [pending, setPending] = useState(false);

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header>
        {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flex: 1 }}>
            {USE_NETWORK_SELECTOR && (
              <div style={{ marginRight: 20 }}>
                {/* <NetworkSwitch
                  networkOptions={networkOptions}
                  selectedNetwork={selectedNetwork}
                  setSelectedNetwork={setSelectedNetwork}
                /> */}
              </div>
            )}
            <Account
              useBurner={USE_BURNER_WALLET}
              address={address}
              localProvider={localProvider}
              userSigner={userSigner}
              mainnetProvider={mainnetProvider}
              price={price}
              web3Modal={web3Modal}
              loadWeb3Modal={loadWeb3Modal}
              logoutOfWeb3Modal={logoutOfWeb3Modal}
              blockExplorer={blockExplorer}
            />
          </div>
        </div>
      </Header>
      {yourLocalBalance.lte(ethers.BigNumber.from("0")) && (
        <FaucetHint localProvider={localProvider} targetNetwork={targetNetwork} address={address} />
      )}
      <NetworkDisplay
        NETWORKCHECK={NETWORKCHECK}
        localChainId={localChainId}
        selectedChainId={selectedChainId}
        targetNetwork={targetNetwork}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
        USE_NETWORK_SELECTOR={USE_NETWORK_SELECTOR}
      />

      <Stack direction={"row"} align={"center"} justify={"center"} spacing={77}>
        <Link to={"/"}>Smile</Link>
        <Link to={"/minthappi"}>Mint Happi</Link>
      </Stack>

      <Switch>
        {/* <Route exact path="/">
          
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
           

          <Contract
            name="Smile"
            customContract={writeContracts && writeContracts.Loogies}
            signer={userSigner}
            provider={localProvider}
            address={address}
            blockExplorer={blockExplorer}
            contractConfig={contractConfig}
          />
        </Route>
        <Route exact path="/loogietank">
          <Contract
            name="LoogieTank"
            signer={userSigner}
            provider={localProvider}
            address={address}
            blockExplorer={blockExplorer}
            contractConfig={contractConfig}
          />
        </Route> */}
        <Route exact path="/">
          <div style={{ maxWidth: 820, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
            <Button
              onClick={async () => {
                setPending(true);
                await tx(writeContracts.Smile.mintItem());
                setPending(false);
              }}
              isLoading={pending}
            >
              MINT
            </Button>
          </div>
          {/* */}
          <Container boxShadow="dark-lg" rounded="2xl" p={4} w={"fit-content"}>
            <List>
              {yourSmile &&
                yourSmile.map(item => {
                  const id = item.id.toNumber();

                  console.log("IMAGE", item.image);

                  return (
                    <ListItem key={id + "_" + item.uri + "_" + item.owner}>
                      <Flex direction={"column"} align={"center"}>
                        <Heading>
                          <div>
                            <span style={{ fontSize: 18, marginRight: 8 }}>{item.name}</span>
                          </div>
                        </Heading>
                        <Image h={"244"} src={item.image} />
                        {/* <div>{item.description}</div> */}
                      </Flex>
                      <Flex my={2} alignItems={"center"} justify={"center"} direction={"column"}>
                        <Flex direction={"row"} justify={"center"} align={"center"}>
                          <Text pr={2}>Owner</Text>
                          <Address
                            address={item.owner}
                            ensProvider={mainnetProvider}
                            blockExplorer={blockExplorer}
                            fontSize={16}
                          />
                        </Flex>
                        <Flex direction={"column"} alignItems={"center"} w={"fit-content"}>
                          <AddressInput
                            ensProvider={mainnetProvider}
                            placeholder="transfer to address"
                            value={transferToAddresses[id]}
                            onChange={newValue => {
                              const update = {};
                              update[id] = newValue;
                              setTransferToAddresses({ ...transferToAddresses, ...update });
                            }}
                          />
                          <Button
                            my={3}
                            onClick={() => {
                              console.log("writeContracts", writeContracts);
                              tx(writeContracts.Smile.transferFrom(address, transferToAddresses[id], id));
                            }}
                          >
                            Transfer
                          </Button>
                          <br />
                          <Flex direction={"row"} justify={"center"} align={"center"}>
                            <Text pr={2}>Transfer to Happi:</Text>
                            <Address
                              address={readContracts.Happi.address}
                              blockExplorer={blockExplorer}
                              fontSize={16}
                            />
                          </Flex>

                          <Input
                            placeholder="HAPPI ID"
                            onChange={newValue => {
                              console.log("newValue", newValue.target.value);
                              const update = {};
                              update[id] = newValue.target.value;
                              setTransferToTankId({ ...transferToTankId, ...update });
                            }}
                          />

                          <Button
                            my={2}
                            onClick={() => {
                              console.log("writeContracts", writeContracts);
                              console.log("transferToTankId[id]", transferToTankId[id]);
                              console.log(parseInt(transferToTankId[id]));

                              const tankIdInBytes =
                                "0x" + parseInt(transferToTankId[id]).toString(16).padStart(64, "0");
                              console.log(tankIdInBytes);

                              tx(
                                writeContracts.Smile["safeTransferFrom(address,address,uint256,bytes)"](
                                  address,
                                  readContracts.Happi.address,
                                  id,
                                  tankIdInBytes,
                                ),
                              );
                            }}
                          >
                            Transfer
                          </Button>
                        </Flex>
                      </Flex>
                    </ListItem>
                  );
                })}
            </List>
          </Container>
          {/* */}
        </Route>
        <Route exact path="/minthappi">
          <Flex w={"full"} direction={"row-reverse"}>
            <Button
              mr={5}
              onClick={async () => {
                setPending(true);
                await tx(writeContracts.Happi.mintItem());
                setPending(false);
              }}
              isLoading={pending}
              loadingText="Minting"
            >
              MINT
            </Button>
            <Button mr={5} onClick={() => updateHappi()}>
              Refresh
            </Button>
          </Flex>
          {/* */}

          <Container boxShadow="dark-lg" rounded="3xl" p={4} w={"fit-content"}>
            <List>
              {yourHappi &&
                yourHappi.map(item => {
                  const id = item.id.toNumber();

                  console.log("IMAGE", item.image);

                  return (
                    <ListItem key={id + "_" + item.uri + "_" + item.owner}>
                      <Flex direction={"column"}>
                        <Heading fontFamily={"monospace"}>{item.name}</Heading>
                        <Image borderRadius={"2xl"} src={item.image} />
                        <Text>{item.description}</Text>
                      </Flex>

                      <Flex my={2} alignItems={"center"} justify={"center"} direction={"column"}>
                        <Flex direction={"row"} justify={"center"} align={"center"}>
                          <Text pr={2}>Owner</Text>
                          <Address
                            address={item.owner}
                            ensProvider={mainnetProvider}
                            blockExplorer={blockExplorer}
                            fontSize={16}
                          />
                        </Flex>
                        <Flex direction={"column"} alignItems={"center"} w={"fit-content"}>
                          <AddressInput
                            ensProvider={mainnetProvider}
                            placeholder="Transfer to address"
                            value={transferToAddresses[id]}
                            onChange={newValue => {
                              const update = {};
                              update[id] = newValue;
                              setTransferToAddresses({ ...transferToAddresses, ...update });
                            }}
                          />
                        </Flex>
                        <HStack my={3}>
                          <Button
                            onClick={() => {
                              console.log("writeContracts", writeContracts);
                              tx(writeContracts.Smile.transferFrom(address, transferToAddresses[id], id));
                            }}
                          >
                            Transfer
                          </Button>
                          <br />
                          <br />
                          <Button
                            onClick={async () => {
                              setPending(true);
                              await tx(writeContracts.Happi.returnAllSmiles(id));
                              setPending(false);
                            }}
                            isLoading={pending}
                          >
                            Remove Smiles
                          </Button>
                        </HStack>
                      </Flex>
                    </ListItem>
                  );
                })}
            </List>
          </Container>

          {/* */}
        </Route>
      </Switch>
      <div
        style={{
          position: "fixed",
          display: "flex",
          direction: "right",
          right: 0,
          bottom: 20,
          padding: 10,
        }}
      >
        <ThemeSwitch />
      </div>

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div
        style={{
          position: "fixed",
          display: "flex",
          direction: "right",
          textAlign: "left",
          left: 0,
          bottom: 20,
          padding: 6,
        }}
      >
        <Flex justify={"center"} align={"center"} direction={"left"}>
          <Box>
            <Ramp price={price} address={address} networks={NETWORKS} />
          </Box>

          <Box>
            <GasGauge gasPrice={gasPrice} />
          </Box>
          <Box>
            <Button
              variant={"unstyled"}
              onClick={() => {
                window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
              }}
            >
              <span style={{ marginRight: 8 }} role="img" aria-label="support">
                💬
              </span>
              Support
            </Button>
          </Box>
        </Flex>
        {/* 
        <HStack align="middle" gutter={[4, 4]}>
          <VStack span={24}>
            {
             
              faucetAvailable ? (
                <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              ) : (
                ""
              )
            }
          </VStack>
        </HStack> */}
      </div>
    </div>
  );
}

export default App;
