import * as express from "express";
const router = express.Router();

router.get('/test', (req, res)=>{ res.send('Test inside router')})

export default router;