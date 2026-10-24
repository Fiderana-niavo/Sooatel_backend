import { ChatOpenAI } from "@langchain/openai";

export function getLlm(temperature = 0): ChatOpenAI {
  return new ChatOpenAI({
    model: "deepseek-chat",
    apiKey: process.env["DEEPSEEK_KEY"] as string,
    temperature,
    configuration: { baseURL: "https://api.deepseek.com" },
  });
}
