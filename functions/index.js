const {setGlobalOptions} = require("firebase-functions/v2");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_CHAT_MESSAGE_LENGTH = 1000;

setGlobalOptions({
  region: "asia-southeast1",
  maxInstances: 10,
});

exports.chatGuide = onCall(
  {
    secrets: [GEMINI_API_KEY],
    timeoutSeconds: 60,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Ban can dang nhap de dung guide."
      );
    }

    const message = String(request.data?.message || "").trim();
    const currentScene = sanitizeScene(request.data?.currentScene);
    const progress = sanitizeProgress(request.data?.progress);

    if (!message) {
      throw new HttpsError("invalid-argument", "Tin nhan khong duoc de trong.");
    }

    if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
      throw new HttpsError(
        "invalid-argument",
        `Tin nhan khong duoc qua ${MAX_CHAT_MESSAGE_LENGTH} ky tu.`
      );
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "x-goog-api-key": GEMINI_API_KEY.value(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: [
                    "Ban la chatbot guide cho VKU 360 Quest.",
                    "Tra loi bang tieng Viet, ngan gon, ro rang, than thien.",
                    "Huong dan nguoi dung kham pha campus VKU theo khu V va khu K.",
                    "Chi dua thong tin dua tren ngu canh duoc cung cap.",
                    "Neu khong co du lieu, hay noi rang ban chua co thong tin do.",
                  ].join(" "),
                },
              ],
            },
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: JSON.stringify({
                      question: message,
                      currentScene,
                      progress,
                    }),
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 500,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Gemini API error", {
          status: response.status,
          body: errorText.slice(0, 1000),
        });
        throw new HttpsError("internal", "Gemini hien chua phan hoi duoc.");
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

      return {
        reply: reply || "Minh chua co cau tra loi phu hop.",
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("chatGuide failed", error);
      throw new HttpsError("internal", "Guide hien chua san sang.");
    }
  }
);

function sanitizeScene(scene) {
  if (!scene || typeof scene !== "object") return null;

  return {
    id: stringOrEmpty(scene.id),
    zone: stringOrEmpty(scene.zone),
    zoneName: stringOrEmpty(scene.zoneName),
    title: stringOrEmpty(scene.title),
    shortTitle: stringOrEmpty(scene.shortTitle),
    chapter: stringOrEmpty(scene.chapter),
    body: stringOrEmpty(scene.body).slice(0, 700),
    mission: stringOrEmpty(scene.mission).slice(0, 300),
    notes: Array.isArray(scene.notes)
      ? scene.notes.slice(0, 4).map((note) => stringOrEmpty(note).slice(0, 220))
      : [],
  };
}

function sanitizeProgress(progress) {
  if (!progress || typeof progress !== "object") return null;

  return {
    currentStep: Number.isFinite(Number(progress.currentStep))
      ? Number(progress.currentStep)
      : 0,
    unlockedStep: Number.isFinite(Number(progress.unlockedStep))
      ? Number(progress.unlockedStep)
      : 0,
  };
}

function stringOrEmpty(value) {
  return typeof value === "string" ? value : "";
}
