// load packages
const MongoClient = require("mongodb").MongoClient;

// load config
const config = require("./config");

async function runTest() {
  const client = new MongoClient(config.mongoUri, { useUnifiedTopology: true });
  await client.connect();

  // Prereq: Create collections. CRUD operations in transactions must be on existing collections.
  console.log("Creating the collections...");
  await client
    .db("mydb1")
    .collection("foo")
    .insertOne({ abc: 0 }, { w: "majority" });

  await client
    .db("mydb2")
    .collection("bar")
    .insertOne({ xyz: 0 }, { w: "majority" });

  console.log("Collections created !");

  // Step 1: Start a Client Session
  const session = client.startSession();

  // Step 2: Optional. Define options to use for the transaction
  const transactionOptions = {
    readPreference: "primary",
    readConcern: { level: "local" },
    writeConcern: { w: "majority" },
  };

  // Step 3: Use withTransaction to start a transaction, execute the callback, and commit (or abort on error)
  // Note: The callback for withTransaction MUST be async and/or return a Promise.
  try {
    console.log("Initializing the transaction...");
    await session.withTransaction(async () => {
      const coll1 = client.db("mydb1").collection("foo");
      const coll2 = client.db("mydb2").collection("bar");

      // Important:: You must pass the session to the operations

      await coll1.insertOne({ abc: 1 }, { session });
      await coll2.insertOne({ xyz: 999 }, { session });
      console.log("The transaction has been performed !");
    }, transactionOptions);
  } finally {
    await session.endSession();
    await client.close();
  }
}

runTest();
