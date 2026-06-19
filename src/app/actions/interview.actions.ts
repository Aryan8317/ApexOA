"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateMockInterview({
  jobPosition,
  jobDesc,
  jobExperience,
  interviewType = "dsa",
  questionCount = 5
}: {
  jobPosition: string;
  jobDesc: string;
  jobExperience: number;
  interviewType?: string;
  questionCount?: number;
}) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      throw new Error("Unauthorized access");
    }
    const userId = session.user.id;

    const isMCQ = interviewType === "mcq" || interviewType.includes("mcq");

    let typeFocusDescription = "";
    if (interviewType.startsWith("dsa")) {
      typeFocusDescription = `Data Structures & Algorithms. Focus ONLY on: ${jobDesc}.`;
    } else if (interviewType.startsWith("system_design")) {
      typeFocusDescription = `System Design. Focus ONLY on: ${jobDesc}.`;
    } else if (interviewType.startsWith("behavioral")) {
      typeFocusDescription = `Behavioral & Leadership. Focus ONLY on: ${jobDesc}.`;
    } else {
      typeFocusDescription = `Computer Science Core Fundamentals. Focus ONLY on: ${jobDesc}.`;
    }

    if (isMCQ) {
      typeFocusDescription += " generated as Multiple Choice Questions (with exactly 4 options labeled A), B), C), D))";
    }

    const prompt = `
      Act as an expert technical interviewer.
      Based on the following job details, generate exactly ${questionCount} interview questions and their ideal answers.
      Interview Type Focus: ${typeFocusDescription}
      Job Position: ${jobPosition}
      Job Description: ${jobDesc}
      Years of Experience: ${jobExperience}
      
      CRITICAL TOPIC CONSTRAINT:
      You MUST ONLY ask questions directly and explicitly related to the topics listed in the Job Description: "${jobDesc}". 
      Do NOT ask any questions about topics that are not in this list. For example, if "Computer Networks" or "ACID Transactions" is NOT in the list, you must not ask anything about them.
      
      ${isMCQ ? `
      CRITICAL INSTRUCTION FOR MCQ:
      Each question MUST be a multiple-choice question with exactly 4 options labeled A), B), C), D).
      Format the "question" key to contain the main question text, followed by a newline, and then the four choices on separate newlines.
      Format each option inline on a single line (e.g., "A) Option text"). Do NOT put a newline after the option letter (e.g., do NOT write "A)\\nOption text").
      Example format for "question":
      "What is the output of typeof null in JavaScript?\nA) \"object\"\nB) \"null\"\nC) \"undefined\"\nD) \"function\""
      Format the "correctAnswer" key to contain only the correct option label and its value (e.g. "A) \"object\"").
      ` : ""}
      
      CRITICAL INSTRUCTION: Return the response STRICTLY as a minified JSON array without any markdown formatting or code blocks. The JSON array should contain objects with the following keys: "question" and "correctAnswer".
      Example format:
      [{"question":"...","correctAnswer":"..."},{"question":"...","correctAnswer":"..."}]
    `;

    let result;
    try {
      // Primary model: gemini-2.5-flash (fast and fully featured)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      result = await model.generateContent(prompt);
    } catch (modelError) {
      console.warn("gemini-2.5-flash failed, falling back to gemini-flash-latest", modelError);
      const modelFlash = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      result = await modelFlash.generateContent(prompt);
    }

    const textResponse = result.response.text();
    
    // Robust extraction of JSON array
    let parsedMockResp;
    try {
      const start = textResponse.indexOf("[");
      const end = textResponse.lastIndexOf("]");
      if (start === -1 || end === -1 || end < start) {
        throw new Error("No JSON array found in response");
      }
      parsedMockResp = JSON.parse(textResponse.substring(start, end + 1));
    } catch (e) {
      console.warn("Robust JSON array parse failed, trying direct regex cleanup:", e);
      let cleanText = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedMockResp = JSON.parse(cleanText);
    }

    const interview = await db.interview.create({
      data: {
        userId,
        jobPosition,
        jobDesc: `[Type: ${interviewType}] ${jobDesc}`,
        jobExperience,
        jsonMockResp: parsedMockResp,
      }
    });

    return { success: true, interviewId: interview.id };
  } catch (error) {
    console.error("Error generating mock interview:", error);
    return { success: false, error: "Failed to generate mock interview" };
  }
}

export async function evaluateUserAnswer({
  interviewId,
  question,
  correctAnswer,
  userAnswer
}: {
  interviewId: string;
  question: string;
  correctAnswer: string;
  userAnswer: string;
}) {
  try {
    const interview = await db.interview.findUnique({
      where: { id: interviewId }
    });
    const isMCQ = interview?.jobDesc.match(/\[Type:\s*[^\]]*mcq[^\]]*\]/) !== null;

    const prompt = `
      Act as an expert technical interviewer evaluating a candidate's answer.
      Question: ${question}
      Ideal Correct Answer: ${correctAnswer}
      Candidate's Answer: ${userAnswer}
      
      Evaluate the candidate's answer for technical accuracy and completeness compared to the ideal answer.
      
      ${isMCQ ? `
      CRITICAL INSTRUCTION FOR MCQ:
      This is a multiple-choice question (MCQ). The candidate's answer must match the correct option.
      - If the candidate's answer matches the correct option (e.g., they chose the correct letter/content), you MUST give a rating of 10.
      - If the candidate's answer is incorrect, wrong, blank, or matches a wrong option, you MUST give a rating of 1.
      - Do not give partial credit (like 4 or 5) for selecting a wrong choice. It is binary (either 10 for correct or 1 for incorrect).
      ` : `
      RATING SCALE (Strictly enforce this):
      - 1: Blank, empty, extremely short (fewer than 5 words), gibberish, off-topic, or indicates they do not know (e.g., "skip", "idk", "dont know", "no idea", "asdf").
      - 2-3: Extremely poor attempt. The answer is incorrect or barely touches on the question with no actual solution or logic.
      - 4-5: Partial attempt. The candidate has some basic concepts right but the answer is highly incomplete, has major technical errors, or misses the core requirement.
      - 6-7: Decent attempt. The candidate answers the question correctly but lacks depth, ignores key constraints, or misses edge cases/optimization.
      - 8-9: Strong answer. Accurate, comprehensive, covers edge cases and tradeoffs.
      - 10: Perfect answer. Complete, precise, optimal, and covers all constraints and tradeoffs.
      `}

      CRITICAL INSTRUCTION:
      1. You must be completely honest, objective, and realistic. Do not sugarcoat or praise a candidate who has not answered or has answered incorrectly.
      2. Return the response STRICTLY as a JSON object without any markdown formatting or code blocks.
      3. The JSON object must contain the following keys:
         - "rating": number (1-10) based on the criteria above.
         - "feedback": string (3-4 sentences of constructive and honest critique. If the answer is poor, explain clearly what is missing and what they should study).

      Example format:
      {"rating": 1, "feedback": "The candidate did not attempt the question or provided a blank answer. To improve, they need to study..."}
    `;

    let result;
    try {
      // Primary model: gemini-2.5-flash
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      result = await model.generateContent(prompt);
    } catch (modelError) {
      console.warn("gemini-2.5-flash evaluation failed, falling back to gemini-flash-latest", modelError);
      const modelFlash = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      result = await modelFlash.generateContent(prompt);
    }

    const textResponse = result.response.text();
    
    // Robust extraction of JSON object
    let parsedCritique;
    try {
      const start = textResponse.indexOf("{");
      const end = textResponse.lastIndexOf("}");
      if (start === -1 || end === -1 || end < start) {
        throw new Error("No JSON object found in response");
      }
      parsedCritique = JSON.parse(textResponse.substring(start, end + 1));
    } catch (e) {
      console.warn("Robust JSON object parse failed, trying direct regex cleanup:", e);
      let cleanText = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedCritique = JSON.parse(cleanText);
    }

    const answerRecord = await db.userAnswer.create({
      data: {
        interviewId,
        question,
        correctAnswer,
        userAnswer,
        feedback: parsedCritique.feedback,
        rating: parsedCritique.rating,
      }
    });

    return { success: true, feedback: parsedCritique };
  } catch (error) {
    console.error("Error evaluating user answer:", error);
    return { success: false, error: "Failed to evaluate answer" };
  }
}
