import regeneratorRuntime from "regenerator-runtime";
import { h, app } from "hyperapp";
import { Link, Route, location, Switch } from "@hyperapp/router";
import axios from 'axios';
const ethers = require('ethers');
const { utils, Wallet, providers } = require('ethers');
const { sendTransaction, balanceOf, call, Eth, onReceipt } = require('ethjs-extras');
import styled from 'hyperapp-styled-components';
import moment from 'moment';

// colors
const lightgray = '#E9E9E9';
const white = '#FFF';
const darker = '#A6A2A2';
const darkest = '#261E1C';
const primary = '#ED7354';
const whiteish = '#FFFFFE';
const green = '#6EDB81';
const bluegray = '#8A979D';
const grayer = '#95979C';
const blackish = '#1C1F26';

// standard route method
const route = pathname => {
  window.scrollTo(0, 0);
  history.pushState(null, "", pathname);
};

// localmemory storage
let localMemory = {};

// localstorage
const local = window.localStorage || {
  setItem: (key, value) => Object.assign(localMemory, { [key]: value }),
  getItem: key => localMemory[key] || null,
};

// define initial app state
const state = {
  location: location.state,
};

var editor;

// local.setItem('hashes', '[]');

// define initial actions
const actions = {
  location: location.actions,
  searchOrSubmit: hash => async (state, actions) => {
    try {
      if (!utils.isHexString(hash) || hash.length !== 66) {
        return actions.change({
          result: 'Must be a 32 byte hex string..',
        });
      }

      actions.change({
        result: 'Processing..',
      });

      try {
        const statusResult = (await axios.get(`https://api.merkl.io/status/${hash}`)).data;

        return actions.change({
          result: statusResult.status === 'pending' ? (<div>
            <h2>Notarization Record:</h2>

            <p>This hash is pending merklization and notarization.</p>

            <br />

            <h3>Hash</h3>

            <p>{hash}</p>
          </div>) : (
            <div>
              <h2>Notarization Record:</h2>
              <p>This hash has been successfully notarized via deterministic merkle-proofs on the Ethereum blockchain</p>

              <br />

              <h3>Hash</h3>
              <p>{statusResult.hash}</p>

              <br />

              <h3>Notarized on:</h3>
              <p>{statusResult.created}</p>

              <br />

              <h3>Status</h3>
              <p>Transacted</p>

              <br />

              <h3>Transaction Hash:</h3>
              <p>{statusResult.tx} <br /> <a href={`https://etherscan.io/tx/${statusResult.tx}`} target="_blank">view it on Etherscan</a></p>

              <br />

              <h3>Merkle Proof</h3>
              <pre>{JSON.stringify(statusResult.proof, null, 2)}</pre>

              <br />

              <a
                href={URL.createObjectURL(new Blob([JSON.stringify(statusResult)], { type: "application/json" }))}
                download={`${statusResult.hash}-notarization-record.json`}>
                Save Notarization Record as JSON
              </a>
            </div>
          ),
        });
      } catch (error) { // hash doesnt exist.. submit
        const statusResult = ((await axios.get(`https://api.merkl.io/add/${hash}`)) || {}).data;

        // store hashes locally
        const hashes = (JSON.parse(local.getItem('hashes') || '[]') || []).concat([hash]);
        actions.change({ hashes });
        local.setItem('hashes', JSON.stringify(hashes));

        return actions.change({
          result: 'Hash submitted to merkl.io! Please wait a few hours for our system to merklize and notarize it on-chain.',
        });
      }
    } catch (error) {
      return actions.change({
        result: 'There was an error with this data :(',
      });
    }
  },
  upload: (evt) => (state, actions) => {
    var files = evt.dataTransfer || evt.target.files; // FileList object

    // use the 1st file from the list
    const f = files[0];
    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function(theFile) {
      return function(e) {
        actions.searchOrSubmit(utils.keccak256(utils.toUtf8Bytes(e.target.result)));
      };
    })(f);

    // Read in the image file as a data URL.
    reader.readAsText(f);
  },
  load: () => (state, actions) => {
    // load up stored hashes
    actions.change({ hashes: (JSON.parse(local.getItem('hashes') || '[]') || []) });
  },
  clearHistory: () => (state, actions) => {
    // clear all stored hashes
    actions.change({ hashes: [] });
    local.setItem('hashes', '[]');
  },
  change: obj => obj,
};

// Not found page
const NotFound = () => (
  <div style={{ padding: '20%', 'padding-top': '100px' }}>
    <h1>Cool kids?</h1>
    <h3>Hmm... Page not found</h3>
  </div>
);

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 60%;
  margin: 0px auto;
  margin-top: 70px;
  font-family: 'Source Code Pro', monospace;
  margin-bottom: 100px;

  @media (max-width: 600px) {
    width: 80%;
    margin-top: 70px;
  }
`;

const ConsoleInput = styled.input`
  padding: 20px;
  width: 60%;
  font-size: 13px;
  margin-top: 70px;
  font-family: 'Source Code Pro', monospace;
`;

const UploadBox = styled.div`
  background: ${lightgray};
  padding: 20px;
  margin-top: 70px;
`;
const UploadBoxInner = styled.div`
  border: 3px dashed ${darker};
  min-height: 280px;
  display: flex;
  padding: 20px;

  align-items: center;
  flex-direction: row;
  justify-content: center;
`;

const Lander = () => (state, actions) => (
  <Wrapper>
    <h2 style="position: relative;"><a style="color: black; text-decoration: none;" href="http://merkl.io"><u>M</u>erkl.io
      <small style="font-size: 10px; color: gray; display: flex;">ALPHA</small></a>
    </h2>
    <h3>Notarize anything on Ethereum <b><i>for free</i></b>.</h3>

    <input type="file" style="display: none;" id="fileUpload" onchange={e => actions.upload(e)} />

    {!state.open ? (
      <div ondrop={e => actions.upload(e)}>
        <UploadBox onclick={e => document.querySelector('#fileUpload').click()}>
          <UploadBoxInner>
            <p>
              <p style="text-align: center; margin-bottom: 10px;">
                <svg class="box__icon" xmlns="http://www.w3.org/2000/svg" width="80" height="70" viewBox="0 0 80 70">
                  <path d="M48.4 26.5c-.9 0-1.7.7-1.7 1.7v11.6h-43.3v-11.6c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v13.2c0 .9.7 1.7 1.7 1.7h46.7c.9 0 1.7-.7 1.7-1.7v-13.2c0-1-.7-1.7-1.7-1.7zm-24.5 6.1c.3.3.8.5 1.2.5.4 0 .9-.2 1.2-.5l10-11.6c.7-.7.7-1.7 0-2.4s-1.7-.7-2.4 0l-7.1 8.3v-25.3c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v25.3l-7.1-8.3c-.7-.7-1.7-.7-2.4 0s-.7 1.7 0 2.4l10 11.6z"></path>
                </svg>
              </p>
              <b>Choose a file </b> to search or notarize.
              <br /><br />
              <small><i>Note, documents are not stored and are hashed locally</i></small>
            </p>
          </UploadBoxInner>
        </UploadBox>

        <br />

        <a href="#" style="margin-top: 20px;" onclick={e => actions.change({ open: true })}>or search by hash</a>
      </div>
    ) : ''}
    {state.open === true ? (
      <div>
        <ConsoleInput type="text" placeholder="search or submit a hash" oninput={e => actions.searchOrSubmit(e.target.value)} />

        <br /><br />

        <a href="#" style="margin-top: 20px;" onclick={e => actions.change({ open: false })}>or by document</a>
      </div>
    ) : ''}

    <a name="recordAnchor"></a>
    {state.result ? (
      <div style="margin-top: 50px;">{state.result}</div>
    ) : ''}

    {(state.hashes || '').length ? (
      <div>
        <h4 style="margin-top: 100px;">Your History</h4>

        {(state.hashes || []).map(hash => (
          <p><a href="#recordAnchor" onclick={e => actions.searchOrSubmit(hash)}>{hash}</a></p>
        ))}

        <br />

        <a style="margin-top: 40px;" onclick={actions.clearHistory}>Clear History</a>
      </div>
    ) : ''}

    <h4 style="margin-top: 100px;">How does it work?</h4>

    <p>Merkl.io ingests 32 byte hashes for free, orgnizes them into a merkle tree off-chain, than submits the master hash on-chain to a callable Ethereum smart-contract every few hours.</p>

    <h4>Why?</h4>

    <p>No need for those pesky lawyers to witness/notarize documents anymore!</p>
    <small>Note, the above is not legal advice. We mean this in theory. :)</small>

    <p>Furthermore, many documents, contacts and legal systems require 3rd party notarization that a stated peice of data both exists and exists at a certain time.
    The blockchain is a perfect notarization mechanism, like a lawyer that can notarize any data provably at a specific time. Merkl.io uses the Ethereum blockchain to notarize documents and data for free and submits the master hash proofs on chain so they can be challenged if need be.</p>

    <h4>Developers / API</h4>

    <p>We have open-sourced our entire code-base and provide the merkl.io endpoint for free under the MIT license. Read more about our developer documentation here:</p>

    <a href="https://github.com/silentcicero/merkl" target="_blank">Github Repo</a>

    <br />

    <h4>Example</h4>

    <p>Click on this hash to lookup the notarization record: <br /><br />
      <a href="#recordAnchor" onclick={e => actions.searchOrSubmit('0xe25ff4dcf11d7cd42b3c1be5e078ea5375c5992f9d3ff858f2318592bb0f5104')}>0xe25ff4dcf11d7cd42b3c1be5e078ea5375c5992f9d3ff858f2318592bb0f5104</a></p>

    <h4>Smart Contract</h4>

    <p><span>Our smart-contract is available here </span>
     <a href="https://etherscan.io/address/0x532d85bd4bd0233dfa0eed5b3fe8bcfbba0420a4" target="_blank">view it on Etherscan</a></p>
  </Wrapper>
);

// routes for app
const Routes = () => (
  <Switch>
    <Route path="/" render={Lander} />
    <Route render={NotFound} />
  </Switch>
);

// main app
const main = app(
  state,
  actions,
  Routes,
  document.body,
);

// load main call
main.load();

// unsubscripe for routing
const unsubscribe = location.subscribe(main.location);
