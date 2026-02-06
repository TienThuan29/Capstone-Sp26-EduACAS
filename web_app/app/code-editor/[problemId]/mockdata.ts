import { Problem, TestCase } from "../types";

// Mock problem data - in production, this would come from an API
export const MOCK_PROBLEM: Problem = {
  id: "1",
  title: "Two Sum",
  difficulty: "Easy",
  description: `
## Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.

### Example 1:

\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
\`\`\`

**Explanation:** Because nums[0] + nums[1] == 9, we return [0, 1].

### Example 2:

\`\`\`
Input: nums = [3,2,4], target = 6
Output: [1,2]
\`\`\`

### Example 3:

\`\`\`
Input: nums = [3,3], target = 6
Output: [0,1]
\`\`\`

### Constraints:

- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- **Only one valid answer exists.**

### Input Format:

- First line: \`n\` - the number of elements
- Second line: \`n\` space-separated integers
- Third line: \`target\` - the target sum

### Output Format:

- Two space-separated integers - the indices of the two numbers
`,
  inputFormat:
    "First line: n\nSecond line: n space-separated integers\nThird line: target",
  outputFormat: "Two space-separated integers - the indices",
  constraints: "2 <= nums.length <= 10^4",
  examples: [
    {
      input: "4\n2 7 11 15\n9",
      output: "0 1",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    {
      input: "3\n3 2 4\n6",
      output: "1 2",
    },
  ],
  hints: [
    "Think about what you need to find for each element in the array.",
    "For each element x, you need to find another element that equals target - x.",
    "Consider using a hash map to store values you've seen before, along with their indices.",
  ],
  timeLimit: 2,
  memoryLimit: 256,
};

export const MOCK_TEST_CASES: TestCase[] = [
  {
    id: "1",
    input: "4\n2 7 11 15\n9",
    expectedOutput: "0 1",
    status: "untested",
  },
  {
    id: "2",
    input: "3\n3 2 4\n6",
    expectedOutput: "1 2",
    status: "untested",
  },
  {
    id: "3",
    input: "2\n3 3\n6",
    expectedOutput: "0 1",
    status: "untested",
  },
];


export const MOCK_PROBLEM_DESCRIPTION = `
## Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.

### Example 1:

\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
\`\`\`

**Explanation:** Because nums[0] + nums[1] == 9, we return [0, 1].

### Example 2:

\`\`\`
Input: nums = [3,2,4], target = 6
Output: [1,2]
\`\`\`

### Example 3:

\`\`\`
Input: nums = [3,3], target = 6
Output: [0,1]
\`\`\`

### Constraints:

- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- **Only one valid answer exists.**

### Input Format:

- First line: \`n\` - the number of elements
- Second line: \`n\` space-separated integers
- Third line: \`target\` - the target sum

### Output Format:

- Two space-separated integers - the indices of the two numbers
`;

export const MOCK_HINTS = [
  "Think about what you need to find for each element in the array.",
  "For each element x, you need to find another element that equals target - x.",
  "Consider using a hash map to store values you've seen before, along with their indices.",
  "A single pass through the array with a hash map lookup gives you O(n) time complexity.",
];
