export interface AnthropicToolProperty {
  type: string;
  description: string;
  enum?: string[];
}

export interface AnthropicToolInputSchema {
  type: 'object';
  properties: Record<string, AnthropicToolProperty>;
  required: string[];
}

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: AnthropicToolInputSchema;
}

export interface ToolsOutput {
  tools: AnthropicTool[];
}
