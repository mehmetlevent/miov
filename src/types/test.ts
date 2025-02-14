import { PublicKey, PrivateKey } from 'o1js';

export interface TestAccount {
  publicKey: PublicKey;
  privateKey: PrivateKey;
}

export interface TestContext {
  deployerAccount: TestAccount;
  senderAccount: TestAccount;
}