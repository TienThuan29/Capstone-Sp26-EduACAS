
export interface FormatCodeResponse {
    formatted: string;
    stderr?: string;
    code: number;
  }
  
  export interface FormatCodeParams {
    source: string;
    lang: string;
  }
  