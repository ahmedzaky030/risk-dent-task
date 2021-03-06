import * as express from 'express';

class App {
    public app: express.Application;
    public port: number;

    constructor(controllers, port) {
        this.app = express();
        this.port = port;
        this.initializeControllers(controllers);
    }

    private initializeControllers(controllers) {
        controllers.forEach((controller) => {
            this.app.use('/', controller.router)
        })
    }

    public listen() {
        this.app.listen(this.port, () => {
            console.log(`App listening on the port ${this.port}`)
        })
    }
}

export default App;