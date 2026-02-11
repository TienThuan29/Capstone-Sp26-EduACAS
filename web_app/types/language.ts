export interface Compiler {
  id: string;
  name: string;
  group: string;
  stdVersions: string[];
}

export interface ProgrammingLanguage {
  id: string;
  name: string;
  monaco: string;
  extensions: string[];
  logoFileUrl: string;
  formatter: string;
  digitSeparator: string;
  compilers: Compiler[];
  status: string;
  createdDate: Date;
  updatedDate: Date;
}
