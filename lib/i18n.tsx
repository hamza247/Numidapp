import React, { createContext, useContext, useEffect, useState } from "react";
import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Language = "en" | "ar" | "fr";

const LANG_KEY = "app_language";

export const translations = {
  en: {
    // App
    appName: "Who Saved Me",
    appTagline: "Discover who has your phone number",

    // Auth - Login
    login: "Log In",
    loginTitle: "Welcome Back",
    loginSubtitle: "Sign in to your account",
    phoneNumber: "Phone Number",
    password: "Password",
    loggingIn: "Signing in...",
    noAccount: "Don't have an account?",
    register: "Register",
    loginError: "Login failed. Please check your credentials.",
    phoneRequired: "Please enter a valid phone number",
    passwordRequired: "Please enter your password",

    // Auth - Register
    registerTitle: "Create Account",
    registerSubtitle: "Join the network — discover who saved your number",
    fullName: "Full Name",
    fullNamePlaceholder: "First and last name",
    phonePlaceholder: "Phone number",
    sendCode: "Send Verification Code",
    sendingCode: "Sending...",
    alreadyHaveAccount: "Already have an account?",
    nameMin: "Name must be at least 2 characters",
    nameTooLong: "Name is too long",
    nameInvalid: "Name contains invalid characters",
    nameFullRequired: "Please enter your full name (first and last)",
    phoneTooShort: "Phone number is too short",
    phoneTooLong: "Phone number is too long",

    // Auth - Verify OTP
    verifyTitle: "Verify Your Number",
    verifySubtitle: "We sent a 6-digit code to",
    verify: "Verify Code",
    verifying: "Verifying...",
    didntReceive: "Didn't receive the code?",
    resend: "Resend",
    resending: "Sending...",
    enterComplete: "Please enter the complete 6-digit code",

    // Auth - Set Password
    setPasswordTitle: "Create Password",
    setPasswordSubtitle: "Set a secure password for your account",
    newPassword: "Password",
    confirmPassword: "Confirm Password",
    passwordPlaceholder: "At least 6 characters",
    confirmPasswordPlaceholder: "Re-enter password",
    createAccount: "Create Account",
    creatingAccount: "Creating...",
    passwordMin: "Password must be at least 6 characters",
    passwordConfirmRequired: "Please confirm your password",
    passwordMismatch: "Passwords do not match",
    privacyNote: "Your number is never shown to other users",
    referralCodeLabel: "Referral Code (optional)",
    referralCodePlaceholder: "Friend's referral code",
    referralCodeInvalid: "Invalid referral code",

    // Referral
    referralSection: "Invite Friends",
    myReferralCode: "My Referral Code",
    referralShareMsg: "Share your code — earn coins for every friend who joins",
    referralCopied: "Copied!",
    referralShareText: (code: string, reward: number) => `Join Who Saved Me! Use my referral code ${code} when signing up to get ${reward} coins. Download at numidapp.com`,

    // Main screen
    searchPlaceholder: "Phone number",
    freeSearches: (n: number) => `${n} free search${n !== 1 ? "es" : ""} left today`,
    noFreeSearches: "No free searches left",
    useCoin: "1 coin per search",
    syncRequired: "Sync Required",
    syncRequiredMsg: "You need to upload your contacts before you can search. This helps build the network for everyone.",
    cancel: "Cancel",
    syncNow: "Sync Now",
    noSearchesLeft: "No Searches Left",
    noSearchesMsg: (free: number, cost: number) => `You've used all ${free} free searches today and don't have enough coins. Each extra search costs ${cost} coin.`,
    notEnoughCoins: "Not Enough Coins",
    notEnoughCoinsMsg: (cost: number, balance: number) => `Each search costs ${cost} coin. You currently have ${balance} coins.`,
    buyCoins: "Buy Coins",
    recent: "Recent",
    clear: "Clear",
    enterNumberHint: "Enter any phone number to see\nwho has it saved",

    // Sync gate card
    syncGateTitle: "Upload Your Contacts",
    syncGateBody: "To search the network, you must first share your own contacts. This is how the shared index is built.",
    syncGateBtn: "Sync Contacts Now",
    syncingContacts: "Syncing...",
    syncSuccess: (n: number) => `${n} contacts uploaded successfully.`,
    syncFailed: "Sync Failed",
    syncNoContacts: "No phone contacts found.",
    permissionRequired: "Permission Required",
    permissionMsg: "We need access to your contacts to help others discover who saved their number.",

    // Results
    searchingContacts: "Searching contacts...",
    tryAgain: "Try Again",
    failedToLoad: "Failed to load results. Please try again.",
    notSavedYet: "Not Saved Yet",
    notSavedBody: "Nobody in our network has this number saved in their contacts yet. Ask more friends to sync their contacts.",
    personSaved: (n: number) => n === 1 ? "person saved this number" : "people saved this number",
    savedAs: (count: number, label: string) => `${count} as ${label}`,
    savedBy: "Saved by",
    revealName: "Reveal",
    notEnoughCoinsReveal: "You need at least 1 coin to reveal this name.",
    contactsDetails: "CONTACTS DETAILS",

    // Store
    coinStore: "Coin Store",
    coinsRemaining: "coins remaining",
    coinPackages: "COIN PACKAGES",
    coinPackagesSub: "Each coin reveals one uploader's full phone number",
    perCoin: "per coin",
    purchaseComplete: "Purchase Complete",
    purchaseCompleteMsg: (coins: number, total: number) => `You received ${coins} coins! Your new balance is ${total} coins.`,
    securePayment: "Secure payment processing",
    coinsNeverExpire: "Coins never expire",
    instantDelivery: "Instant delivery after purchase",
    mostPopular: "Most Popular",
    bestValue: "Best Value",
    save33: "Save 33%",
    save47: "Save 47%",
    loginRequiredForPurchase: "Please log in before purchasing coins.",
    stripeUnavailable: "Payments are not available right now. Please try again later.",
    stripeError: "Payment failed. Please try again.",

    // Profile
    profile: "Profile",
    account: "ACCOUNT",
    phone: "Phone",
    memberSince: "Member since",
    preferences: "PREFERENCES",
    language: "Language",
    changeLanguage: "Change app language",
    privacy: "PRIVACY",
    removeMyNumber: "Remove My Number",
    removeMyNumberSub: "Hide from search results",
    numberRemoved: "Number Removed",
    numberRemovedSub: "Hidden from all search results",
    removeFromSearch: "Remove From Search Results",
    removeConfirm: (cost: number) => `This will remove your phone number from everyone's search results. It costs ${cost} coins. This cannot be undone.`,
    removeCta: (cost: number) => `Remove (${cost} coins)`,
    notEnoughCoinsRemove: (cost: number, balance: number) => `Removing your number from search results costs ${cost} coins. You currently have ${balance} coin${balance !== 1 ? "s" : ""}.`,
    getCoins: "Get Coins",
    removeSuccess: "Your phone number has been removed from all search results.",
    removeFailed: "Failed to remove your phone number. Please try again.",
    legal: "LEGAL",
    privacyPolicy: "Privacy Policy",
    termsConditions: "Terms & Conditions",
    about: "About",
    session: "SESSION",
    logOut: "Log Out",
    logOutConfirm: "Are you sure you want to log out?",
    contactUs: "CONTACT US",
    contactEmail: "Your email",
    contactMessage: "Your message",
    contactSend: "Send Message",
    contactSending: "Sending...",
    contactSent: "Message sent! We'll get back to you soon.",
    contactFailed: "Failed to send. Please try again.",

    dangerZone: "DANGER ZONE",
    deleteAccount: "Delete Account",
    deleteAccountSub: "Permanently remove all your data",
    deleteConfirmTitle: "Delete Account",
    deleteConfirmMsg: "This will permanently delete your account, contacts, and all associated data. This cannot be undone.",
    delete: "Delete",
    deleteSuccess: "Your account has been deleted.",
    deleteFailed: "Failed to delete account. Please try again.",
    tapToChange: "Tap to change photo",
    contacts: "contacts",
    synced: "Synced",
    notSynced: "Not synced",

    // Language picker
    changePhone: "Change phone number",
    backToVerification: "Back to verification",
    loginWith: "Log in with your phone number and password",
    registerTagline: "Create your profile to discover who has your number saved.",
    uploadContactsTitle: "Upload contacts to unlock search",
    uploadContactsBody: "Share your contact list to help build the network. You can then search any number to see who has it saved.",
    createOne: "Create one",

    selectLanguage: "Select Language",
    english: "English",
    arabic: "Arabic",
    french: "French",
    languageChanged: "Language Changed",
    languageChangedMsg: "The app will restart to apply the new language.",
    restart: "Restart Now",

    // Maintenance
    underMaintenance: "Under Maintenance",
    maintenanceSub: "We're making improvements to give you a better experience. We'll be back shortly.",
    scheduledMaintenance: "Scheduled maintenance in progress",
    dataSafe: "Your data is safe",
    notifyBack: "We'll notify you when we're back",
    checkAgain: "Check Again",

    // Legal titles
    privacyPolicyTitle: "Privacy Policy",
    termsTitle: "Terms & Conditions",
    aboutTitle: "About",
  },

  ar: {
    appName: "من حفظني",
    appTagline: "اكتشف من يملك رقم هاتفك",

    login: "تسجيل الدخول",
    loginTitle: "مرحباً بعودتك",
    loginSubtitle: "سجّل الدخول إلى حسابك",
    phoneNumber: "رقم الهاتف",
    password: "كلمة المرور",
    loggingIn: "جارٍ تسجيل الدخول...",
    noAccount: "ليس لديك حساب؟",
    register: "إنشاء حساب",
    loginError: "فشل تسجيل الدخول. تحقق من بياناتك.",
    phoneRequired: "أدخل رقم هاتف صحيحاً",
    passwordRequired: "أدخل كلمة المرور",

    registerTitle: "إنشاء حساب",
    registerSubtitle: "انضم إلى الشبكة — اكتشف من حفظ رقمك",
    fullName: "الاسم الكامل",
    fullNamePlaceholder: "الاسم الأول والأخير",
    phonePlaceholder: "رقم الهاتف",
    sendCode: "إرسال رمز التحقق",
    sendingCode: "جارٍ الإرسال...",
    alreadyHaveAccount: "هل لديك حساب بالفعل؟",
    nameMin: "يجب أن يكون الاسم حرفين على الأقل",
    nameTooLong: "الاسم طويل جداً",
    nameInvalid: "الاسم يحتوي على أحرف غير صالحة",
    nameFullRequired: "أدخل اسمك الكامل (الأول والأخير)",
    phoneTooShort: "رقم الهاتف قصير جداً",
    phoneTooLong: "رقم الهاتف طويل جداً",

    verifyTitle: "تحقق من رقمك",
    verifySubtitle: "أرسلنا رمزاً مكوناً من 6 أرقام إلى",
    verify: "تحقق من الرمز",
    verifying: "جارٍ التحقق...",
    didntReceive: "لم تستلم الرمز؟",
    resend: "إعادة الإرسال",
    resending: "جارٍ الإرسال...",
    enterComplete: "أدخل الرمز المكوّن من 6 أرقام كاملاً",

    setPasswordTitle: "إنشاء كلمة مرور",
    setPasswordSubtitle: "أنشئ كلمة مرور آمنة لحسابك",
    newPassword: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    passwordPlaceholder: "6 أحرف على الأقل",
    confirmPasswordPlaceholder: "أعد إدخال كلمة المرور",
    createAccount: "إنشاء الحساب",
    creatingAccount: "جارٍ الإنشاء...",
    passwordMin: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
    passwordConfirmRequired: "أكّد كلمة المرور",
    passwordMismatch: "كلمتا المرور غير متطابقتين",
    privacyNote: "رقمك لن يُعرض لأي مستخدم آخر",
    referralCodeLabel: "رمز الإحالة (اختياري)",
    referralCodePlaceholder: "رمز إحالة صديق",
    referralCodeInvalid: "رمز الإحالة غير صالح",

    referralSection: "دعوة الأصدقاء",
    myReferralCode: "رمز الإحالة الخاص بي",
    referralShareMsg: "شارك رمزك — اكسب عملات لكل صديق ينضم",
    referralCopied: "تم النسخ!",
    referralShareText: (code: string, reward: number) => `انضم إلى Who Saved Me! استخدم رمز الإحالة ${code} عند التسجيل للحصول على ${reward} عملات. حمّل التطبيق من numidapp.com`,

    searchPlaceholder: "رقم الهاتف",
    freeSearches: (n: number) => `${n} بحث مجاني متبقٍ اليوم`,
    noFreeSearches: "لا توجد بحوث مجانية متبقية",
    useCoin: "عملة واحدة لكل بحث",
    syncRequired: "المزامنة مطلوبة",
    syncRequiredMsg: "يجب رفع جهات اتصالك قبل البحث. هذا يساعد على بناء الشبكة للجميع.",
    cancel: "إلغاء",
    syncNow: "مزامنة الآن",
    noSearchesLeft: "لا بحوث متبقية",
    noSearchesMsg: (free: number, cost: number) => `لقد استخدمت ${free} بحثاً مجانياً اليوم وليس لديك عملات كافية. كل بحث إضافي يكلف ${cost} عملة.`,
    notEnoughCoins: "عملات غير كافية",
    notEnoughCoinsMsg: (cost: number, balance: number) => `كل بحث يكلف ${cost} عملة. رصيدك الحالي ${balance} عملات.`,
    buyCoins: "شراء عملات",
    recent: "الأخيرة",
    clear: "مسح",
    enterNumberHint: "أدخل أي رقم هاتف لمعرفة\nمن حفظه",

    syncGateTitle: "ارفع جهات اتصالك",
    syncGateBody: "للبحث في الشبكة، يجب أولاً مشاركة جهات اتصالك. هكذا يتم بناء الفهرس المشترك.",
    syncGateBtn: "مزامنة جهات الاتصال الآن",
    syncingContacts: "جارٍ المزامنة...",
    syncSuccess: (n: number) => `تم رفع ${n} جهة اتصال بنجاح.`,
    syncFailed: "فشلت المزامنة",
    syncNoContacts: "لا توجد جهات اتصال هاتفية.",
    permissionRequired: "الإذن مطلوب",
    permissionMsg: "نحتاج إلى الوصول إلى جهات اتصالك لمساعدة الآخرين على اكتشاف من حفظ رقمهم.",

    searchingContacts: "جارٍ البحث في جهات الاتصال...",
    tryAgain: "حاول مجدداً",
    failedToLoad: "فشل تحميل النتائج. حاول مجدداً.",
    notSavedYet: "لم يُحفظ بعد",
    notSavedBody: "لا أحد في شبكتنا حفظ هذا الرقم في جهات اتصاله بعد. اطلب من أصدقائك مزامنة جهات اتصالهم.",
    personSaved: (n: number) => n === 1 ? "شخص حفظ هذا الرقم" : "أشخاص حفظوا هذا الرقم",
    savedAs: (count: number, label: string) => `${count} بـ${label}`,
    savedBy: "حفظه",
    revealName: "كشف",
    notEnoughCoinsReveal: "تحتاج عملة واحدة على الأقل للكشف عن هذا الاسم.",
    contactsDetails: "تفاصيل جهات الاتصال",

    coinStore: "متجر العملات",
    coinsRemaining: "عملات متبقية",
    coinPackages: "حزم العملات",
    coinPackagesSub: "كل عملة تكشف رقم هاتف مكتمل لشخص حفظك",
    perCoin: "لكل عملة",
    purchaseComplete: "تمت عملية الشراء",
    purchaseCompleteMsg: (coins: number, total: number) => `حصلت على ${coins} عملات! رصيدك الجديد ${total} عملات.`,
    securePayment: "معالجة دفع آمنة",
    coinsNeverExpire: "العملات لا تنتهي صلاحيتها",
    instantDelivery: "تسليم فوري بعد الشراء",
    mostPopular: "الأكثر شعبية",
    bestValue: "أفضل قيمة",
    save33: "وفّر 33%",
    save47: "وفّر 47%",
    loginRequiredForPurchase: "يرجى تسجيل الدخول قبل شراء العملات.",
    stripeUnavailable: "المدفوعات غير متاحة الآن. يرجى المحاولة لاحقاً.",
    stripeError: "فشلت عملية الدفع. يرجى المحاولة مرة أخرى.",

    profile: "الملف الشخصي",
    account: "الحساب",
    phone: "الهاتف",
    memberSince: "عضو منذ",
    preferences: "التفضيلات",
    language: "اللغة",
    changeLanguage: "تغيير لغة التطبيق",
    privacy: "الخصوصية",
    removeMyNumber: "إزالة رقمي",
    removeMyNumberSub: "إخفاء من نتائج البحث",
    numberRemoved: "تمت إزالة الرقم",
    numberRemovedSub: "مخفي من جميع نتائج البحث",
    removeFromSearch: "إزالة من نتائج البحث",
    removeConfirm: (cost: number) => `سيؤدي هذا إلى إزالة رقم هاتفك من نتائج بحث الجميع. يكلف ${cost} عملات. لا يمكن التراجع عن هذا الإجراء.`,
    removeCta: (cost: number) => `إزالة (${cost} عملات)`,
    notEnoughCoinsRemove: (cost: number, balance: number) => `إزالة رقمك تكلف ${cost} عملات. رصيدك الحالي ${balance} عملة.`,
    getCoins: "الحصول على عملات",
    removeSuccess: "تمت إزالة رقم هاتفك من جميع نتائج البحث.",
    removeFailed: "فشلت الإزالة. حاول مجدداً.",
    legal: "قانوني",
    privacyPolicy: "سياسة الخصوصية",
    termsConditions: "الشروط والأحكام",
    about: "حول التطبيق",
    session: "الجلسة",
    logOut: "تسجيل الخروج",
    logOutConfirm: "هل أنت متأكد من رغبتك في تسجيل الخروج؟",
    contactUs: "تواصل معنا",
    contactEmail: "بريدك الإلكتروني",
    contactMessage: "رسالتك",
    contactSend: "إرسال الرسالة",
    contactSending: "جارٍ الإرسال...",
    contactSent: "تم إرسال رسالتك! سنتواصل معك قريباً.",
    contactFailed: "فشل الإرسال. حاول مرة أخرى.",
    dangerZone: "منطقة الخطر",
    deleteAccount: "حذف الحساب",
    deleteAccountSub: "إزالة جميع بياناتك نهائياً",
    deleteConfirmTitle: "حذف الحساب",
    deleteConfirmMsg: "سيؤدي هذا إلى حذف حسابك وجهات اتصالك وجميع بياناتك المرتبطة به نهائياً. لا يمكن التراجع عن هذا الإجراء.",
    delete: "حذف",
    deleteSuccess: "تم حذف حسابك.",
    deleteFailed: "فشل حذف الحساب. حاول مجدداً.",
    tapToChange: "اضغط لتغيير الصورة",
    contacts: "جهات اتصال",
    synced: "تمت المزامنة",
    notSynced: "لم تتم المزامنة",

    changePhone: "تغيير رقم الهاتف",
    backToVerification: "العودة إلى التحقق",
    loginWith: "سجّل الدخول برقم هاتفك وكلمة المرور",
    registerTagline: "أنشئ ملفك الشخصي لاكتشاف من يحفظ رقمك.",
    uploadContactsTitle: "ارفع جهات الاتصال لفتح البحث",
    uploadContactsBody: "شارك قائمة جهات اتصالك للمساعدة في بناء الشبكة. يمكنك بعد ذلك البحث عن أي رقم.",
    createOne: "إنشاء حساب",

    selectLanguage: "اختر اللغة",
    english: "الإنجليزية",
    arabic: "العربية",
    french: "الفرنسية",
    languageChanged: "تم تغيير اللغة",
    languageChangedMsg: "سيُعاد تشغيل التطبيق لتطبيق اللغة الجديدة.",
    restart: "إعادة التشغيل الآن",

    underMaintenance: "قيد الصيانة",
    maintenanceSub: "نعمل على تحسين تجربتك. سنعود قريباً.",
    scheduledMaintenance: "الصيانة المجدولة جارية",
    dataSafe: "بياناتك في أمان",
    notifyBack: "سنُعلمك عند العودة",
    checkAgain: "تحقق مجدداً",

    privacyPolicyTitle: "سياسة الخصوصية",
    termsTitle: "الشروط والأحكام",
    aboutTitle: "حول التطبيق",
  },

  fr: {
    appName: "Qui m'a enregistré",
    appTagline: "Découvrez qui a votre numéro",

    login: "Connexion",
    loginTitle: "Bon retour",
    loginSubtitle: "Connectez-vous à votre compte",
    phoneNumber: "Numéro de téléphone",
    password: "Mot de passe",
    loggingIn: "Connexion en cours...",
    noAccount: "Pas encore de compte ?",
    register: "S'inscrire",
    loginError: "Connexion échouée. Vérifiez vos identifiants.",
    phoneRequired: "Entrez un numéro de téléphone valide",
    passwordRequired: "Entrez votre mot de passe",

    registerTitle: "Créer un compte",
    registerSubtitle: "Rejoignez le réseau — découvrez qui a votre numéro",
    fullName: "Nom complet",
    fullNamePlaceholder: "Prénom et nom",
    phonePlaceholder: "Numéro de téléphone",
    sendCode: "Envoyer le code de vérification",
    sendingCode: "Envoi en cours...",
    alreadyHaveAccount: "Déjà un compte ?",
    nameMin: "Le nom doit comporter au moins 2 caractères",
    nameTooLong: "Le nom est trop long",
    nameInvalid: "Le nom contient des caractères invalides",
    nameFullRequired: "Entrez votre nom complet (prénom et nom)",
    phoneTooShort: "Le numéro de téléphone est trop court",
    phoneTooLong: "Le numéro de téléphone est trop long",

    verifyTitle: "Vérifiez votre numéro",
    verifySubtitle: "Nous avons envoyé un code à 6 chiffres au",
    verify: "Vérifier le code",
    verifying: "Vérification...",
    didntReceive: "Vous n'avez pas reçu le code ?",
    resend: "Renvoyer",
    resending: "Envoi en cours...",
    enterComplete: "Entrez le code complet à 6 chiffres",

    setPasswordTitle: "Créer un mot de passe",
    setPasswordSubtitle: "Définissez un mot de passe sécurisé pour votre compte",
    newPassword: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    passwordPlaceholder: "Au moins 6 caractères",
    confirmPasswordPlaceholder: "Ressaisissez le mot de passe",
    createAccount: "Créer le compte",
    creatingAccount: "Création en cours...",
    passwordMin: "Le mot de passe doit comporter au moins 6 caractères",
    passwordConfirmRequired: "Confirmez votre mot de passe",
    passwordMismatch: "Les mots de passe ne correspondent pas",
    privacyNote: "Votre numéro n'est jamais montré aux autres utilisateurs",
    referralCodeLabel: "Code de parrainage (facultatif)",
    referralCodePlaceholder: "Code de parrainage d'un ami",
    referralCodeInvalid: "Code de parrainage invalide",

    referralSection: "Inviter des amis",
    myReferralCode: "Mon code de parrainage",
    referralShareMsg: "Partagez votre code — gagnez des pièces pour chaque ami qui s'inscrit",
    referralCopied: "Copié !",
    referralShareText: (code: string, reward: number) => `Rejoins Who Saved Me ! Utilise mon code de parrainage ${code} lors de l'inscription pour obtenir ${reward} pièces. Télécharge l'app sur numidapp.com`,

    searchPlaceholder: "Numéro de téléphone",
    freeSearches: (n: number) => `${n} recherche${n !== 1 ? "s" : ""} gratuite${n !== 1 ? "s" : ""} restante${n !== 1 ? "s" : ""}`,
    noFreeSearches: "Plus de recherches gratuites",
    useCoin: "1 pièce par recherche",
    syncRequired: "Synchronisation requise",
    syncRequiredMsg: "Vous devez d'abord importer vos contacts pour pouvoir rechercher. Cela aide à construire le réseau pour tous.",
    cancel: "Annuler",
    syncNow: "Synchroniser maintenant",
    noSearchesLeft: "Plus de recherches",
    noSearchesMsg: (free: number, cost: number) => `Vous avez utilisé vos ${free} recherches gratuites aujourd'hui et n'avez pas assez de pièces. Chaque recherche supplémentaire coûte ${cost} pièce.`,
    notEnoughCoins: "Pièces insuffisantes",
    notEnoughCoinsMsg: (cost: number, balance: number) => `Chaque recherche coûte ${cost} pièce. Vous avez actuellement ${balance} pièces.`,
    buyCoins: "Acheter des pièces",
    recent: "Récent",
    clear: "Effacer",
    enterNumberHint: "Entrez un numéro de téléphone pour voir\nqui l'a enregistré",

    syncGateTitle: "Importez vos contacts",
    syncGateBody: "Pour rechercher dans le réseau, vous devez d'abord partager vos propres contacts. C'est ainsi que l'index partagé est construit.",
    syncGateBtn: "Synchroniser les contacts maintenant",
    syncingContacts: "Synchronisation...",
    syncSuccess: (n: number) => `${n} contacts importés avec succès.`,
    syncFailed: "Synchronisation échouée",
    syncNoContacts: "Aucun contact téléphonique trouvé.",
    permissionRequired: "Autorisation requise",
    permissionMsg: "Nous avons besoin d'accéder à vos contacts pour aider les autres à découvrir qui a leur numéro.",

    searchingContacts: "Recherche dans les contacts...",
    tryAgain: "Réessayer",
    failedToLoad: "Chargement des résultats échoué. Réessayez.",
    notSavedYet: "Pas encore enregistré",
    notSavedBody: "Personne dans notre réseau n'a enregistré ce numéro dans ses contacts. Demandez à plus d'amis de synchroniser leurs contacts.",
    personSaved: (n: number) => n === 1 ? "personne a enregistré ce numéro" : "personnes ont enregistré ce numéro",
    savedAs: (count: number, label: string) => `${count} en ${label}`,
    savedBy: "Enregistré par",
    revealName: "Révéler",
    notEnoughCoinsReveal: "Vous avez besoin d'au moins 1 pièce pour révéler ce nom.",
    contactsDetails: "DÉTAILS DES CONTACTS",

    coinStore: "Boutique de pièces",
    coinsRemaining: "pièces restantes",
    coinPackages: "PACKS DE PIÈCES",
    coinPackagesSub: "Chaque pièce révèle le numéro complet d'un utilisateur",
    perCoin: "par pièce",
    purchaseComplete: "Achat effectué",
    purchaseCompleteMsg: (coins: number, total: number) => `Vous avez reçu ${coins} pièces ! Votre nouveau solde est de ${total} pièces.`,
    securePayment: "Paiement sécurisé",
    coinsNeverExpire: "Les pièces n'expirent jamais",
    instantDelivery: "Livraison instantanée après achat",
    mostPopular: "Le plus populaire",
    bestValue: "Meilleur rapport qualité-prix",
    save33: "Économisez 33%",
    save47: "Économisez 47%",
    loginRequiredForPurchase: "Veuillez vous connecter avant d'acheter des pièces.",
    stripeUnavailable: "Les paiements ne sont pas disponibles pour l'instant. Veuillez réessayer plus tard.",
    stripeError: "Paiement échoué. Veuillez réessayer.",

    profile: "Profil",
    account: "COMPTE",
    phone: "Téléphone",
    memberSince: "Membre depuis",
    preferences: "PRÉFÉRENCES",
    language: "Langue",
    changeLanguage: "Changer la langue de l'application",
    privacy: "CONFIDENTIALITÉ",
    removeMyNumber: "Supprimer mon numéro",
    removeMyNumberSub: "Masquer des résultats de recherche",
    numberRemoved: "Numéro supprimé",
    numberRemovedSub: "Masqué de tous les résultats de recherche",
    removeFromSearch: "Supprimer des résultats de recherche",
    removeConfirm: (cost: number) => `Cela supprimera votre numéro des résultats de recherche de tous. Cela coûte ${cost} pièces. Cette action est irréversible.`,
    removeCta: (cost: number) => `Supprimer (${cost} pièces)`,
    notEnoughCoinsRemove: (cost: number, balance: number) => `La suppression de votre numéro coûte ${cost} pièces. Vous avez actuellement ${balance} pièce${balance !== 1 ? "s" : ""}.`,
    getCoins: "Obtenir des pièces",
    removeSuccess: "Votre numéro de téléphone a été supprimé de tous les résultats de recherche.",
    removeFailed: "Échec de la suppression. Réessayez.",
    legal: "LÉGAL",
    privacyPolicy: "Politique de confidentialité",
    termsConditions: "Conditions générales",
    about: "À propos",
    session: "SESSION",
    logOut: "Se déconnecter",
    logOutConfirm: "Êtes-vous sûr de vouloir vous déconnecter ?",
    contactUs: "NOUS CONTACTER",
    contactEmail: "Votre email",
    contactMessage: "Votre message",
    contactSend: "Envoyer le message",
    contactSending: "Envoi en cours...",
    contactSent: "Message envoyé ! Nous vous répondrons bientôt.",
    contactFailed: "Échec de l'envoi. Veuillez réessayer.",
    dangerZone: "ZONE DANGEREUSE",
    deleteAccount: "Supprimer le compte",
    deleteAccountSub: "Supprimer définitivement toutes vos données",
    deleteConfirmTitle: "Supprimer le compte",
    deleteConfirmMsg: "Cela supprimera définitivement votre compte, vos contacts et toutes les données associées. Cette action est irréversible.",
    delete: "Supprimer",
    deleteSuccess: "Votre compte a été supprimé.",
    deleteFailed: "Échec de la suppression du compte. Réessayez.",
    tapToChange: "Appuyez pour changer la photo",
    contacts: "contacts",
    synced: "Synchronisé",
    notSynced: "Non synchronisé",

    changePhone: "Changer le numéro",
    backToVerification: "Retour à la vérification",
    loginWith: "Connectez-vous avec votre numéro et mot de passe",
    registerTagline: "Créez votre profil pour découvrir qui a votre numéro.",
    uploadContactsTitle: "Importez vos contacts pour débloquer la recherche",
    uploadContactsBody: "Partagez votre liste de contacts pour aider à construire le réseau. Vous pouvez ensuite rechercher n'importe quel numéro.",
    createOne: "Créer un compte",

    selectLanguage: "Sélectionner la langue",
    english: "Anglais",
    arabic: "Arabe",
    french: "Français",
    languageChanged: "Langue modifiée",
    languageChangedMsg: "L'application va redémarrer pour appliquer la nouvelle langue.",
    restart: "Redémarrer maintenant",

    underMaintenance: "En maintenance",
    maintenanceSub: "Nous apportons des améliorations pour vous offrir une meilleure expérience. Nous serons de retour bientôt.",
    scheduledMaintenance: "Maintenance programmée en cours",
    dataSafe: "Vos données sont en sécurité",
    notifyBack: "Nous vous informerons à notre retour",
    checkAgain: "Vérifier à nouveau",

    privacyPolicyTitle: "Politique de confidentialité",
    termsTitle: "Conditions générales",
    aboutTitle: "À propos",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
export type Translations = typeof translations.en;

export interface FontSet {
  regular: string;
  medium: string;
  semiBold: string;
  bold: string;
}

const interFonts: FontSet = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

const arabicFonts: FontSet = {
  regular: "JannaLTBold",
  medium: "JannaLTBold",
  semiBold: "JannaLTBold",
  bold: "JannaLTBold",
};

interface LanguageContextType {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  fonts: FontSet;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  t: translations.en,
  setLanguage: () => {},
  isRTL: false,
  fonts: interFonts,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [langLoaded, setLangLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(LANG_KEY);
      const lang: Language =
        saved === "en" || saved === "ar" || saved === "fr" ? saved : "en";
      I18nManager.forceRTL(lang === "ar");
      setLanguageState(lang);
      setLangLoaded(true);
    })();
  }, []);

  async function setLanguage(lang: Language) {
    await AsyncStorage.setItem(LANG_KEY, lang);
    I18nManager.forceRTL(lang === "ar");
    setLanguageState(lang);
  }

  const isRTL = language === "ar";
  const t = translations[language] as Translations;
  const fonts = language === "ar" ? arabicFonts : interFonts;

  if (!langLoaded) return null;

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage, isRTL, fonts }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
