import {
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  UInt64,
  Permissions,
  DeployArgs,
  AccountUpdate,
  Bool,
  Struct,
} from 'o1js';

export class TokenEvent extends Struct({
  from: PublicKey,
  to: PublicKey,
  amount: UInt64,
}) {}

export class MinaMeowToken extends SmartContract {
  @state(UInt64) totalSupply = State<UInt64>();
  @state(Bool) isPaused = State<Bool>();
  @state(PublicKey) owner = State<PublicKey>();
  
  // Map of address => balance
  @state(UInt64) balances = State<UInt64>();

  events = {
    transfer: TokenEvent,
    burn: TokenEvent,
  };

  deploy(args: DeployArgs) {
    super.deploy(args);
    
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });

    const initialSupply = UInt64.from(1000000000000n);
    this.totalSupply.set(initialSupply);
    this.isPaused.set(Bool(false));
    this.owner.set(this.sender);
    
    // Initialize deployer balance
    this.balances.set(initialSupply);
  }

  @method pause() {
    // Only owner can pause
    const currentOwner = this.owner.get();
    this.owner.assertEquals(currentOwner);
    this.sender.assertEquals(currentOwner);
    
    this.isPaused.set(Bool(true));
  }

  @method unpause() {
    // Only owner can unpause
    const currentOwner = this.owner.get();
    this.owner.assertEquals(currentOwner);
    this.sender.assertEquals(currentOwner);
    
    this.isPaused.set(Bool(false));
  }

  @method transfer(to: PublicKey, amount: UInt64) {
    // Check if contract is not paused
    const paused = this.isPaused.get();
    this.isPaused.assertEquals(paused);
    paused.assertFalse();

    // Get sender balance
    const senderBalance = this.balances.get();
    this.balances.assertEquals(senderBalance);

    // Check sufficient balance
    senderBalance.assertGreaterThanOrEqual(amount);

    // Get receiver balance
    const receiverBalance = this.balances.get();

    // Update balances
    const newSenderBalance = senderBalance.sub(amount);
    const newReceiverBalance = receiverBalance.add(amount);

    this.balances.set(newSenderBalance);
    this.balances.set(newReceiverBalance);

    // Emit transfer event
    this.emitEvent('transfer', {
      from: this.sender,
      to: to,
      amount: amount,
    });
  }

  @method burn(amount: UInt64) {
    // Check if contract is not paused
    const paused = this.isPaused.get();
    this.isPaused.assertEquals(paused);
    paused.assertFalse();

    const senderBalance = this.balances.get();
    this.balances.assertEquals(senderBalance);
    
    senderBalance.assertGreaterThanOrEqual(amount);
    
    const newBalance = senderBalance.sub(amount);
    this.balances.set(newBalance);
    
    const currentSupply = this.totalSupply.get();
    this.totalSupply.set(currentSupply.sub(amount));

    // Emit burn event
    this.emitEvent('burn', {
      from: this.sender,
      to: PublicKey.empty(),
      amount: amount,
    });
  }

  @method getBalance(address: PublicKey): UInt64 {
    return this.balances.get();
  }
}

