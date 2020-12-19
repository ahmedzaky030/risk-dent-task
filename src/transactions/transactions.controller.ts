import { ModifiedTransaction, Transaction } from './transactions.model';
import * as express from 'express';
import * as neo4j from 'neo4j-driver';



class TransactionController {
    public path = '/transactions';
    public router = express.Router();
    // database configuration
    private connection = {
        //uri:'bolt://localhost:7687',
        uri: 'neo4j+s://6b1ba0f0.databases.neo4j.io',
        username: 'neo4j',
        //password:'1234',
        password: 'IAo9sab0A7lPd8q8H8qEsoa4Ug2iMg9cJsKqXvwzgaw'
    }

    private driver;

    constructor() {
        this.initializeConnection();
        this.initializeRoutes();
    }
    private initializeConnection() {
        this.driver = neo4j.driver(this.connection.uri, neo4j.auth.basic(this.connection.username, this.connection.password));
    }

    public initializeRoutes() {
        this.router.get('/test', (req, res) => { res.send('<h1>Test ok</h1>') })
        this.router.get(this.path, this.getTransactions);
    }

    getTransactions = async (request: express.Request, response: express.Response) => {
        const { transactionId, confidence } = request.query;
        let statement = this.buildStatement();
        let session = this.driver.session({ defaultAccessMode: neo4j.session.READ });
        try {
            const resultR = await session.run(statement, { idParam: transactionId, confidenceParam: +confidence })
            let allRecords = [...resultR.records];
            // map data as it returns from database
            let nodes = allRecords.map(value => value._fields[0].properties) as Transaction[];
            // convert data to more suitable model/interface
            let adjustedNodes = nodes.map(value => ({ ...value, age: value.age.low, confidence: (value.confidence.low || value['confidence']), combinedConnectionInfo: { type: [], confidence: 0 } })) as ModifiedTransaction[]
            adjustedNodes.forEach(value => {
                let parent = adjustedNodes.find(tr => tr.id === value.parentId);
                if (parent) {
                    value.combinedConnectionInfo.confidence = value.confidence * parent.confidence;
                    let distinctTypes = new Set<string>();
                    distinctTypes = distinctTypes.add(parent.type).add(value.type);
                    parent.combinedConnectionInfo.type.forEach(type => distinctTypes.add(type));
                    value.combinedConnectionInfo.type = [...distinctTypes];
                    value.connectionInfo = { confidence: value.confidence, type: value.type };
                    // remove unwanted fields
                    let { confidence, type, parentId, ...newValue } = value;
                    value = newValue;
                } else {
                    // remove unwanted fields
                    let { combinedConnectionInfo, connectionInfo, confidence, type, parentId, ...newValue } = value;
                    value = newValue;
                }
            })
            response.json({ data: adjustedNodes })
        } catch (error) {
            console.log('error in subscribe', error)
        } finally {
            session.close();
        }
        // It should be called at the end of program
        //this.driver.close();
    }

    buildStatement() {
        return `MATCH (p:Transaction)<-[:IS_CHILD_OF*0..]-(children:Transaction) where p.id=$idParam and children.confidence >= $confidenceParam   RETURN   children`
    }
}

export default TransactionController