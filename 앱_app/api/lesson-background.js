/**
 * @file /api/lesson-background
 * @description 1차시 배경 문장을 이미지로 생성해 data URL 로 반환.
 */

const OPENAI_IMAGE_URL = 'https://api.openai.com/v1/images/generations';
const MODEL = 'gpt-image-1';

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  if (typeof body === 'object') return body;
  return {};
}

function buildBoardPrompt(rawPrompt) {
  const prompt = String(rawPrompt || '').trim();
  return [
    'Create a background illustration that will be placed BEHIND a square 12-cell board game board.',
    'The student description below tells you what the scene should look like — follow it as the main source of truth.',
    '',
    '[Student background notes]',
    prompt,
    '',
    '[Art direction]',
    'Soft, warm, classroom-friendly digital illustration.',
    'The image will be tiled to "cover" a square game board area, so keep the composition centered and low-detail in the middle (calm sky, sea, fields, etc.) — important visual elements toward the edges.',
    'No characters, no text, no logos, no UI elements, no game pieces, no borders, no frames, no captions.',
    'No tiny intricate details that fight with overlaid game cells; broad shapes and gentle gradients only.',
    'Friendly, clean, and suitable for Korean elementary students.',
  ].join('\n');
}

function buildDicePrompt(rawPrompt) {
  const prompt = String(rawPrompt || '').trim();
  return [
    'Create a small centered icon of a SIX-SIDED DIE styled with the theme described below.',
    'The die should have a recognizable cube shape with rounded corners, but its texture, color, and decoration should reflect the theme.',
    '',
    '[Theme]',
    prompt,
    '',
    '[Art direction]',
    'Square composition; the die fills most of the frame and is centered.',
    'Clean, plain background (white or very light pastel) — no scenes, no extra objects.',
    'No text, no numbers, no pips visible on the die faces — just the styled die shape.',
    'Cute, flat illustration style with soft shadows; suitable for Korean elementary students.',
  ].join('\n');
}

function buildPrompt(rawPrompt, kind) {
  return kind === 'dice' ? buildDicePrompt(rawPrompt) : buildBoardPrompt(rawPrompt);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'missing_openai_api_key', message: 'OPENAI_API_KEY 가 설정되지 않았어요.' });
  }

  const body = parseBody(req.body);
  const prompt = String(body?.prompt || '').trim();
  const kind = body?.kind === 'dice' ? 'dice' : 'board';
  if (!prompt) {
    return res.status(400).json({ error: 'missing_prompt', message: '프롬프트가 비어 있어요.' });
  }

  try {
    const response = await fetch(OPENAI_IMAGE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: buildPrompt(prompt, kind),
        // 보드판 위에 셀/토큰이 덮이므로 'low' 품질로 충분 — 생성 속도 ~10s 단축
        // gpt-image-1 은 1024 가 최소 size. 대신 output_format 을 webp 로 두고 output_compression 으로
        // base64 페이로드를 PNG 대비 60~80% 줄임 (Storage 5MB 한도·HTML 인라인 base64 비대화 대응).
        size: '1024x1024',
        quality: 'low',
        output_format: 'webp',
        output_compression: 75,
        background: 'opaque',
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.code || 'image_generation_failed',
        message: data?.error?.message || '배경 이미지를 만들지 못했어요.',
      });
    }

    const imageUrl = data?.data?.[0]?.url || (data?.data?.[0]?.b64_json ? `data:image/webp;base64,${data.data[0].b64_json}` : '');
    if (!imageUrl) {
      return res.status(502).json({ error: 'invalid_image_response', message: '이미지 응답이 비어 있어요.' });
    }

    return res.status(200).json({
      imageUrl,
      promptUsed: prompt,
      model: MODEL,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'image_generation_exception',
      message: err?.message || '배경 이미지를 만들지 못했어요.',
    });
  }
}
