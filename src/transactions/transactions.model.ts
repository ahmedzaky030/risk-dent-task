export interface Transaction {
    id: string;
    name: string;
    age: {low:number , high:number};
    geoInfo:{ latitude: string , longitude: string},
    phone: string;
    email: string;
    confidence:{low:number , high:number},
    parentId: string;
    type: string;
    combinedConnectionInfo?: { type: string , confidence: number }
}

export interface ModifiedTransaction {
    id: string;
    name: string;
    age: number;
    phone: string;
    email: string;
    confidence:number;
    parentId: string;
    type: string;
    combinedConnectionInfo?: { type: string[] , confidence: number }
}
  