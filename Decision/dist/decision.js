const icon = `data:image/svg+xml,%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3C!-- Uploaded to: SVG Repo, www.svgrepo.com, Transformed by: SVG Repo MixTools --%3E%3Csvg width='800px' height='800px' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg' fill='white'%3E%3Cg id='SVGRepo_bgCarrier' stroke-width='0'/%3E%3Cg id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cg id='SVGRepo_iconCarrier'%3E%3Ctitle%3Esplit%3C/title%3E%3Cg id='Layer_2' data-name='Layer 2'%3E%3Cg id='invisible_box' data-name='invisible box'%3E%3Crect width='48' height='48' fill='none'/%3E%3C/g%3E%3Cg id='icons_Q2' data-name='icons Q2'%3E%3Cpath d='M44,17V6a2,2,0,0,0-2-2H31a2,2,0,0,0-2,2h0a2,2,0,0,0,2,2h6.2l-14,14H6a2,2,0,0,0-2,2H4a2,2,0,0,0,2,2H23.2l14,14H31a2,2,0,0,0-2,2h0a2,2,0,0,0,2,2H42a2,2,0,0,0,2-2V31a2,2,0,0,0-2-2h0a2,2,0,0,0-2,2v6.2L26.8,24,40,10.8V17a2,2,0,0,0,2,2h0A2,2,0,0,0,44,17Z'/%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;
const { Node } = await modular.require('@edisonai/nodemap/node');

// JSON template
//----------------------------------------------------------------------------------------------------

// Node JSON template
const template = {

    name: "Decision",
    category: "Utility Nodes",
    color: "rgb(128, 128, 255)",
    icon: icon,

    settings: {
        outputs: {
            canAdd: true,
            canRemove: true,
            canEditName: true,
        }
    },

    contents: null,

    inputs: [
        {
            name: 'text match',
            accept: 'complete',
            canEditAccept: false,
            canEditName: false,
        },

        {
            name: 'passthrough',
            accept: 'complete',
            canEditName: false,
            canEditAccept: true,
            canAcceptStream: true,
        }
    ],

    outputs: [
        { name: 'yes', },
        { name: 'no', }
    ]
}

// Processing function
//----------------------------------------------------------------------------------------------------

export default class DecisionNode extends Node {

    static template = template;

    constructor(node, options) {

        super(node || template, options);

        // Define inputs / outputs
        this.textMatchInput = this.inputs.get('text match');
        this.passthroughInput = this.inputs.get('passthrough');
    }

    main(caller, value) { this.executeOnce(this.matchAndSend); }

    // Combine multiple calls to main into one request
    matchAndSend() {

        // Reachback
        if (!this.inputsReady()) {
            this.log('Reaching back...');
            this.reachBack();
            return;
        }

        this.clearLogs();

        // Get text-match and pass-through inputs
        const textMatch = String(this.textMatchInput.value);
        let foundMatch = false;

        // Match textMatch against each output
        this.outputs.forEach((output) => {

            let regexPattern = null;

            // Attempt to create a regex object from the output name
            try {
                regexPattern = output.name.startsWith('/') ? new RegExp(output.name.slice(1, -2), output.name.slice(-1)) : new RegExp(output.name, 'i');
            }

            catch (error) {
                this.warn('Invalid regular expression in output name:', output.name);
                regexPattern = new RegExp(output.name, 'i'); // Use the string as provided if not a valid regex
            }

            // Check if the contents match the regex
            if (regexPattern.test(textMatch)) {
                output.send(this.passthroughInput.value);
                foundMatch = true;
            }
        });

        // Give up if no matches found
        if (!foundMatch) {
            this.warn('found no matches');
            return;
        }

        // Clear text match input if passthrough value is last
        if (this.passthroughInput.value?.isChunk) {
            if (this.passthroughInput.value.last) {
                this.textMatchInput.clear();
            }
        }

        else {
            this.textMatchInput.clear();
        }

        // Always clear passthrough input
        this.passthroughInput.clear();
        this.setState('done');
    }
}
