// load packages
const mongoose = require("mongoose");
// for currency calculation handling
const $ = require("currency");

// the run-rs command will by default start the replica sets on the following ports
const uri = require("./config").mongoUri;

async function init() {
  // connecting the DB
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // a simple mongoose model
  const User = mongoose.model(
    "User",
    new mongoose.Schema({ accountId: String, name: String, balance: Number })
  );

  // creating two users
  await User.create([
    { accountId: "ACC001", name: "John", balance: 50.0 },
    { accountId: "ACC002", name: "Jane", balance: 50.0 },
  ]);

  return User;
}

async function handleMoneyTransfer(senderAccountId, receiveAccountId, amount) {
  // connect the DB and get the User Model
  const User = await init();

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // always pass session to find queries when the data is needed for the transaction session
    const sender = await User.findOne({ accountId: senderAccountId }).session(
      session
    );

    // calculate the updated sender balance
    sender.balance = sender.balance -= amount;

    // if funds are insufficient, the transfer cannot be processed
    if (sender.balance < 0) {
      throw new Error(`User - ${sender.name} has insufficient funds`);
    }

    // save the sender updated balance
    // do not pass the session here
    // mongoose uses the associated session here from the find query return
    // more about the associated session ($session) later on
    await sender.save();

    const receive = await User.findOne({
      accountId: receiveAccountId,
    }).session(session);

    receive.balance = receive.balance += amount;

    await receive.save();

    // commit the changes if everything was successful
    await session.commitTransaction();
  } catch (error) {
    // if anything fails above just rollback the changes here

    // this will rollback any changes made in the database
    await session.abortTransaction();

    // logging the error
    console.error(error);

    // rethrow the error
    throw error;
  } finally {
    // ending the session
    session.endSession();
  }
}

handleMoneyTransfer("ACC001", "ACC002", 25);
