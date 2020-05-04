const express = require("express");
const mongoose = require("mongoose");

const { Chaines, Regies } = require("./customExample");
const { mongoUri, options, port } = require("./config");

mongoose.connect(mongoUri, options).then(() => {
  console.log("Connected to MongoDb...");
});

const app = express();
app.use(express.json());

app.post("/init", async (req, res) => {
  await Regies.createCollection();
  await Chaines.createCollection();
  res.status(201).send({ message: "Collections created" });
});

app.post("/regies", async (req, res) => {
  let newRegie = new Regies(req.body.regie);
  await newRegie.save();
  res.status(201).send({ regie: newRegie });
});

app.post("/chaines", async (req, res) => {
  let session = await mongoose.startSession();
  try {
    await session.startTransaction();
    let newChaine = new Chaines(req.body.chaine);
    newChaine.save({ session });
    let regie = await Regies.findOne({ _id: req.body.chaine.regie }).session(
      session
    );
    regie.chaines.push(newChaine);
    await regie.save({ session });
    session.commitTransaction();
    session.endSession();
    res.status(201).send({ regie });
  } catch (error) {
    session.abort;
    res.send({ error: error });
  }
});

app.listen(port, () => console.log(`Listening on port ${port}...`));
