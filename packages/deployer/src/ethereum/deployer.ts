import { Ethereum, Structure } from '@solon/environment';
import * as ethers from 'ethers';
import * as fs from 'fs-extra';
import { glob } from 'glob';
import * as path from 'path';
import { Signale } from 'signale';

import { update } from './tracker';
import { EnsBuilder } from './ensBuilder';

export class EthererumDeployer {
  public contracts!: string[];
  public signer: ethers.Signer;
  public gasPrice!: ethers.utils.BigNumber;
  public ens: EnsBuilder;
  private config: Ethereum;
  private signale: Signale;
  private contractFiles!: { [basename: string]: string };

  constructor(config: Ethereum, signer: ethers.Signer) {
    this.config = config
    this.ens = new EnsBuilder(this);
    this.signer = signer
    this.signale = new Signale({ scope: 'Deployer' });
  }

  initialize = async () => {
    await fs.ensureFile(Structure.contracts.tracker);
    await this.initializeContracts();
    await this.initializeEthereum();
  }

  async run() {
    try {
      this.signale.await('Starting to deploy ethererum contracts by running migrate...');
      await this.config.migrate(this);
      this.signale.success('Ethererum contracts have been deployed');
    } catch (error) {
      this.signale.error(error);
    }
  }
  
  async deploy(contractName: string, ...args: any[]) {
    return this.deployWithWallet(contractName, this.signer, ...args);
  }

  async deployWithWallet(contractName: string, signer: ethers.Signer, ...args: any[]) {
    if (!this.contractFiles) {
      return;
    }

    const contractFile = this.contractFiles[contractName];
    if (!contractFile) {
      return;
    }

    const source = JSON.parse(fs.readFileSync(contractFile).toString());

    const abi = source.abi;
    const bytecode = `0x${source.evm.bytecode.object}`;
    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    return this.deployContractFactory(contractName, factory, ...args);
  }

  async deployContractFactory(contractName: string, factory: ethers.ContractFactory, ...args: any[]) {
    const contract = await factory.deploy(...args);
    await contract.deployed();
    update(contractName, contract.address, contract.abi);
    return contract;
  }

  private initializeContracts = () => {
    return new Promise<void>(resolve => {
      glob(`${Structure.contracts.build}/**/*.json`, {}, (_, files: string[]) => {
        this.contractFiles = files.reduce((acc: { [basename: string]: string }, file) => {
          acc[path.basename(file, '.json')] = file;
          return acc;
        },                                {});
        this.contracts = Object.keys(this.contractFiles);
        resolve();
      });
    });
  }

  private initializeEthereum = async () => {
    if (this.signer.provider) {
      this.gasPrice = await this.signer.provider.getGasPrice();
    }
  }
}
