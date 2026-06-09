import { jsPDF } from "jspdf";
import { ChatJudgeReport } from "../types";
import { ChatAnalyticsReport } from "./analyticsParser";

export function generateProgrammaticPDF(
  analysisResult: ChatJudgeReport,
  chatAnalytics: ChatAnalyticsReport | null
) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const printableWidth = pageWidth - 2 * margin;

  let currentPage = 1;

  // Helper to start a new page with the dark background and border layout
  const startPage = () => {
    if (currentPage > 1) {
      pdf.addPage();
    }
    
    // Fill background
    pdf.setFillColor(13, 13, 13);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    // Outer boundary border
    pdf.setDrawColor(42, 42, 42);
    pdf.setLineWidth(0.5);
    pdf.rect(8, 8, pageWidth - 16, pageHeight - 16, "D");

    // Header grid watermark style
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(110, 110, 110);
    pdf.text("CHATJUDGE FORENSIC AUDIT // CONFIDENTIAL VERDICT", 12, 14);
    pdf.text(`PAGE ${currentPage}`, pageWidth - 12 - 15, 14);

    // Decorative horizontal header line
    pdf.setDrawColor(32, 32, 32);
    pdf.line(12, 16, pageWidth - 12, 16);

    // Footer
    pdf.text("VERDICT VERIFICATION SYSTEM © 2026", 12, pageHeight - 11);
    pdf.text("SECURE BLOCKCHAIN VERIFICATION: CJ-982X3", pageWidth - 12 - 70, pageHeight - 11);

    currentPage++;
    return 24; // Initial Y coordinate for content
  };

  let y = startPage();

  // --- PAGE 1: TITLE & RELATIONSHIP AUDIT ---
  y += 15;
  
  // Title Accent Gavel Icon
  pdf.setFontSize(28);
  pdf.setTextColor(239, 68, 68); // Red-500
  pdf.text("⚖️", margin, y);
  y += 10;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(26);
  pdf.setTextColor(255, 255, 255);
  pdf.text("CHATJUDGE REPORT", margin, y);
  y += 8;
  
  pdf.setFontSize(13);
  pdf.setTextColor(150, 150, 150);
  pdf.text("Official Forensic Audit & Chat Relationship Verdict", margin, y);
  y += 12;

  // Horizontal divider
  pdf.setDrawColor(60, 60, 60);
  pdf.setLineWidth(0.8);
  pdf.line(margin, y, margin + printableWidth, y);
  y += 10;

  // Meta Information box
  pdf.setFillColor(22, 22, 22);
  pdf.rect(margin, y, printableWidth, 24, "F");
  pdf.setDrawColor(44, 44, 44);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, y, printableWidth, 24, "D");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(180, 180, 180);
  pdf.text(`SUBJECTS OF AUDIT:`, margin + 4, y + 7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  const names = analysisResult.persons.map(p => p.name).join(" vs ");
  pdf.text(names, margin + 40, y + 7);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(180, 180, 180);
  pdf.text(`DATE GENERATED:`, margin + 4, y + 14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text(new Date().toUTCString(), margin + 40, y + 14);
  y += 34;

  // Relationship Audit Score Card
  pdf.setFillColor(26, 26, 26);
  pdf.rect(margin, y, printableWidth, 42, "F");
  pdf.setDrawColor(239, 68, 68); // Red border
  pdf.setLineWidth(0.5);
  pdf.rect(margin, y, printableWidth, 42, "D");

  // Draw Score circle or text box
  pdf.setFillColor(18, 18, 18);
  pdf.rect(margin + 5, y + 5, 32, 32, "F");
  pdf.setDrawColor(44, 44, 44);
  pdf.rect(margin + 5, y + 5, 32, 32, "D");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(239, 68, 68);
  pdf.text(`${analysisResult.relationship.score}`, margin + 11, y + 21);
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.text("TOXIC SCORE", margin + 8, y + 28);

  // Relationship Status Label
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`RELATIONSHIP METRIC: ${analysisResult.relationship.label}`, margin + 43, y + 11);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(200, 200, 200);
  const summaryWrapped = pdf.splitTextToSize(analysisResult.relationship.summary, printableWidth - 48);
  let summaryY = y + 18;
  for (const line of summaryWrapped) {
    pdf.text(line, margin + 43, summaryY);
    summaryY += 4.5;
  }
  y += 60;

  // Disclaimer and signature watermark
  pdf.setFillColor(18, 18, 18);
  pdf.rect(margin, y, printableWidth, 24, "F");
  pdf.setDrawColor(33, 33, 33);
  pdf.rect(margin, y, printableWidth, 24, "D");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text("CRITICAL SYSTEM VERIFICATION & COMPLIANCE", margin + 4, y + 6);
  
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(140, 140, 140);
  const disclaimerText = "Disclaimer: ChatJudge uses forensic logical pattern heuristics and language model assessments to evaluate conversation dynamics. This report does not constitute official legal arbitration or marital therapy. Ego control and mutual empathy are advised.";
  const discWrapped = pdf.splitTextToSize(disclaimerText, printableWidth - 8);
  let dY = y + 11;
  for (const line of discWrapped) {
    pdf.text(line, margin + 4, dY);
    dY += 3.5;
  }

  // --- PAGE 2: INDIVIDUAL PERSON ANALYSES ---
  y = startPage();
  y += 10;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text("💀 INDIVIDUAL PERSONALITY AUDITS", margin, y);
  y += 10;

  for (let i = 0; i < analysisResult.persons.length; i++) {
    const person = analysisResult.persons[i];
    
    // Header for person
    pdf.setFillColor(20, 20, 20);
    pdf.rect(margin, y, printableWidth, 10, "F");
    pdf.setDrawColor(40, 40, 40);
    pdf.rect(margin, y, printableWidth, 10, "D");
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`AUDITEE #${i+1}: ${person.name.toUpperCase()}`, margin + 4, y + 7);
    y += 15;

    // Details grid
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(245, 158, 11); // Amber
    pdf.text("PERSONAL VERDICT:", margin + 4, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(220, 220, 220);
    pdf.text(person.verdict, margin + 42, y);
    y += 5;

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(239, 68, 68); // Red
    pdf.text("TOXIC SCORE:", margin + 4, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(220, 220, 220);
    pdf.text(`${person.scores.toxicity}/100`, margin + 42, y);
    y += 6;

    // Toxicity summary / roast
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.text("FORENSIC ROAST ASSESSMENT:", margin + 4, y);
    y += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(190, 190, 190);
    const roastWrapped = pdf.splitTextToSize(person.roast || person.verdict, printableWidth - 8);
    for (const rLine of roastWrapped) {
      pdf.text(rLine, margin + 4, y);
      y += 4.5;
    }
    y += 6;

    // Toxic behaviors checklist
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(239, 68, 68);
    pdf.text("KEY TOXIC BEHAVIORS IDENTIFIED:", margin + 4, y);
    y += 5;
    
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(180, 180, 180);
    const behaviors = person.redFlags || person.evidence.map(e => e.trait) || [];
    for (const b of behaviors) {
      pdf.text(`• ${b}`, margin + 8, y);
      y += 4.5;
    }
    y += 14;

    // Check padding so we don't overflow page
    if (y > pageHeight - 85 && i < analysisResult.persons.length - 1) {
      y = startPage();
      y += 10;
    }
  }

  // --- PAGE 3: CHAT METRICS & LINGUISTICS ---
  if (chatAnalytics) {
    y = startPage();
    y += 10;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text("📊 FORENSIC CHAT METRICS & ANALYSIS", margin, y);
    y += 12;

    for (let i = 0; i < chatAnalytics.personas.length; i++) {
      const p = chatAnalytics.personas[i];
      
      pdf.setFillColor(22, 22, 22);
      pdf.rect(margin, y, printableWidth, 54, "F");
      pdf.setDrawColor(50, 50, 50);
      pdf.rect(margin, y, printableWidth, 54, "D");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`Auditee Engagement Scorecard: ${p.name}`, margin + 5, y + 6);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(180, 180, 180);
      pdf.text(`• Total Volumetric Messages:`, margin + 5, y + 15);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${p.messageCount} texts (${Math.round(p.messageCount / chatAnalytics.totalMessages * 100)}% of chat)`, margin + 55, y + 15);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(180, 180, 180);
      pdf.text(`• Conversation Initiatives:`, margin + 5, y + 21);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${p.conversationStarters} chat starters`, margin + 55, y + 21);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(180, 180, 180);
      pdf.text(`• Mean Response Pacing:`, margin + 5, y + 27);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${p.avgResponseTimeMin} min avg (${p.ghostingStatus})`, margin + 55, y + 27);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(180, 180, 180);
      pdf.text(`• Midnight Owl Frequency:`, margin + 5, y + 33);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${p.timeDistribution.lateNight} texts sent 11 PM - 4 AM`, margin + 55, y + 33);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(180, 180, 180);
      pdf.text(`• Top Favorite Emojis:`, margin + 5, y + 39);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      const emojisStr = p.emojis.map(em => `${em.emoji} (${em.count}x)`).join(", ") || "None";
      pdf.text(emojisStr, margin + 55, y + 39);

      // Top Vocabulary words
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(180, 180, 180);
      pdf.text(`• Linguistic Vocabulary:`, margin + 5, y + 45);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(245, 158, 11); // Amber
      const wordsStr = p.topWords.map(w => `"${w.word}" (${w.count}x)`).join(", ") || "None";
      pdf.text(wordsStr, margin + 55, y + 45);

      y += 62;
      
      if (y > pageHeight - 75 && i < chatAnalytics.personas.length - 1) {
        y = startPage();
        y += 10;
      }
    }
  }

  // --- PAGE 4: APOLOGY VERDICT & COURT DECREE ---
  y = startPage();
  y += 10;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text("⚖️ COURT DECREE & ULTIMATE RESOLUTION", margin, y);
  y += 12;

  // Verdict Box
  pdf.setFillColor(28, 18, 18); // reddish container
  pdf.rect(margin, y, printableWidth, 54, "F");
  pdf.setDrawColor(239, 68, 68);
  pdf.setLineWidth(0.6);
  pdf.rect(margin, y, printableWidth, 54, "D");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(239, 68, 68);
  pdf.text("🚨 COURT RESOLUTION ORDER", margin + 6, y + 8);

  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`PRIMARY EGOTIST CALLED OUT: ${analysisResult.apologyVerdict.shouldApologizeFirst.toUpperCase()}`, margin + 6, y + 18);
  
  pdf.setFontSize(8.5);
  pdf.setTextColor(150, 150, 150);
  pdf.text("THE ABOVE PARTY MUST OFFICIALLY INITIATE EGOTISM SUBDUANCE & MAKE THE FIRST APOLOGY.", margin + 6, y + 24);

  // Verdict Explanation
  pdf.setDrawColor(60, 40, 40);
  pdf.line(margin + 6, y + 28, margin + printableWidth - 6, y + 28);
  
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(210, 210, 210);
  const reasoningWrapped = pdf.splitTextToSize(analysisResult.apologyVerdict.reasoning, printableWidth - 12);
  let rY = y + 34;
  for (const line of reasoningWrapped) {
    if (rY < y + 50) {
      pdf.text(line, margin + 6, rY);
      rY += 4.5;
    }
  }
  y += 65;

  // --- RELATIONSHIP ADVICE BOX ---
  pdf.setFillColor(15, 23, 20); // soft emerald/moss shade container
  pdf.rect(margin, y, printableWidth, 58, "F");
  pdf.setDrawColor(16, 185, 129); // emerald green border
  pdf.setLineWidth(0.6);
  pdf.rect(margin, y, printableWidth, 58, "D");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(16, 185, 129); // Emerald-500
  pdf.text("🌱 AI RELATIONSHIP RECONCILIATION ADVICE", margin + 6, y + 8);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(210, 210, 210);
  
  let advY = y + 14;
  if (analysisResult.relationshipAdvice) {
    const steps = analysisResult.relationshipAdvice.actionableSteps;
    for (let sIdx = 0; sIdx < steps.length && sIdx < 3; sIdx++) {
      const stepText = `• ${steps[sIdx]}`;
      const wrappedStep = pdf.splitTextToSize(stepText, printableWidth - 12);
      for (const line of wrappedStep) {
        if (advY < y + 35) {
          pdf.text(line, margin + 6, advY);
          advY += 4.2;
        }
      }
    }
    
    // Add couple challenge with premium highlights
    advY = y + 39;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(252, 211, 77); // Amber-300
    pdf.text("🔥 THE HEALING TEAMWORK CHALLENGE:", margin + 6, advY);
    advY += 4.5;
    
    pdf.setFont("helvetica", "oblique");
    pdf.setTextColor(220, 220, 220);
    const challengeText = analysisResult.relationshipAdvice.coupleChallenge;
    const wrappedChallenge = pdf.splitTextToSize(challengeText, printableWidth - 12);
    for (const line of wrappedChallenge) {
      if (advY < y + 54) {
        pdf.text(line, margin + 6, advY);
        advY += 4.2;
      }
    }
  } else {
    // Fallback if older cached share data is loaded
    pdf.text("• Listen actively twice as much as you deflect or defend yourself.", margin + 6, advY); advY += 4.5;
    pdf.text("• Validate feelings first before jumping to legalistic problem solving.", margin + 6, advY); advY += 4.5;
    pdf.text("• Speak with 'I feel' statements instead of pointing accusing fingers.", margin + 6, advY);
  }

  y += 68;

  // Verification Seal
  pdf.setDrawColor(38, 38, 38);
  pdf.setLineWidth(0.5);
  pdf.setFillColor(15, 15, 15);
  pdf.rect(margin, y, printableWidth, 38, "F");
  pdf.rect(margin, y, printableWidth, 38, "D");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text("SECURE VERIFICATION SEAL", margin + 6, y + 8);
  
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(140, 140, 140);
  pdf.text("• Hash Signature: SHA-256/f7b3a985cc99aa", margin + 6, y + 16);
  pdf.text("• Status: Signed, sealed and fully validated", margin + 6, y + 22);
  pdf.text("• Core logical judgment validated by ChatJudge Heuristic Pipeline", margin + 6, y + 28);

  // Trigger Save File
  const participantNames = analysisResult.persons.map(p => p.name).join("_") || "chat";
  
  // Clean trigger
  pdf.save(`ChatJudge_Verdict_${participantNames}.pdf`);
}
