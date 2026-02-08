
import connectDB from "./db/index.js";
import express from "express";

const app = express();
const port = 3000;

// Clean and readable! Just call the function.
connectDB()
.then(() => {
    app.listen(port, () => {
        console.log(`Server is running at port : ${port}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})

app.get('/', (req, res) => {
  res.send('Hello World!');
});