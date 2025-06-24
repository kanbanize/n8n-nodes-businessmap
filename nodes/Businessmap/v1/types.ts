import { IExecuteFunctions } from 'n8n-workflow';

export interface IResourceOperationHandler {
    (this: IExecuteFunctions, itemIndex: number): Promise<any>;
}

export interface IResourceHandler {
    [operation: string]: IResourceOperationHandler;
}

export interface IResourceHandlers {
    [resource: string]: IResourceHandler;
}
