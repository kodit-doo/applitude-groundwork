import { InterviewAnswers } from "@/types/interview";

export async function pushLeadToHubSpot(
  email: string,
  answers: InterviewAnswers
): Promise<void> {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;

  if (!token) {
    console.warn("HUBSPOT_ACCESS_TOKEN not set — skipping lead push");
    return;
  }

  // Support both old key format ("1.1") and new descriptive keys ("problemStatement")
  const problem =
    answers["problemStatement"] || answers["1.1"] || "";
  const vision =
    answers["vision"] || answers["2.1"] || "";
  const targetUsers =
    answers["targetUsers"] || answers["1.2"] || "";

  const properties: Record<string, string> = {
    email,
    ...(problem && { aicofounder_problem: problem }),
    ...(vision && { aicofounder_vision: vision }),
    ...(targetUsers && { aicofounder_target_user: targetUsers }),
  };

  // Try to create; if contact already exists (409), update instead
  const createRes = await fetch(
    "https://api.hubapi.com/crm/v3/objects/contacts",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ properties }),
    }
  );

  if (createRes.status === 409) {
    // Contact exists — fetch their ID and update
    const searchRes = await fetch(
      "https://api.hubapi.com/crm/v3/objects/contacts/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                { propertyName: "email", operator: "EQ", value: email },
              ],
            },
          ],
          properties: ["email"],
          limit: 1,
        }),
      }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const contactId = searchData.results?.[0]?.id;
      if (contactId) {
        await fetch(
          `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ properties }),
          }
        );
      }
    }
    return;
  }

  if (!createRes.ok) {
    console.error("HubSpot contact creation failed:", await createRes.text());
  }
}
