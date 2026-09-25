import { runHeaded } from '../backend/src/scraper/headedRunner.js';
await runHeaded({
	url: process.argv[2] || 'https://demo.inelabteamdev.com/',
	selectedOption: process.argv[3] ? { name: process.argv[3] } : undefined
});
