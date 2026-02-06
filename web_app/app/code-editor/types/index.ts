// Types for the Coding Workspace

export type ProgrammingLanguage = 'java' | 'cpp' | 'python';

export type TestCaseStatus = 'untested' | 'pass' | 'fail' | 'error';

export type SubmissionStatus =
  | 'idle'
  | 'queued'
  | 'processing'
  | 'accepted'
  | 'wrong_answer'
  | 'tle'
  | 'runtime_error'
  | 'compilation_error';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  status: TestCaseStatus;
  executionTime?: number;
  memoryUsed?: number;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  timeLimit: number; // in seconds
  memoryLimit: number; // in MB
}

export interface Submission {
  id: string;
  language: ProgrammingLanguage;
  code: string;
  status: SubmissionStatus;
  timestamp: Date;
  executionTime?: number;
  memoryUsed?: number;
  passedTestCases?: number;
  totalTestCases?: number;
}

export interface EditorState {
  code: string;
  language: ProgrammingLanguage;
  fontSize: number;
  theme: 'vs-dark' | 'vs-light';
}

export interface ConsoleTab {
  id: string;
  label: string;
  type: 'testcase' | 'custom' | 'output';
}

export const BOILERPLATE_CODE: Record<ProgrammingLanguage, string> = {
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        // Read input
        int n = scanner.nextInt();
        
        // Your solution here
        
        // Output result
        System.out.println(n);
        
        scanner.close();
    }
}`,
  cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n;
    cin >> n;
    
    // Your solution here
    
    cout << n << endl;
    
    return 0;
}`,
  python: `# Read input
n = int(input())

# Your solution here

# Output result
print(n)
`,
};

export const LANGUAGE_CONFIG: Record<ProgrammingLanguage, { 
  label: string; monacoLanguage: string; extension: string 
}> = {
  java: { label: 'Java', monacoLanguage: 'java', extension: '.java' },
  cpp: { label: 'C++', monacoLanguage: 'cpp', extension: '.cpp' },
  python: { label: 'Python', monacoLanguage: 'python', extension: '.py' },
};
