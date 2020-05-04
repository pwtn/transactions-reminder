const uri = require("./config").mongoUri;
const mongoose = require("mongoose");

async function main() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // Transactions cannot be performed collections that aren't created yet
    await createCollections();
    console.log("Collections created !");
    await runTest();
  } catch (error) {
    console.log(error);
  } finally {
    await mongoose.disconnect();
  }
}

const chaineSchema = new mongoose.Schema({
  libelle: String,
  regie: { type: mongoose.Schema.Types.ObjectId, ref: "regies" },
});
const Chaines = mongoose.model("Chaine", chaineSchema, "chaines");

const Regies = mongoose.model(
  "Regie",
  new mongoose.Schema({
    libelle: String,
    chaines: [chaineSchema],
  }),
  "regies"
);

async function createCollections() {
  await Regies.createCollection();
  await Chaines.createCollection();
}

async function runTest() {
  let session = await mongoose.startSession();

  try {
    await session.startTransaction();
    let newRegie = new Regies({ libelle: "TF1 Publicité" });
    await newRegie.save({ session: session });

    let newChaine = new Chaines({
      libelle: "TF1",
      regie: newRegie._id,
    });
    await newChaine.save({ session: session });

    newRegie.chaines.push(newChaine);
    await newRegie.save({ session: session });

    await session.commitTransaction();
    console.log("The transaction is completed...");
  } catch (error) {
    console.log(error.message);
    await session.abortTransaction();
  } finally {
    await session.endSession();
  }
}

main();
