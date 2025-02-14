import { Mina } from 'o1js';
import { TestContext } from '../types';
import { MinaMeowToken } from '../MinaMeowToken';

export function setupTestContext(): TestContext {
  const Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  
  return {
    deployerAccount: {
      privateKey: Local.testAccounts[0].privateKey,
      publicKey: Local.testAccounts[0].publicKey,
    },
    senderAccount: {
      privateKey: Local.testAccounts[1].privateKey,
      publicKey: Local.testAccounts[1].publicKey,
    }
  };
}