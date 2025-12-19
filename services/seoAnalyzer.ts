
import { GoogleGenAI, Type } from "@google/genai";
import { SEOInput, SEOAnalysis, CheckResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const OUTLINE_CHECKLIST_PROMPT = `
PHẦN 2: DANH SÁCH KIỂM TRA TỐI ƯU DÀN Ý
1: MAIN CONTENT
- Main Content có trả lời trực tiếp search intent chính không?
- Nội dung có tập trung vào ngữ nghĩa vĩ mô (macro semantics) không?
- Có sử dụng Root Attributes để triển khai nội dung chính không?
- Các tiêu đề Heading có được viết theo định dạng câu hỏi không?
- Đã áp dụng đủ 4 loại câu hỏi: Boolean (Có/Không)?, Definition (định nghĩa)?, Grouping (danh sách)?, Comparison (so sánh)?
- Mỗi H2 có ghi chú về nội dung và thuộc tính chính không?
- Mỗi H3 có ghi chú về nội dung chi tiết không?
- Nội dung có đủ để trả lời đầy đủ search intent chính không?

2: CONTEXTUAL BORDER (Ranh giới ngữ cảnh)
- Đã xác định rõ điểm chuyển tiếp giữa Main và Supplementary Content?
- Ranh giới có đánh dấu sự chuyển từ trả lời trực tiếp sang mở rộng ngữ nghĩa không?
- Vị trí ranh giới có hợp lý không?

3: SUPPLEMENTARY CONTENT
- Supplementary Content có duy nhất 1 thẻ H2 không?
- Có tối đa 4 thẻ H3 không?
- Nội dung có đào sâu ngữ nghĩa vi mô (micro semantics) không?
- Đã sử dụng Unique Attributes và Rare Attributes để mở rộng/đào sâu?
- Trả lời các truy vấn phụ và sử dụng quan hệ từ vựng (antonyms)?
- Nội dung có bổ sung thông tin liên quan không được đề cập trong Main Content?
- Có tăng độ liên kết ngữ nghĩa với chủ đề chính không?
- Mỗi H3 có ghi chú về nội dung chi tiết không?

4: ĐỊNH DẠNG VÀ CẤU TRÚC
- Có tiêu đề H1 chính ở đầu outline?
- Có phân rõ 2 phần: ## MAIN CONTENT và ## SUPPLEMENTARY CONTENT?
- Cấu trúc phân cấp H2, H3 đúng? Không bị rút gọn?

5: CHẤT LƯỢNG TỔNG THỂ
- Logic, dễ theo dõi, liên kết chặt chẽ, thứ tự H2/H3 hợp lý?
- Thể hiện độ chuyên sâu, xây dựng thẩm quyền, cân bằng cơ bản/chuyên sâu?
- Phản ánh đúng search intent, giúp Google hiểu rõ nội dung, đủ ngữ nghĩa vĩ mô/vi mô?
`;

const WRITING_CHECKLIST_PROMPT = `
PHẦN 3: KIỂM TRA DANH SÁCH TỐI ƯU VIẾT
- Quy tắc: 40 word featured snippet, Answer Boolean Questions (lặp lại 3 lần theo yêu cầu), Answering Short vs Long Form, Author Rules, Avoid Analogies, Avoid Confusing Users or Bots, Avoid Copy Pasting Questions, Avoid Coreference Error, Avoid Entities Stuffing, Avoid Everyday Language (lặp lại 2 lần), Avoid Linking to Citations, Avoid Opinion, Avoid Product Promotion, Avoid Uncertain Words, Avoid Unnecessary Sentences, Be Certain, Be Specific, Bold the Answer Section, Choose Predicates Wisely, Citing Authoritative Sources, Consistent Declarations, Consistent Document Style, Consistent Part of Speech, Content Length Rules, Context Vector Hierarchy, Cut the Fluff, Discourse Integration Optimization, Enhance Paragraph Perspective, Entities not Keywords, Expand Evidence, Factual Sentence, Fewer Links, Give Examples After Plural Nouns, Google Fact Verification, Grammar & Spelling, How to Answer Type/Listing Questions, Importance of TOC, Key Term in Title & Heading, Long Form Answering, Maintain Context, Maintain Information Graph, Match Anchor Text, Match Tenses Modality, Mention Studies, More Information per Section, Optimize Content for NLP, Optimize Subordinate Text's First Sentence, Parts of Speech, Placement of 'if' in Second Statement (lặp lại 2 lần), Prioritize Attributes & Contexts, Provide Safe Answers, Reduce Contextless Words, Relevance Configuration, Same N-Grams, Sentence Context, Single Macro Context, Single Topic with Every Detail, Table Context, Timely Answer Delivery, Topic in Q/A Format, Truth Ranges, Unique N-Grams, Use Abbreviations, Use Diverse Measurement Units, Use Entities/Attributes/N-Grams, Use Numeric Values, Use Ordered/Unordered Lists, Use Shorter Sentences, Using Research Papers.

CÁC CỤM MÓC XÍCH:
- Cụm 1: Tiêu đề → Sapo → H2 → Câu trả lời dưới H2 → Câu chuyển tiếp
- Cụm 2: Sapo → Câu trả lời của H2 → H3 → Câu trả lời của H3 → Câu chuyển tiếp của H3
- Cụm 3: Câu trả lời của H3 → Chi tiết phát triển câu trả lời của H3
`;

export const runHardcodedOnPageChecks = (input: SEOInput): CheckResult[] => {
  const checks: CheckResult[] = [];
  const { mainKeyword, url, title, metaDescription, content } = input;
  const kw = mainKeyword.toLowerCase();
  const kwSlug = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');

  // Helper for detailed descriptions
  const createDetailedDesc = (title: string, reason: string, howto: string, benefits: string) => {
    return `PHÂN TÍCH CHUYÊN SÂU: ${title}\n\n1. LÝ DO VÀ NGUYÊN LÝ SEMANTIC: ${reason}\n\n2. CÁCH THỰC HIỆN CHI TIẾT: ${howto}\n\n3. LỢI ÍCH CHIẾN LƯỢC: ${benefits}\n\n4. LƯU Ý TỪ CHUYÊN GIA: Đảm bảo tính tự nhiên và trải nghiệm người dùng là ưu tiên hàng đầu. Việc tối ưu hóa kỹ thuật phải đi đôi với giá trị thực tế mà bài viết mang lại. Đừng cố gắng thao túng thuật toán bằng các kỹ thuật cũ kỹ (Black-hat), hãy tập trung vào ngữ nghĩa (Semantic) để xây dựng thẩm quyền bền vững trong mắt Google. Mỗi thay đổi nhỏ trong cấu trúc On-page đều góp phần tạo nên một 'Information Graph' mạnh mẽ cho thực thể của bạn. Hãy kiên trì tối ưu từng điểm một cho đến khi đạt điểm tuyệt đối.`;
  };

  // 2.1, 2.2, 2.3 URL
  checks.push({
    id: '1.2.1',
    label: 'URL theo phân cấp',
    status: url.split('/').length >= 4 ? 'passed' : 'warning',
    description: createDetailedDesc("Cấu trúc URL phân cấp", "Giúp Bot hiểu kiến trúc thông tin.", "Sửa Permalink thành domain/parent/child/slug.", "Tăng tốc độ Index và Link Juice.")
  });
  checks.push({
    id: '1.2.2',
    label: 'Chứa từ khóa trong URL',
    status: url.toLowerCase().includes(kwSlug) ? 'passed' : 'failed',
    description: createDetailedDesc("Từ khóa trong URL", "Tín hiệu xếp hạng và CTR.", "Sử dụng slug không dấu nối bằng gạch ngang.", "Tăng độ tin tưởng của người dùng.")
  });
  checks.push({
    id: '1.2.3',
    label: 'URL dưới 112 ký tự',
    status: url.length < 112 ? 'passed' : 'failed',
    message: `${url.length} ký tự`,
    description: createDetailedDesc("Độ dài URL tối ưu", "Đảm bảo hiển thị đầy đủ trên SERP.", "Xóa các stop words vô nghĩa.", "Tránh bị cắt bớt nội dung quan trọng.")
  });

  // 3.1, 3.2 Title
  const titleWords = title.toLowerCase().split(/\s+/);
  const titleHasKwStart = titleWords.slice(0, 3).join(' ').includes(kw);
  checks.push({
    id: '1.3.1',
    label: 'Từ khóa ở đầu tiêu đề (3 từ)',
    status: titleHasKwStart ? 'passed' : 'failed',
    description: createDetailedDesc("Vị trí từ khóa Title", "Ưu tiên trọng số từ trái sang phải.", "Đưa từ khóa lên 3 từ đầu tiên.", "Tăng trọng số SEO mạnh nhất.")
  });
  checks.push({
    id: '1.3.2',
    label: 'Tiêu đề dưới 65 ký tự',
    status: title.length < 65 ? 'passed' : 'failed',
    message: `${title.length} ký tự`,
    description: createDetailedDesc("Độ dài Title", "Tránh bị cắt bớt trên Google Search.", "Sử dụng từ ngữ súc tích, hấp dẫn.", "Tối ưu hiển thị cho Mobile và Desktop.")
  });

  // 4.1, 4.2, 4.3 Meta
  const metaKwCount = (metaDescription.toLowerCase().match(new RegExp(kw, 'g')) || []).length;
  checks.push({
    id: '1.4.1',
    label: 'Meta chứa từ khóa chính',
    status: metaDescription.toLowerCase().includes(kw) ? 'passed' : 'failed',
    description: createDetailedDesc("Từ khóa Meta Description", "Hiệu ứng bôi đậm tăng CTR.", "Chèn từ khóa tự nhiên vào mô tả.", "Nổi bật hơn so với đối thủ.")
  });
  checks.push({
    id: '1.4.2',
    label: 'Độ dài Meta 230-320 ký tự',
    status: metaDescription.length >= 230 && metaDescription.length <= 320 ? 'passed' : 'warning',
    message: `${metaDescription.length} ký tự`,
    description: createDetailedDesc("Độ dài Meta tối ưu", "Tận dụng tối đa không gian hiển thị.", "Viết thêm nội dung tóm tắt giá trị.", "Cung cấp đủ thông tin để kích thích nhấp chuột.")
  });
  checks.push({
    id: '1.4.3',
    label: 'Meta lặp lại từ khóa 2 lần',
    status: metaKwCount >= 2 ? 'passed' : 'warning',
    description: createDetailedDesc("Tần suất từ khóa Meta", "Tăng khả năng bôi đậm và nhận diện.", "Chèn khéo léo từ khóa vào đầu và cuối meta.", "Củng cố chủ đề cho người dùng.")
  });

  // 5.1 - 5.12 Body
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const plainText = doc.body.textContent || "";
  const words = plainText.trim().split(/\s+/);
  const first100 = words.slice(0, 100).join(' ').toLowerCase();
  const last100 = words.slice(-100).join(' ').toLowerCase();
  const h2s = doc.querySelectorAll('h2');
  const images = doc.querySelectorAll('img');

  checks.push({
    id: '1.5.1',
    label: 'Từ khóa trong 100 từ đầu',
    status: first100.includes(kw) ? 'passed' : 'failed',
    description: createDetailedDesc("Sapo chứa từ khóa", "Xác định thực thể ngay lập tức.", "Sửa đoạn mở đầu bao hàm từ khóa chính.", "Google Bot nhận diện chủ đề nhanh hơn.")
  });

  const kwMatches = (plainText.toLowerCase().match(new RegExp(kw, 'g')) || []).length;
  const density = words.length > 0 ? (kwMatches / words.length) * 100 : 0;
  checks.push({
    id: '1.5.2',
    label: 'Mật độ từ khóa (0.8% - 1.3%)',
    status: density >= 0.8 && density <= 1.3 ? 'passed' : 'warning',
    message: `${density.toFixed(2)}%`,
    description: createDetailedDesc("Mật độ từ khóa", "Tránh Keyword Stuffing.", "Thêm/bớt từ khóa hoặc dùng từ đồng nghĩa.", "Cân bằng giữa SEO và trải nghiệm đọc.")
  });

  const firstH2Text = h2s[0]?.textContent?.toLowerCase() || "";
  checks.push({
    id: '1.5.3',
    label: 'H2 đầu tiên chứa từ khóa',
    status: firstH2Text.includes(kw) ? 'passed' : 'failed',
    description: createDetailedDesc("Heading 2 và Keyword", "Heading là tín hiệu cấu trúc mạnh.", "Đưa từ khóa vào H2 đầu tiên.", "Khẳng định cấu trúc bài viết chuyên sâu.")
  });

  const h2WithKw = Array.from(h2s).filter(h => h.textContent?.toLowerCase().includes(kw)).length;
  const h2Ratio = h2s.length > 0 ? h2WithKw / h2s.length : 0;
  checks.push({
    id: '1.5.4',
    label: '2/3 H2 chứa từ khóa chính',
    status: h2Ratio >= 0.66 ? 'passed' : 'warning',
    description: createDetailedDesc("Phân bổ từ khóa Headings", "Duy trì mạch ngữ nghĩa toàn bài.", "Bổ sung từ khóa vào các H2 khác.", "Củng cố Information Graph.")
  });

  checks.push({
    id: '1.5.5',
    label: 'Video YouTube nhúng',
    status: content.includes('youtube.com/embed') ? 'passed' : 'warning',
    description: createDetailedDesc("Đa phương tiện (Video)", "Tăng Time on Page và tương tác.", "Nhúng video liên quan từ YouTube.", "Google đánh giá cao nội dung phong phú.")
  });

  // 5.6: Image under every H2 (Approximate check)
  let imgUnderAllH2 = true;
  h2s.forEach(h2 => {
    let next = h2.nextElementSibling;
    let foundImg = false;
    let count = 0;
    while(next && count < 5) { // Check next 5 elements
      if (next.querySelector('img') || next.tagName === 'IMG') { foundImg = true; break; }
      next = next.nextElementSibling;
      count++;
    }
    if (!foundImg) imgUnderAllH2 = false;
  });
  checks.push({
    id: '1.5.6',
    label: 'Ảnh ở mỗi dưới H2',
    status: (h2s.length > 0 && imgUnderAllH2) ? 'passed' : 'warning',
    description: createDetailedDesc("Ảnh minh họa Heading", "Phân tách nội dung, dễ đọc.", "Chèn ảnh ngay dưới mỗi tiêu đề H2.", "Tránh khối văn bản quá dài gây nhàm chán.")
  });

  const allImgsHaveAlt = Array.from(images).every(img => img.getAttribute('alt')?.trim());
  checks.push({
    id: '1.5.7',
    label: 'Đầy đủ thuộc tính Alt ảnh',
    status: (images.length > 0 && allImgsHaveAlt) ? 'passed' : 'failed',
    description: createDetailedDesc("Tối ưu Alt Text", "Giúp Google hiểu nội dung hình ảnh.", "Thêm alt chứa từ khóa mô tả ảnh.", "Hỗ trợ SEO Image và Accessibility.")
  });

  // Simple caption check (figcaption or following paragraph)
  const hasCaptions = content.includes('<figcaption') || content.includes('class="caption"');
  checks.push({
    id: '1.5.8',
    label: 'Chú thích dưới ảnh (Caption)',
    status: hasCaptions ? 'passed' : 'warning',
    description: createDetailedDesc("Chú thích hình ảnh", "Cung cấp ngữ cảnh cho người dùng.", "Sử dụng <figcaption> hoặc text dưới ảnh.", "Tăng tính chuyên nghiệp cho bài viết.")
  });

  checks.push({
    id: '1.5.9',
    label: 'Ít nhất 1000 từ',
    status: words.length >= 1000 ? 'passed' : 'failed',
    message: `${words.length} từ`,
    description: createDetailedDesc("Độ dài bài viết", "Nội dung chuyên sâu có lợi thế.", "Viết thêm các phần ví dụ, FAQ.", "Xây dựng Authority (thẩm quyền) chủ đề.")
  });

  const internalLinks = Array.from(doc.querySelectorAll('a')).filter(a => a.getAttribute('href')?.startsWith('/') || a.getAttribute('href')?.includes(url.split('/')[2]));
  const allBlank = internalLinks.length > 0 && internalLinks.every(a => a.getAttribute('target') === '_blank');
  checks.push({
    id: '1.5.10',
    label: 'Link nội bộ mở tab mới',
    status: allBlank ? 'passed' : 'warning',
    description: createDetailedDesc("Behavior Link nội bộ", "Giữ người dùng ở lại trang hiện tại.", "Thêm target='_blank' vào link nội bộ.", "Giảm Bounce Rate cho website.")
  });

  const refLinksCount = Array.from(doc.querySelectorAll('a')).filter(a => !a.getAttribute('href')?.includes(url.split('/')[2])).length;
  checks.push({
    id: '1.5.11',
    label: 'Reference link (2-10)',
    status: (refLinksCount >= 2 && refLinksCount <= 10) ? 'passed' : 'warning',
    message: `${refLinksCount} links`,
    description: createDetailedDesc("Link tham khảo ngoại", "Minh chứng cho tính xác thực.", "Trích dẫn nguồn uy tín (Wikipedia, báo lớn).", "Củng cố tính E-E-A-T cho nội dung.")
  });

  checks.push({
    id: '1.5.12',
    label: 'Từ khóa trong 100 từ cuối',
    status: last100.includes(kw) ? 'passed' : 'failed',
    description: createDetailedDesc("Kết luận chứa từ khóa", "Khép lại mạch ngữ nghĩa chặt chẽ.", "Nhắc lại từ khóa chính ở phần kết.", "Tạo vòng lặp Semantic hoàn hảo.")
  });

  return checks;
};

export const analyzeWithAI = async (input: SEOInput): Promise<Partial<SEOAnalysis>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bạn là chuyên gia SEO Semantic cao cấp. Hãy đánh giá bài viết và dàn ý dựa trên các danh sách kiểm tra sau:

TỪ KHÓA CHÍNH: ${input.mainKeyword}
URL: ${input.url}
DÀN Ý: ${input.outline}
NỘI DUNG: ${input.content}

--- ${OUTLINE_CHECKLIST_PROMPT} ---

--- ${WRITING_CHECKLIST_PROMPT} ---

--- YÊU CẦU ĐẦU RA (JSON) ---
1. Rà soát TẤT CẢ tiêu chí trong danh sách trên.
2. Trả về kết quả JSON. 
3. YÊU CẦU QUAN TRỌNG: Mỗi trường "description" cho từng check phải là một bài phân tích chuyên sâu tối thiểu 300 từ tiếng Việt. 
4. Phải giải thích tại sao tiêu chí đó quan trọng đối với Semantic SEO và cách sửa cụ thể dựa trên dữ liệu người dùng cung cấp.

{
  "outlineChecks": [{ "id": string, "label": string, "status": "passed" | "failed" | "warning", "message": string, "description": string }],
  "writingChecks": [{ "id": string, "label": string, "status": "passed" | "failed" | "warning", "message": string, "description": string }],
  "scores": { 
    "overall": number, 
    "onpage": number, 
    "outline": number, 
    "writing": number 
  },
  "strategicFeedback": { 
    "pros": string[], 
    "cons": string[], 
    "summary": string 
  }
}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            outlineChecks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  status: { type: Type.STRING },
                  message: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["id", "label", "status", "description"]
              }
            },
            writingChecks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  status: { type: Type.STRING },
                  message: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["id", "label", "status", "description"]
              }
            },
            scores: {
              type: Type.OBJECT,
              properties: {
                overall: { type: Type.NUMBER },
                onpage: { type: Type.NUMBER },
                outline: { type: Type.NUMBER },
                writing: { type: Type.NUMBER }
              },
              required: ["overall", "onpage", "outline", "writing"]
            },
            strategicFeedback: {
              type: Type.OBJECT,
              properties: {
                pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                summary: { type: Type.STRING }
              },
              required: ["pros", "cons", "summary"]
            }
          },
          required: ["outlineChecks", "writingChecks", "scores", "strategicFeedback"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    const scores = result.scores || { overall: 0, onpage: 0, outline: 0, writing: 0 };
    const strategicReport = result.strategicFeedback || { pros: [], cons: [], summary: "Không có nhận xét." };

    return {
      outline: result.outlineChecks || [],
      writing: result.writingChecks || [],
      aiFeedback: strategicReport.summary || "Không có phản hồi.",
      overallScore: scores.overall || 0,
      subScores: {
        onpage: scores.onpage || 0,
        outline: scores.outline || 0,
        writing: scores.writing || 0
      },
      strategicReport: strategicReport
    };
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return { 
      outline: [], writing: [], aiFeedback: "Lỗi phân tích AI.", 
      overallScore: 0, subScores: { onpage: 0, outline: 0, writing: 0 },
      strategicReport: { pros: [], cons: ["Lỗi kết nối"], summary: "Hệ thống AI đang bận." }
    };
  }
};
