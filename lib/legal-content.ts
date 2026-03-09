import { Language } from "./i18n";

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocument {
  sections: LegalSection[];
}

const privacy: Record<Language, LegalDocument> = {
  en: {
    sections: [
      {
        title: "What We Collect",
        paragraphs: [
          "When you create an account, we collect your full name, phone number, and country code. When you upload your contacts, we store the phone numbers and names from your address book to power the search feature.",
        ],
      },
      {
        title: "How We Use Your Data",
        bullets: [
          "Your contacts are stored to let other users search whether their number is saved by someone in our network.",
          "We never sell your data or contacts to third parties.",
          "We do not use your data for advertising or profiling.",
          "Your password is stored as a one-way hash and cannot be recovered by us.",
        ],
      },
      {
        title: "Third-Party Phone Numbers",
        paragraphs: [
          "When you upload contacts, phone numbers of people who are not registered users may be stored. These numbers are only used to answer search queries — they are never surfaced or shared in any other way.",
        ],
      },
      {
        title: "Your Rights",
        bullets: [
          "You can remove your phone number from all search results at any time from your profile page.",
          "You can delete your account and all associated data at any time from your profile page.",
          "EU residents have the right to request access, correction, or erasure of their personal data under GDPR.",
          "California residents have rights under CCPA, including the right to know what data is collected and to request deletion.",
        ],
      },
      {
        title: "Data Security",
        paragraphs: [
          "We use industry-standard security practices to protect your data. All communication between the app and our servers is encrypted. We do not store passwords in plain text.",
        ],
      },
      {
        title: "Contact",
        paragraphs: [
          "For privacy inquiries or data deletion requests, please contact us through the app's support channel. Non-registered users who wish to opt out can use the Remove My Number feature after creating a free account.",
        ],
      },
      {
        title: "Last Updated",
        paragraphs: ["March 2026"],
      },
    ],
  },

  ar: {
    sections: [
      {
        title: "ما نجمعه",
        paragraphs: [
          "عند إنشاء حساب، نجمع اسمك الكامل ورقم هاتفك ورمز البلد. عند رفع جهات اتصالك، نحفظ أرقام الهواتف والأسماء من دفتر عناوينك لتشغيل ميزة البحث.",
        ],
      },
      {
        title: "كيف نستخدم بياناتك",
        bullets: [
          "تُخزَّن جهات اتصالك لتمكين المستخدمين الآخرين من البحث عما إذا كان رقمهم محفوظاً لدى أحد في شبكتنا.",
          "لا نبيع بياناتك أو جهات اتصالك لأطراف ثالثة.",
          "لا نستخدم بياناتك للإعلانات أو تحليل الملفات الشخصية.",
          "تُخزَّن كلمة مرورك كقيمة مشفرة أحادية الاتجاه ولا يمكننا استرجاعها.",
        ],
      },
      {
        title: "أرقام هواتف الأطراف الثالثة",
        paragraphs: [
          "عند رفع جهات الاتصال، قد تُخزَّن أرقام هواتف لأشخاص ليسوا مستخدمين مسجلين. تُستخدم هذه الأرقام فقط للإجابة على استعلامات البحث، ولا تُكشَف أو تُشارَك بأي طريقة أخرى.",
        ],
      },
      {
        title: "حقوقك",
        bullets: [
          "يمكنك إزالة رقم هاتفك من جميع نتائج البحث في أي وقت من صفحة ملفك الشخصي.",
          "يمكنك حذف حسابك وجميع بياناتك المرتبطة به في أي وقت من صفحة ملفك الشخصي.",
          "يحق للمقيمين في الاتحاد الأوروبي طلب الوصول إلى بياناتهم الشخصية أو تصحيحها أو حذفها بموجب اللائحة الأوروبية لحماية البيانات (GDPR).",
          "يتمتع المقيمون في كاليفورنيا بحقوق بموجب قانون CCPA، بما في ذلك الحق في معرفة البيانات المجمعة وطلب حذفها.",
        ],
      },
      {
        title: "أمان البيانات",
        paragraphs: [
          "نستخدم ممارسات أمنية تتوافق مع معايير الصناعة لحماية بياناتك. جميع الاتصالات بين التطبيق وخوادمنا مشفرة. لا نحتفظ بكلمات المرور بنص واضح.",
        ],
      },
      {
        title: "التواصل",
        paragraphs: [
          "لأي استفسارات تتعلق بالخصوصية أو طلبات حذف البيانات، يرجى التواصل معنا عبر قناة دعم التطبيق. يمكن للمستخدمين غير المسجلين الراغبين في الانسحاب استخدام ميزة إزالة رقمي بعد إنشاء حساب مجاني.",
        ],
      },
      {
        title: "آخر تحديث",
        paragraphs: ["مارس 2026"],
      },
    ],
  },

  fr: {
    sections: [
      {
        title: "Ce que nous collectons",
        paragraphs: [
          "Lors de la création d'un compte, nous collectons votre nom complet, votre numéro de téléphone et votre indicatif pays. Lorsque vous importez vos contacts, nous stockons les numéros de téléphone et les noms de votre répertoire pour alimenter la fonctionnalité de recherche.",
        ],
      },
      {
        title: "Comment nous utilisons vos données",
        bullets: [
          "Vos contacts sont stockés pour permettre aux autres utilisateurs de savoir si leur numéro est enregistré par quelqu'un dans notre réseau.",
          "Nous ne vendons jamais vos données ou contacts à des tiers.",
          "Nous n'utilisons pas vos données à des fins publicitaires ou de profilage.",
          "Votre mot de passe est stocké sous forme de hachage unidirectionnel et ne peut pas être récupéré par nous.",
        ],
      },
      {
        title: "Numéros de tiers",
        paragraphs: [
          "Lors de l'importation des contacts, des numéros de téléphone de personnes non inscrites peuvent être stockés. Ces numéros ne sont utilisés que pour répondre aux requêtes de recherche — ils ne sont jamais divulgués ni partagés d'une autre façon.",
        ],
      },
      {
        title: "Vos droits",
        bullets: [
          "Vous pouvez retirer votre numéro de téléphone de tous les résultats de recherche à tout moment depuis votre page de profil.",
          "Vous pouvez supprimer votre compte et toutes les données associées à tout moment depuis votre page de profil.",
          "Les résidents de l'UE ont le droit de demander l'accès, la correction ou la suppression de leurs données personnelles en vertu du RGPD.",
          "Les résidents de Californie disposent de droits en vertu du CCPA, notamment le droit de savoir quelles données sont collectées et d'en demander la suppression.",
        ],
      },
      {
        title: "Sécurité des données",
        paragraphs: [
          "Nous appliquons des pratiques de sécurité conformes aux normes du secteur pour protéger vos données. Toutes les communications entre l'application et nos serveurs sont chiffrées. Nous ne stockons pas les mots de passe en clair.",
        ],
      },
      {
        title: "Contact",
        paragraphs: [
          "Pour toute demande relative à la confidentialité ou à la suppression de données, veuillez nous contacter via le canal de support de l'application. Les utilisateurs non inscrits souhaitant se désinscrire peuvent utiliser la fonctionnalité Supprimer mon numéro après avoir créé un compte gratuit.",
        ],
      },
      {
        title: "Dernière mise à jour",
        paragraphs: ["Mars 2026"],
      },
    ],
  },
};

const terms: Record<Language, LegalDocument> = {
  en: {
    sections: [
      {
        title: "Acceptance",
        paragraphs: [
          "By using Who Saved Me, you agree to these Terms. If you do not agree, please do not use the app.",
        ],
      },
      {
        title: "What the App Does",
        paragraphs: [
          "Who Saved Me lets users discover who has saved their phone number in others' contact lists. Users contribute by uploading their own contacts, which builds the shared index that makes searches possible.",
        ],
      },
      {
        title: "Your Responsibilities",
        bullets: [
          "You must be at least 13 years old to use this app.",
          "You must only upload contacts that you legitimately have access to (your own address book).",
          "You must not attempt to scrape, reverse-engineer, or misuse the search feature.",
          "You must not use the app to harass, stalk, or harm others.",
          "You are responsible for keeping your account credentials secure.",
        ],
      },
      {
        title: "Coin System",
        bullets: [
          "New accounts receive 5 free coins upon registration.",
          "5 free searches are available each day at no coin cost.",
          "Additional searches beyond the daily limit cost 1 coin each.",
          "Coins purchased are non-refundable unless required by applicable law.",
          "We reserve the right to adjust coin prices and free search limits with notice.",
        ],
      },
      {
        title: "Data Accuracy",
        paragraphs: [
          "Search results depend entirely on data uploaded by our users. We make no guarantees about the completeness or accuracy of results. A person may be saved in more contacts than shown, or in none at all.",
        ],
      },
      {
        title: "Account Termination",
        paragraphs: [
          "We reserve the right to suspend or terminate accounts that violate these Terms. You may delete your account at any time from your profile page, which will permanently remove all your data from our system.",
        ],
      },
      {
        title: "Limitation of Liability",
        paragraphs: [
          'The app is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the app or reliance on its results.',
        ],
      },
      {
        title: "Last Updated",
        paragraphs: ["March 2026"],
      },
    ],
  },

  ar: {
    sections: [
      {
        title: "الموافقة",
        paragraphs: [
          "باستخدامك لتطبيق «من حفظني»، فإنك توافق على هذه الشروط. إذا لم توافق عليها، يُرجى عدم استخدام التطبيق.",
        ],
      },
      {
        title: "ما يفعله التطبيق",
        paragraphs: [
          "يتيح تطبيق «من حفظني» للمستخدمين اكتشاف من قام بحفظ رقم هاتفهم في قوائم جهات اتصال الآخرين. يُسهم المستخدمون بذلك عن طريق رفع جهات اتصالهم الخاصة، مما يُنشئ الفهرس المشترك الذي يُتيح إجراء البحوث.",
        ],
      },
      {
        title: "مسؤولياتك",
        bullets: [
          "يجب أن يكون عمرك 13 عاماً على الأقل لاستخدام هذا التطبيق.",
          "يجب عليك رفع جهات الاتصال التي تملك حق الوصول إليها فقط (دفتر عناوينك الخاص).",
          "يُحظر عليك محاولة استخراج البيانات أو إجراء هندسة عكسية أو إساءة استخدام ميزة البحث.",
          "يُحظر عليك استخدام التطبيق لمضايقة الآخرين أو ملاحقتهم أو إلحاق الأذى بهم.",
          "أنت مسؤول عن الحفاظ على أمان بيانات حسابك.",
        ],
      },
      {
        title: "نظام العملات",
        bullets: [
          "تحصل الحسابات الجديدة على 5 عملات مجانية عند التسجيل.",
          "تتاح 5 عمليات بحث مجانية يومياً دون استهلاك عملات.",
          "تكلّف كل عملية بحث إضافية تتجاوز الحد اليومي عملة واحدة.",
          "العملات المشتراة غير قابلة للاسترداد إلا إذا اقتضى ذلك القانون المعمول به.",
          "نحتفظ بالحق في تعديل أسعار العملات وحدود البحث المجاني مع الإشعار المسبق.",
        ],
      },
      {
        title: "دقة البيانات",
        paragraphs: [
          "تعتمد نتائج البحث كلياً على البيانات التي يرفعها مستخدمونا. لا نقدم أي ضمانات بشأن اكتمال النتائج أو دقتها. قد يكون رقم شخص ما محفوظاً في عدد أكبر من جهات الاتصال مما هو معروض، أو لا في أي منها.",
        ],
      },
      {
        title: "إنهاء الحساب",
        paragraphs: [
          "نحتفظ بالحق في تعليق الحسابات التي تنتهك هذه الشروط أو إنهائها. يمكنك حذف حسابك في أي وقت من صفحة ملفك الشخصي، مما سيؤدي إلى إزالة جميع بياناتك من نظامنا بشكل دائم.",
        ],
      },
      {
        title: "تحديد المسؤولية",
        paragraphs: [
          "يُقدَّم التطبيق \"كما هو\" دون أي ضمانات من أي نوع. لسنا مسؤولين عن أي أضرار تنشأ عن استخدامك للتطبيق أو اعتمادك على نتائجه.",
        ],
      },
      {
        title: "آخر تحديث",
        paragraphs: ["مارس 2026"],
      },
    ],
  },

  fr: {
    sections: [
      {
        title: "Acceptation",
        paragraphs: [
          "En utilisant Qui m'a enregistré, vous acceptez ces Conditions. Si vous n'êtes pas d'accord, veuillez ne pas utiliser l'application.",
        ],
      },
      {
        title: "Ce que fait l'application",
        paragraphs: [
          "Qui m'a enregistré permet aux utilisateurs de découvrir qui a sauvegardé leur numéro de téléphone dans les listes de contacts d'autres personnes. Les utilisateurs contribuent en important leurs propres contacts, ce qui alimente l'index partagé permettant les recherches.",
        ],
      },
      {
        title: "Vos responsabilités",
        bullets: [
          "Vous devez avoir au moins 13 ans pour utiliser cette application.",
          "Vous ne devez importer que les contacts auxquels vous avez légitimement accès (votre propre répertoire).",
          "Vous ne devez pas tenter d'extraire des données, de procéder à de l'ingénierie inverse ou d'abuser de la fonctionnalité de recherche.",
          "Vous ne devez pas utiliser l'application pour harceler, traquer ou nuire à autrui.",
          "Vous êtes responsable de la sécurité de vos identifiants de compte.",
        ],
      },
      {
        title: "Système de pièces",
        bullets: [
          "Les nouveaux comptes reçoivent 5 pièces gratuites à l'inscription.",
          "5 recherches gratuites sont disponibles chaque jour sans utiliser de pièces.",
          "Les recherches supplémentaires au-delà de la limite quotidienne coûtent 1 pièce chacune.",
          "Les pièces achetées ne sont pas remboursables, sauf si la loi applicable l'exige.",
          "Nous nous réservons le droit d'ajuster les prix des pièces et les limites de recherche gratuites avec préavis.",
        ],
      },
      {
        title: "Exactitude des données",
        paragraphs: [
          "Les résultats de recherche dépendent entièrement des données importées par nos utilisateurs. Nous ne garantissons pas l'exhaustivité ni l'exactitude des résultats. Un numéro peut être enregistré dans plus de contacts que ce qui est affiché, ou dans aucun.",
        ],
      },
      {
        title: "Résiliation de compte",
        paragraphs: [
          "Nous nous réservons le droit de suspendre ou de résilier les comptes qui enfreignent ces Conditions. Vous pouvez supprimer votre compte à tout moment depuis votre page de profil, ce qui supprimera définitivement toutes vos données de notre système.",
        ],
      },
      {
        title: "Limitation de responsabilité",
        paragraphs: [
          "L'application est fournie \"telle quelle\" sans garantie d'aucune sorte. Nous ne sommes pas responsables des dommages résultant de votre utilisation de l'application ou de votre confiance dans ses résultats.",
        ],
      },
      {
        title: "Dernière mise à jour",
        paragraphs: ["Mars 2026"],
      },
    ],
  },
};

const about: Record<Language, LegalDocument> = {
  en: {
    sections: [
      {
        title: "Who Saved Me",
        paragraphs: [
          "Who Saved Me is a social discovery app that answers a simple question: who has my number saved in their contacts?",
          "By sharing your own contact list, you gain the ability to search the shared network and see how others have saved your number — the name they know you by, and the label they assigned.",
        ],
      },
      {
        title: "How It Works",
        bullets: [
          "Create an account with your phone number and verify via OTP.",
          "Upload your contacts once to join the network.",
          "Search any phone number to see who has it saved and under what name.",
          "5 free searches per day — additional searches use coins.",
        ],
      },
      {
        title: "Your Privacy",
        paragraphs: [
          "You are always in control. You can remove your number from search results at any time from this profile page, or delete your account entirely. Removed numbers are permanently blocked from re-appearing even if others re-upload their contacts.",
        ],
      },
      {
        title: "Version",
        paragraphs: ["1.0.0"],
      },
      {
        title: "Support",
        paragraphs: [
          "For questions, support, or data requests, please reach out through the app store listing or contact the developer directly.",
        ],
      },
    ],
  },

  ar: {
    sections: [
      {
        title: "من حفظني",
        paragraphs: [
          "«من حفظني» تطبيق اجتماعي للاكتشاف يجيب على سؤال بسيط: من يحتفظ برقمي في جهات اتصاله؟",
          "بمشاركة قائمة جهات اتصالك، تحصل على القدرة على البحث في الشبكة المشتركة ومعرفة كيف حفظ الآخرون رقمك — الاسم الذي يعرفونك به والتسمية التي أعطوها لك.",
        ],
      },
      {
        title: "كيف يعمل",
        bullets: [
          "أنشئ حساباً برقم هاتفك وتحقق منه عبر رمز OTP.",
          "ارفع جهات اتصالك مرة واحدة للانضمام إلى الشبكة.",
          "ابحث عن أي رقم هاتف لمعرفة من يحتفظ به وتحت أي اسم.",
          "5 عمليات بحث مجانية يومياً — تستخدم البحوث الإضافية عملات.",
        ],
      },
      {
        title: "خصوصيتك",
        paragraphs: [
          "أنت دائماً في السيطرة الكاملة. يمكنك إزالة رقمك من نتائج البحث في أي وقت من صفحة ملفك الشخصي، أو حذف حسابك بالكامل. تُحجب الأرقام المُزالة بشكل دائم من الظهور مجدداً حتى لو أعاد الآخرون رفع جهات اتصالهم.",
        ],
      },
      {
        title: "الإصدار",
        paragraphs: ["1.0.0"],
      },
      {
        title: "الدعم",
        paragraphs: [
          "لأي استفسارات أو دعم أو طلبات بيانات، يُرجى التواصل عبر قائمة متجر التطبيقات أو الاتصال مباشرةً بالمطور.",
        ],
      },
    ],
  },

  fr: {
    sections: [
      {
        title: "Qui m'a enregistré",
        paragraphs: [
          "Qui m'a enregistré est une application de découverte sociale qui répond à une question simple : qui a mon numéro enregistré dans ses contacts ?",
          "En partageant votre propre liste de contacts, vous pouvez rechercher dans le réseau partagé et voir comment les autres ont enregistré votre numéro — le nom sous lequel ils vous connaissent, et le libellé qu'ils ont attribué.",
        ],
      },
      {
        title: "Comment ça fonctionne",
        bullets: [
          "Créez un compte avec votre numéro de téléphone et vérifiez-le via OTP.",
          "Importez vos contacts une seule fois pour rejoindre le réseau.",
          "Recherchez n'importe quel numéro de téléphone pour voir qui l'a enregistré et sous quel nom.",
          "5 recherches gratuites par jour — les recherches supplémentaires utilisent des pièces.",
        ],
      },
      {
        title: "Votre confidentialité",
        paragraphs: [
          "Vous avez toujours le contrôle. Vous pouvez retirer votre numéro des résultats de recherche à tout moment depuis votre page de profil, ou supprimer entièrement votre compte. Les numéros supprimés sont définitivement bloqués et ne réapparaissent pas, même si d'autres importent à nouveau leurs contacts.",
        ],
      },
      {
        title: "Version",
        paragraphs: ["1.0.0"],
      },
      {
        title: "Support",
        paragraphs: [
          "Pour toute question, assistance ou demande de données, veuillez nous contacter via la fiche de l'application ou directement auprès du développeur.",
        ],
      },
    ],
  },
};

export const legalContent = { privacy, terms, about };
