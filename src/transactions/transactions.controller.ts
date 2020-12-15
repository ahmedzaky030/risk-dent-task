import { ModifiedTransaction, Transaction } from './transactions.model';
import * as express from 'express';
import * as neo4j from 'neo4j-driver';



class TransactionController {
    public path = '/transactions';
    public router = express.Router();
    private connection = {
        //uri:'bolt://localhost:7687',
        uri:'neo4j+s://6b1ba0f0.databases.neo4j.io',
        username:'neo4j',
        //password:'1234',
        password:'IAo9sab0A7lPd8q8H8qEsoa4Ug2iMg9cJsKqXvwzgaw'
    }
    private driver;

    constructor(){
        this.initializeConnection();
        this.initializeRoutes();
    }
    private initializeConnection(){
        this.driver = neo4j.driver(this.connection.uri, neo4j.auth.basic(this.connection.username, this.connection.password));
    }

    private async ExecuteCypherQuery(statementQuery: string , response:express.Response){
        let responseData  = {};
        let session = this.driver.rxSession({defaultAccessMode:neo4j.session.READ});
        const resultR = session.run(statementQuery,{})
        const singleRecord = resultR.records().subscribe(data => {
            console.log('dataaaaaaaaaaaaaaaaa', data.get(0));
            responseData = data;
          } , (e)=>{ console.log('error in subscribe', e)}, ()=> { session.close(); response.json({done:'Ok', tr:responseData});})     
    }

    

    public initializeRoutes(){
        this.router.get('/test', (req, res)=>{ res.send('<h1>Test ok</h1>')})
        this.router.get(this.path , this.getTransactions);
    }

    getTransactions = async (request: express.Request , response: express.Response) => {
        const { transactionId , confidence} = request.query;
        let statement = this.buildStatement();
        // await this.ExecuteCypherQuery(statement, response);   
        let session = this.driver.session({defaultAccessMode:neo4j.session.READ});
        try {
            const resultR =  await session.run(statement,{idParam:transactionId , confidenceParam: +confidence})
            let allRecords =  [...resultR.records];
            let nodes = allRecords.map(v => v._fields[0].properties) as Transaction[];
            let adjustedNodes =  nodes.map(v => ({...v, age:v.age.low , confidence:v.confidence.low , combinedConnectionInfo:{type:[],confidence:1}})) as ModifiedTransaction[]
            adjustedNodes.forEach(v => {
                let parent = adjustedNodes.find(tr => tr.id === v.parentId);
                if(parent){
                    v.combinedConnectionInfo.confidence = v.confidence * parent.confidence;
                    let distinctTypes = new Set<string>();
                    distinctTypes = distinctTypes.add(parent.type).add(v.type);
                    parent.combinedConnectionInfo.type.forEach(type => distinctTypes.add(type));
                    v.combinedConnectionInfo.type = [...distinctTypes];
                }
            })
            response.json({data: adjustedNodes })
        } catch (error) {
            console.log('error in subscribe', error)
        } finally {
            session.close();
            
        }
        
        //this.driver.close();
        
    }

    buildStatement(){
        return `MATCH (p:Transaction)<-[:IS_CHILD_OF*0..]-(children:Transaction) where p.id=$idParam and children.confidence >= $confidenceParam   RETURN   children`
        // return `MATCH (p:Transaction)<-[:IS_CHILD_OF*1..]-(children:Transaction) where p.id=$id and children.confidence >= $confidence RETURN   children`
        //return `MATCH (p:Transaction {id:$id , confidence:$confidence})-[:IS_CHILD_OF*1..]-(children:Transaction) RETURN p, children`; 
    }

}

export default TransactionController