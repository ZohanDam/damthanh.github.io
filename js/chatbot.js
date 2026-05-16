const chatbotMessages = document.getElementById("chatbot-messages");
const chatbotInput = document.getElementById("chatbot-input");
const chatbotSend = document.getElementById("chatbot-send");
const chatbotClear = document.getElementById("chatbot-clear");
const chatbotStatus = document.getElementById("chatbot-status");
const chatbotPrompt = document.getElementById("chatbot-prompt");
const chatbotTone = document.getElementById("chatbot-tone");
const chatbotLength = document.getElementById("chatbot-length");
const chatbotModel = document.getElementById("chatbot-model");
const chatbotTemperature = document.getElementById("chatbot-temperature");
const chatbotTemperatureValue = document.getElementById("chatbot-temperature-value");
const chatbotMemory = document.getElementById("chatbot-memory");

if (
  chatbotMessages &&
  chatbotInput &&
  chatbotSend &&
  chatbotClear &&
  chatbotStatus &&
  chatbotPrompt &&
  chatbotTone &&
  chatbotLength &&
  chatbotModel &&
  chatbotTemperature &&
  chatbotTemperatureValue &&
  chatbotMemory
) {
  let history = [];
  let isSending = false;

  const renderBubble = (role, text) => {
    const bubble = document.createElement("article");
    bubble.className = `chatbot-bubble ${role === "user" ? "chatbot-bubble-user" : "chatbot-bubble-bot"}`;
    bubble.textContent = text;
    chatbotMessages.append(bubble);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  };

  const setSendingState = (sending) => {
    isSending = sending;
    chatbotSend.disabled = sending;
    chatbotInput.disabled = sending;
    chatbotStatus.textContent = sending ? "Waiting for AI response..." : "";
  };

  const buildSettings = () => ({
    model: chatbotModel.value,
    systemPrompt: chatbotPrompt.value.trim(),
    tone: chatbotTone.value,
    responseLength: chatbotLength.value,
    temperature: Number(chatbotTemperature.value),
    keepHistory: chatbotMemory.checked,
  });

  const sendMessage = async () => {
    const message = chatbotInput.value.trim();

    if (!message || isSending) {
      return;
    }

    const settings = buildSettings();
    const historyToSend = settings.keepHistory ? history : [];

    renderBubble("user", message);
    chatbotInput.value = "";
    setSendingState(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          history: historyToSend,
          settings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Chat request failed.");
      }

      renderBubble("assistant", data.reply);

      if (settings.keepHistory) {
        history.push({ role: "user", text: message });
        history.push({ role: "assistant", text: data.reply });
      } else {
        history = [];
      }
    } catch (error) {
      renderBubble("assistant", error.message || "Something went wrong.");
    } finally {
      setSendingState(false);
      chatbotInput.focus();
    }
  };

  chatbotTemperature.addEventListener("input", () => {
    chatbotTemperatureValue.textContent = chatbotTemperature.value;
  });

  chatbotSend.addEventListener("click", sendMessage);
  chatbotClear.addEventListener("click", () => {
    history = [];
    chatbotMessages.innerHTML = "";
    renderBubble("assistant", "Chat cleared. Send a new message.");
    chatbotStatus.textContent = "";
  });

  chatbotInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
}
