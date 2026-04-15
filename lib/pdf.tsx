import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { VisionDocument } from "@/types/interview";
import React from "react";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    color: "#1E2429",
    lineHeight: 1.6,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#1E2429",
  },
  subtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 28,
    marginBottom: 8,
    color: "#1E2429",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  body: {
    fontSize: 11,
    lineHeight: 1.7,
    color: "#374151",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginVertical: 8,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 56,
    right: 56,
    fontSize: 9,
    color: "#9CA3AF",
    textAlign: "center",
  },
});

const SECTION_LABELS: Record<keyof VisionDocument, string> = {
  problemStatement: "Problem Statement",
  vision: "Vision",
  targetUsers: "Target Users",
  userNeeds: "User Needs",
  solutionOverview: "Solution Overview",
  businessModel: "Business Model",
  successMetrics: "Success Metrics",
};

function VisionDocumentPDF({
  doc,
  generatedAt,
}: {
  doc: VisionDocument;
  generatedAt: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Product Vision Document</Text>
        <Text style={styles.subtitle}>
          Generated on {generatedAt} · A free tool by Applitude
        </Text>
        <View style={styles.divider} />
        {(Object.keys(SECTION_LABELS) as (keyof VisionDocument)[]).map(
          (key) => (
            <View key={key}>
              <Text style={styles.sectionTitle}>{SECTION_LABELS[key]}</Text>
              <Text style={styles.body}>{doc[key]}</Text>
            </View>
          )
        )}
        <Text style={styles.footer}>
          applitude.tech · AICofounder — Product Discovery Tool
        </Text>
      </Page>
    </Document>
  );
}

export async function generatePDF(
  doc: VisionDocument,
  generatedAt: string
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <VisionDocumentPDF doc={doc} generatedAt={generatedAt} />
  );
  return Buffer.from(buffer);
}
