import {
  Button,
  Modal,
  Spinner,
  Tooltip,
  Text,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { MdOutlineVpnKey, MdOutlineQrCodeScanner } from "react-icons/md";
import { BiSend } from "react-icons/bi";
import { RiWallet3Fill } from "react-icons/ri";
import QR from "qrcode.react";

import { Transactor } from "../helpers";
import Address from "./Address";
import AddressInput from "./AddressInput";
import Balance from "./Balance";
import EtherInput from "./EtherInput";

/**
  ~ What it does? ~

  Displays a wallet where you can specify address and send USD/ETH, with options to
  scan address, to convert between USD and ETH, to see and generate private keys,
  to send, receive and extract the burner wallet

  ~ How can I use? ~

  <Wallet
    provider={userProvider}
    address={address}
    ensProvider={mainnetProvider}
    price={price}
    color='red'
  />

  ~ Features ~

  - Provide provider={userProvider} to display a wallet
  - Provide address={address} if you want to specify address, otherwise
                                                    your default address will be used
  - Provide ensProvider={mainnetProvider} and your address will be replaced by ENS name
              (ex. "0xa870" => "user.eth") or you can enter directly ENS name instead of address
  - Provide price={price} of ether and easily convert between USD and ETH
  - Provide color to specify the color of wallet icon
**/

export default function Wallet(props) {
  const [signerAddress, setSignerAddress] = useState();
  useEffect(() => {
    async function getAddress() {
      if (props.signer) {
        const newAddress = await props.signer.getAddress();
        setSignerAddress(newAddress);
      }
    }
    getAddress();
  }, [props.signer]);

  const selectedAddress = props.address || signerAddress;

  const [open, setOpen] = useState();
  const [qr, setQr] = useState();
  const [amount, setAmount] = useState();
  const [toAddress, setToAddress] = useState();
  const [pk, setPK] = useState();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const providerSend = props.provider ? (
    <Tooltip label="Wallet">
      <RiWallet3Fill
        onClick={() => {
          onOpen();
          setOpen(!isOpen);
        }}
        rotate={-90}
        style={{
          padding: props.padding ? props.padding : 7,
          color: props.color ? props.color : "",
          cursor: "pointer",
          fontSize: props.size ? props.size : 28,
          verticalAlign: "middle",
        }}
      />
    </Tooltip>
  ) : (
    ""
  );

  let display;
  let receiveButton;
  let privateKeyButton;
  if (qr) {
    display = (
      <div>
        <div>
          <Text copyable>{selectedAddress}</Text>
        </div>
        <QR
          value={selectedAddress}
          size="450"
          level="H"
          includeMargin
          renderAs="svg"
          imageSettings={{ excavate: false }}
        />
      </div>
    );
    receiveButton = (
      <Button
        mx={2}
        key="hide"
        onClick={() => {
          setQr("");
        }}
      >
        <MdOutlineQrCodeScanner /> Hide
      </Button>
    );
    privateKeyButton = (
      <Button
        mx={2}
        key="hide"
        onClick={() => {
          setPK(selectedAddress);
          setQr("");
        }}
      >
        <MdOutlineVpnKey /> Private Key
      </Button>
    );
  } else if (pk) {
    const pk = localStorage.getItem("metaPrivateKey");
    const wallet = new ethers.Wallet(pk);

    if (wallet.address !== selectedAddress) {
      display = (
        <div>
          <b>*injected account*, private key unknown</b>
        </div>
      );
    } else {
      const extraPkDisplayAdded = {};
      const extraPkDisplay = [];
      extraPkDisplayAdded[wallet.address] = true;
      extraPkDisplay.push(
        <div style={{ fontSize: 16, padding: 2, backgroundStyle: "#89e789" }}>
          <a href={"/pk#" + pk}>
            <Address minimized address={wallet.address} ensProvider={props.ensProvider} /> {wallet.address.substr(0, 6)}
          </a>
        </div>,
      );
      for (const key in localStorage) {
        if (key.indexOf("metaPrivateKey_backup") >= 0) {
          console.log(key);
          const pastpk = localStorage.getItem(key);
          const pastwallet = new ethers.Wallet(pastpk);
          if (!extraPkDisplayAdded[pastwallet.address] /* && selectedAddress!=pastwallet.address */) {
            extraPkDisplayAdded[pastwallet.address] = true;
            extraPkDisplay.push(
              <div style={{ fontSize: 16 }}>
                <a href={"/pk#" + pastpk}>
                  <Address minimized address={pastwallet.address} ensProvider={props.ensProvider} />{" "}
                  {pastwallet.address.substr(0, 6)}
                </a>
              </div>,
            );
          }
        }
      }

      display = (
        <div>
          <b>Private Key:</b>

          <div>
            <Text copyable>{pk}</Text>
          </div>

          <hr />

          <i>
            Point your camera phone at qr code to open in
            <a target="_blank" href={"https://xdai.io/" + pk} rel="noopener noreferrer">
              burner wallet
            </a>
            :
          </i>
          <QR
            value={"https://xdai.io/" + pk}
            size="450"
            level="H"
            includeMargin
            renderAs="svg"
            imageSettings={{ excavate: false }}
          />

          <Text style={{ fontSize: "16" }} copyable>
            {"https://xdai.io/" + pk}
          </Text>

          {extraPkDisplay ? (
            <div>
              <h3>Known Private Keys:</h3>
              {extraPkDisplay}
              <Button
                onClick={() => {
                  const currentPrivateKey = window.localStorage.getItem("metaPrivateKey");
                  if (currentPrivateKey) {
                    window.localStorage.setItem("metaPrivateKey_backup" + Date.now(), currentPrivateKey);
                  }
                  const randomWallet = ethers.Wallet.createRandom();
                  const privateKey = randomWallet._signingKey().privateKey;
                  window.localStorage.setItem("metaPrivateKey", privateKey);
                  window.location.reload();
                }}
              >
                Generate
              </Button>
            </div>
          ) : (
            ""
          )}
        </div>
      );
    }

    receiveButton = (
      <Button
        key="receive"
        onClick={() => {
          setQr(selectedAddress);
          setPK("");
        }}
      >
        <MdOutlineQrCodeScanner /> Receive
      </Button>
    );
    privateKeyButton = (
      <Button
        key="hide"
        onClick={() => {
          setPK("");
          setQr("");
        }}
      >
        <MdOutlineVpnKey /> Hide
      </Button>
    );
  } else {
    const inputStyle = {
      padding: 10,
    };

    display = (
      <div>
        <div style={inputStyle}>
          <AddressInput
            autoFocus
            ensProvider={props.ensProvider}
            placeholder="to address"
            address={toAddress}
            onChange={setToAddress}
          />
        </div>
        <div style={inputStyle}>
          <EtherInput
            price={props.price}
            value={amount}
            onChange={value => {
              setAmount(value);
            }}
          />
        </div>
      </div>
    );
    receiveButton = (
      <Button
        mx={2}
        key="receive"
        onClick={() => {
          setQr(selectedAddress);
          setPK("");
        }}
      >
        <MdOutlineQrCodeScanner /> Receive
      </Button>
    );
    privateKeyButton = (
      <Button
        mx={2}
        key="hide"
        onClick={() => {
          setPK(selectedAddress);
          setQr("");
        }}
      >
        <MdOutlineVpnKey /> Private Key
      </Button>
    );
  }

  return (
    <span>
      {providerSend}

      <Modal
        size={"lg"}
        onOk={() => {
          setQr();
          setPK();
          setOpen(!isOpen);
        }}
        onCancel={() => {
          setQr();
          setPK();
          setOpen(!isOpen);
        }}
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {" "}
            <div>
              {selectedAddress ? <Address address={selectedAddress} ensProvider={props.ensProvider} /> : <Spinner />}
              <div style={{ float: "right", paddingRight: 25 }}>
                <Balance address={selectedAddress} provider={props.provider} dollarMultiplier={props.price} />
              </div>
            </div>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>{display}</ModalBody>

          <ModalFooter>
            {[
              privateKeyButton,
              receiveButton,
              <Button
                key="submit"
                mx={2}
                disabled={!amount || !toAddress || qr}
                isLoading={false}
                onClick={() => {
                  const tx = Transactor(props.signer || props.provider);

                  let value;
                  try {
                    value = ethers.utils.parseEther("" + amount);
                  } catch (e) {
                    // failed to parseEther, try something else
                    value = ethers.utils.parseEther("" + parseFloat(amount).toFixed(8));
                  }

                  tx({
                    to: toAddress,
                    value,
                  });
                  setOpen(!isOpen);
                  setQr();
                }}
              >
                <BiSend /> Send
              </Button>,
            ]}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </span>
  );
}
