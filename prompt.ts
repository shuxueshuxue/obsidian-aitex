import { hasChineseCharacters } from "stringUtils"

export function generate_promt(origin_text: string, power=1){

    let language = "en"
    if (hasChineseCharacters(origin_text)){
        language = "zh"
    }

let English_passive = `For the text below, correct spelling errors and format formulas as per MathStackExchange conventions, using $:
"
${origin_text}
"
(NOTE: If no edits needed, return the text as is)`

let English_aggressive = `For the text below, find mathematics objects' text description(for example, "a 3x3 matrix") and replace them to their exact LaTex formulas. Wrap them by $ or $$ as per MathStackExchange conventions:
"
${origin_text}
" 
(NOTE: Reply only the replaced text)`

let Chinese_passive = `对于以下文本, 将出现的行内公式转化为 LaTex 并用 $ 包裹:
"
${origin_text}
"
(NOTE: 若不需要修改则原样返回)`

let Chinese_aggressive = `对于以下文本, 找出对数学对象的描述(例如"一个3x3矩阵")并替换成相应的 LaTex 公式, 用$(小公式)或$$(大公式)包裹:
"
${origin_text}
"
(NOTE: 仅回答替换后的文本)`

    let prompt = English_passive

    if (power == 2){
        if (language == "en"){
            prompt = English_passive
        }
        if (language == "zh"){
            prompt = Chinese_passive
        }
    }
    
    if (power >= 3){
        if (language == "en"){
            prompt = English_aggressive
        }
        if (language == "zh"){
            prompt = Chinese_aggressive
        }
    }

    return prompt
}
