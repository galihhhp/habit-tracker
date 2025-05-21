import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const aiService = {
  async getHabitDescription(name: string): Promise<string> {
    const prompt = `Given this habit name: "${name}", provide a clear and concise description explaining what activities or actions are involved in practicing this habit on a regular basis. The description MUST be under 250 characters.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful habit coach that provides clear, practical descriptions of habit activities in less than 250 characters.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const description = response.choices[0].message.content || "";

    return description.length > 250
      ? description.substring(0, 247) + "..."
      : description;
  },

  async getHabitPredictions(
    name: string,
    description: string | undefined,
    targetDays: number
  ): Promise<{
    milestones: Array<{
      period: string;
      prediction: string;
    }>;
    targetPrediction: string;
  }> {
    const prompt = `Given this habit:
Name: "${name}"
Description: "${description || "No description provided"}"
Target Days: ${targetDays}

For each time period (1 month, 3 months, 6 months, 9 months, 1 year) and the final target, provide ONE descriptive sentence that captures what they'll experience, improvements they'll see, challenges they might face, and tips to overcome them.

IMPORTANT: Your response must be a valid JSON object with this exact structure and no additional text:
{
  "milestones": [
    {
      "period": "1 month",
      "prediction": "One descriptive sentence about their first month journey"
    },
    {
      "period": "3 months",
      "prediction": "One descriptive sentence about their three months journey"
    },
    {
      "period": "6 months",
      "prediction": "One descriptive sentence about their six months journey"
    },
    {
      "period": "9 months",
      "prediction": "One descriptive sentence about their nine months journey"
    },
    {
      "period": "1 year",
      "prediction": "One descriptive sentence about their one year journey"
    }
  ],
  "targetPrediction": "One descriptive sentence about what they'll achieve after completing all target days"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert habit coach and personal development specialist. 
Your predictions should be:
- Deeply personalized based on the habit type
- Scientifically grounded where applicable
- Focused on both immediate and long-term benefits
- Include practical advice and actionable steps
- Address potential obstacles and solutions
- Connect the habit to broader life improvements

IMPORTANT: Your response must be a valid JSON object with no additional text or formatting.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });

    const content = response.choices[0].message.content || "";
    try {
      const parsed = JSON.parse(content);

      if (
        !parsed.milestones ||
        !Array.isArray(parsed.milestones) ||
        !parsed.targetPrediction
      ) {
        throw new Error("Invalid prediction structure");
      }

      parsed.milestones = parsed.milestones.map((milestone: any) => ({
        period: milestone.period,
        prediction: milestone.prediction || "",
      }));

      return {
        milestones: parsed.milestones,
        targetPrediction: parsed.targetPrediction || "",
      };
    } catch (error) {
      console.log(error);
      throw new Error("Invalid AI response format");
    }
  },
};
