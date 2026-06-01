const mainConfig = require('./eslint.config.js');

module.exports = [
	...mainConfig,
	{
		files: ['package.json'],
		rules: {
			'n8n-nodes-base/community-package-json-name-still-default': 'error',
		},
	},
];
