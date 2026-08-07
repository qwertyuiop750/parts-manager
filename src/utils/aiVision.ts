// AI 视觉识别：调用 OpenAI 兼容的视觉模型，识别图片中的配件清单表格

export interface ApiConfig {
  baseURL: string; // 接口地址，如 https://open.bigmodel.cn/api/paas/v4
  apiKey: string; // API 密钥
  model: string; // 视觉模型名，如 glm-4v-plus
}

export interface RecognizedItem {
  name: string; // 配件名称
  spec: string; // 规格
  quantity: number; // 数量
}

const API_CONFIG_KEY = "parts_manager_api_config";

/** 读取 API 配置 */
export function getApiConfig(): ApiConfig | null {
  const raw = localStorage.getItem(API_CONFIG_KEY);
  if (!raw) return null;
  try {
    const cfg = JSON.parse(raw);
    if (cfg.baseURL && cfg.apiKey && cfg.model) return cfg;
    return null;
  } catch {
    return null;
  }
}

/** 保存 API 配置 */
export function setApiConfig(config: ApiConfig): void {
  localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
}

const PROMPT = `请识别这张图片中的配件清单表格。提取每一行的三个字段：
- name: 配件名称（中文）
- spec: 规格（如 M8×30、Φ20、6204ZZ，没有则为空字符串）
- quantity: 数量（整数，没有则为1）

只返回一个 JSON 数组，不要输出任何其他文字或解释。格式示例：
[{"name":"六角螺栓","spec":"M8×30","quantity":10},{"name":"垫圈","spec":"Φ8","quantity":20}]
如果图片中没有可识别的配件表格，返回空数组 []。`;

/** 调用视觉模型识别表格 */
export async function recognizeTable(
  imageDataUrl: string,
  config: ApiConfig
): Promise<RecognizedItem[]> {
  const base = config.baseURL.replace(/\/+$/, "");
  const url = `${base}/chat/completions`;

  const body = {
    model: config.model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: PROMPT },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    temperature: 0.1,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`接口请求失败（${res.status}）：${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const content: string =
    data?.choices?.[0]?.message?.content ??
    data?.output?.choices?.[0]?.message?.content ??
    "";

  return parseRecognizedItems(content);
}

/** 从模型返回内容中解析出配件数组 */
function parseRecognizedItems(content: string): RecognizedItem[] {
  if (!content) return [];
  let text = content.trim();

  // 去掉 markdown 代码块
  const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    text = codeMatch[1].trim();
  }

  // 提取第一个 JSON 数组
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return [];
  text = text.slice(start, end + 1);

  try {
    const arr = JSON.parse(text);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((it: unknown) => {
        const obj = it as Record<string, unknown>;
        return {
          name: String(obj.name ?? obj.名称 ?? "").trim(),
          spec: String(obj.spec ?? obj.规格 ?? "").trim(),
          quantity: Number(obj.quantity ?? obj.数量 ?? 1) || 1,
        };
      })
      .filter((it: RecognizedItem) => it.name);
  } catch {
    return [];
  }
}

/** 匹配结果：根据识别出的名称/规格在已有配件中查找 */
export interface MatchResult {
  partId: string | null; // 匹配上的配件 id，null 表示未匹配
  candidates: string[]; // 候选配件 id 列表
  matched: "exact" | "name" | "none"; // 匹配类型
}

export function matchPart(
  item: RecognizedItem,
  parts: { id: string; name: string; spec: string }[]
): MatchResult {
  const name = item.name.trim().toLowerCase();
  const spec = item.spec.trim().toLowerCase();

  if (!name) return { partId: null, candidates: [], matched: "none" };

  // 精确匹配：名称+规格都一致
  const exact = parts.find(
    (p) => p.name.toLowerCase() === name && p.spec.toLowerCase() === spec
  );
  if (exact) {
    return { partId: exact.id, candidates: [exact.id], matched: "exact" };
  }

  // 名称匹配：名称一致（规格为空或不一致）
  const nameMatches = parts.filter(
    (p) => p.name.toLowerCase() === name
  );
  if (nameMatches.length === 1) {
    return {
      partId: nameMatches[0].id,
      candidates: [nameMatches[0].id],
      matched: "name",
    };
  }
  if (nameMatches.length > 1) {
    // 多个同名，按规格相似排序
    nameMatches.sort((a, b) =>
      specDiff(a.spec.toLowerCase(), spec) -
      specDiff(b.spec.toLowerCase(), spec)
    );
    return {
      partId: null,
      candidates: nameMatches.map((p) => p.id),
      matched: "name",
    };
  }

  // 模糊：名称包含
  const fuzzy = parts.filter(
    (p) =>
      p.name.toLowerCase().includes(name) ||
      name.includes(p.name.toLowerCase())
  );
  return {
    partId: null,
    candidates: fuzzy.map((p) => p.id),
    matched: "none",
  };
}

function specDiff(a: string, b: string): number {
  if (!b) return 0;
  return a === b ? 0 : 1;
}
