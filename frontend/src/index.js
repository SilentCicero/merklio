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

        console.log(statusResult);

        return actions.change({
          result: statusResult.status === 'pending' ? 'Your hash is pending merklization and noterization.' : (
            <div>
              <h3>Hash</h3>
              <p>{statusResult.hash}</p>

              <br />

              <h3>Status</h3>
              <p>Transacted</p>

              <br />

              <h3>Transaction Hash:</h3>
              <p>{statusResult.tx} <a href={`https://etherscan.io/tx/${statusResult.tx}`} target="_blank">view it on Etherscan</a></p>

              <br />

              <h3>Merkle Proof</h3>
              <pre>{JSON.stringify(statusResult.proof, null, 2)}</pre>
            </div>
          ),
        });
      } catch (error) { // hash doesnt exist.. submit
        const statusResult = (await axios.get(`https://api.merkl.io/add/${hash}`)).data;

        console.log(error);

        return actions.change({
          result: 'Hash submitted to merkl.io! Please wait a few hours for our system to merklize and noterize it on-chain.',
        });
      }

      console.log(statusResult);
    } catch (error) {
      console.log(error);
      return actions.change({
        result: 'There was an error with this data :(',
      });
    }
  },
  load: () => (state, actions) => {
    try {
    } catch (err) {
    }
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
  font-size: 20px;
  margin-top: 70px;
  font-family: 'Source Code Pro', monospace;
`;

const Lander = () => (state, actions) => (
  <Wrapper>
    <h2><u>M</u>erkl.io</h2>
    <h3>Noterize anything on Ethereum <b><i>for free</i></b>.</h3>

    <ConsoleInput type="text" placeholder="search or submit a hash" oninput={e => actions.searchOrSubmit(e.target.value)} />

    {state.result ? (
      <div style="margin-top: 50px;">{state.result}</div>
    ) : ''}

    <h4 style="margin-top: 100px;">How does it work?</h4>

    <p>Merkl.io ingests 32 byte hashes for free, orgnizes them into a merkle tree off-chain, than submits the master hash on-chain to a callable Ethereum smart-contract every few hours.</p>

    <h4>Why?</h4>

    <p>Many documents, contacts and legal systems require 3rd party noterization that a stated peice of data both exists and exists at a certain time.
    The blockchain is a perfect noterization mechanism, like a lawyer that can noterize any data provably at a specific time. Merkl.io uses the Ethereum blockchain to noterize documents and data for free and submits the master hash proofs on chain so they can be challenged if need be.</p>

    <h4>Developers / API</h4>

    <p>We have open-sourced our entire code-base and provide the merkl.io endpoint for free under the MIT license. Read more about our developer documentation here:</p>

    <a href="https://github.com/silentcicero/merkl" target="_blank">Github Repo</a>
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
