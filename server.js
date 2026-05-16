const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const SITE_ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/api/chat") {
      await handleChatRequest(request, response);
      return;
    }

    if (request.method !== "GET") {
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }

    await serveStaticFile(request, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error." });
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

async function handleChatRequest(request, response) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(response, 500, {
      error: "OPENAI_API_KEY is missing. Add it to the environment before starting the server.",
    });
    return;
  }

  const body = await readJsonBody(request);
  const message = String(body.message || "").trim();
  const history = Array.isArray(body.history) ? body.history : [];
  const settings = body.settings || {};

  if (!message) {
    sendJson(response, 400, { error: "Message is required." });
    return;
  }

  const lengthMap = {
    short: 140,
    medium: 280,
    long: 520,
  };

  const payload = {
    model: settings.model || "gpt-5.5",
    instructions: buildInstructions(settings),
    input: [
      ...history
        .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.text === "string")
        .slice(-10)
        .map((item) => ({
          role: item.role,
          content: [{ type: "input_text", text: item.text }],
        })),
      {
        role: "user",
        content: [{ type: "input_text", text: message }],
      },
    ],
    temperature: clampNumber(settings.temperature, 0, 1, 0.7),
    max_output_tokens: lengthMap[settings.responseLength] || lengthMap.medium,
  };

  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await openAiResponse.json();

  if (!openAiResponse.ok) {
    const errorMessage = data.error && data.error.message ? data.error.message : "OpenAI request failed.";
    sendJson(response, openAiResponse.status, { error: errorMessage });
    return;
  }

  sendJson(response, 200, {
    reply: extractOutputText(data) || "No reply was returned.",
  });
}

async function serveStaticFile(request, response) {
  const requestPath = request.url === "/" ? "/index.html" : decodeURIComponent(request.url.split("?")[0]);
  const safePath = path.normalize(path.join(SITE_ROOT, requestPath));

  if (!safePath.startsWith(SITE_ROOT)) {
    sendJson(response, 403, { error: "Forbidden." });
    return;
  }

  fs.readFile(safePath, (error, fileBuffer) => {
    if (error) {
      if (error.code === "ENOENT") {
        sendJson(response, 404, { error: "File not found." });
        return;
      }

      sendJson(response, 500, { error: "Unable to read file." });
      return;
    }

    const extension = path.extname(safePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
    });
    response.end(fileBuffer);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    request.on("error", reject);
  });
}

function buildInstructions(settings) {
  const parts = [];

  if (settings.systemPrompt) {
    parts.push(String(settings.systemPrompt).trim());
  } else {
    parts.push("You are a helpful assistant for a personal website.");
  }

  if (settings.tone) {
    parts.push(`Tone: ${settings.tone}.`);
  }

  if (settings.responseLength) {
    parts.push(`Preferred response length: ${settings.responseLength}.`);
  }

  parts.push("Be accurate, direct, and easy to understand.");

  return parts.join("\n");
}

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const pieces = [];

  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        pieces.push(content.text);
      }
    }
  }

  return pieces.join("\n").trim();
}

function clampNumber(value, min, max, fallback) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numericValue));
}
