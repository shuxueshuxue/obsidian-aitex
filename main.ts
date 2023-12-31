import { Plugin, MarkdownView } from "obsidian";
import { SettingTab } from "./settings";
import { Prec, Text as codemirrorText } from "@codemirror/state";
import { EditorView ,keymap } from '@codemirror/view';
import * as https from 'https';
import { URL } from 'url';
import { generate_promt } from "prompt";
import { addDisplayStyle, powerToEmoji, tokenEstimate } from "stringUtils";

interface PluginSettings {
    endpoint: string;
    apiKey: string;
}

interface MyLine {
    lineNumber: number;
    text: string;
}

const DEFAULT_SETTINGS: Partial<PluginSettings> = {
    endpoint: "https://api.openai.com/v1/chat/completions",
    apiKey: "",
};

export default class aitex extends Plugin {
    settings: PluginSettings;

    async onload() {
    await this.loadSettings();
    this.addSettingTab(new SettingTab(this.app, this));

    this.registerEditorExtension(Prec.highest(keymap.of([
            {
                key: "Enter",
                run: (view: EditorView): boolean => {
                    const success = this.handleEnter(view);
                    return success;
                }
            }
        ])));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

// here comes the main function
handleEnter = (view: EditorView) => {
    let state = view.state;
    let doc = state.doc
    const s = view.state.selection;
    if (s.ranges.length > 1) return false;
    const pos = s.main.to;
    let line = doc.lineAt(pos)

    if (line.text.endsWith("\\\\")){
        this.process_line({lineNumber: line.number, text: line.text}, doc)
    }

    return false
}

getActiveView() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView !== null) {
        return activeView;
    } else {
        // new Notice("The file type should be Markdown!");
        return null;
    }
}

async process_line(line: MyLine, doc: codemirrorText){
    let activeView = this.getActiveView();
    if (activeView !== null){
        const editor = activeView.editor;

        let power = 2
        if (line.text.endsWith("\\\\\\")){
            power = 3
        }
        if (line.text.endsWith("\\\\\\\\")){
            power = 4
        }
        line.text = line.text.slice(0, -power)

        if (line.text.trim()){
            editor.setLine(line.lineNumber - 1, line.text + powerToEmoji(power))

            const res = await this.get_formatted_latex(line.text, power, this.settings.endpoint, this.settings.apiKey)
            if (res){
                editor.setLine(line.lineNumber - 1, res)
            }
        }
        else {
            let lineNumber = line.lineNumber - 1;  // Start from the line above
            let accumulatedText = "";
            let totalLines = 0;
            let totalToken = 0;
            let max_token = 1000
        
            // Keep adding previous lines until conditions are met
            while (lineNumber > 0 && totalLines < 10 && totalToken <= max_token) {
                let lastLine = doc.line(lineNumber);
        
                if (lastLine.text.trim() === "") {
                    break;  // Break if an empty line is found
                }
        
                // Add this line at the beginning of the accumulated text
                accumulatedText = lastLine.text + "\n" + accumulatedText;
                totalToken += tokenEstimate(lastLine.text);
                totalLines++;
                lineNumber--;
            }
            accumulatedText = accumulatedText.trim()
        
            if (accumulatedText.trim() !== "") {  // If the accumulated text is not empty
                editor.setLine(line.lineNumber - 1, line.text + powerToEmoji(power))
                const res = await this.get_formatted_latex(accumulatedText, power, this.settings.endpoint, this.settings.apiKey)
                // const res  = accumulatedText
                editor.replaceRange("", {line: line.lineNumber - 1 - totalLines, ch: 0}, {line: line.lineNumber - 2, ch: doc.line(line.lineNumber - 1).text.length + 1 + powerToEmoji(power).length});
                editor.replaceRange("\n" + res, {line: line.lineNumber - 2 - totalLines, ch: 0})
            }
        }
    }
}

async get_formatted_latex(origin_text: string, power=2, url: string, api_key: string){
    let text = generate_promt(origin_text, power)
    console.log(text)
    let model = "gpt-3.5-turbo"
    if (power>=4){
        model = "gpt-4"
        console.log("GPT-4 used.")
    }
    let generated_result = await generateCompletion(text, url, api_key, model)
    generated_result = addDisplayStyle(generated_result)
    return generated_result;
}
}

async function generateCompletion(prompt: string, url: string, api_key: string, model: string) {
    // console.log("generating completion...")
    const chunks = await httpStream({message: prompt}, url, api_key, model);
    // console.log(chunks)
    const result = extractAndConcatenateContent(chunks as string)
    // console.log(result)
    return result
}

function parseUrl(myUrl: string): { hostname: string; path: string } {
    const parsedUrl = new URL(myUrl);
    return {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname
    };
}

async function httpStream({ message }: { message: string }, url: string, api_key: string, model: string){
    let parsed = parseUrl(url)

    const data = JSON.stringify({
            model: model,
            stream: true,
            messages: [
                {
                    content: message,
                    role: "user"
                }
            ],
            max_tokens: 1000,
            temperature: 0.3,
        });

    const options = {
        hostname: parsed.hostname,
        path: parsed.path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${api_key}`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
        },
    };

    const reqPromise = new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
        let chunks: Buffer[] = [];
        res.on('data', (chunk) => {
        chunks.push(chunk);
        });

        res.on('end', () => {
        resolve(Buffer.concat(chunks).toString());
        });

        res.on('error', (err) => {
        reject(err);
        });
    });
    req.write(data);
    req.end();
    });

    let result = await reqPromise
    return result
}

function extractAndConcatenateContent(dataString: string): string {
    let concatenatedContent = '';

    const dataStrings = dataString.split('\n');

    for (const dataStr of dataStrings) {
        if (dataStr.trim() !== '' && dataStr.startsWith('data:')) {
            const jsonStr = dataStr.slice(5); // remove 'data:' prefix
            const dataObject = JSON.parse(jsonStr);
            const content = dataObject.choices[0]?.delta?.content || '';
            concatenatedContent += content;
        }
    }

    return concatenatedContent;
}
