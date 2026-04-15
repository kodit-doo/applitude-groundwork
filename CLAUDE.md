# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (http://localhost:3000)
npm run build    # production build
npm run lint     # ESLint
npx tsc --noEmit # type-check without emitting
```

## Environment

Copy `.env.local.example` to `.env.local` and fill in keys before running:

```
ANTHROPIC_API_KEY=
RESEND_API_KEY=
HUBSPOT_PORTAL_ID=
HUBSPOT_FORM_ID=
NEXT_PUBLIC_BASE_URL=https://discover.applitude.tech
```

## Architecture

**AICofounder** is a Next.js 16 App Router project. It runs a 7-section product discovery interview, validates vision against problem via AI, generates a `VisionDocument`, previews it with a blur gate, then emails the PDF via Resend on email submission.

### Data flow

```
/discover → InterviewFlow (client component)
  ├── QuestionCard × 25 questions (7 sections)
  ├── POST /api/interview  — per-section AI acknowledgment (non-blocking)
  ├── POST /api/validate   — after section 2: checks problem/vision alignment
  ├── POST /api/generate   — after section 7: produces VisionDocument JSON
  ├── DocumentPreview      — shows first 3 sections, blurs rest
  ├── EmailCapture         — collects email
  └── POST /api/submit     — generates PDF, emails via Resend, pushes to HubSpot
```

### Key files

| Path | Role |
|------|------|
| `types/interview.ts` | All shared TypeScript interfaces |
| `lib/questions.ts` | 25 questions organised into 7 `Section` objects |
| `lib/prompts.ts` | Three Anthropic system prompts: interview, validation, generation |
| `lib/pdf.tsx` | `@react-pdf/renderer` PDF builder — `generatePDF(doc, date): Buffer` |
| `lib/hubspot.ts` | HubSpot Forms v3 submission helper |
| `components/InterviewFlow.tsx` | Top-level state machine for the entire flow |

### Brand tokens

- Text: `#1E2429`
- Accent / CTA buttons: `#DBF227` (lime), hover `#cde020`
- Font: Rethink Sans (Google Fonts, via `--font-rethink-sans` CSS variable)

### Anthropic usage

All three API routes use `claude-sonnet-4-6`. The generate route requests up to 4096 tokens; interview and validate are capped at 512 and 256 respectively. Responses are not streamed.
