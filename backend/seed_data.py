from __future__ import annotations

SEED_DOCUMENTS = [
    {
        "id": "doc-msa-2026",
        "title": "Enterprise Master Services Agreement (MSA v4.2)",
        "title_ar": "اتفاقية الخدمات الرئيسية للمؤسسات (الإصدار 4.2)",
        "category": "Commercial Contract",
        "category_ar": "عقد تجاري",
        "language": "EN",
        "status": "Flagged",
        "page_count": 18,
        "uploaded_by": "Legal Ops",
        "updated_at": "2026-11-20T09:15:00Z",
        "summary": "Master enterprise SaaS and managed AI services agreement governing SLAs, liability caps, termination, and intellectual property ownership.",
        "summary_ar": "اتفاقية خدمات مؤسسية رئيسية تنظم اتفاقيات مستوى الخدمة وسقف المسؤولية والإنهاء وملكية الحقوق الفكرية.",
        "sections": [
            {
                "section": "Section 4.2 — Service Level Availability & Credits",
                "page": 6,
                "content": (
                    "Provider guarantees 99.95% monthly uptime for production RAG inference and document ingestion APIs. "
                    "Scheduled maintenance windows require 72 hours advance written notice and shall not exceed 2 hours per calendar month. "
                    "If monthly availability drops below 99.95%, Customer is entitled to a 10% service credit; below 99.5%, a 25% credit applies."
                ),
            },
            {
                "section": "Section 9.1 — Limitation of Liability & Uncapped Indemnity",
                "page": 12,
                "content": (
                    "Except for indemnification obligations, confidentiality breaches, and data protection violations, each party's aggregate liability "
                    "is capped at twelve (12) months of fees paid prior to the claim. However, Clause 9.1(c) currently leaves third-party IP and data "
                    "breach indemnities uncapped without a super-cap multiplier, triggering mandatory Legal Ops review."
                ),
            },
            {
                "section": "Section 11.3 — Termination for Convenience & Data Return",
                "page": 15,
                "content": (
                    "Customer may terminate this Agreement for convenience upon thirty (30) days prior written notice without early termination penalty. "
                    "Upon termination, Provider must export all indexed embeddings, raw documents, and audit logs in JSONL/PDF format within 14 business days "
                    "and issue a signed certificate of cryptographic erasure within 30 days."
                ),
            },
        ],
    },
    {
        "id": "doc-pdpl-ar-2026",
        "title": "GCC Personal Data Protection & Residency Policy (PDPL)",
        "title_ar": "سياسة حماية البيانات الشخصية وإقامة البيانات في دول الخليج (PDPL)",
        "category": "Compliance Policy",
        "category_ar": "سياسة امتثال",
        "language": "AR",
        "status": "Indexed",
        "page_count": 14,
        "uploaded_by": "Compliance Desk",
        "updated_at": "2026-11-21T11:40:00Z",
        "summary": "Arabic compliance policy covering personal data residency, cross-border transfers, breach notification timelines, and retention schedules.",
        "summary_ar": "سياسة امتثال باللغة العربية تغطي إقامة البيانات الشخصية ونقل البيانات عبر الحدود ومهل الإبلاغ عن التسريبات وجداول الاحتفاظ.",
        "sections": [
            {
                "section": "المادة 3 — إقامة البيانات ونقلها عبر الحدود",
                "page": 4,
                "content": (
                    "يجب استضافة جميع البيانات الشخصية الحساسة وسجلات العملاء داخل مراكز بيانات معتمدة في المنطقة الجغرافية المحددة. "
                    "لا يجوز نقل البيانات الشخصية خارج الحدود إلا بعد الحصول على موافقة مسبقة من مسؤول حماية البيانات وتقييم أثر النقل، "
                    "مع تطبيق التشفير أثناء النقل والتخزين وفق معيار AES-256 و TLS 1.3."
                ),
            },
            {
                "section": "المادة 7 — الإبلاغ عن حوادث تسريب البيانات",
                "page": 9,
                "content": (
                    "يلتزم معالج البيانات بإخطار الجهة المختصة وصاحب البيانات خلال مدة لا تتجاوز 72 ساعة من وقت العلم بوقوع أي تسريب أو وصول غير مصرح به. "
                    "يجب أن يتضمن الإخطار طبيعة البيانات المتأثرة، وعدد السجلات المتضررة، وإجراءات الاحتواء الفورية المتخذة."
                ),
            },
            {
                "section": "المادة 10 — الاحتفاظ بالبيانات والحذف الآمن",
                "page": 12,
                "content": (
                    "يتم الاحتفاظ بسجلات التدقيق والمستندات التعاقدية لمدة خمس (5) سنوات لأغراض الامتثال الرقابي، ما لم يطلب العميل الحذف المبكر "
                    "وفق الضوابط القانونية. وبعد انتهاء مدة الاحتفاظ يتم إتلاف النسخ الاحتياطية والفهارس النصية بشكل نهائي غير قابل للاسترجاع."
                ),
            },
        ],
    },
    {
        "id": "doc-vendor-dpa-2026",
        "title": "Bilingual Vendor Data Processing Addendum (DPA)",
        "title_ar": "ملحق معالجة البيانات للموردين (ثنائي اللغة)",
        "category": "Data Privacy",
        "category_ar": "خصوصية البيانات",
        "language": "Bilingual",
        "status": "Flagged",
        "page_count": 11,
        "uploaded_by": "Privacy Counsel",
        "updated_at": "2026-11-22T14:05:00Z",
        "summary": "Bilingual EN/AR Data Processing Addendum specifying sub-processor notice periods, zero-data-retention AI inference, and audit rights.",
        "summary_ar": "ملحق معالجة بيانات ثنائي اللغة يحدد فترات إشعار المعالجين الفرعيين وعدم الاحتفاظ بالبيانات في نماذج الذكاء الاصطناعي وحقوق التدقيق.",
        "sections": [
            {
                "section": "Clause 5.4 — AI Model Training Prohibition / حظر تدريب النماذج",
                "page": 5,
                "content": (
                    "Processor shall strictly enforce Zero Data Retention (ZDR) on all LLM inference endpoints and shall never use Customer documents, "
                    "prompts, or embeddings to train or fine-tune foundation models. "
                    "يحظر على المعالج استخدام مستندات العميل أو الاستعلامات أو المتجهات لتدريب أو تحسين أي نماذج ذكاء اصطناعي خارجية."
                ),
            },
            {
                "section": "Clause 6.2 — Sub-processor Onboarding Notice / إشعار المعالجين الفرعيين",
                "page": 7,
                "content": (
                    "Processor currently provides only ten (10) days advance notice before engaging a new sub-processor, which falls short of the "
                    "enterprise standard of thirty (30) days written notice with an explicit right to object. "
                    "فترة الإشعار الحالية البالغة 10 أيام أقل من المعيار المؤسسي المطلوب البالغ 30 يوماً مع حق الاعتراض."
                ),
            },
        ],
    },
    {
        "id": "doc-procurement-sop-2026",
        "title": "Procurement & Invoice Approval SOP (MENA Ops)",
        "title_ar": "إجراءات التشغيل القياسية للمشتريات واعتماد الفواتير",
        "category": "Operations SOP",
        "category_ar": "إجراءات تشغيلية",
        "language": "EN",
        "status": "Indexed",
        "page_count": 9,
        "uploaded_by": "Finance Ops",
        "updated_at": "2026-11-23T08:30:00Z",
        "summary": "Standard operating procedure defining purchase order thresholds, dual-control sign-offs, and automated OCR invoice exception routing.",
        "summary_ar": "إجراءات تشغيلية قياسية تحدد حدود أوامر الشراء والاعتماد المزدوج وتوجيه استثناءات الفواتير المستخرجة آلياً.",
        "sections": [
            {
                "section": "Section 2.1 — Approval Matrix & Dual Sign-off",
                "page": 3,
                "content": (
                    "Invoices under $10,000 require single Reviewer approval after automated 3-way PO matching. "
                    "Invoices between $10,000 and $50,000 require Reviewer plus Finance Director approval. "
                    "Any contract or invoice exceeding $50,000 or flagged for non-standard payment terms (Net 15 or prepayment) must be escalated to Admin / Executive Committee."
                ),
            },
            {
                "section": "Section 3.3 — OCR Exception Handling & Audit Trail",
                "page": 6,
                "content": (
                    "When document OCR confidence drops below 92% on tax registration numbers (TRN/VAT ID) or line-item totals, "
                    "the pipeline automatically routes the document to the Human-in-the-Loop Approval Queue with source bounding excerpts and immutable request IDs."
                ),
            },
        ],
    },
]

SEED_APPROVALS = [
    {
        "id": "apr-101",
        "document_id": "doc-msa-2026",
        "document_title": "Enterprise Master Services Agreement (MSA v4.2)",
        "document_title_ar": "اتفاقية الخدمات الرئيسية للمؤسسات (الإصدار 4.2)",
        "clause_ref": "Section 9.1(c) · Page 12",
        "clause_ref_ar": "البند 9.1(ج) · صفحة 12",
        "risk_title": "Uncapped IP & Data Breach Indemnity Exposure",
        "risk_title_ar": "تعويض غير محدد السقف للملكية الفكرية وتسريب البيانات",
        "risk_summary": "Clause 9.1(c) excludes third-party IP and data protection indemnities from the 12-month liability cap without defining a 2x or 3x super-cap.",
        "risk_summary_ar": "يستثني البند 9.1(ج) تعويضات الملكية الفكرية وحماية البيانات من سقف المسؤولية البالغ 12 شهراً دون تحديد سقف أعلى بديل.",
        "source_excerpt": "Clause 9.1(c) currently leaves third-party IP and data breach indemnities uncapped without a super-cap multiplier, triggering mandatory Legal Ops review.",
        "severity": "High",
        "confidence": 0.96,
        "status": "Pending",
        "assigned_role": "Reviewer",
        "updated_at": "2026-11-23T10:12:00Z",
        "last_actor": None,
        "last_comment": None,
    },
    {
        "id": "apr-102",
        "document_id": "doc-vendor-dpa-2026",
        "document_title": "Bilingual Vendor Data Processing Addendum (DPA)",
        "document_title_ar": "ملحق معالجة البيانات للموردين (ثنائي اللغة)",
        "clause_ref": "Clause 6.2 · Page 7",
        "clause_ref_ar": "البند 6.2 · صفحة 7",
        "risk_title": "Short Sub-processor Notice Period (10 Days vs 30-Day Standard)",
        "risk_title_ar": "قصر مدة إشعار المعالجين الفرعيين (10 أيام مقابل 30 يوماً)",
        "risk_summary": "Vendor DPA provides only 10 days notice prior to adding sub-processors; company policy requires 30 days written notice with objection rights.",
        "risk_summary_ar": "ينص ملحق المورد على إشعار قبل 10 أيام فقط قبل إضافة معالجين فرعيين، بينما تتطلب السياسة 30 يوماً مع حق الاعتراض.",
        "source_excerpt": "Processor currently provides only ten (10) days advance notice before engaging a new sub-processor, which falls short of the enterprise standard of thirty (30) days.",
        "severity": "Medium",
        "confidence": 0.93,
        "status": "Pending",
        "assigned_role": "Reviewer",
        "updated_at": "2026-11-23T11:05:00Z",
        "last_actor": None,
        "last_comment": None,
    },
    {
        "id": "apr-103",
        "document_id": "doc-pdpl-ar-2026",
        "document_title": "GCC Personal Data Protection & Residency Policy (PDPL)",
        "document_title_ar": "سياسة حماية البيانات الشخصية وإقامة البيانات في دول الخليج (PDPL)",
        "clause_ref": "Article 7 · Page 9",
        "clause_ref_ar": "المادة 7 · صفحة 9",
        "risk_title": "72-Hour Breach Notification SLA Confirmed",
        "risk_title_ar": "تأكيد مهلة الإبلاغ عن تسريب البيانات خلال 72 ساعة",
        "risk_summary": "Arabic PDPL policy aligns with regional 72-hour regulatory notification requirement and specifies mandatory incident containment details.",
        "risk_summary_ar": "تتوافق سياسة حماية البيانات العربية مع متطلب الإبلاغ التنظيمي خلال 72 ساعة وتحدد تفاصيل الاحتواء الإلزامية.",
        "source_excerpt": "يلتزم معالج البيانات بإخطار الجهة المختصة وصاحب البيانات خلال مدة لا تتجاوز 72 ساعة من وقت العلم بوقوع أي تسريب أو وصول غير مصرح به.",
        "severity": "Low",
        "confidence": 0.98,
        "status": "Approved",
        "assigned_role": "Admin",
        "updated_at": "2026-11-22T16:40:00Z",
        "last_actor": "Admin",
        "last_comment": "Verified alignment with regional PDPL regulatory schedule.",
    },
    {
        "id": "apr-104",
        "document_id": "doc-procurement-sop-2026",
        "document_title": "Procurement & Invoice Approval SOP (MENA Ops)",
        "document_title_ar": "إجراءات التشغيل القياسية للمشتريات واعتماد الفواتير",
        "clause_ref": "Section 2.1 · Page 3",
        "clause_ref_ar": "القسم 2.1 · صفحة 3",
        "risk_title": "Prepayment / Net-15 Exception Routing Threshold",
        "risk_title_ar": "توجيه استثناءات الدفع المسبق وشروط Net-15",
        "risk_summary": "Non-standard payment terms (Net 15 or prepayment) or invoices above $50,000 require Executive / Admin escalation before ERP release.",
        "risk_summary_ar": "تتطلب شروط الدفع غير القياسية أو الفواتير التي تتجاوز 50,000 دولار تصعيداً إدارياً قبل الاعتماد المالي.",
        "source_excerpt": "Any contract or invoice exceeding $50,000 or flagged for non-standard payment terms (Net 15 or prepayment) must be escalated to Admin / Executive Committee.",
        "severity": "Medium",
        "confidence": 0.91,
        "status": "Pending",
        "assigned_role": "Admin",
        "updated_at": "2026-11-23T12:20:00Z",
        "last_actor": None,
        "last_comment": None,
    },
]
