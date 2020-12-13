import * as express from "express";
import log from "./log";

const app = express();

app.get("/", (req, res) => {
    res.json({ok: 2});
});

app.listen(process.env.PORT || 5000, () => {
    log.info("app running");
});
