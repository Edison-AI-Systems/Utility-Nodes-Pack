// Icon
const icon = `data:image/svg+xml,%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3C!-- Uploaded to: SVG Repo, www.svgrepo.com, Transformed by: SVG Repo MixTools --%3E%3Csvg width='800px' height='800px' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg' fill='white'%3E%3Cg id='SVGRepo_bgCarrier' stroke-width='0'/%3E%3Cg id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cg id='SVGRepo_iconCarrier'%3E%3Ctitle%3Ecode%3C/title%3E%3Cg id='Layer_2' data-name='Layer 2'%3E%3Cg id='invisible_box' data-name='invisible box'%3E%3Crect width='48' height='48' fill='none'/%3E%3C/g%3E%3Cg id='icons_Q2' data-name='icons Q2'%3E%3Cpath d='M20,40h-.5a2,2,0,0,1-1.4-2.5l8-27.9a2,2,0,0,1,3.8,1l-8,28A1.9,1.9,0,0,1,20,40Z'/%3E%3Cpath d='M14,35a2,2,0,0,0,1.3-3.5L7,24l8.3-7.5a2,2,0,0,0-2.6-3l-10,9a2,2,0,0,0,0,3l10,9A1.9,1.9,0,0,0,14,35Z'/%3E%3Cpath d='M34,35a2,2,0,0,1-1.3-3.5L41,24l-8.3-7.5a2,2,0,1,1,2.6-3l10,9a2,2,0,0,1,0,3l-10,9A1.9,1.9,0,0,1,34,35Z'/%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;

const { Node } = await modular.require('@edisonai/nodemap/node');

// JSON template
//----------------------------------------------------------------------------------------------------

const defaultCustomCode =
`
export function helloWorld() {
	this.log('Hello world!');
}
`

// Processing function
//----------------------------------------------------------------------------------------------------

export default class CustomNode extends Node {

	static template = {

		name: "Custom Code",
		type: "CustomNode",
		category: "Utility Nodes",
		color: "rgb(66, 165, 245)",
		icon: icon,

		inputs: [{ name: 'stream', accept: 'complete', }],
		outputs: [{ name: 'stream', }],

		settings: {

			showIcon: true,
			textBoxDimensions: { width: 550, height: 375 },
			showLogs: false,

			customCode: defaultCustomCode,

			inputs: {
				canAdd: true,
				canRemove: true,
				canEditName: true,
				canEditAccept: true,
				canAcceptStream: true,
			},

			outputs: {
				canAdd: true,
				canRemove: true,
				canEditName: true,
				canEditAccept: true,
				canAcceptStream: true,
			}
		},

		gui: {
			type: 'group', direction: 'vertical', elements: [
				{ type: 'codeEditor', setting: 'customCode', events: { 'save': 'trySaveCode', 'change': 'setOutOfDate' }, style: { resize: 'both', width: '500px', height: '350px' } }
			]
		},
	}

	constructor(node, options) {
		super(node || template, options);
	}

	async onInitialize() {

		try {
			await this.saveCode();
			this.initialized = true;
			setTimeout(() => { this.emit('update'); }, 250);
		}

		catch (e) {
			this.initialized = true;
			setTimeout(() => { this.error(e); }, 250);
		}
	}

	main() {
		this.setState('idle');
		this.run();
	}

	setOutOfDate() {
		this.settings.outOfDate = true;
		this.emit('update');
	}

	async trySaveCode() {
		try { await this.saveCode(); }
		catch (e) { this.error(e); }
	}

	async saveCode() {

		try {

			delete this.settings.outOfDate;

			this.clearLogs();
			this.log('Saving...');

			// Get string, make blob, get url
			const customCodeString = this.settings.customCode.replace(/(?<!await\s)require\(/g, 'await require(').replace(/await import\(/g, 'await require(').replace(/import\(/g, 'await require(');
			const customCodeBlob = new Blob([customCodeString], { type: 'text/javascript' });
			const customCodeBlobUrl = URL.createObjectURL(customCodeBlob);

			// Import with dynamic import function (greater scope)
			const exports = await modular.require(customCodeBlobUrl);

			// Clear functions first
			delete this.functions;
			this.functions = exports;

			this.setState('done');
			setTimeout(() => { this.setState('idle') }, 450);

			this.emit('update');
		}

		catch (e) {
			throw e;
		}
	}
}
