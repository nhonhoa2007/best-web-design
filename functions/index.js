const {setGlobalOptions} = require("firebase-functions/v2");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const GEMINI_MODELS = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
const MAX_CHAT_MESSAGE_LENGTH = 1000;
const MAX_CHAT_HISTORY_MESSAGES = 12;
const MAX_CHAT_HISTORY_TEXT_LENGTH = 1200;
const CAMPUS_KNOWLEDGE = {
  sourcePolicy: "Dữ liệu bên dưới được tổng hợp từ các trang cơ cấu tổ chức và giới thiệu trên website chính thức vku.udn.vn. Chỉ trả lời dựa trên các mục này; nếu thiếu thông tin thì nói chưa có dữ liệu chính thức trong guide.",
  areas: [
    "VKU là Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn, Đại học Đà Nẵng; trụ sở tại 470 Trần Đại Nghĩa, phường Ngũ Hành Sơn, TP Đà Nẵng; điện thoại chung 0236.3.667.117; email chung info@vku.udn.vn.",
    "VKU đào tạo, nghiên cứu và chuyển giao trong các lĩnh vực công nghệ thông tin, truyền thông, kinh tế số và các lĩnh vực liên quan.",
    "Cơ sở vật chất chính gồm khu giảng đường, khu thực hành thí nghiệm, thư viện/trung tâm học liệu, trung tâm sinh viên, khu thể thao và ký túc xá.",
  ],
  units: [
    {
      name: "Phòng Đào tạo",
      function: "Tham mưu và giúp Hiệu trưởng tổ chức, quản lý toàn bộ hoạt động đào tạo của Nhà trường ở tất cả trình độ, hệ và loại hình đào tạo.",
      tasks: "Chiến lược đào tạo, văn bản quản lý đào tạo, chương trình/giáo trình, tuyển sinh, kế hoạch đào tạo, tổ chức đào tạo, quản lý quá trình và kết quả học tập, cấp phát văn bằng/chứng chỉ.",
      contact: "Phòng K.D1 - 103; điện thoại 0236.3.667.113; email daotao@vku.udn.vn.",
      source: "https://vku.udn.vn/vi/co-cau-to-chuc/phong-dao-tao/",
    },
    {
      name: "Phòng Công tác sinh viên",
      function: "Tham mưu, giúp Hiệu trưởng quản lý và tổ chức công tác chính trị tư tưởng sinh viên; quản lý và thực hiện chế độ chính sách đối với sinh viên.",
      tasks: "Công tác chính trị tư tưởng sinh viên, quản lý chính sách sinh viên, hội đồng miễn giảm học phí, trợ cấp xã hội, học bổng khuyến khích học tập, khen thưởng/kỷ luật, điểm rèn luyện.",
      contact: "Điện thoại 0236.3.962.963; email congtacsinhvien@vku.udn.vn.",
      source: "https://vku.udn.vn/vi/co-cau-to-chuc/phong-cong-tac-sinh-vien/",
    },
    {
      name: "Phòng Tổ chức - Hành chính",
      function: "Tham mưu, giúp Hiệu trưởng quản lý tổ chức bộ máy, nhân sự, tiền lương, chế độ chính sách, bảo hiểm xã hội, tổng hợp báo cáo, thi đua khen thưởng, hành chính văn thư lưu trữ, lễ tân khánh tiết, y tế học đường, an ninh trật tự và cảnh quan môi trường.",
      tasks: "Tổ chức bộ máy/nhân sự/tiền lương, kế hoạch tổng hợp, đào tạo bồi dưỡng, thi đua khen thưởng, hành chính văn phòng, an ninh trật tự, y tế, an toàn lao động, phòng chống cháy nổ và vệ sinh môi trường.",
      contact: "Điện thoại 0236.3.667.117; email hanhchinh@vku.udn.vn.",
      source: "https://vku.udn.vn/co-cau-to-chuc/phong-to-chuc-hanh-chinh/",
    },
    {
      name: "Phòng Khoa học công nghệ - Hợp tác quốc tế",
      function: "Tham mưu và giúp Hiệu trưởng tổ chức, quản lý, xây dựng chiến lược phát triển các hoạt động nghiên cứu khoa học, chuyển giao công nghệ, hợp tác quốc tế và hợp tác nhà trường - doanh nghiệp trong lĩnh vực khoa học công nghệ.",
      tasks: "Công tác khoa học công nghệ, hợp tác quốc tế, thường trực Hội đồng Khoa học công nghệ.",
      contact: "Điện thoại 0236.3.962.972; email khcn_htqt@vku.udn.vn.",
      source: "https://vku.udn.vn/vi/co-cau-to-chuc/phong-khoa-hoc-cong-nghe-hop-tac-quoc-te/",
    },
    {
      name: "Phòng Khảo thí - Đảm bảo chất lượng giáo dục",
      function: "Guide hiện chỉ có dữ liệu liên hệ chính thức, chưa có mô tả chức năng/nhiệm vụ trong nguồn đã nạp.",
      tasks: "Nếu được hỏi về lịch thi, quy chế thi, phúc khảo hoặc đảm bảo chất lượng, hãy nói đây có thể là đầu mối liên hệ nhưng cần xác minh trên kênh chính thức vì guide chưa có mô tả chức năng đầy đủ.",
      contact: "Điện thoại 0236.3.962.368; email kt_dbcl@vku.udn.vn.",
      source: "https://vku.udn.vn/vi/co-cau-to-chuc/phong-khao-thi-dam-bao-chat-luong-giao-duc/",
    },
    {
      name: "Phòng Thanh tra - Pháp chế",
      function: "Tham mưu, giúp việc và chịu trách nhiệm trước Hiệu trưởng về thanh tra, kiểm tra, tiếp công dân, giải quyết khiếu nại/tố cáo, phòng chống tham nhũng và quản lý hoạt động pháp chế.",
      tasks: "Công tác thanh tra và công tác pháp chế.",
      contact: "Điện thoại 0236.3.962.529; email thanhtraphapche@vku.udn.vn.",
      source: "https://vku.udn.vn/vi/co-cau-to-chuc/phong-thanh-tra-phap-che/",
    },
    {
      name: "Phòng Cơ sở vật chất",
      function: "Tham mưu và tổ chức quản lý công sở, tài sản, quy hoạch, xây dựng và quản trị cơ sở vật chất; mua sắm, thanh lý và theo dõi sử dụng tài sản/trang thiết bị phục vụ nghiên cứu, giảng dạy, làm việc và học tập.",
      tasks: "Quản lý tài sản công, dự án đầu tư/xây dựng, hạ tầng cơ sở, điện/mạng/internet/điện thoại/cấp thoát nước, sửa chữa bảo dưỡng, an toàn lao động, PCCC, kiểm kê và thanh lý tài sản.",
      contact: "Điện thoại 0236.3.962.963; email csvc@vku.udn.vn.",
      source: "https://vku.udn.vn/vi/co-cau-to-chuc/phong-co-so-vat-chat/",
    },
    {
      name: "Phòng Kế hoạch - Tài chính",
      function: "Tham mưu và giúp Hiệu trưởng lập kế hoạch, quản lý tài chính, thanh quyết toán các nguồn kinh phí, hướng dẫn/kiểm tra hoạt động tài chính tại các đơn vị và tổng hợp báo cáo tài chính.",
      tasks: "Quản lý tài chính, giám sát thu chi, thanh quyết toán kinh phí, kiểm tra giám sát hoạt động tài chính tại các đơn vị trực thuộc.",
      contact: "Điện thoại 0236.3.667.114; email kehoachtaichinh@vku.udn.vn.",
      source: "https://vku.udn.vn/vi/co-cau-to-chuc/phong-ke-hoach-tai-chinh/",
    },
    {
      name: "Khoa Khoa học máy tính",
      function: "Tham mưu, giúp Hiệu trưởng đào tạo, bồi dưỡng, nghiên cứu khoa học, định hướng phát triển ngành/chuyên ngành của khoa và quản lý chuyên môn, giảng viên, sinh viên thuộc khoa.",
      tasks: "Chương trình đào tạo, kế hoạch giảng dạy, quản lý giảng viên, giáo trình/tài liệu, chất lượng đào tạo, nghiên cứu khoa học, cố vấn học tập, tư vấn/quản lý sinh viên, thực tập và đồ án/luận văn tốt nghiệp.",
      contact: "Phòng D304 - tầng 3, tòa D1, Khu K; điện thoại 0236.3.667.118; email cs@vku.udn.vn.",
      source: "https://vku.udn.vn/vi/co-cau-to-chuc/khoa-khoa-hoc-may-tinh/",
    },
    {
      name: "Khoa Kỹ thuật máy tính và Điện tử",
      function: "Tham mưu, giúp Hiệu trưởng đào tạo, bồi dưỡng, nghiên cứu khoa học, định hướng phát triển ngành/chuyên ngành của khoa và quản lý chuyên môn, giảng viên, sinh viên thuộc khoa.",
      tasks: "Chương trình đào tạo, kế hoạch giảng dạy, quản lý giảng viên, chất lượng đào tạo, nghiên cứu khoa học, cố vấn học tập, tư vấn/quản lý sinh viên, thực tập và đồ án/luận văn tốt nghiệp.",
      contact: "Tầng 3, tòa D1, Khu K; điện thoại 0236.3.667.117; email ce@vku.udn.vn.",
      source: "https://vku.udn.vn/vi/co-cau-to-chuc/khoa-ky-thuat-may-tinh-va-dien-tu/",
    },
    {
      name: "Khoa Kinh tế số và Thương mại điện tử",
      function: "Tham mưu, giúp Hiệu trưởng đào tạo, bồi dưỡng, nghiên cứu khoa học, định hướng phát triển ngành/chuyên ngành của khoa và quản lý chuyên môn, giảng viên, sinh viên thuộc khoa.",
      tasks: "Chương trình đào tạo, kế hoạch giảng dạy, phát triển ngành học/chương trình đào tạo và các hoạt động chuyên môn của khoa.",
      contact: "Phòng D204, D205, D206 - tầng 2, tòa D1, Khu K; điện thoại 0236.3.962.360; email de@vku.udn.vn.",
      source: "https://vku.udn.vn/vi/co-cau-to-chuc/khoa-kinh-te-so-va-thuong-mai-dien-tu/",
    },
    {
      name: "Trung tâm Học liệu và Truyền thông",
      function: "Tham mưu và giúp Hiệu trưởng quản lý, tổ chức công tác thông tin, thư viện hỗ trợ học tập, đào tạo, nghiên cứu khoa học; xây dựng kế hoạch truyền thông và quảng bá thương hiệu Nhà trường.",
      tasks: "Công tác học liệu, truyền thông và quảng bá học hiệu.",
      contact: "Điện thoại 0236.3.962.377; email lib@vku.udn.vn.",
      source: "https://vku.udn.vn/vi/co-cau-to-chuc/trung-tam-hoc-lieu-va-truyen-thong/",
    },
    {
      name: "Viện Khoa học và Công nghệ số",
      function: "Guide hiện chỉ có dữ liệu liên hệ chính thức, chưa có mô tả chức năng/nhiệm vụ trong nguồn đã nạp.",
      tasks: "Nếu người dùng hỏi chi tiết về chức năng của viện, hãy nói guide chưa có dữ liệu chính thức đầy đủ và gợi ý liên hệ viện.",
      contact: "Điện thoại 0236.3.667.127; email esti@vku.udn.vn.",
      source: "https://vku.udn.vn/vi/co-cau-to-chuc/vien-khoa-hoc-va-cong-nghe-so/",
    },
  ],
  answerRules: [
    "Hiểu TSV là tân sinh viên nếu người dùng dùng từ viết tắt này.",
    "Nếu người dùng hỏi phòng ban/khoa làm gì, hãy trả lời dựa trên trường function và tasks của đơn vị phù hợp.",
    "Nếu người dùng hỏi liên hệ, có thể trả lời contact nếu có trong dữ liệu.",
    "Nếu người dùng hỏi số phòng, lịch làm việc, biểu mẫu, quy định chi tiết hoặc thông tin không có trong units, phải nói mình chưa có dữ liệu chính thức trong guide và gợi ý kiểm tra website/kênh chính thức VKU hoặc liên hệ đơn vị.",
    "Không tự suy đoán thêm phòng ban, số phòng, số điện thoại, email, nhiệm vụ hay chính sách ngoài dữ liệu đã nạp.",
  ],
};

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
        "Bạn cần đăng nhập để dùng guide."
      );
    }

    const message = String(request.data?.message || "").trim();
    const language = stringOrEmpty(request.data?.language) || "vi";
    const history = sanitizeHistory(request.data?.history);
    const currentScene = sanitizeScene(request.data?.currentScene);
    const progress = sanitizeProgress(request.data?.progress);

    if (!message) {
      throw new HttpsError("invalid-argument", "Tin nhắn không được để trống.");
    }

    if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
      throw new HttpsError(
        "invalid-argument",
        `Tin nhắn không được quá ${MAX_CHAT_MESSAGE_LENGTH} ký tự.`
      );
    }

    try {
      for (const model of GEMINI_MODELS) {
        const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
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
                    "Tra loi gon trong toi da 4 cau va luon ket thuc bang mot cau hoan chinh; khong dung giua cau.",
                    "Bạn là chatbot guide cho VKU 360 Quest.",
                    "Trả lời theo language được cung cấp: vi thì tiếng Việt, en thì tiếng Anh.",
                    "Dùng tone vui vẻ, dễ thương, ấm áp như một người bạn đồng hành trong khuôn viên.",
                    "Dùng cách xưng hô mình-bạn, câu ngắn gọn, tự nhiên; có thể thêm các cụm nhẹ nhàng như 'nha', 'nè', 'xíu' khi phù hợp.",
                    "Giữ nội dung hữu ích và đúng ngữ cảnh; không nói quá dài, không dùng quá nhiều emoji.",
                    "Không dùng Markdown hoặc ký tự định dạng như **, *, _, #, danh sách gạch đầu dòng; chỉ trả về văn bản thuần để hiển thị trực tiếp trong khung chat.",
                    "Hướng dẫn người dùng khám phá campus VKU theo khu V và khu K.",
                    "Khi trả lời về Đại học Việt - Hàn, phòng ban, khoa, viện, trung tâm, thông tin liên hệ hoặc nhiệm vụ đơn vị, bắt buộc bám sát campusKnowledge.units.",
                    "Được trả lời các câu hỏi định hướng chung cho tân sinh viên dựa trên campusKnowledge, currentScene và progress được cung cấp, nhưng không được thêm thông tin ngoài nguồn.",
                    "Có thể dùng history để hiểu ngữ cảnh hội thoại trước đó, nhưng câu hỏi hiện tại vẫn là ưu tiên chính.",
                    "Ưu tiên giải thích phòng ban/khoa làm gì, sinh viên nên đến đâu để hỏi việc gì, và cách tiếp tục hành trình nếu có dữ liệu.",
                    "Nếu không có dữ liệu chính xác về số phòng, lịch làm việc, biểu mẫu hoặc quy định, hãy nói rõ mình chưa có thông tin chính thức đó và gợi ý kiểm tra kênh VKU.",
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
                      language,
                      history,
                      currentScene,
                      progress,
                      campusKnowledge: CAMPUS_KNOWLEDGE,
                    }),
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 900,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        const geminiError = parseGeminiError(errorText);
        logger.error("Gemini API error", {
          model,
          status: response.status,
          body: errorText.slice(0, 1000),
          geminiStatus: geminiError?.status || "",
        });
        if (shouldUseFallbackReply(response.status, geminiError)) {
          logger.warn("Trying next guide model", {
            model,
            status: response.status,
            geminiStatus: geminiError?.status || "",
          });
          continue;
        }
        throw new HttpsError("internal", "Gemini hiện chưa phản hồi được.");
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

      return {
        reply: reply || "Mình chưa tìm được câu trả lời hợp lý nè. Bạn thử hỏi về chặng hiện tại hoặc mở bản đồ giúp mình nha.",
      };
      }

      logger.warn("Using guide fallback reply after all Gemini models failed", {
        models: GEMINI_MODELS,
      });
      return {
        reply: buildFallbackReply({
          message,
          language,
          currentScene,
          progress,
        }),
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("chatGuide failed", error);
      return {
        reply: buildFallbackReply({
          message,
          language,
          currentScene,
          progress,
        }),
      };
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

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-MAX_CHAT_HISTORY_MESSAGES)
    .map((message) => {
      const role = message?.role === "user"
        ? "user"
        : message?.role === "assistant"
          ? "assistant"
          : "";

      return {
        role,
        text: stringOrEmpty(message?.text).slice(0, MAX_CHAT_HISTORY_TEXT_LENGTH),
      };
    })
    .filter((message) => message.role && message.text);
}

function stringOrEmpty(value) {
  return typeof value === "string" ? value : "";
}

function parseGeminiError(errorText) {
  try {
    return JSON.parse(errorText)?.error || null;
  } catch (error) {
    return null;
  }
}

function shouldUseFallbackReply(status, geminiError) {
  return (
    status === 429 ||
    status === 404 ||
    status >= 500 ||
    geminiError?.status === "NOT_FOUND" ||
    geminiError?.status === "RESOURCE_EXHAUSTED" ||
    geminiError?.status === "UNAVAILABLE"
  );
}

function buildFallbackReply({message, language, currentScene, progress}) {
  const isEnglish = language === "en";
  const normalizedQuestion = normalizeLookup(message);
  const sceneTitle = currentScene?.shortTitle || currentScene?.title || "";
  const stepText = progress?.currentStep !== undefined
    ? String(Number(progress.currentStep) + 1)
    : "";
  const matchedUnit = findCampusUnit(normalizedQuestion);

  if (matchedUnit) {
    if (isEnglish) {
      return [
        "I'm using the quick offline guide because Gemini quota is temporarily full.",
        `${matchedUnit.name}: ${matchedUnit.function}`,
        matchedUnit.contact ? `Contact: ${matchedUnit.contact}` : "",
      ].filter(Boolean).join(" ");
    }

    return [
      "Mình đang dùng chế độ trả lời nhanh vì Gemini tạm hết quota.",
      `${matchedUnit.name}: ${matchedUnit.function}`,
      matchedUnit.contact ? `Liên hệ: ${matchedUnit.contact}` : "",
    ].filter(Boolean).join(" ");
  }

  if (hasAny(normalizedQuestion, ["ho so", "profile", "avatar", "nickname", "ten", "tai khoan"])) {
    if (isEnglish) {
      return [
        "I'm using the quick offline guide because Gemini quota is temporarily full.",
        "If your profile looks incomplete, open Profile and check your display name/avatar while signed in with the right account.",
        "If you just updated it, refresh once so Firebase data can sync.",
      ].join(" ");
    }

    return [
      "Mình đang dùng chế độ trả lời nhanh vì Gemini tạm hết quota.",
      "Nếu hồ sơ bị thiếu, bạn mở mục Hồ sơ để kiểm tra tên hiển thị/avatar và chắc chắn đang đăng nhập đúng tài khoản.",
      "Nếu vừa cập nhật xong mà chưa thấy, tải lại trang một lần để dữ liệu Firebase đồng bộ nha.",
    ].join(" ");
  }

  if (hasAny(normalizedQuestion, ["ban do", "map", "lo trinh", "route", "di dau", "di tiep", "nhiem vu", "mission", "chang", "stop"])) {
    if (isEnglish) {
      return [
        "I'm using the quick offline guide because Gemini quota is temporarily full.",
        sceneTitle ? `You are at ${sceneTitle}.` : "Open Map 360 to see the current stop.",
        "Use Map for location, Route for the full checklist, or Next to continue.",
      ].join(" ");
    }

    return [
      "Mình đang dùng chế độ trả lời nhanh vì Gemini tạm hết quota.",
      sceneTitle ? `Bạn đang ở chặng ${sceneTitle}${stepText ? `, bước ${stepText}` : ""}.` : "Bạn mở Bản đồ 360 để xem chặng hiện tại nha.",
      "Dùng Bản đồ để xem vị trí, Lộ trình để xem danh sách chặng, hoặc Đi tiếp để hoàn thành chặng hiện tại.",
    ].join(" ");
  }

  if (isEnglish) {
    return [
      "I'm using the quick offline guide because Gemini quota is temporarily full.",
      sceneTitle ? `For now, continue from ${sceneTitle}.` : "For now, use Map 360 or Route to keep exploring.",
      "Ask about a department, profile, map, route, or current mission and I can still answer from the saved guide data.",
    ].join(" ");
  }

  return [
    "Mình đang dùng chế độ trả lời nhanh vì Gemini tạm hết quota.",
    sceneTitle ? `Tạm thời bạn cứ tiếp tục từ chặng ${sceneTitle} nha.` : "Bạn có thể dùng Bản đồ 360 hoặc Lộ trình để tiếp tục khám phá.",
    "Bạn hỏi về phòng ban, hồ sơ, bản đồ, lộ trình hoặc nhiệm vụ hiện tại thì mình vẫn trả lời được từ dữ liệu guide đã lưu.",
  ].join(" ");
}

function findCampusUnit(normalizedQuestion) {
  return CAMPUS_KNOWLEDGE.units.find((unit) => {
    const normalizedName = normalizeLookup(unit.name);
    const nameWords = normalizedName.split(" ").filter((word) => word.length > 2);
    return (
      normalizedQuestion.includes(normalizedName) ||
      nameWords.filter((word) => normalizedQuestion.includes(word)).length >= 2
    );
  });
}

function hasAny(value, keywords) {
  return keywords.some((keyword) => value.includes(keyword));
}

function normalizeLookup(value) {
  return stringOrEmpty(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}
