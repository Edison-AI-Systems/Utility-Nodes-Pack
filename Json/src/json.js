// Modules
import json_icon from './icon.svg';
import json5 from 'json5';
const { Node } = await modular.require('@edisonai/nodemap/node');

// Default json=
const defaultJson =
	`{
	string: 'string',
	number: 1,
	boolean: true,
	array: [],
	object: {}
}`

// Processing function
//----------------------------------------------------------------------------------------------------

export default class JsonNode extends Node {

	static template = {

		name: 'JSON',
		category: 'Utility Nodes',
		color: 'rgb(66, 165, 245)',
		icon: json_icon,

		inputs: [{}],
		outputs: [{ canRemove: false, canEditName: false }],

		settings: {
			jsonString: defaultJson,

			outputs: {
				canAdd: true,
				canRemove: true,
				canEditName: true,
				placeholder: 'prop'
			}
		},

		gui: {
			type: 'group', direction: 'vertical', elements: [
				{ type: 'codeEditor', setting: 'jsonString', events: { 'save': 'saveString', 'change': 'setOutOfDate' }, style: { resize: 'both', width: 250, height: 175 } }
			]
		},
	}

	constructor(node, options) {
		super(node, options);
	}

	async onInitialize() {

		try {
			await this.saveString();
			this.initialized = true;
			setTimeout(() => { this.emit('update'); }, 250);
		}

		catch (e) {
			this.initialized = true;
			setTimeout(() => { this.error(e); }, 250);
		}
	}

	setOutOfDate() {
		this.settings.outOfDate = true;
		this.emit('update');
	}

	main(caller, value) {
		if (typeof value === 'string') { this.settings.jsonString = value }
		if (typeof value === 'object') { this.settings.jsonString = json5.parse(value); }
		this.emit('update');
		this.saveString();
	}

	saveString() {

		this.clearLogs();
		this.log('Saving...');

		if (this.settings.jsonString) {
			this.settings.object = json5.parse(this.settings.jsonString);
			this.settings.object[Symbol.toPrimitive] = () => { return JSON.stringify(json); }
		}

		else {
			this.settings.object = undefined;
		}

		delete this.settings.outOfDate;
		this.log(this.settings.object);

		setTimeout(() => { this.setState('idle') }, 450);
		this.setState('done');
		this.emit('update');
	}

	// Set the object
	async setJson(caller, object) {

		this.clearLogs();
		this.log('Setting...');

		this.settings.object = object;
		this.settings.string = stringifyCircular(object);

		this.log(this.settings.object);
		this.setState('done');
		this.emit('update');
	}

	// Override start
	start() {

		// Do nothing if we have connected inputs
		for (const input of this.inputs) {
			if (input.connections?.size) {
				return;
			}
		}

		this.outputs.forEach((output) => {
			if (output.name in this.settings.object) { output.send(this.settings.object[output.name]); }
			else { output.send(this.settings.object); }
		});
	}

	// Supply an output asking for a value
	supply(output) {
		if (output.name in this.settings.object) { output.send(this.settings.object[output.name]); }
		else { output.send(this.settings.object); }
	}
}

// Stringify an object while ignoring circular references
function stringifyCircular(obj) {

	const seen = new WeakSet();

	return JSON.stringify(obj, (key, value) => {

		// Return value none, not an object, or already seen
		if (!value) { return value; }
		if (typeof value !== 'object') { return value; }
		if (seen.has(value)) { return (`...${seen}`); }

		// Add to seen and return
		seen.add(value);
		return value;
	});
}
