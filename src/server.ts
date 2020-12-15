
import App from './app';
import TransactionController from './transactions/transactions.controller';
const port = process.env.PORT || 5000
const app = new App([
   new TransactionController()
], port)


app.listen();