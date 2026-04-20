import {
  UsersIcon,
  BookOpenIcon,
  ClipboardIcon,
  FileCodeIcon,
  CheckCircleIcon,
  BarChartIcon,
  ChatBubbleLeftIcon,
} from "@/components/svg-icons"
import {
  PYTHON_CODE_IMG,
  JAVASCRIPT_CODE_IMG,
  JAVA_CODE_IMG,
  SQL_CODE_IMG,
  // C_CODE_IMG,
} from "@/assets/images"

export const heroStats = [
  { number: "4+", label: "Languages" },
  { number: "∞", label: "Exercises" },
  { number: "24/7", label: "Support" },
]

export const features = [
  {
    icon: UsersIcon,
    title: "Classroom management",
    description:
      "Lecturers can easily create and manage classrooms and add students to classes. Detailed content will be added later.",
  },
  {
    icon: BookOpenIcon,
    title: "Learning materials",
    description:
      "Share documents, lecture slides, and learning resources with students. Detailed content will be added later.",
  },
  {
    icon: ChatBubbleLeftIcon,
    title: "Discussion forum",
    description:
      "Students and lecturers can discuss and ask questions about the course. Detailed content will be added later.",
  },
  {
    icon: FileCodeIcon,
    title: "Online submission",
    description:
      "Students submit code assignments directly on the system. Detailed content will be added later.",
  },
  {
    icon: CheckCircleIcon,
    title: "Automatic grading",
    description:
      "The system automatically checks and grades student assignments. Detailed content will be added later.",
  },
  {
    icon: BarChartIcon,
    title: "Progress tracking",
    description:
      "Lecturers track each student's learning progress. Detailed content will be added later.",
  },
]

export const communityStats = [
  { number: "0", label: "Active students", sublabel: "Loading..." },
  { number: "0", label: "Lecturers", sublabel: "Loading..." },
  { number: "0", label: "Classrooms", sublabel: "Loading..." },
]

export const programmingLanguages = [
  {
    img: PYTHON_CODE_IMG,
    title: "Python programming",
    desc: "Learn Python through hands-on exercises on data structures, algorithms, and real-world applications. Detailed content will be added later.",
    badge: "Python",
  },
  {
    img: JAVASCRIPT_CODE_IMG,
    title: "JavaScript",
    desc: "Master JavaScript with interactive exercises on ES6+, asynchronous programming, and DOM manipulation. Detailed content will be added later.",
    badge: "JavaScript",
  },
  {
    img: JAVA_CODE_IMG,
    title: "Java programming",
    desc: "Learn Java with exercises on OOP, data structures, and enterprise application development. Detailed content will be added later.",
    badge: "Java",
  },
  // {
  //   img: SQL_CODE_IMG,
  //   title: "SQL & Databases",
  //   desc: "Practice SQL queries, database design, and work effectively with relational databases. Detailed content will be added later.",
  //   badge: "SQL",
  // },
  {
    img: SQL_CODE_IMG,
    title: "C/C++ programming",
    desc: "Learn C/C++ with exercises on data structures, algorithms, and real-world applications. Detailed content will be added later.",
    badge: "C/C++",
  },
  {
    img: SQL_CODE_IMG,
    title: "TypeScript programming",
    desc: "Learn TypeScript with exercises on data structures, algorithms, and real-world applications. Detailed content will be added later.",
    badge: "TypeScript",
  },
  {
    img: SQL_CODE_IMG,
    title: "C# programming",
    desc: "Learn C# with exercises on data structures, algorithms, and real-world applications. Detailed content will be added later.",
    badge: "C#",
  }
]
