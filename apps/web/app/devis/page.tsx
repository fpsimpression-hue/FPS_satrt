"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ApiError, apiRequest, getLocale, type Locale, type UploadResult } from "@/lib/api";
import { portfolioCategories } from "@/lib/portfolio";

type CategoryId =
  | "enseignes"
  | "vehicules"
  | "grand-format"
  | "textile"
  | "objets-cadeaux"
  | "imprimes-papeterie"
  | "decoration-tableaux"
  | "plv-decoupe"
  | "autre";
type Step = 1 | 2 | 3;
type Fulfillment = "pickup" | "delivery";
type FileItem = { key: string; name: string; size: number; status: "uploading" | "done" | "error"; id?: string; error?: string };
type Field = "category" | "description" | "quantity" | "desiredDate" | "fullName" | "phone" | "email" | "address" | "files";
type FieldErrors = Partial<Record<Field, string>>;
type Draft = {
  step: Step;
  category: CategoryId | null;
  description: string;
  quantity: number;
  dimensions: string;
  desiredDate: string;
  designHelp: boolean;
  fullName: string;
  phone: string;
  email: string;
  whatsappOptIn: boolean;
  fulfillment: Fulfillment;
  address: string;
  files: FileItem[];
};
type Confirmation = { reference: string; firstName: string; phone: string; category: CategoryId };

const DRAFT_KEY = "fps-quote-draft-v1";
const MAX_FILES = 5;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".tif", ".tiff"];
const WHATSAPP_NUMBER = "21623267178";
const QUICK_QUANTITIES = [1, 10, 50, 100, 500];

const categoryCovers: Record<Exclude<CategoryId, "autre">, string> = {
  enseignes: "/portfolio/enseignes/08.jpg",
  vehicules: "/portfolio/vehicules/02.jpg",
  "grand-format": "/portfolio/grand-format/11.jpg",
  textile: "/portfolio/textile/02.jpg",
  "objets-cadeaux": "/portfolio/objets-cadeaux/04.jpg",
  "imprimes-papeterie": "/portfolio/imprimes-papeterie/04.jpg",
  "decoration-tableaux": "/portfolio/decoration-tableaux/08.jpg",
  "plv-decoupe": "/portfolio/plv-decoupe/03.jpg",
};

const categoryIds: CategoryId[] = [...portfolioCategories.map((category) => category.id), "autre"].filter(isCategoryId);

const emptyDraft: Draft = {
  step: 1,
  category: null,
  description: "",
  quantity: 1,
  dimensions: "",
  desiredDate: "",
  designHelp: false,
  fullName: "",
  phone: "",
  email: "",
  whatsappOptIn: false,
  fulfillment: "pickup",
  address: "",
  files: [],
};

const copy = {
  fr: {
    eyebrow: "Demande de devis · Fast Print Sahline",
    title: "Votre devis en 3 étapes.",
    intro: "Décrivez votre projet et ajoutez vos fichiers si vous en avez : l’atelier étudie votre demande et vous recontacte avec un prix adapté.",
    trust: ["Sans engagement", "Fichiers vérifiés par l’atelier", "Suivi par téléphone ou WhatsApp"],
    steps: ["Votre projet", "Les détails", "Vos coordonnées"],
    stepOf: (step: number) => `Étape ${step} sur 3`,
    projectTitle: "Quel est votre projet ?",
    projectIntro: "Choisissez le type de réalisation le plus proche. Vous pourrez tout préciser ensuite.",
    other: "Autre projet",
    otherText: "Une idée originale ? Décrivez-la-nous.",
    catalogueHint: "Vous connaissez déjà votre produit ?",
    catalogueLink: "Commandez en ligne depuis le catalogue",
    detailsTitle: "Parlez-nous de votre projet",
    detailsIntro: "Plus votre description est précise, plus notre réponse sera rapide et juste.",
    description: "Description du projet",
    suggestions: "Idées rapides",
    quantity: "Quantité",
    less: "Diminuer la quantité",
    more: "Augmenter la quantité",
    dimensions: "Format ou dimensions",
    dimensionsPlaceholder: "Ex. 200 × 60 cm, A5, tailles S à XL…",
    optional: "facultatif",
    desiredDate: "Pour quand ?",
    designHelp: "J’ai besoin d’aide pour la création graphique",
    designHelpText: "Notre équipe peut créer ou adapter votre visuel.",
    files: "Vos fichiers",
    filesHint: "Logo, maquette ou photo d’inspiration : tout nous aide.",
    drop: "Glissez vos fichiers ici",
    browse: "ou parcourez votre appareil",
    fileRules: "PDF, PNG, JPEG ou TIFF · 25 Mo maximum · 5 fichiers",
    uploading: "Envoi…",
    uploaded: "Ajouté",
    remove: "Retirer",
    contactTitle: "Comment vous recontacter ?",
    contactIntro: "Nous utilisons ces informations uniquement pour répondre à votre demande.",
    fullName: "Nom complet",
    phone: "Téléphone",
    phonePlaceholder: "Ex. 23 267 178",
    email: "E-mail",
    whatsappOptIn: "Recevoir le suivi sur WhatsApp",
    whatsappOptInText: "Nous vous enverrons la confirmation et l’avancement de votre demande.",
    reception: "Réception",
    pickup: "Retrait à l’atelier",
    pickupText: "À Sahline, Monastir",
    delivery: "Livraison",
    deliveryText: "Frais confirmés avec le devis",
    address: "Adresse de livraison",
    back: "Retour",
    next: "Continuer",
    submit: "Envoyer ma demande",
    sending: "Envoi en cours…",
    privacy: "En envoyant ce formulaire, vous acceptez d’être recontacté au sujet de cette demande.",
    summaryTitle: "Votre demande",
    summaryEmpty: "Choisissez un projet pour commencer.",
    summaryQuantity: "Quantité",
    summaryFormat: "Format",
    summaryDate: "Pour le",
    summaryDesign: "Aide graphique",
    summaryFiles: "Fichiers",
    summaryReception: "Réception",
    edit: "Modifier",
    yes: "Oui",
    notSet: "—",
    draftSaved: "Brouillon enregistré sur cet appareil",
    help: "Une question ?",
    call: "Appeler l’atelier",
    chat: "Écrire sur WhatsApp",
    errors: {
      category: "Choisissez le type de projet.",
      description: "Décrivez votre projet en quelques mots (10 caractères minimum).",
      quantity: "Indiquez une quantité entre 1 et 100 000.",
      desiredDate: "Choisissez une date à partir d’aujourd’hui.",
      fullName: "Indiquez votre nom (2 caractères minimum).",
      phone: "Indiquez un numéro de téléphone valide.",
      whatsappPhone: "Pour WhatsApp, indiquez un numéro tunisien (8 chiffres) ou international (+…).",
      email: "Cette adresse e-mail ne semble pas valide.",
      address: "Indiquez une adresse de livraison complète (10 caractères minimum).",
      filesBusy: "Patientez jusqu’à la fin de l’envoi des fichiers.",
      fileType: "Format non accepté : utilisez PDF, PNG, JPEG ou TIFF.",
      fileSize: "Ce fichier dépasse 25 Mo.",
      fileCount: "Vous pouvez joindre 5 fichiers au maximum.",
      uploadFailed: "L’envoi a échoué. Réessayez.",
      filesUnavailable: "Un fichier n’a pas pu être joint. Retirez-le puis ajoutez-le à nouveau.",
      invalid: "Certaines informations sont incomplètes. Vérifiez les champs signalés.",
      network: "Connexion impossible pour le moment. Réessayez dans un instant ou envoyez votre demande sur WhatsApp.",
    },
    fallback: "Envoyer sur WhatsApp",
    successTitle: (name: string) => `Merci ${name}, votre demande est bien enregistrée !`,
    successText: "Conservez votre référence : elle permet à l’atelier de retrouver votre demande rapidement.",
    reference: "Référence",
    copy: "Copier",
    copied: "Copié",
    nextTitle: "Et maintenant ?",
    nextSteps: (phone: string) => [
      "L’atelier étudie votre projet et vos fichiers.",
      `Nous vous contactons au ${phone} pour préciser les détails et le prix.`,
      "Vous validez le devis : la production démarre.",
    ],
    follow: "Suivre sur WhatsApp",
    newRequest: "Faire une autre demande",
    gallery: "Voir nos réalisations",
    whatsappGreeting: "Bonjour Fast Print Sahline,",
    whatsappSent: (reference: string) => `je viens d’envoyer la demande de devis ${reference}.`,
    whatsappRequest: "je souhaite un devis pour ce projet :",
    placeholders: {
      enseignes: "Ex. Enseigne lumineuse pour la façade de ma boutique, avec mon logo, environ 2 m de large.",
      vehicules: "Ex. Logo et coordonnées sur les deux portières d’un utilitaire.",
      "grand-format": "Ex. Une banderole et deux roll-ups pour un salon le mois prochain.",
      textile: "Ex. 25 t-shirts noirs avec un logo devant et un prénom au dos.",
      "objets-cadeaux": "Ex. 12 trophées gravés pour un tournoi de football.",
      "imprimes-papeterie": "Ex. 500 cartes de visite recto verso et 1 000 flyers A5.",
      "decoration-tableaux": "Ex. Un tableau calligraphie doré de 90 × 60 cm pour un salon.",
      "plv-decoupe": "Ex. Une découpe PVC de 1,5 m pour une vitrine.",
      autre: "Décrivez votre idée : support, quantité, usage, délai…",
    },
    ideas: {
      enseignes: ["Enseigne lumineuse", "Lettres en relief", "Panneau de façade", "Signalétique intérieure"],
      vehicules: ["Logo sur portières", "Habillage complet", "Vitres arrière"],
      "grand-format": ["Banderole", "Roll-up", "Stand d’exposition", "Drapeaux"],
      textile: ["T-shirts", "Tenues d’équipe", "Sweats", "Tabliers"],
      "objets-cadeaux": ["Trophées", "Médailles", "Mugs", "Porte-clés"],
      "imprimes-papeterie": ["Cartes de visite", "Flyers", "Menus", "Sacs personnalisés"],
      "decoration-tableaux": ["Tableau calligraphie", "Toile imprimée", "Décor mural en relief"],
      "plv-decoupe": ["Découpe PVC", "Présentoir", "Comptoir promotionnel"],
      autre: ["Idée à discuter", "Projet événementiel", "Cadeau sur mesure"],
    },
  },
  ar: {
    eyebrow: "طلب عرض سعر · Fast Print Sahline",
    title: "عرض سعركم في 3 خطوات.",
    intro: "صفوا مشروعكم وأضيفوا ملفاتكم إن وُجدت: تدرس الورشة طلبكم وتتواصل معكم بسعر مناسب.",
    trust: ["دون أي التزام", "مراجعة الملفات من الورشة", "متابعة بالهاتف أو واتساب"],
    steps: ["مشروعكم", "التفاصيل", "بيانات الاتصال"],
    stepOf: (step: number) => `الخطوة ${step} من 3`,
    projectTitle: "ما هو مشروعكم؟",
    projectIntro: "اختاروا نوع الإنجاز الأقرب، ويمكنكم توضيح كل شيء بعد ذلك.",
    other: "مشروع آخر",
    otherText: "فكرة مختلفة؟ صفوها لنا.",
    catalogueHint: "تعرفون المنتج المطلوب؟",
    catalogueLink: "اطلبوا مباشرة من الكتالوج",
    detailsTitle: "حدّثونا عن مشروعكم",
    detailsIntro: "كلما كان الوصف دقيقاً، كان ردّنا أسرع وأدق.",
    description: "وصف المشروع",
    suggestions: "أفكار سريعة",
    quantity: "الكمية",
    less: "إنقاص الكمية",
    more: "زيادة الكمية",
    dimensions: "المقاس أو الأبعاد",
    dimensionsPlaceholder: "مثال: 200 × 60 سم، A5، مقاسات S إلى XL…",
    optional: "اختياري",
    desiredDate: "متى تحتاجونه؟",
    designHelp: "أحتاج إلى مساعدة في التصميم",
    designHelpText: "يمكن لفريقنا تصميم ملفكم أو تعديله.",
    files: "ملفاتكم",
    filesHint: "شعار أو نموذج أو صورة للإلهام: كل ذلك يساعدنا.",
    drop: "اسحبوا ملفاتكم إلى هنا",
    browse: "أو اختاروها من جهازكم",
    fileRules: "PDF أو PNG أو JPEG أو TIFF · 25 م.ب كحد أقصى · 5 ملفات",
    uploading: "جارٍ الإرسال…",
    uploaded: "تمت الإضافة",
    remove: "حذف",
    contactTitle: "كيف نتواصل معكم؟",
    contactIntro: "نستخدم هذه البيانات فقط للرد على طلبكم.",
    fullName: "الاسم الكامل",
    phone: "الهاتف",
    phonePlaceholder: "مثال: 23 267 178",
    email: "البريد الإلكتروني",
    whatsappOptIn: "تلقي المتابعة عبر واتساب",
    whatsappOptInText: "نرسل لكم التأكيد ومراحل تقدّم طلبكم.",
    reception: "الاستلام",
    pickup: "الاستلام من الورشة",
    pickupText: "في الساحلين، المنستير",
    delivery: "التوصيل",
    deliveryText: "تُؤكَّد الرسوم مع عرض السعر",
    address: "عنوان التوصيل",
    back: "رجوع",
    next: "متابعة",
    submit: "إرسال طلبي",
    sending: "جارٍ الإرسال…",
    privacy: "بإرسال هذه الاستمارة، توافقون على أن نتواصل معكم بخصوص هذا الطلب.",
    summaryTitle: "طلبكم",
    summaryEmpty: "اختاروا مشروعاً للبدء.",
    summaryQuantity: "الكمية",
    summaryFormat: "المقاس",
    summaryDate: "التاريخ",
    summaryDesign: "مساعدة في التصميم",
    summaryFiles: "الملفات",
    summaryReception: "الاستلام",
    edit: "تعديل",
    yes: "نعم",
    notSet: "—",
    draftSaved: "تم حفظ المسودة على هذا الجهاز",
    help: "لديكم سؤال؟",
    call: "الاتصال بالورشة",
    chat: "الكتابة عبر واتساب",
    errors: {
      category: "اختاروا نوع المشروع.",
      description: "صفوا مشروعكم ببضع كلمات (10 أحرف على الأقل).",
      quantity: "أدخلوا كمية بين 1 و100000.",
      desiredDate: "اختاروا تاريخاً ابتداءً من اليوم.",
      fullName: "أدخلوا اسمكم (حرفان على الأقل).",
      phone: "أدخلوا رقم هاتف صالحاً.",
      whatsappPhone: "لواتساب، أدخلوا رقماً تونسياً (8 أرقام) أو دولياً (+…).",
      email: "يبدو أن هذا البريد الإلكتروني غير صالح.",
      address: "أدخلوا عنوان توصيل كاملاً (10 أحرف على الأقل).",
      filesBusy: "انتظروا حتى ينتهي إرسال الملفات.",
      fileType: "صيغة غير مقبولة: استعملوا PDF أو PNG أو JPEG أو TIFF.",
      fileSize: "يتجاوز هذا الملف 25 م.ب.",
      fileCount: "يمكنكم إرفاق 5 ملفات كحد أقصى.",
      uploadFailed: "تعذّر الإرسال. أعيدوا المحاولة.",
      filesUnavailable: "تعذّر إرفاق أحد الملفات. احذفوه ثم أضيفوه من جديد.",
      invalid: "بعض المعلومات غير مكتملة. راجعوا الحقول المشار إليها.",
      network: "تعذّر الاتصال حالياً. أعيدوا المحاولة بعد قليل أو أرسلوا طلبكم عبر واتساب.",
    },
    fallback: "الإرسال عبر واتساب",
    successTitle: (name: string) => `شكراً ${name}، تم تسجيل طلبكم بنجاح!`,
    successText: "احتفظوا بالمرجع: يساعد الورشة على إيجاد طلبكم بسرعة.",
    reference: "المرجع",
    copy: "نسخ",
    copied: "تم النسخ",
    nextTitle: "ما الخطوة التالية؟",
    nextSteps: (phone: string) => [
      "تدرس الورشة مشروعكم وملفاتكم.",
      `نتصل بكم على الرقم ${phone} لتوضيح التفاصيل والسعر.`,
      "توافقون على العرض فيبدأ الإنتاج.",
    ],
    follow: "المتابعة عبر واتساب",
    newRequest: "طلب جديد",
    gallery: "شاهدوا أعمالنا",
    whatsappGreeting: "مرحباً Fast Print Sahline،",
    whatsappSent: (reference: string) => `أرسلت للتو طلب عرض السعر ${reference}.`,
    whatsappRequest: "أرغب في عرض سعر لهذا المشروع:",
    placeholders: {
      enseignes: "مثال: لافتة مضيئة لواجهة متجري مع الشعار، بعرض مترين تقريباً.",
      vehicules: "مثال: شعار وبيانات الاتصال على بابي سيارة نفعية.",
      "grand-format": "مثال: لافتة قماشية ورول أب اثنان لمعرض الشهر القادم.",
      textile: "مثال: 25 قميصاً أسود مع شعار في الأمام واسم في الخلف.",
      "objets-cadeaux": "مثال: 12 كأساً محفورة لدورة كرة قدم.",
      "imprimes-papeterie": "مثال: 500 بطاقة أعمال على الوجهين و1000 منشور A5.",
      "decoration-tableaux": "مثال: لوحة خط عربي ذهبية 90 × 60 سم لصالون.",
      "plv-decoupe": "مثال: قصّة PVC بطول 1.5 م لواجهة متجر.",
      autre: "صفوا فكرتكم: نوع المادة، الكمية، الاستعمال، الموعد…",
    },
    ideas: {
      enseignes: ["لافتة مضيئة", "حروف بارزة", "لافتة واجهة", "إشارات داخلية"],
      vehicules: ["شعار على الأبواب", "تغليف كامل", "النوافذ الخلفية"],
      "grand-format": ["لافتة قماشية", "رول أب", "جناح عرض", "أعلام"],
      textile: ["قمصان", "أزياء الفريق", "سترات", "مآزر"],
      "objets-cadeaux": ["كؤوس", "ميداليات", "أكواب", "حاملات مفاتيح"],
      "imprimes-papeterie": ["بطاقات أعمال", "منشورات", "قوائم طعام", "أكياس مخصصة"],
      "decoration-tableaux": ["لوحة خط عربي", "لوحة مطبوعة", "ديكور جداري بارز"],
      "plv-decoupe": ["قصّة PVC", "حامل عرض", "منضدة ترويجية"],
      autre: ["فكرة للنقاش", "مشروع مناسبة", "هدية حسب الطلب"],
    },
  },
  en: {
    eyebrow: "Quote request · Fast Print Sahline",
    title: "Your quote in 3 steps.",
    intro: "Describe your project and add your files if you have any: the workshop reviews your request and gets back to you with the right price.",
    trust: ["No commitment", "Files checked by the workshop", "Follow-up by phone or WhatsApp"],
    steps: ["Your project", "The details", "Your contact details"],
    stepOf: (step: number) => `Step ${step} of 3`,
    projectTitle: "What is your project?",
    projectIntro: "Pick the closest type of work. You can add every detail next.",
    other: "Something else",
    otherText: "An original idea? Tell us about it.",
    catalogueHint: "Already know the product you need?",
    catalogueLink: "Order online from the catalogue",
    detailsTitle: "Tell us about your project",
    detailsIntro: "The more precise your description, the faster and more accurate our answer.",
    description: "Project description",
    suggestions: "Quick ideas",
    quantity: "Quantity",
    less: "Decrease quantity",
    more: "Increase quantity",
    dimensions: "Format or dimensions",
    dimensionsPlaceholder: "E.g. 200 × 60 cm, A5, sizes S to XL…",
    optional: "optional",
    desiredDate: "Needed by",
    designHelp: "I need help with the design",
    designHelpText: "Our team can create or adapt your artwork.",
    files: "Your files",
    filesHint: "Logo, mock-up or inspiration photo: everything helps.",
    drop: "Drop your files here",
    browse: "or browse your device",
    fileRules: "PDF, PNG, JPEG or TIFF · 25 MB max · 5 files",
    uploading: "Uploading…",
    uploaded: "Added",
    remove: "Remove",
    contactTitle: "How can we reach you?",
    contactIntro: "We only use these details to answer your request.",
    fullName: "Full name",
    phone: "Phone",
    phonePlaceholder: "E.g. 23 267 178",
    email: "Email",
    whatsappOptIn: "Get updates on WhatsApp",
    whatsappOptInText: "We will send the confirmation and progress of your request.",
    reception: "Fulfilment",
    pickup: "Workshop pickup",
    pickupText: "In Sahline, Monastir",
    delivery: "Delivery",
    deliveryText: "Fees confirmed with the quote",
    address: "Delivery address",
    back: "Back",
    next: "Continue",
    submit: "Send my request",
    sending: "Sending…",
    privacy: "By sending this form, you agree to be contacted about this request.",
    summaryTitle: "Your request",
    summaryEmpty: "Pick a project to get started.",
    summaryQuantity: "Quantity",
    summaryFormat: "Format",
    summaryDate: "Needed by",
    summaryDesign: "Design help",
    summaryFiles: "Files",
    summaryReception: "Fulfilment",
    edit: "Edit",
    yes: "Yes",
    notSet: "—",
    draftSaved: "Draft saved on this device",
    help: "Any questions?",
    call: "Call the workshop",
    chat: "Message on WhatsApp",
    errors: {
      category: "Pick a project type.",
      description: "Describe your project in a few words (at least 10 characters).",
      quantity: "Enter a quantity between 1 and 100,000.",
      desiredDate: "Pick a date from today onwards.",
      fullName: "Enter your name (at least 2 characters).",
      phone: "Enter a valid phone number.",
      whatsappPhone: "For WhatsApp, enter a Tunisian (8 digits) or international (+…) number.",
      email: "This email address does not look valid.",
      address: "Enter a full delivery address (at least 10 characters).",
      filesBusy: "Please wait until your files finish uploading.",
      fileType: "Unsupported format: use PDF, PNG, JPEG or TIFF.",
      fileSize: "This file is larger than 25 MB.",
      fileCount: "You can attach up to 5 files.",
      uploadFailed: "Upload failed. Please try again.",
      filesUnavailable: "A file could not be attached. Remove it and add it again.",
      invalid: "Some details are incomplete. Check the highlighted fields.",
      network: "We cannot connect right now. Try again in a moment or send your request on WhatsApp.",
    },
    fallback: "Send on WhatsApp",
    successTitle: (name: string) => `Thank you ${name}, your request is saved!`,
    successText: "Keep your reference: it helps the workshop find your request quickly.",
    reference: "Reference",
    copy: "Copy",
    copied: "Copied",
    nextTitle: "What happens next?",
    nextSteps: (phone: string) => [
      "The workshop reviews your project and files.",
      `We call you on ${phone} to confirm the details and price.`,
      "You approve the quote and production begins.",
    ],
    follow: "Follow up on WhatsApp",
    newRequest: "Make another request",
    gallery: "See our work",
    whatsappGreeting: "Hello Fast Print Sahline,",
    whatsappSent: (reference: string) => `I have just sent quote request ${reference}.`,
    whatsappRequest: "I would like a quote for this project:",
    placeholders: {
      enseignes: "E.g. An illuminated shopfront sign with my logo, about 2 m wide.",
      vehicules: "E.g. Logo and contact details on both doors of a van.",
      "grand-format": "E.g. One banner and two roll-ups for a trade show next month.",
      textile: "E.g. 25 black T-shirts with a logo on the front and a name on the back.",
      "objets-cadeaux": "E.g. 12 engraved trophies for a football tournament.",
      "imprimes-papeterie": "E.g. 500 double-sided business cards and 1,000 A5 flyers.",
      "decoration-tableaux": "E.g. A 90 × 60 cm gold calligraphy artwork for a living room.",
      "plv-decoupe": "E.g. A 1.5 m PVC cutout for a shop window.",
      autre: "Describe your idea: material, quantity, use, deadline…",
    },
    ideas: {
      enseignes: ["Illuminated sign", "Raised letters", "Shopfront panel", "Indoor signage"],
      vehicules: ["Door logos", "Full wrap", "Rear windows"],
      "grand-format": ["Banner", "Roll-up", "Exhibition booth", "Flags"],
      textile: ["T-shirts", "Team wear", "Sweatshirts", "Aprons"],
      "objets-cadeaux": ["Trophies", "Medals", "Mugs", "Keyrings"],
      "imprimes-papeterie": ["Business cards", "Flyers", "Menus", "Custom bags"],
      "decoration-tableaux": ["Calligraphy artwork", "Printed canvas", "Raised wall decor"],
      "plv-decoupe": ["PVC cutout", "Display stand", "Promo counter"],
      autre: ["Idea to discuss", "Event project", "Custom gift"],
    },
  },
} as const;

function isCategoryId(value: string): value is CategoryId {
  return ["enseignes", "vehicules", "grand-format", "textile", "objets-cadeaux", "imprimes-papeterie", "decoration-tableaux", "plv-decoupe", "autre"].includes(value);
}

function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** Mirrors the API: Tunisian 8-digit numbers get +216, other numbers must be international. */
function whatsappNumber(phone: string): string | null {
  let compact = phone.replace(/[\s().-]/g, "");
  if (compact.startsWith("00")) compact = `+${compact.slice(2)}`;
  else if (/^\d{8}$/.test(compact)) compact = `+216${compact}`;
  else if (/^216\d{8}$/.test(compact)) compact = `+${compact}`;
  return /^\+[1-9]\d{7,14}$/.test(compact) ? compact : null;
}

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

function readDraft(): Draft | null {
  try {
    const saved = window.localStorage.getItem(DRAFT_KEY);
    if (!saved) return null;
    const draft = { ...emptyDraft, ...(JSON.parse(saved) as Partial<Draft>) };
    // Only completed uploads survive a reload; interrupted ones must be added again.
    draft.files = draft.files.filter((file) => file.status === "done" && file.id);
    if (draft.category && !isCategoryId(draft.category)) draft.category = null;
    if (!draft.category || ![1, 2, 3].includes(draft.step)) draft.step = 1;
    return draft;
  } catch {
    return null;
  }
}

function CategoryIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export default function QuotePage() {
  const [locale, setLocale] = useState<Locale>("fr");
  const [form, setForm] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [copied, setCopied] = useState(false);
  const [website, setWebsite] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const wizardRef = useRef<HTMLDivElement>(null);
  const text = copy[locale];
  const uploading = form.files.some((file) => file.status === "uploading");

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLocale);
    window.history.replaceState(null, "", url);
  }

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitError("");
  }

  function categoryTitle(id: CategoryId): string {
    if (id === "autre") return text.other;
    return portfolioCategories.find((category) => category.id === id)?.title[locale] ?? id;
  }

  useEffect(() => {
    setLocale(getLocale());
    const draft = readDraft() ?? emptyDraft;
    const requested = new URLSearchParams(window.location.search).get("projet");
    if (requested && isCategoryId(requested)) {
      draft.category = requested;
      draft.step = draft.step === 1 ? 2 : draft.step;
    }
    setForm(draft);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || confirmation) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      // Private browsing or full storage: the form still works without a draft.
    }
  }, [form, hydrated, confirmation]);

  function validate(step: Step): FieldErrors {
    const found: FieldErrors = {};
    if (step === 1 && !form.category) found.category = text.errors.category;
    if (step === 2) {
      if (form.description.trim().length < 10) found.description = text.errors.description;
      if (!Number.isInteger(form.quantity) || form.quantity < 1 || form.quantity > 100_000) found.quantity = text.errors.quantity;
      if (form.desiredDate && form.desiredDate < todayIso()) found.desiredDate = text.errors.desiredDate;
      if (uploading) found.files = text.errors.filesBusy;
    }
    if (step === 3) {
      if (form.fullName.trim().length < 2) found.fullName = text.errors.fullName;
      const phone = form.phone.trim();
      if (phone.length < 7 || !/^\+?[0-9][0-9\s().-]{5,38}$/.test(phone)) found.phone = text.errors.phone;
      else if (form.whatsappOptIn && !whatsappNumber(phone)) found.phone = text.errors.whatsappPhone;
      if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) found.email = text.errors.email;
      if (form.fulfillment === "delivery" && form.address.trim().length < 10) found.address = text.errors.address;
    }
    return found;
  }

  function focusFirstError(found: FieldErrors) {
    const first = (Object.keys(found) as Field[])[0];
    if (first) window.requestAnimationFrame(() => document.getElementById(`quote-${first}`)?.focus());
  }

  function goTo(step: Step) {
    setForm((current) => ({ ...current, step }));
    setSubmitError("");
    window.requestAnimationFrame(() => {
      wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      headingRef.current?.focus({ preventScroll: true });
    });
  }

  function next() {
    const found = validate(form.step);
    setErrors(found);
    if (Object.keys(found).length) {
      focusFirstError(found);
      return;
    }
    goTo((form.step + 1) as Step);
  }

  async function uploadFile(item: FileItem, file: File) {
    const data = new FormData();
    data.append("file", file);
    try {
      const uploaded = await apiRequest<UploadResult>("/uploads", { method: "POST", body: data });
      setForm((current) => ({
        ...current,
        files: current.files.map((entry) => (entry.key === item.key ? { ...entry, status: "done", id: uploaded.id } : entry)),
      }));
    } catch (cause) {
      const status = cause instanceof ApiError ? cause.status : 0;
      const message = status === 413 ? text.errors.fileSize : status === 415 ? text.errors.fileType : text.errors.uploadFailed;
      setForm((current) => ({
        ...current,
        files: current.files.map((entry) => (entry.key === item.key ? { ...entry, status: "error", error: message } : entry)),
      }));
    }
  }

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const incoming = Array.from(list);
    const available = MAX_FILES - form.files.length;
    const accepted: { item: FileItem; file: File }[] = [];
    const rejected: FileItem[] = [];

    incoming.forEach((file, index) => {
      const key = `${Date.now()}-${index}-${file.name}`;
      const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      const base = { key, name: file.name, size: file.size };
      if (index >= available) return;
      if (!ACCEPTED_EXTENSIONS.includes(extension)) rejected.push({ ...base, status: "error", error: text.errors.fileType });
      else if (file.size > MAX_FILE_BYTES) rejected.push({ ...base, status: "error", error: text.errors.fileSize });
      else accepted.push({ item: { ...base, status: "uploading" }, file });
    });

    setErrors((current) => ({ ...current, files: incoming.length > available ? text.errors.fileCount : undefined }));
    setForm((current) => ({ ...current, files: [...current.files, ...accepted.map(({ item }) => item), ...rejected] }));
    accepted.forEach(({ item, file }) => void uploadFile(item, file));
  }

  function removeFile(key: string) {
    setForm((current) => ({ ...current, files: current.files.filter((file) => file.key !== key) }));
    setErrors((current) => ({ ...current, files: undefined }));
  }

  // Suggestions only append text, so nothing the visitor typed is ever removed.
  function addIdea(idea: string) {
    const description = form.description.trim();
    update("description", description ? `${description}, ${idea}` : idea);
  }

  function whatsappLink(reference?: string): string {
    const lines = [
      text.whatsappGreeting,
      reference ? text.whatsappSent(reference) : text.whatsappRequest,
      form.category ? `• ${categoryTitle(form.category)}` : "",
      form.description.trim() ? `• ${form.description.trim()}` : "",
      `• ${text.quantity} : ${form.quantity}`,
      form.dimensions.trim() ? `• ${text.dimensions} : ${form.dimensions.trim()}` : "",
      form.desiredDate ? `• ${text.desiredDate} ${form.desiredDate}` : "",
      form.fullName.trim() ? `— ${form.fullName.trim()}` : "",
    ].filter(Boolean);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.step !== 3) {
      next();
      return;
    }
    for (const step of [1, 2, 3] as Step[]) {
      const found = validate(step);
      if (Object.keys(found).length) {
        setErrors(found);
        if (step !== 3) goTo(step);
        focusFirstError(found);
        return;
      }
    }

    setBusy(true);
    setSubmitError("");
    try {
      const result = await apiRequest<{ reference: string }>("/project-quote-requests", {
        method: "POST",
        body: JSON.stringify({
          category: form.category,
          description: form.description.trim(),
          quantity: form.quantity,
          dimensions: form.dimensions.trim() || null,
          desired_date: form.desiredDate || null,
          design_help: form.designHelp,
          customer: {
            full_name: form.fullName.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || undefined,
            locale,
            whatsapp_opt_in: form.whatsappOptIn,
          },
          file_ids: form.files.flatMap((file) => (file.status === "done" && file.id ? [file.id] : [])),
          fulfillment_method: form.fulfillment,
          delivery_address: form.fulfillment === "delivery" ? form.address.trim() : null,
          website,
        }),
      });
      setConfirmation({
        reference: result.reference,
        firstName: form.fullName.trim().split(/\s+/)[0],
        phone: form.phone.trim(),
        category: form.category as CategoryId,
      });
      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Nothing to clean up when storage is unavailable.
      }
      window.requestAnimationFrame(() => {
        wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        document.getElementById("quote-success-title")?.focus({ preventScroll: true });
      });
    } catch (cause) {
      const status = cause instanceof ApiError ? cause.status : 0;
      setSubmitError(status === 409 ? text.errors.filesUnavailable : status === 422 ? text.errors.invalid : text.errors.network);
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    setConfirmation(null);
    setCopied(false);
    setErrors({});
    setForm(emptyDraft);
  }

  async function copyReference() {
    if (!confirmation) return;
    try {
      await navigator.clipboard.writeText(confirmation.reference);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const fieldProps = (field: Field) => ({
    id: `quote-${field}`,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `quote-${field}-error` : undefined,
  });
  const fieldError = (field: Field) =>
    errors[field] ? <p className="quote-field-error" id={`quote-${field}-error`}>{errors[field]}</p> : null;

  const selectedCover = form.category && form.category !== "autre" ? categoryCovers[form.category] : null;
  const doneFiles = form.files.filter((file) => file.status === "done").length;

  return (
    <main className="shop-page quote-page" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <SiteHeader locale={locale} onLocaleChange={changeLocale} />

      <section className="quote-hero">
        <p className="eyebrow"><span />{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p>{text.intro}</p>
        <ul className="quote-trust">
          {text.trust.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <div className="quote-layout" ref={wizardRef}>
        {confirmation ? (
          <section className="quote-card quote-success" aria-labelledby="quote-success-title">
            <span className="quote-success-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
            </span>
            <h2 id="quote-success-title" tabIndex={-1}>{text.successTitle(confirmation.firstName)}</h2>
            <p>{text.successText}</p>
            <div className="quote-reference">
              <span>{text.reference}</span>
              <strong dir="ltr">{confirmation.reference}</strong>
              <button onClick={() => void copyReference()} type="button">{copied ? text.copied : text.copy}</button>
            </div>
            <h3>{text.nextTitle}</h3>
            <ol className="quote-next-steps">
              {text.nextSteps(confirmation.phone).map((step) => <li key={step}>{step}</li>)}
            </ol>
            <div className="quote-success-actions">
              <a className="button button-whatsapp" href={whatsappLink(confirmation.reference)} rel="noreferrer" target="_blank">{text.follow}<span aria-hidden="true">↗</span></a>
              <a className="button button-outline" href={`/realisations?lang=${locale}#portfolio-${confirmation.category === "autre" ? "enseignes" : confirmation.category}`}>{text.gallery}</a>
              <button className="text-link" onClick={restart} type="button">{text.newRequest}<span aria-hidden="true">→</span></button>
            </div>
          </section>
        ) : (
          <form className="quote-card quote-wizard" noValidate onSubmit={(event) => void submit(event)}>
            <ol className="quote-stepper">
              {text.steps.map((label, index) => {
                const step = (index + 1) as Step;
                const state = step < form.step ? "done" : step === form.step ? "current" : "todo";
                return (
                  <li aria-current={state === "current" ? "step" : undefined} className={`quote-stepper-item is-${state}`} key={label}>
                    <button disabled={step >= form.step} onClick={() => goTo(step)} type="button">
                      <span aria-hidden="true">{state === "done" ? "✓" : step}</span>
                      {label}
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="quote-progress" aria-hidden="true"><span style={{ width: `${(form.step / 3) * 100}%` }} /></div>

            {form.step === 1 && (
              <fieldset className="quote-step" aria-describedby="quote-step-1-intro">
                <legend className="quote-step-heading">
                  <small>{text.stepOf(1)}</small>
                  <span ref={headingRef} tabIndex={-1}>{text.projectTitle}</span>
                </legend>
                <p className="quote-step-intro" id="quote-step-1-intro">{text.projectIntro}</p>
                <div className="quote-categories" id="quote-category" tabIndex={-1}>
                  {categoryIds.map((id) => (
                    <label className={form.category === id ? "quote-category is-selected" : "quote-category"} key={id}>
                      <input checked={form.category === id} name="category" onChange={() => update("category", id)} type="radio" value={id} />
                      {id === "autre" ? (
                        <span className="quote-category-media quote-category-other"><CategoryIcon /></span>
                      ) : (
                        <span className="quote-category-media"><Image alt="" fill sizes="(max-width: 600px) 45vw, 220px" src={categoryCovers[id]} /></span>
                      )}
                      <span className="quote-category-name">{categoryTitle(id)}</span>
                      {id === "autre" && <span className="quote-category-text">{text.otherText}</span>}
                      <span className="quote-category-check" aria-hidden="true">✓</span>
                    </label>
                  ))}
                </div>
                {fieldError("category")}
                <p className="quote-catalogue-hint">
                  {text.catalogueHint} <a href={`/catalogue?lang=${locale}`}>{text.catalogueLink}<span aria-hidden="true"> →</span></a>
                </p>
              </fieldset>
            )}

            {form.step === 2 && form.category && (
              <fieldset className="quote-step">
                <legend className="quote-step-heading">
                  <small>{text.stepOf(2)}</small>
                  <span ref={headingRef} tabIndex={-1}>{text.detailsTitle}</span>
                </legend>
                <p className="quote-step-intro">{text.detailsIntro}</p>

                <div className="quote-field">
                  <label htmlFor="quote-description">{text.description}</label>
                  <textarea
                    {...fieldProps("description")}
                    maxLength={2000}
                    onChange={(event) => update("description", event.target.value)}
                    placeholder={text.placeholders[form.category]}
                    rows={5}
                    value={form.description}
                  />
                  <div className="quote-ideas" role="group" aria-label={text.suggestions}>
                    <span>{text.suggestions}</span>
                    {text.ideas[form.category].map((idea) => {
                      const added = form.description.includes(idea);
                      return (
                        <button className={added ? "is-added" : undefined} disabled={added} key={idea} onClick={() => addIdea(idea)} type="button">
                          <span aria-hidden="true">{added ? "✓" : "+"}</span>{idea}
                        </button>
                      );
                    })}
                  </div>
                  {fieldError("description")}
                </div>

                <div className="quote-grid-2">
                  <div className="quote-field">
                    <label htmlFor="quote-quantity">{text.quantity}</label>
                    <div className="quote-stepper-input">
                      <button aria-label={text.less} disabled={form.quantity <= 1} onClick={() => update("quantity", Math.max(1, form.quantity - 1))} type="button">−</button>
                      <input
                        {...fieldProps("quantity")}
                        inputMode="numeric"
                        max={100000}
                        min={1}
                        onChange={(event) => update("quantity", Math.round(Number(event.target.value)) || 0)}
                        type="number"
                        value={form.quantity || ""}
                      />
                      <button aria-label={text.more} onClick={() => update("quantity", Math.min(100_000, form.quantity + 1))} type="button">+</button>
                    </div>
                    <div className="quote-quick-quantities">
                      {QUICK_QUANTITIES.map((value) => (
                        <button aria-pressed={form.quantity === value} key={value} onClick={() => update("quantity", value)} type="button">{value}</button>
                      ))}
                    </div>
                    {fieldError("quantity")}
                  </div>
                  <div className="quote-field">
                    <label htmlFor="quote-dimensions">{text.dimensions} <small>({text.optional})</small></label>
                    <input id="quote-dimensions" maxLength={200} onChange={(event) => update("dimensions", event.target.value)} placeholder={text.dimensionsPlaceholder} value={form.dimensions} />
                    <label className="quote-subfield" htmlFor="quote-desiredDate">{text.desiredDate} <small>({text.optional})</small></label>
                    <input {...fieldProps("desiredDate")} min={todayIso()} onChange={(event) => update("desiredDate", event.target.value)} type="date" value={form.desiredDate} />
                    {fieldError("desiredDate")}
                  </div>
                </div>

                <label className="quote-switch">
                  <input checked={form.designHelp} onChange={(event) => update("designHelp", event.target.checked)} type="checkbox" />
                  <span className="quote-switch-track" aria-hidden="true" />
                  <span><strong>{text.designHelp}</strong><small>{text.designHelpText}</small></span>
                </label>

                <div className="quote-field">
                  <span className="quote-label">{text.files} <small>({text.optional})</small></span>
                  <p className="quote-help">{text.filesHint}</p>
                  <label
                    className={dragging ? "quote-dropzone is-dragging" : "quote-dropzone"}
                    onDragLeave={() => setDragging(false)}
                    onDragOver={(event: DragEvent<HTMLLabelElement>) => { event.preventDefault(); setDragging(true); }}
                    onDrop={(event: DragEvent<HTMLLabelElement>) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}
                  >
                    <input
                      {...fieldProps("files")}
                      accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,application/pdf,image/png,image/jpeg,image/tiff"
                      disabled={form.files.length >= MAX_FILES}
                      multiple
                      onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }}
                      type="file"
                    />
                    <span className="quote-dropzone-icon"><UploadIcon /></span>
                    <strong>{text.drop}</strong>
                    <span>{text.browse}</span>
                    <small>{text.fileRules}</small>
                  </label>
                  {form.files.length > 0 && (
                    <ul className="quote-files">
                      {form.files.map((file) => (
                        <li className={`is-${file.status}`} key={file.key}>
                          <span className="quote-file-name">{file.name}</span>
                          <span className="quote-file-meta" role={file.status === "error" ? "alert" : undefined}>
                            {file.status === "uploading" ? text.uploading : file.status === "error" ? file.error : `${text.uploaded} · ${formatSize(file.size)}`}
                          </span>
                          <button aria-label={`${text.remove} : ${file.name}`} onClick={() => removeFile(file.key)} type="button">×</button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {fieldError("files")}
                </div>
              </fieldset>
            )}

            {form.step === 3 && (
              <fieldset className="quote-step">
                <legend className="quote-step-heading">
                  <small>{text.stepOf(3)}</small>
                  <span ref={headingRef} tabIndex={-1}>{text.contactTitle}</span>
                </legend>
                <p className="quote-step-intro">{text.contactIntro}</p>

                <div className="quote-grid-2">
                  <div className="quote-field">
                    <label htmlFor="quote-fullName">{text.fullName}</label>
                    <input {...fieldProps("fullName")} autoComplete="name" maxLength={160} onChange={(event) => update("fullName", event.target.value)} value={form.fullName} />
                    {fieldError("fullName")}
                  </div>
                  <div className="quote-field">
                    <label htmlFor="quote-phone">{text.phone}</label>
                    <input {...fieldProps("phone")} autoComplete="tel" dir="ltr" inputMode="tel" maxLength={40} onChange={(event) => update("phone", event.target.value)} placeholder={text.phonePlaceholder} type="tel" value={form.phone} />
                    {fieldError("phone")}
                  </div>
                </div>
                <div className="quote-field">
                  <label htmlFor="quote-email">{text.email} <small>({text.optional})</small></label>
                  <input {...fieldProps("email")} autoComplete="email" dir="ltr" maxLength={254} onChange={(event) => update("email", event.target.value)} type="email" value={form.email} />
                  {fieldError("email")}
                </div>

                <label className="quote-switch quote-switch-whatsapp">
                  <input checked={form.whatsappOptIn} onChange={(event) => update("whatsappOptIn", event.target.checked)} type="checkbox" />
                  <span className="quote-switch-track" aria-hidden="true" />
                  <span><strong>{text.whatsappOptIn}</strong><small>{text.whatsappOptInText}</small></span>
                </label>

                <div className="quote-field" role="radiogroup" aria-labelledby="quote-reception-label">
                  <span className="quote-label" id="quote-reception-label">{text.reception}</span>
                  <div className="quote-choice-row">
                    {(["pickup", "delivery"] as Fulfillment[]).map((method) => (
                      <label className={form.fulfillment === method ? "quote-choice is-selected" : "quote-choice"} key={method}>
                        <input checked={form.fulfillment === method} name="fulfillment" onChange={() => update("fulfillment", method)} type="radio" value={method} />
                        <strong>{method === "pickup" ? text.pickup : text.delivery}</strong>
                        <small>{method === "pickup" ? text.pickupText : text.deliveryText}</small>
                      </label>
                    ))}
                  </div>
                </div>
                {form.fulfillment === "delivery" && (
                  <div className="quote-field">
                    <label htmlFor="quote-address">{text.address}</label>
                    <textarea {...fieldProps("address")} autoComplete="street-address" maxLength={1000} onChange={(event) => update("address", event.target.value)} rows={3} value={form.address} />
                    {fieldError("address")}
                  </div>
                )}

                <div className="quote-honeypot" aria-hidden="true">
                  <label htmlFor="quote-website">Website</label>
                  <input autoComplete="off" id="quote-website" name="website" onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} value={website} />
                </div>

                {submitError && (
                  <div className="quote-submit-error" role="alert">
                    <p>{submitError}</p>
                    <a href={whatsappLink()} rel="noreferrer" target="_blank">{text.fallback}<span aria-hidden="true"> ↗</span></a>
                  </div>
                )}
                <p className="quote-privacy">{text.privacy}</p>
              </fieldset>
            )}

            <div className="quote-actions">
              {form.step > 1 && (
                <button className="button button-outline" onClick={() => goTo((form.step - 1) as Step)} type="button">{text.back}</button>
              )}
              <button className="button button-dark" disabled={busy || (form.step === 2 && uploading)} type="submit">
                {form.step < 3 ? text.next : busy ? text.sending : text.submit}
                <span aria-hidden="true">{form.step < 3 ? "→" : "↗"}</span>
              </button>
            </div>
          </form>
        )}

        <aside className="quote-card quote-summary" aria-label={text.summaryTitle}>
          <div className="quote-summary-media">
            {selectedCover ? (
              <Image alt="" fill sizes="(max-width: 980px) 92vw, 360px" src={selectedCover} />
            ) : (
              <span className="quote-category-other"><CategoryIcon /></span>
            )}
          </div>
          <div className="quote-summary-body">
            <p className="quote-summary-title">{text.summaryTitle}</p>
            {form.category ? (
              <>
                <div className="quote-summary-project">
                  <strong>{categoryTitle(form.category)}</strong>
                  {!confirmation && form.step > 1 && <button onClick={() => goTo(1)} type="button">{text.edit}</button>}
                </div>
                {form.description.trim() && <p className="quote-summary-description">{form.description.trim()}</p>}
                <dl>
                  <div><dt>{text.summaryQuantity}</dt><dd>{form.quantity || text.notSet}</dd></div>
                  <div><dt>{text.summaryFormat}</dt><dd>{form.dimensions.trim() || text.notSet}</dd></div>
                  <div><dt>{text.summaryDate}</dt><dd>{form.desiredDate ? new Date(`${form.desiredDate}T12:00:00`).toLocaleDateString(locale === "ar" ? "ar-TN" : `${locale}-TN`) : text.notSet}</dd></div>
                  <div><dt>{text.summaryDesign}</dt><dd>{form.designHelp ? text.yes : text.notSet}</dd></div>
                  <div><dt>{text.summaryFiles}</dt><dd>{doneFiles || text.notSet}</dd></div>
                  <div><dt>{text.summaryReception}</dt><dd>{form.fulfillment === "pickup" ? text.pickup : text.delivery}</dd></div>
                </dl>
              </>
            ) : (
              <p className="quote-summary-empty">{text.summaryEmpty}</p>
            )}
            {hydrated && !confirmation && form.category && <p className="quote-draft-note">{text.draftSaved}</p>}
            <div className="quote-help-box">
              <strong>{text.help}</strong>
              <a href="tel:+21623267178">{text.call} · <span dir="ltr">+216 23 267 178</span></a>
              <a href={whatsappLink()} rel="noreferrer" target="_blank">{text.chat}<span aria-hidden="true"> ↗</span></a>
            </div>
          </div>
        </aside>
      </div>

      <SiteFooter locale={locale} />
    </main>
  );
}
