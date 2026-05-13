import type {
  TeacherAnswerRow,
  TeacherChatMessage,
  TeacherPromptRow,
  TeacherSessionInfo,
} from "@/components/teacher-live-view";

const session: TeacherSessionInfo = {
  session_id: 1,
  title: "Intro to Photosynthesis — Period 3",
  description: "Warm-up, check for understanding, then a quick reflection.",
  join_code: "SUN-04",
};

const prompts: TeacherPromptRow[] = [
  {
    prompt_id: 1,
    slide_index: 0,
    kind: "slide",
    content: {
      imageUrl: undefined,
      page: 1,
    },
    is_open: false,
    released: true,
  },
  {
    prompt_id: 2,
    slide_index: 1,
    kind: "mcq",
    content: {
      question: "Which pigment captures light energy for photosynthesis?",
      options: ["Keratin", "Chlorophyll", "Hemoglobin", "Melanin"],
      correctIndex: 1,
    },
    is_open: false,
    released: false,
  },
  {
    prompt_id: 3,
    slide_index: 2,
    kind: "short_text",
    content: {
      prompt: "In one sentence, why do leaves look green?",
      charLimit: 140,
    },
    is_open: false,
    released: false,
  },
];

const answers: TeacherAnswerRow[] = [
  {
    answer_id: 1,
    user_id: "student-a",
    prompt_id: 2,
    choice_index: 1,
    text_answer: null,
    created_at: "2025-04-20T14:02:11.000Z",
    display_name: "Maya",
  },
  {
    answer_id: 2,
    user_id: "student-b",
    prompt_id: 2,
    choice_index: 1,
    text_answer: null,
    created_at: "2025-04-20T14:02:14.000Z",
    display_name: "Devon",
  },
  {
    answer_id: 3,
    user_id: "student-c",
    prompt_id: 2,
    choice_index: 3,
    text_answer: null,
    created_at: "2025-04-20T14:02:17.000Z",
    display_name: "Priya",
  },
];

const messages: TeacherChatMessage[] = [
  {
    message_id: 1,
    body: "wait is it A or B lol",
    user_id: "student-b",
    display_name: "Devon",
    avatar: null,
    created_at: "2025-04-20T14:02:08.000Z",
  },
  {
    message_id: 2,
    body: "chlorophyll for sure — absorbs red and blue light",
    user_id: "student-a",
    display_name: "Maya",
    avatar: null,
    created_at: "2025-04-20T14:02:19.000Z",
  },
];

export const landingDemo = {
  session,
  prompts,
  answers,
  messages,
};
