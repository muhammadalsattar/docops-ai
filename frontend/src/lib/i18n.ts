import type { Locale, UserRole } from "./types";

export const DICTIONARY = {
  en: {
    brand: "DocOps AI",
    subtitle: "Bilingual Document RAG & Approval Ops",
    nav: {
      vault: "Document Vault",
      rag: "RAG Workspace",
      approvals: "Approval Queue",
      audit: "Audit Trail",
    },
    topbar: {
      roleLabel: "RBAC Role",
      runtimeEmbedded: "Standalone RAG Engine",
      runtimeFastapi: "FastAPI Connected",
      langToggle: "العربية",
    },
    roles: {
      Admin: { label: "Admin", desc: "Full ingest, query & approval authority" },
      Reviewer: { label: "Reviewer", desc: "Ingest, query & sign-off authority" },
      Viewer: { label: "Viewer", desc: "Read-only Q&A and audit visibility" },
    },
    stats: {
      indexedDocs: "Indexed Documents",
      totalChunks: "Vector / TF-IDF Chunks",
      pendingApprovals: "Pending Reviews",
      auditEvents: "Audit Events",
    },
    vault: {
      heading: "Document Vault & Ingestion Pipeline",
      subheading:
        "Bilingual contracts, compliance policies, and SOPs indexed for citation-grounded retrieval.",
      ingestBtn: "Ingest Document",
      readOnlyHint: "Switch to Admin or Reviewer to ingest documents",
      searchPlaceholder: "Filter documents by title, category, or summary...",
      allLanguages: "All Languages",
      chunks: "chunks",
      pages: "pages",
      uploadedBy: "Owner",
      modalTitle: "Ingest & Index New Document",
      modalDesc:
        "Upload a .txt / .md file or paste contract text. Chunks are immediately indexed for RAG retrieval and scanned for risk flags.",
      fieldTitle: "Document Title",
      fieldCategory: "Category",
      fieldLanguage: "Language",
      fieldFile: "Upload .txt / .md file (optional)",
      fieldContent: "Document Content",
      cancel: "Cancel",
      submit: "Index Document",
      submitting: "Indexing...",
      placeholderTitle: "e.g., Enterprise SLA Addendum 2026",
      placeholderContent:
        "Paste English or Arabic contract clauses here (minimum 20 characters)...",
    },
    rag: {
      heading: "Citation-Grounded RAG Q&A",
      subheading:
        "Ask questions in English or Arabic. Click inline citations [1], [2] to verify exact source passages.",
      inputPlaceholder:
        "Ask about liability caps, PDPL 72h breach rules, sub-processor notice, or invoice thresholds...",
      askBtn: "Run Query",
      asking: "Retrieving...",
      suggestedTitle: "Quick Bilingual Prompts",
      inspectorTitle: "Evidence Inspector",
      inspectorEmpty:
        "Select any inline citation chip [1], [2] or citation card to inspect the exact source excerpt, section metadata, and similarity score.",
      similarity: "Similarity Score",
      section: "Section / Clause",
      page: "Page",
      sourceDoc: "Source Document",
      modeExtractive: "TF-IDF Extractive",
      modeOpenai: "OpenAI Grounded",
      citationsCount: "Sources",
      clearScope: "All Documents",
      prompts: [
        "What is the SLA uptime guarantee and liability cap in the MSA?",
        "ما هي مهلة الإبلاغ عن تسريب البيانات وشروط إقامة البيانات في سياسة PDPL؟",
        "Does the Vendor DPA prohibit AI model training and what is the sub-processor notice period?",
        "When do invoices require Admin escalation under the Procurement SOP?",
      ],
    },
    approvals: {
      heading: "Human-in-the-Loop Approval Queue",
      subheading:
        "AI-extracted legal & compliance risk flags requiring RBAC-gated reviewer sign-off.",
      viewerBanner:
        "Viewer mode active — approval controls are locked in read-only mode. Switch RBAC role to Reviewer or Admin to take action.",
      approve: "Approve",
      requestRevision: "Request Revision",
      escalate: "Escalate",
      confidence: "AI Confidence",
      clause: "Clause Ref",
      notePlaceholder: "Optional reviewer rationale or redline note...",
      lastAction: "Last Action",
      sourceExcerpt: "Extracted Clause Excerpt",
    },
    audit: {
      heading: "Immutable Operational Audit Trail",
      subheading:
        "Chronological log of every RAG query, document ingestion, RBAC role switch, and approval decision.",
      colTime: "Timestamp (UTC)",
      colReqId: "Request ID",
      colRole: "Role",
      colAction: "Action",
      colResource: "Resource",
      colStatus: "Status",
      colDetails: "Details",
      filterAll: "All Events",
      refresh: "Refresh",
    },
  },
  ar: {
    brand: "DocOps AI",
    subtitle: "منصة RAG ثنائية اللغة وعمليات الاعتماد",
    nav: {
      vault: "خزنة المستندات",
      rag: "مساحة الاستعلام RAG",
      approvals: "قائمة الاعتمادات",
      audit: "سجل التدقيق",
    },
    topbar: {
      roleLabel: "صلاحية الدور",
      runtimeEmbedded: "محرك RAG مدمج",
      runtimeFastapi: "متصل بـ FastAPI",
      langToggle: "English",
    },
    roles: {
      Admin: { label: "مدير (Admin)", desc: "صلاحية كاملة للرفع والاستعلام والاعتماد" },
      Reviewer: { label: "مراجع (Reviewer)", desc: "صلاحية الرفع والاستعلام واتخاذ القرار" },
      Viewer: { label: "مشاهد (Viewer)", desc: "صلاحية القراءة والاستعلام فقط" },
    },
    stats: {
      indexedDocs: "المستندات المفهرسة",
      totalChunks: "المقاطع المفهرسة",
      pendingApprovals: "مراجعات قيد الانتظار",
      auditEvents: "سجلات التدقيق",
    },
    vault: {
      heading: "خزنة المستندات وخط الاستيعاب",
      subheading:
        "عقود وسياسات امتثال وإجراءات تشغيلية ثنائية اللغة مفهرسة للاسترجاع الموثق بالمصادر.",
      ingestBtn: "رفع مستند جديد",
      readOnlyHint: "بدّل الدور إلى Admin أو Reviewer لرفع مستندات جديدة",
      searchPlaceholder: "ابحث بالعنوان أو التصنيف أو الملخص...",
      allLanguages: "جميع اللغات",
      chunks: "مقاطع",
      pages: "صفحة",
      uploadedBy: "المالك",
      modalTitle: "استيعاب وفهرسة مستند جديد",
      modalDesc:
        "ارفع ملف .txt أو .md أو الصق نص العقد. يتم تقسيم النص وفهرسته فوراً مع فحص تلقائي لمخاطر البنود.",
      fieldTitle: "عنوان المستند",
      fieldCategory: "التصنيف",
      fieldLanguage: "اللغة",
      fieldFile: "رفع ملف .txt / .md (اختياري)",
      fieldContent: "محتوى المستند",
      cancel: "إلغاء",
      submit: "فهرسة المستند",
      submitting: "جارٍ الفهرسة...",
      placeholderTitle: "مثال: ملحق اتفاقية مستوى الخدمة 2026",
      placeholderContent: "الصق نصوص العقود باللغة العربية أو الإنجليزية (20 حرفاً على الأقل)...",
    },
    rag: {
      heading: "الاستعلام الذكي الموثق بالمصادر (RAG)",
      subheading:
        "اطرح أسئلتك بالعربية أو الإنجليزية. انقر على أرقام المصادر [1] و [2] لمعاينة النص الأصلي.",
      inputPlaceholder:
        "اسأل عن سقف المسؤولية، أو مهلة 72 ساعة لتسريب البيانات، أو شروط اعتماد الفواتير...",
      askBtn: "تشغيل الاستعلام",
      asking: "جارٍ الاسترجاع...",
      suggestedTitle: "استعلامات سريعة ثنائية اللغة",
      inspectorTitle: "لوحة فحص الأدلة",
      inspectorEmpty:
        "انقر على أي رقم مصدر مثل [1] أو [2] لمعاينة النص الأصلي وبيانات البند ودرجة التطابق.",
      similarity: "درجة التطابق",
      section: "البند / القسم",
      page: "الصفحة",
      sourceDoc: "المستند المصدر",
      modeExtractive: "استرجاع TF-IDF",
      modeOpenai: "توليد OpenAI موثق",
      citationsCount: "مصادر",
      clearScope: "كل المستندات",
      prompts: [
        "ما هي مهلة الإبلاغ عن تسريب البيانات وشروط إقامة البيانات في سياسة PDPL؟",
        "هل يحظر ملحق المورد تدريب نماذج الذكاء الاصطناعي وما هي مدة إشعار المعالجين الفرعيين؟",
        "What is the SLA uptime guarantee and liability cap in the MSA?",
        "متى تتطلب الفواتير تصعيداً إلى الإدارة العليا في إجراءات المشتريات؟",
      ],
    },
    approvals: {
      heading: "قائمة الاعتمادات والمراجعة البشرية",
      subheading:
        "تنبيهات المخاطر القانونية والامتثالية المستخرجة آلياً مع بوابة صلاحيات RBAC.",
      viewerBanner:
        "وضع المشاهدة فقط (Viewer) مفعل — أزرار الاعتماد مقفلة. بدّل الدور إلى Reviewer أو Admin لاتخاذ إجراء.",
      approve: "اعتماد",
      requestRevision: "طلب تعديل",
      escalate: "تصعيد",
      confidence: "ثقة الذكاء الاصطناعي",
      clause: "مرجع البند",
      notePlaceholder: "ملاحظة المراجع أو سبب القرار (اختياري)...",
      lastAction: "آخر إجراء",
      sourceExcerpt: "المقطع المستخرج من المصدر",
    },
    audit: {
      heading: "سجل التدقيق التشغيلي",
      subheading:
        "سجل زمني كامل لكل استعلام RAG وعملية رفع مستند وتغيير صلاحية وقرار اعتماد.",
      colTime: "الوقت (UTC)",
      colReqId: "معرف الطلب",
      colRole: "الدور",
      colAction: "الإجراء",
      colResource: "المورد",
      colStatus: "الحالة",
      colDetails: "التفاصيل",
      filterAll: "جميع الأحداث",
      refresh: "تحديث",
    },
  },
} as const;

export function getCopy(locale: Locale) {
  return DICTIONARY[locale];
}

export function getRoleLabel(locale: Locale, role: UserRole): string {
  return DICTIONARY[locale].roles[role].label;
}
