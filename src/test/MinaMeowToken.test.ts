import { MinaMeowToken } from '../MinaMeowToken';
import {
  AccountUpdate,
  Bool,
  Mina,
  PrivateKey,
  PublicKey,
  UInt64,
} from 'o1js';

describe('MinaMeowToken', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    senderAccount: PublicKey,
    senderKey: PrivateKey,
    zkApp: MinaMeowToken;

  beforeEach(async () => {
    const Local = Mina.LocalBlockchain();
    Mina.setActiveInstance(Local);
    
    deployerKey = Local.testAccounts[0].privateKey;
    deployerAccount = Local.testAccounts[0].publicKey;
    senderKey = Local.testAccounts[1].privateKey;
    senderAccount = Local.testAccounts[1].publicKey;
    
    zkApp = new MinaMeowToken(deployerAccount);
  });

  describe('Deployment and Initial State', () => {
    it('deploys correctly with initial supply', async () => {
      await zkApp.deploy();
      
      const totalSupply = zkApp.totalSupply.get();
      const deployerBalance = zkApp.balances.get();
      const isPaused = zkApp.isPaused.get();
      const owner = zkApp.owner.get();
      
      expect(totalSupply).toEqual(UInt64.from(1000000000000n));
      expect(deployerBalance).toEqual(UInt64.from(1000000000000n));
      expect(isPaused).toEqual(Bool(false));
      expect(owner).toEqual(deployerAccount);
    });
  });

  describe('Transfer Functionality', () => {
    it('allows valid transfers', async () => {
      await zkApp.deploy();
      
      const tx = await Mina.transaction(deployerAccount, () => {
        zkApp.transfer(senderAccount, UInt64.from(1000n));
      });
      await tx.prove();
      await tx.sign([deployerKey]).send();
      
      const senderBalance = zkApp.balances.get();
      expect(senderBalance).toEqual(UInt64.from(1000n));
    });

    it('prevents transfers exceeding balance', async () => {
      await zkApp.deploy();
      
      const exceedingAmount = UInt64.from(1000000000001n);
      
      await expect(async () => {
        const tx = await Mina.transaction(deployerAccount, () => {
          zkApp.transfer(senderAccount, exceedingAmount);
        });
        await tx.prove();
      }).rejects.toThrow();
    });

    it('prevents transfers when paused', async () => {
      await zkApp.deploy();
      
      // Pause the contract
      let tx = await Mina.transaction(deployerAccount, () => {
        zkApp.pause();
      });
      await tx.prove();
      await tx.sign([deployerKey]).send();
      
      // Try to transfer
      await expect(async () => {
        tx = await Mina.transaction(deployerAccount, () => {
          zkApp.transfer(senderAccount, UInt64.from(1000n));
        });
        await tx.prove();
      }).rejects.toThrow();
    });
  });

  describe('Burn Functionality', () => {
    it('allows burning tokens', async () => {
      await zkApp.deploy();
      
      const burnAmount = UInt64.from(1000n);
      const initialSupply = UInt64.from(1000000000000n);
      
      const tx = await Mina.transaction(deployerAccount, () => {
        zkApp.burn(burnAmount);
      });
      await tx.prove();
      await tx.sign([deployerKey]).send();
      
      const newTotalSupply = zkApp.totalSupply.get();
      expect(newTotalSupply).toEqual(initialSupply.sub(burnAmount));
    });

    it('prevents burning more than balance', async () => {
      await zkApp.deploy();
      
      const exceedingAmount = UInt64.from(1000000000001n);
      
      await expect(async () => {
        const tx = await Mina.transaction(deployerAccount, () => {
          zkApp.burn(exceedingAmount);
        });
        await tx.prove();
      }).rejects.toThrow();
    });

    it('prevents burning when paused', async () => {
      await zkApp.deploy();
      
      // Pause the contract
      let tx = await Mina.transaction(deployerAccount, () => {
        zkApp.pause();
      });
      await tx.prove();
      await tx.sign([deployerKey]).send();
      
      // Try to burn
      await expect(async () => {
        tx = await Mina.transaction(deployerAccount, () => {
          zkApp.burn(UInt64.from(1000n));
        });
        await tx.prove();
      }).rejects.toThrow();
    });
  });

  describe('Pause Functionality', () => {
    it('allows owner to pause and unpause', async () => {
      await zkApp.deploy();
      
      // Pause
      let tx = await Mina.transaction(deployerAccount, () => {
        zkApp.pause();
      });
      await tx.prove();
      await tx.sign([deployerKey]).send();
      
      let isPaused = zkApp.isPaused.get();
      expect(isPaused).toEqual(Bool(true));
      
      // Unpause
      tx = await Mina.transaction(deployerAccount, () => {
        zkApp.unpause();
      });
      await tx.prove();
      await tx.sign([deployerKey]).send();
      
      isPaused = zkApp.isPaused.get();
      expect(isPaused).toEqual(Bool(false));
    });

    it('prevents non-owner from pausing', async () => {
      await zkApp.deploy();
      
      await expect(async () => {
        const tx = await Mina.transaction(senderAccount, () => {
          zkApp.pause();
        });
        await tx.prove();
      }).rejects.toThrow();
    });
  });
});