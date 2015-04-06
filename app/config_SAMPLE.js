module.exports = {
	TOKEN_SECRET: process.env.TOKEN_SECRET || 'a sample string that is hard to guess',
	MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost/',
	FACEBOOK_SECRET: process.env.FACEBOOK_SECRET || 'FACEBOOK_SECRET',
	GOOGLE_SECRET: process.env.GOOGLE_SECRET || 'GOOGLE_SECRET',
	GITHUB_SECRET: process.env.GITHUB_SECRET || 'GITHUB_SECRET',
	TWITTER_KEY: process.env.TWITTER_KEY || 'TWITTER_KEY',
	TWITTER_SECRET: process.env.TWITTER_SECRET || 'TWITTER_SECRET',
	TWITTER_CALLBACK: process.env.TWITTER_CALLBACK || 'http://localhost:8080'
};