
import App from './app';
import TransactionController from './transactions/transactions.controller';

const app = new App([
   new TransactionController()
], 5000)


app.listen();