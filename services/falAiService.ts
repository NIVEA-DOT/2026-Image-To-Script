
// Service to interact with Fal.ai for upscaling

export async function upscaleImage(imageBase64: string, apiKey: string): Promise<string> {
  if (!apiKey) throw new Error("Fal.ai API Key가 필요합니다.");

  // 1. Submit the request to Fal.ai (Using Aura SR for upscaling)
  const response = await fetch("https://queue.fal.run/fal-ai/aura-sr", {
    method: "POST",
    headers: {
      "Authorization": `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: imageBase64, // Fal accepts Data URIs
    }),
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
        const errBody = await response.json();
        errorMsg = errBody.detail || JSON.stringify(errBody);
    } catch (e) {
        // Ignore JSON parse error if body is empty or not JSON
    }
    throw new Error(`Fal.ai Error (${response.status}): ${errorMsg}`);
  }

  const data = await response.json();
  const requestId = data.request_id;

  // 2. Poll for results
  return await pollForStatus(requestId, apiKey);
}

async function pollForStatus(requestId: string, apiKey: string): Promise<string> {
  const maxAttempts = 120; // 120 attempts (approx 2 mins)
  const interval = 1000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, interval));

    const statusResponse = await fetch(`https://queue.fal.run/fal-ai/aura-sr/requests/${requestId}`, {
      method: "GET",
      headers: {
        "Authorization": `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!statusResponse.ok) continue;

    const statusData = await statusResponse.json();

    if (statusData.status === "COMPLETED") {
      return statusData.image_url; // Returns the URL of the upscaled image
    } else if (statusData.status === "FAILED") {
      throw new Error(`Fal.ai upscaling failed: ${statusData.error || 'Unknown error'}`);
    }
    // If IN_QUEUE or IN_PROGRESS, continue polling
  }

  throw new Error("Upscaling timed out. (2분 초과)");
}
