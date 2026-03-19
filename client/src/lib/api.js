const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:10000"
).replace(/\/$/, "");

export async function generateStimuli(prompt, signal) {
  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt }),
    signal
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.error?.message || "生成失败，请稍后重试。"
    );
  }

  return payload;
}

export { API_BASE_URL };

