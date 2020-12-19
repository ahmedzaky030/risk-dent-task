import { ModifiedTransaction, Transaction } from './transactions.model';
import * as express from 'express';
import * as neo4j from 'neo4j-driver';
import { DBConnection } from '../config'

class TransactionController {
    public path = '/transactions';
    public router = express.Router();
    // database configuration
    private connection = DBConnection;

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
            let adjustedNodes = nodes.map(value => ({ ...value, age: value.age.low, confidence: (value.confidence.low || value['confidence']),  combinedConnectionInfo: { type: [], confidence: 0 } })) as ModifiedTransaction[];
            let parentNode = adjustedNodes.slice(0,1).map(({combinedConnectionInfo, confidence, type, parentId, ...newValue}) => newValue);

            let childrenNodes = adjustedNodes.slice(1);
            childrenNodes.forEach(value => {
                let parent = adjustedNodes.find(tr => tr.id === value.parentId);
                if (parent) {
                    value.combinedConnectionInfo.confidence = value.confidence * parent.confidence;
                    let distinctTypes = new Set<string>();
                    distinctTypes = distinctTypes.add(parent.type).add(value.type);
                    parent.combinedConnectionInfo.type.forEach(type => distinctTypes.add(type));
                    value.combinedConnectionInfo.type = [...distinctTypes];
                    value.connectionInfo = { confidence: value.confidence, type: value.type };
                }
            });
            let newChildrenNodes = childrenNodes.map(({ confidence, type, parentId, ...newValue }) => newValue);
            
            response.json({ data: [...parentNode, ...newChildrenNodes]})
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