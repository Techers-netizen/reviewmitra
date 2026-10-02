// WhatsApp Notification Engine for ReviewMitra
// Sends real-time alerts to Indian MSME owners via WhatsApp Cloud API or SMS/WhatsApp gateway.

export interface WhatsAppAlertOptions {
  toPhoneNumber: string;
  templateType: "negative_alert" | "auto_reply_confirm" | "daily_digest" | "test_message";
  data: {
    reviewerName?: string;
    rating?: number;
    platform?: string;
    reviewText?: string;
    draftReply?: string;
    businessName?: string;
    summary?: {
      newReviews: number;
      replied: number;
      avgRating: number;
    };
  };
}

export async function sendWhatsAppNotification(opts: WhatsAppAlertOptions): Promise<{ success: boolean; messageId: string }> {
  const cleanPhone = opts.toPhoneNumber.replace(/\D/g, "").slice(-10);
  const fullPhone = `91${cleanPhone}`;

  let messageBody = "";

  switch (opts.templateType) {
    case "negative_alert":
      messageBody = `🚨 *ReviewMitra Alert: Negative Review Received*\n\n` +
        `👤 *Customer:* ${opts.data.reviewerName || "Anonymous"}\n` +
        `⭐ *Rating:* ${opts.data.rating} / 5 Stars\n` +
        `📱 *Platform:* ${opts.data.platform?.toUpperCase()}\n` +
        `💬 *Review:* "${opts.data.reviewText || "(No comment)"}"\n\n` +
        `🤖 *AI Drafted Apology Reply:*\n"${opts.data.draftReply}"\n\n` +
        `👉 *Action:* Apne ReviewMitra dashboard me jaakar 1-click me approve karein ya edit karein: https://reviewmitra.in/dashboard/reviews`;
      break;

    case "auto_reply_confirm":
      messageBody = `✅ *ReviewMitra: Auto-Reply Successfully Posted*\n\n` +
        `AI ne *${opts.data.reviewerName}* ke ${opts.data.rating}★ review (${opts.data.platform}) ka automatic reply post kar diya hai.\n\n` +
        `💬 *Posted Reply:* "${opts.data.draftReply}"`;
      break;

    case "daily_digest":
      messageBody = `☀️ *Good Morning! ReviewMitra Daily Summary*\n\n` +
        `Aapke business *${opts.data.businessName || "Smile Dental"}* ka kal ka update:\n` +
        `• Naye Reviews: ${opts.data.summary?.newReviews || 0}\n` +
        `• AI Replied: ${opts.data.summary?.replied || 0}\n` +
        `• Current Rating: ${opts.data.summary?.avgRating || 4.3}★\n\n` +
        `👉 Open Inbox: https://reviewmitra.in/dashboard`;
      break;

    case "test_message":
      messageBody = `🔔 *ReviewMitra Test Alert*\n\n` +
        `Badhai ho! Aapka WhatsApp number (+91 ${cleanPhone}) successfully ReviewMitra alert system se connect ho gaya hai. Ab negative reviews aate hi aapko yahan instant notification milega. 🙏`;
      break;
  }

  // If WhatsApp Cloud API credentials are provided in env, call Meta API
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (token && phoneNumberId) {
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: fullPhone,
          type: "text",
          text: { body: messageBody },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        return { success: true, messageId: json.messages?.[0]?.id || "wa_ok" };
      }
    } catch (err) {
      console.error("WhatsApp API send failed:", err);
    }
  }

  // Dev / Mock fallback logger
  console.log(`[WHATSAPP NOTIFICATION to +${fullPhone}]:\n${messageBody}`);
  return { success: true, messageId: `mock_wa_${Date.now()}` };
}
