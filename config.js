module.exports = {
  port: process.env.PORT || "3050",
  mongoUri:
    "mongodb+srv://admin:thisisatest@clustertest-smb3v.mongodb.net/newTestDb?retryWrites=true&w=majority",
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};
