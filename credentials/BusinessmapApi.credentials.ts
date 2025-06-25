import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class BusinessmapApi implements ICredentialType {
	name = 'businessmapApi';
	displayName = 'Businessmap API';
	documentationUrl = 'https://businessmap.io/api';
	properties: INodeProperties[] = [
		{
			displayName: 'Businessmap URL',
			name: 'subdomain',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'e.g. https://<your-subdomain>.businessmap.io',
			description: 'Must be a valid URL: https://<subdomain>.businessmap.io or https://<subdomain>.kanbanize.com',
		},
		{
			displayName: 'API key',
			name: 'apikey',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'e.g. Your API key',
			typeOptions: {
				password: true,
			},
		},
		{
			displayName: 'Please configure your Businessmap URL and API key.<br> <a href="https://solutions.businessmap.io/apiLogins/logins" target="_blank">How to get connection settings?</a>',
			name: 'notice',
			type: 'notice',
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				apikey: '={{$credentials.apikey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{$credentials.subdomain.replace(/\\/$/, "") + "/api/v2"}}',
			url: '/me',
			headers: {
				apikey: '={{$credentials.apikey}}',
			},
		},
	};
}
