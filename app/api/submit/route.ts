import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { generatePDF } from "@/lib/pdf";
import { pushLeadToHubSpot } from "@/lib/hubspot";
import { InterviewAnswers, VisionDocument } from "@/types/interview";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const {
    email,
    answers,
    document,
  }: { email: string; answers: InterviewAnswers; document: VisionDocument } =
    await request.json();

  const generatedAt = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const pdfBuffer = await generatePDF(document, generatedAt);

  await resend.emails.send({
    from: "AICofounder <noreply@applitude.tech>",
    to: email,
    subject: "Your Product Vision Document is ready",
    html: `<p>Hi,</p>
<p>Your Product Vision Document is attached. It was generated based on your answers in the AICofounder discovery interview.</p>
<p>If you want to go deeper — strategy, product scoping, or team setup — <a href="https://applitude.tech">Applitude</a> can help.</p>
<p>— The Applitude team</p>`,
    attachments: [
      {
        filename: "product-vision-document.pdf",
        content: pdfBuffer,
      },
    ],
  });

  await pushLeadToHubSpot(email, answers);

  return NextResponse.json({ success: true });
}
