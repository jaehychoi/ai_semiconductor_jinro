import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ReadingMaterial, ValueChainStep } from "../types";
import { VALUE_CHAIN_CONTEXT } from "../constants";

// (기존) process.env는 서버에서만 작동합니다.
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// (수정) Vite에서는 이렇게 써야 브라우저에 키가 심어집니다.
const apiKey = import.meta.env.VITE_API_KEY; 

// 혹시 모를 에러 방지를 위해 키가 없을 때의 대비책도 넣어둡니다.
if (!apiKey) {
  console.error("API Key가 설정되지 않았습니다. .env 파일을 확인해주세요.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

const modelName = 'gemini-2.5-flash';

export const getCareerRecommendations = async (subjects: string[]): Promise<string> => {
  try {
    const prompt = `학생이 대학에서 듣고 싶어하는 전공 수업 목록입니다: ${subjects.join(', ')}. 
    이 수업들을 바탕으로 분석하여 다음을 추천해주세요:
    1) 잘 어울리는 학과 3개
    2) 관련된 구체적인 직업 5개
    
    [출력 형식]
    - 친절하고 격려하는 어조의 줄글 목록 형식으로 작성해주세요.
    - 마크다운 표(Table)는 절대 사용하지 마세요.
    - 반드시 한국어로 답변해주세요.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: "당신은 고등학생을 위한 친절하고 박식한 진로 상담 전문가입니다. 한국어로 답변하세요."
      }
    });

    return response.text || "죄송합니다. 지금은 추천을 생성할 수 없습니다.";
  } catch (error) {
    console.error("Gemini Career Rec Error:", error);
    return "추천을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.";
  }
};

export const recommendAndGenerateMaterials = async (
  job: string, 
  thought: string, 
  existingMaterials: ReadingMaterial[]
): Promise<{ recommended: ReadingMaterial[], generated: ReadingMaterial | null }> => {
  
  // 1. Prepare existing material metadata for the prompt
  const existingMetadata = existingMaterials.map(m => ({
    id: m.id,
    title: m.title,
    tags: [...m.majors, ...m.keywords].join(', ')
  }));

  const prompt = `
    사용자 직업(진로): ${job}
    사용자의 생각(연결고리): ${thought}
    
    작업(Task):
    1. 사용자의 직업과 생각을 분석하세요.
    2. 제공된 '기존 자료(Existing Materials)' 중 이 직업과 가장 관련성 높은 ID를 최대 2개 선택하세요.
    3. '${job}'과 AI/반도체 산업을 연결하는 맞춤형 읽기 자료(심층 리포트)를 하나 새로 생성하세요.
       - 가장 관련 있는 가치사슬 단계(step1 ~ step6)를 하나 선택하세요.
       - 반드시 한국어로 작성하세요.
       - 생성된 자료(content)는 반드시 아래 형식을 정확히 따라야 합니다.

    [생성 자료 형식 가이드 (Strict Template)]
    
    ## [심층 리포트] {전체를 관통하는 호기심 자극 질문 1문장}

    ### 1. 배경 탐구: {소제목 1줄}
    {배경 설명 2-3줄}

    ### 2. 다각적 분석: {소제목 1줄}

    **(1) 사회(Social): {소제목 1줄}**
    {설명 2-3줄}

    **(2) 경제(Economic): {소제목 1줄}**
    {설명 2-3줄}

    **(3) 환경(Environment): {소제목 1줄}**
    {설명 2-3줄}

    ### 3. 진로 인사이트: 내 생각 업그레이드하기 (Career Upgrade)
    **(지시사항: 독자가 이 글을 읽기 전에 작성했던 '자신의 진로와 AI-반도체의 연관성' 내용을, 본문의 구체적 사례를 통해 더 넓고 깊게 '확장'하도록 유도하는 질문입니다.)**

    **Q1. [시각의 확장] 내가 놓치고 있던 연결고리는 무엇인가?**
    - (질문 가이드: "글을 읽기 전, 당신이 생각했던 진로와 기술의 연관성은 무엇이었나요? 본문의 **{본문 내용 핵심 요약}** 사례를 접한 후, 그 생각에 **새롭게 추가하거나 수정해야 할 부분**은 무엇인지 구체적으로 서술해보세요.")

    **Q2. [문제 해결 적용] 내 직업의 난제를 이 기술로 해결한다면?**
    - (질문 가이드: "당신의 희망 직업(${job})에서 겪을 수 있는 가장 골치 아픈 문제를 하나 떠올려보세요. 오늘 읽은 **{본문 기술/솔루션 핵심 요약}**을 **'도구'로 활용하여 그 문제를 해결하는 시나리오**를 챗봇에게 제안해보세요.")


    기존 자료(Existing Materials):
    ${JSON.stringify(existingMetadata)}
  `;

  // Define Schema for structured output
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      recommendedIds: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "IDs of the existing materials that fit best."
      },
      generatedMaterial: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          valueChain: { type: Type.STRING, description: "One of: step1, step2, step3, step4, step5, step6" },
          content: { type: Type.STRING, description: "Markdown content in Korean following the strict template." },
          majors: { type: Type.ARRAY, items: { type: Type.STRING } },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "valueChain", "content", "majors", "keywords"]
      }
    },
    required: ["recommendedIds", "generatedMaterial"]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "당신은 교육 콘텐츠 크리에이터입니다. 일상적인 직업을 첨단 기술 산업(AI/반도체)과 연결하는 역할을 합니다. 모든 출력은 한국어여야 합니다."
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    // Filter existing
    const recommended = existingMaterials.filter(m => result.recommendedIds?.includes(m.id));
    
    // Format generated
    let generated: ReadingMaterial | null = null;
    if (result.generatedMaterial) {
      generated = {
        id: `gen_${Date.now()}`,
        ...result.generatedMaterial,
        isGenerated: true
      };
    }

    return { recommended, generated };

  } catch (error) {
    console.error("Gemini Material Gen Error:", error);
    return { recommended: [], generated: null };
  }
};

export const chatWithMentor = async (
  history: { role: string, text: string }[], 
  job: string, 
  material: ReadingMaterial
): Promise<string> => {
  const stepInfo = VALUE_CHAIN_CONTEXT.find(s => s.id === material.valueChain);
  
  const systemInstruction = `
    당신은 친절한 AI 진로 멘토입니다. 소크라테스 문답법을 사용합니다.
    학생의 희망 직업: ${job}
    현재 읽고 있는 자료: "${material.title}" (관련 단계: ${stepInfo?.label || '알 수 없음'})
    
    [목표]
    학생이 자신의 직업이 이 AI/반도체 이슈와 어떻게 연결되는지 스스로 깨닫게 돕습니다.

    [원칙]
    1. **절대 정답을 바로 알려주지 마세요.** 처음 2~3턴은 질문을 통해 힌트만 제공하세요.
    2. 학생이 스스로 생각할 수 있도록 유도 질문(Leading Question)을 던지세요.
    3. ${job}의 실제 업무 상황을 예시로 들어 질문하면 좋습니다.
    4. 학생이 답변을 힘들어하면, 구체적인 상황(Scenario)을 제시하고 "이럴 땐 어떻게 할 것 같나요?"라고 물어보세요.
    5. 말투는 친절하고 격려하는 어조여야 합니다.
    6. 반드시 한국어로 대화하세요.
  `;

  try {
    // Convert history to Gemini format
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: { systemInstruction }
    });

    return response.text || "지금은 생각이 잘 나지 않네요. 다시 한번 말씀해 주시겠어요?";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "통신 오류가 발생했습니다. 연결 상태를 확인해주세요.";
  }
};

export const generateEsgFeedback = async (
  job: string, 
  materialTitle: string, 
  thoughts: { env: string, soc: string, eco: string },
  history: { role: string, text: string }[]
): Promise<string> => {
  const systemInstruction = `
    당신은 통찰력 있는 ESG 컨설턴트입니다.
    대상: 학생 (희망 직업: ${job})
    맥락: "${materialTitle}" 이슈와 관련된 ${job} 관점의 ESG 아이디어를 논의 중입니다.
    
    학생의 초기 아이디어: 
    - 환경(Env): ${thoughts.env}
    - 사회(Soc): ${thoughts.soc}
    - 경제/제도(Eco): ${thoughts.eco}

    [원칙 - 중요]
    1. **답변 길이는 500자 이내로 제한합니다.** (핵심만 간결하게)
    2. 불필요한 인사말이나 서론을 생략하고, 바로 피드백과 질문으로 들어가세요.
    3. 단순히 "좋아요"라고 칭찬만 하지 말고, **비판적 사고**를 유도하는 날카로운 질문을 하나 던지세요.
       (예: 현실적인 제약 조건, 예상되는 부작용, 기업의 이익과의 충돌 등)
    4. ${job} 직업의 특성을 고려하여 구체적인 피드백을 주세요.
    5. 정답을 주는 대신, 학생이 아이디어를 수정하고 보완하도록 유도하세요.
    6. 반드시 한국어로 답변하세요. 마크다운 표(Table)는 사용하지 마세요.
  `;

  try {
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: { systemInstruction }
    });

    return response.text || "ESG 아이디어에 대해 좀 더 이야기해 봅시다.";
  } catch (error) {
    return "피드백을 생성하는 중 오류가 발생했습니다.";
  }
};
