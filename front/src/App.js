import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import myEpicNft from './utils/MyEpicNFT.json';

const TWITTER_HANDLE = 'la_ayanbe';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const CONTRACT_ADDRESS = "0x6D4462350060D8987a52287ba943d8DBE115FCAC";
const OPENSEA_LINK = `https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/`;
const OPENSEA_COLLECTION_LINK = `https://testnets.opensea.io/collection/squarenft-xbdcfbgyb0`
const TOTAL_MINT_COUNT = 50;


const App = () => {

  const [currentAccount, setCurrentAccount] = useState("");
  const [openseaLink, setOpenseaLink] = useState("");
  const [mintCount, setMintCount] = useState(0)
  const [minting, setMinting] = useState(false)

  useEffect(() => {
    checkIfWalletIsConnected();
    setupEventListener();
  }, [])
    
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
    } else {
        console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    const isTestNet = await checkChainId();
    if (accounts.length !== 0 && isTestNet) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
    } else {
        console.log("No authorized account found")
    }
  }

  const checkChainId = async() => {
    const { ethereum } = window;
    let chainId = await ethereum.request({ method: 'eth_chainId' });
    console.log("Connected to chain " + chainId);

    // String, hex code of the chainId of the Rinkebey test network
    const rinkebyChainId = "0x4"; 
    if (chainId !== rinkebyChainId) {
      //alert("You are not connected to the Rinkeby Test Network!");
      return false
    }
    return true
  }

  /*
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      /*
      * Fancy method to request access to account.
      */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      /*
      * Boom! This should print out public address once we authorize Metamask.
      */
      console.log("Connected", accounts[0]);
      const isTestNet = await checkChainId();
      if (isTestNet) {
        setCurrentAccount(accounts[0]); 
      } else {
        alert("You are not connected to the Rinkeby Test Network!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          setOpenseaLink(OPENSEA_LINK + tokenId.toNumber());
          //alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
        });

        await getTotalNFTsMintedSoFar(connectedContract);

        console.log("Setup event listener!")

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await connectedContract.makeAnEpicNFT();

        setMinting(true)
        console.log("Mining...please wait.")
        await nftTxn.wait();
        
        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    } finally {
      setMinting(false)
    }
  }

  const getTotalNFTsMintedSoFar = async (contract) => {
    const count = await contract.getTotalNFTsMintedSoFar();
    setMintCount(count.toNumber())
  };

  /*
  * Added a conditional render! We don't want to show Connect to Wallet if we're already conencted :).
  */
  return (
    <div className="App">
      <div className="container">
        <section className="header-container">
          <div className="header-title">
            <p className="header gradient-text">NFT Builder</p>
            <p className="sub-text">
              Each unique. Each beautiful. Discover your NFT today.
            </p>
          </div>
          {currentAccount === "" ? (
            <button onClick={connectWallet} className="cta-button connect-wallet-button">
              Connect to Wallet
            </button>
          ) : (
            <button onClick={askContractToMintNft} className="cta-button connect-wallet-button mint-button">
              {minting && <div className="loader"></div>}
              <div>{minting ? 'Minting' : 'Mint NFT'}</div>
            </button>
          )}
          {openseaLink &&
            <div className="gradient-text">
              <h2>Minted Success! See your nft from <a href={openseaLink} target="_blank" rel="noreferrer">here</a></h2>
            </div>
          }
          <p className="mint-count">
            {mintCount}/{TOTAL_MINT_COUNT} NFTs minted so far
          </p>          
          <div className="opensea-collection">
            <div><img src="https://opensea.io/static/images/logos/opensea.svg" alt="opensea logo"/></div>
            <p><a href={OPENSEA_COLLECTION_LINK} target="_blank" rel="noreferrer">View Collection on OpenSea</a></p>
          </div>
        </section>

        <section className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </section>
      </div>
    </div>
  );
};

export default App;