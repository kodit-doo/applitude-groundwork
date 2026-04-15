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

  const properties: Record<string, string> = {
    email,
    // Map key discovery answers to HubSpot contact properties
    ...(answers["1.1"] && { aicofounder_problem: answers["1.1"] }),
    ...(answers["2.1"] && { aicofounder_vision: answers["2.1"] }),
    ...(answers["1.2"] && { aicofounder_target_user: answers["1.2"] }),
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
