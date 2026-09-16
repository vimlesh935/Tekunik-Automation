const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const localesDir = path.join(root, "frontend", "src", "locales");

const localeNames = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  gu: "Gujarati",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  bn: "Bengali",
  pa: "Punjabi",
  or: "Odia",
  as: "Assamese",
  ur: "Urdu",
};

const additions = {
  common: {
    networkError: "Unable to connect to the server. Please refresh the page or try again later.",
    review: "review",
    selectLanguage: "Select Language",
    noLanguagesFound: "No languages found",
    searchLanguages: "Search languages...",
    bookFreeDemo: "Book Free Demo",
    chatOnWhatsApp: "Chat on WhatsApp",
    getStarted: "Get Started",
    learnMore: "Learn More",
    contactUs: "Contact Us",
  },
  language: {
    availableLanguages: "Available languages",
    closeSelector: "Close language selector",
  },
  home: {
    loadFailed: "Failed to sync store parameters. Please reload.",
    openWhatsappSupport: "Open WhatsApp support chat",
  },
  homeApplications: {
    smartHome: {
      title: "Smart Home",
      desc: "Smart switches, digital locks, gateways, sensors and automation devices designed for modern homes.",
    },
    office: {
      title: "Office Automation",
      desc: "Improve productivity and control lighting, access, and energy usage efficiently.",
    },
    hotel: {
      title: "Hotel Solutions",
      desc: "Smart room control, access management and guest convenience automation systems.",
    },
    hospital: {
      title: "Hospital Automation",
      desc: "Reliable automation solutions for healthcare facilities and smart infrastructure management.",
    },
    school: {
      title: "School & College Solutions",
      desc: "Smart classrooms, energy-efficient control systems and secure access management.",
    },
    industrial: {
      title: "Industrial Automation",
      desc: "Advanced control systems, monitoring devices and automation solutions for industrial environments.",
    },
    availableCount: "{{count}} {{productLabel}} available",
  },
  homeApp: {
    tapCards: "Tap the cards on the phone, every action here is live.",
    deviceState: "{{device}} {{state}}",
    cameraStreaming: "4K · Streaming",
    feedPaused: "Feed paused",
    states: {
      on: "On",
      off: "Off",
      locked: "Locked",
      unlocked: "Unlocked",
    },
    controls: {
      lights: {
        label: "Lights",
        on: "Lights turned on",
        off: "Lights turned off",
      },
      doors: {
        label: "Front Door",
        on: "Front door locked",
        off: "Front door unlocked",
      },
      camera: {
        label: "Living Room Cam",
        on: "Camera feed resumed",
        off: "Camera feed paused",
      },
    },
  },
  homeCounter: {
    homesAutomated: "Homes Automated",
    projects: "Projects",
    products: "Products",
    customerSatisfaction: "Customer Satisfaction",
  },
  homeScenes: {
    active: "Active",
    activeScene: "Active - {{scene}}",
    morning: {
      title: "Morning Mode",
      desc: "Curtains open, coffee machine starts, and gentle lights turn on.",
      step1: "Curtains open",
      step2: "Coffee brews",
      step3: "Lights fade in",
    },
    goodNight: {
      title: "Good Night",
      desc: "Doors lock, lights dim, and AC sets to optimal sleep temperature.",
      step1: "Doors lock",
      step2: "Lights dim",
      step3: "AC sets to sleep temp",
    },
    vacation: {
      title: "Vacation Mode",
      desc: "Randomized lighting and active security cameras for peace of mind.",
      step1: "Lighting randomizes",
      step2: "Cameras arm",
      step3: "Alerts enabled",
    },
    movie: {
      title: "Movie Mode",
      desc: "Curtains close, lights dim to 10%, and TV turns on instantly.",
      step1: "Curtains close",
      step2: "Lights dim to 10%",
      step3: "TV powers on",
    },
  },
  homeFaq: {
    title: "Frequently Asked Questions",
    subtitle: "Everything you need to know about our smart home ecosystem.",
    wiring: {
      question: "Do I need special wiring for Automate switches?",
      answer: "No, Automate switches are designed to fit into your existing switchboards without requiring neutral wires or re-wiring.",
    },
    security: {
      question: "Is my data secure?",
      answer: "Yes. We use bank-level AES-256 encryption. Your video feeds and data never leave our secure cloud environment.",
    },
    internet: {
      question: "What happens if the internet goes down?",
      answer: "Your smart devices will continue to function normally via physical switches or local network controls if you are connected to the same Wi-Fi router.",
    },
    installation: {
      question: "Do you offer professional installation?",
      answer: "Absolutely. We have certified professionals who can install and configure your smart home in a few hours.",
    },
    subscription: {
      question: "Is there a monthly subscription fee?",
      answer: "Basic app usage and device control is free. Optional premium plans can extend cloud storage for camera feeds.",
    },
  },
  smartHome: {
    liveFeed: "Live feed",
    liveStatus: "Live status",
    status: {
      on: "ON",
      temperature: "24°C",
      openPercent: "60%",
      locked: "LOCKED",
      live: "LIVE",
      automationCount: "3",
    },
    meta: {
      brightness: "78% brightness",
      autoMode: "Auto mode",
      openEast: "Open · east side",
      frontDoorSecure: "Front door secure",
      camerasStreaming: "4 cameras streaming",
      automationsActive: "Automations active",
    },
  },
  whyTeknode: {
    climate: {
      engine: "Climate Engine",
      temperature: "Temperature",
      cold: "Cold",
      mild: "Mild",
      hot: "Hot",
      cooling: "ZONE-B COOLING",
      balanced: "ZONE-A BALANCED",
      heating: "ZONE-C HEATING",
      winter: "Winter",
      ember: "Ember",
    },
  },
  coupon: {
    label: "Coupon",
    availableCoupons: "Available coupons and offers",
    percentOff: "{{percent}}% OFF",
    amountOff: "{{amount}} OFF",
    minOrderShort: "Min. {{amount}}",
    locked: "Locked",
    addMoreToUnlock: "Add {{amount}} more to unlock",
    validOnOrder: "Valid on this order.",
    showDetails: "Show details",
    upToOff: "Up to {{amount}} off",
    applyCoupon: "Apply coupon {{code}}",
    copyCoupon: "Copy coupon code {{code}}",
    applied: "Coupon applied successfully",
    removed: "Coupon removed",
    fetched: "Coupons fetched",
    availableFetched: "Available coupons fetched",
    validated: "Coupon validated",
    cartTotals: "Cart totals calculated",
    invalid: "Invalid coupon code",
    expired: "Coupon has expired",
    minimumNotMet: "Minimum order value not met",
  },
  product: {
    lowStock: "Low stock",
    colorVariants: "Color variants",
    fetched: "Products fetched",
    singleFetched: "Product fetched",
    notFound: "Product not found",
  },
  auth: {
    registeredSuccess: "Registration successful! Welcome to Tek Node.",
    loggedInSuccess: "Logged in successfully",
    loggedOutSuccess: "Logged out successfully",
    passwordChanged: "Password changed successfully",
    passwordMismatch: "Passwords do not match",
    otpSent: "OTP sent to your email",
    otpVerified: "OTP verified successfully",
    invalidOtp: "Invalid OTP. Please try again.",
    otpExpired: "OTP has expired. Please request a new one.",
    profileFetched: "Profile fetched",
    profileUpdated: "Profile updated successfully",
    verificationRequired: "Verification is required to change the password",
    verificationExpired: "Verification expired or invalid. Please request a new OTP.",
    weakPassword: "Password must be at least 8 characters",
    invalidEmail: "Invalid email address",
    invalidPassword: "Invalid password",
    invalidSession: "Invalid or expired session",
    userNotFound: "User not found",
    emailExists: "Email already registered",
  },
  order: {
    placedSuccess: "Order placed successfully",
    fetched: "Order fetched",
    updated: "Order updated",
    cancelled: "Order cancelled",
    notFound: "Order not found",
    tracked: "Order tracked",
    returnRequested: "Return requested",
    refunded: "Order refunded",
  },
  payment: {
    orderCreated: "Payment order created",
    verified: "Payment verified successfully",
    alreadyVerified: "Payment already verified",
    detailsFetched: "Payment details fetched",
    failed: "Payment failed",
  },
  wishlist: {
    fetched: "Wishlist fetched",
    itemAdded: "Added to wishlist",
    itemRemoved: "Removed from wishlist",
  },
  notifications: {
    fetched: "Notifications fetched",
    markedRead: "Notification marked as read",
    allMarkedRead: "All notifications marked as read",
    deleted: "Notification deleted",
    cleared: "All notifications cleared",
    unreadCountFetched: "Unread count fetched",
  },
  review: {
    submitted: "Review submitted successfully",
    websiteSubmitted: "Website review submitted successfully. Awaiting admin approval.",
    fetched: "Reviews fetched",
    countsFetched: "Review counts fetched",
  },
  category: {
    fetched: "Categories fetched",
  },
  offers: {
    fetched: "Offers fetched",
  },
  demo: {
    submitted: "Your demo enquiry has been submitted successfully! We will contact you shortly.",
  },
  backInStock: {
    subscribed: "We'll notify you when this product is back in stock",
    alreadyAvailable: "Product is already in stock",
    cancelled: "Notification cancelled",
  },
  recentlyViewed: {
    fetched: "Recently viewed products fetched",
    recorded: "Recently viewed product recorded",
    removed: "Recently viewed product removed",
    cleared: "Recently viewed products cleared",
  },
};

const hiAdditions = {
  common: {
    networkError: "सर्वर से कनेक्ट नहीं हो सका। कृपया पेज रीफ्रेश करें या बाद में फिर कोशिश करें।",
    review: "समीक्षा",
    selectLanguage: "भाषा चुनें",
    noLanguagesFound: "कोई भाषा नहीं मिली",
    searchLanguages: "भाषाएँ खोजें...",
    bookFreeDemo: "मुफ्त डेमो बुक करें",
    chatOnWhatsApp: "व्हाट्सऐप पर चैट करें",
    getStarted: "शुरू करें",
    learnMore: "और जानें",
    contactUs: "संपर्क करें",
  },
  language: {
    availableLanguages: "उपलब्ध भाषाएँ",
    closeSelector: "भाषा चयन बंद करें",
  },
  home: {
    loadFailed: "स्टोर डेटा सिंक नहीं हो सका। कृपया फिर लोड करें।",
    openWhatsappSupport: "व्हाट्सऐप सहायता चैट खोलें",
  },
  homeApplications: {
    smartHome: { title: "स्मार्ट होम", desc: "आधुनिक घरों के लिए स्मार्ट स्विच, डिजिटल लॉक, गेटवे, सेंसर और ऑटोमेशन डिवाइस।" },
    office: { title: "ऑफिस ऑटोमेशन", desc: "लाइटिंग, एक्सेस और ऊर्जा उपयोग को कुशलता से नियंत्रित कर उत्पादकता बढ़ाएँ।" },
    hotel: { title: "होटल समाधान", desc: "स्मार्ट रूम नियंत्रण, एक्सेस प्रबंधन और अतिथि सुविधा ऑटोमेशन सिस्टम।" },
    hospital: { title: "अस्पताल ऑटोमेशन", desc: "स्वास्थ्य सुविधाओं और स्मार्ट इंफ्रास्ट्रक्चर के लिए भरोसेमंद ऑटोमेशन समाधान।" },
    school: { title: "स्कूल और कॉलेज समाधान", desc: "स्मार्ट क्लासरूम, ऊर्जा-कुशल नियंत्रण प्रणाली और सुरक्षित एक्सेस प्रबंधन।" },
    industrial: { title: "औद्योगिक ऑटोमेशन", desc: "औद्योगिक वातावरण के लिए उन्नत नियंत्रण प्रणाली, निगरानी डिवाइस और ऑटोमेशन समाधान।" },
    availableCount: "{{count}} {{productLabel}} उपलब्ध",
  },
  homeApp: {
    tapCards: "फोन पर कार्ड टैप करें, यहाँ हर कार्रवाई लाइव है।",
    deviceState: "{{device}} {{state}}",
    cameraStreaming: "4K · स्ट्रीमिंग",
    feedPaused: "फीड रुकी हुई है",
    states: { on: "चालू", off: "बंद", locked: "लॉक", unlocked: "अनलॉक" },
    controls: {
      lights: { label: "लाइट्स", on: "लाइट्स चालू हो गईं", off: "लाइट्स बंद हो गईं" },
      doors: { label: "मुख्य दरवाज़ा", on: "मुख्य दरवाज़ा लॉक हो गया", off: "मुख्य दरवाज़ा अनलॉक हो गया" },
      camera: { label: "लिविंग रूम कैमरा", on: "कैमरा फीड फिर शुरू हुई", off: "कैमरा फीड रोक दी गई" },
    },
  },
  homeCounter: {
    homesAutomated: "ऑटोमेटेड घर",
    projects: "प्रोजेक्ट",
    products: "उत्पाद",
    customerSatisfaction: "ग्राहक संतुष्टि",
  },
  homeScenes: {
    active: "सक्रिय",
    activeScene: "सक्रिय - {{scene}}",
    morning: { title: "मॉर्निंग मोड", desc: "पर्दे खुलते हैं, कॉफी मशीन शुरू होती है और हल्की लाइटें चालू होती हैं।", step1: "पर्दे खुलते हैं", step2: "कॉफी बनती है", step3: "लाइट धीरे चालू होती है" },
    goodNight: { title: "गुड नाइट", desc: "दरवाज़े लॉक होते हैं, लाइट धीमी होती है और AC नींद के तापमान पर सेट होता है।", step1: "दरवाज़े लॉक", step2: "लाइट धीमी", step3: "AC स्लीप तापमान पर" },
    vacation: { title: "वेकेशन मोड", desc: "मन की शांति के लिए रैंडम लाइटिंग और सक्रिय सुरक्षा कैमरे।", step1: "लाइटिंग रैंडम", step2: "कैमरे सक्रिय", step3: "अलर्ट चालू" },
    movie: { title: "मूवी मोड", desc: "पर्दे बंद, लाइट 10% तक धीमी और टीवी तुरंत चालू।", step1: "पर्दे बंद", step2: "लाइट 10% तक धीमी", step3: "टीवी चालू" },
  },
  homeFaq: {
    title: "अक्सर पूछे जाने वाले प्रश्न",
    subtitle: "हमारे स्मार्ट होम इकोसिस्टम के बारे में जरूरी जानकारी।",
    wiring: { question: "क्या Automate स्विच के लिए विशेष वायरिंग चाहिए?", answer: "नहीं, Automate स्विच आपके मौजूदा स्विचबोर्ड में बिना न्यूट्रल वायर या री-वायरिंग के फिट होने के लिए बने हैं।" },
    security: { question: "क्या मेरा डेटा सुरक्षित है?", answer: "हाँ। हम बैंक-स्तर AES-256 एन्क्रिप्शन उपयोग करते हैं। आपके वीडियो फीड और डेटा सुरक्षित क्लाउड में रहते हैं।" },
    internet: { question: "इंटरनेट बंद हो जाए तो क्या होगा?", answer: "आपके स्मार्ट डिवाइस फिजिकल स्विच या लोकल नेटवर्क कंट्रोल से सामान्य रूप से काम करते रहेंगे।" },
    installation: { question: "क्या आप प्रोफेशनल इंस्टॉलेशन देते हैं?", answer: "बिल्कुल। हमारे प्रमाणित प्रोफेशनल कुछ घंटों में आपका स्मार्ट होम इंस्टॉल और कॉन्फिगर कर सकते हैं।" },
    subscription: { question: "क्या मासिक सब्सक्रिप्शन शुल्क है?", answer: "बेसिक ऐप उपयोग और डिवाइस कंट्रोल मुफ्त है। कैमरा फीड के लिए वैकल्पिक प्रीमियम प्लान उपलब्ध हैं।" },
  },
  smartHome: {
    liveFeed: "लाइव फीड",
    liveStatus: "लाइव स्थिति",
    status: { on: "चालू", temperature: "24°C", openPercent: "60%", locked: "लॉक", live: "लाइव", automationCount: "3" },
    meta: { brightness: "78% चमक", autoMode: "ऑटो मोड", openEast: "खुला · पूर्व दिशा", frontDoorSecure: "मुख्य दरवाज़ा सुरक्षित", camerasStreaming: "4 कैमरे स्ट्रीम कर रहे हैं", automationsActive: "ऑटोमेशन सक्रिय" },
  },
  whyTeknode: {
    climate: {
      engine: "क्लाइमेट इंजन",
      temperature: "तापमान",
      cold: "ठंडा",
      mild: "मध्यम",
      hot: "गर्म",
      cooling: "ज़ोन-B कूलिंग",
      balanced: "ज़ोन-A संतुलित",
      heating: "ज़ोन-C हीटिंग",
      winter: "सर्दी",
      ember: "गरम",
    },
  },
};

const mrAdditions = {
  common: {
    networkError: "सर्व्हरशी कनेक्ट होऊ शकले नाही. कृपया पेज रीफ्रेश करा किंवा नंतर पुन्हा प्रयत्न करा.",
    review: "पुनरावलोकन",
    selectLanguage: "भाषा निवडा",
    noLanguagesFound: "भाषा सापडली नाही",
    searchLanguages: "भाषा शोधा...",
    bookFreeDemo: "मोफत डेमो बुक करा",
    chatOnWhatsApp: "WhatsApp वर चॅट करा",
    getStarted: "सुरू करा",
    learnMore: "अधिक जाणून घ्या",
    contactUs: "संपर्क करा",
  },
  language: {
    availableLanguages: "उपलब्ध भाषा",
    closeSelector: "भाषा निवड बंद करा",
  },
  home: {
    loadFailed: "स्टोअर माहिती सिंक होऊ शकली नाही. कृपया पुन्हा लोड करा.",
    openWhatsappSupport: "WhatsApp सपोर्ट चॅट उघडा",
  },
  homeApplications: {
    smartHome: { title: "स्मार्ट होम", desc: "आधुनिक घरांसाठी स्मार्ट स्विच, डिजिटल लॉक, गेटवे, सेन्सर आणि ऑटोमेशन डिव्हाइस." },
    office: { title: "ऑफिस ऑटोमेशन", desc: "लाइटिंग, प्रवेश आणि ऊर्जा वापर कार्यक्षमपणे नियंत्रित करून उत्पादकता वाढवा." },
    hotel: { title: "हॉटेल सोल्यूशन्स", desc: "स्मार्ट रूम कंट्रोल, प्रवेश व्यवस्थापन आणि पाहुण्यांसाठी सुविधा ऑटोमेशन." },
    hospital: { title: "हॉस्पिटल ऑटोमेशन", desc: "आरोग्य सुविधा आणि स्मार्ट इन्फ्रास्ट्रक्चरसाठी विश्वासार्ह ऑटोमेशन सोल्यूशन्स." },
    school: { title: "शाळा आणि कॉलेज सोल्यूशन्स", desc: "स्मार्ट क्लासरूम, ऊर्जा-बचत नियंत्रण प्रणाली आणि सुरक्षित प्रवेश व्यवस्थापन." },
    industrial: { title: "इंडस्ट्रियल ऑटोमेशन", desc: "औद्योगिक वातावरणासाठी प्रगत नियंत्रण प्रणाली, मॉनिटरिंग डिव्हाइस आणि ऑटोमेशन सोल्यूशन्स." },
    availableCount: "{{count}} {{productLabel}} उपलब्ध",
  },
};

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(target, source, { overwrite = false } = {}) {
  for (const [key, value] of Object.entries(source || {})) {
    if (isObject(value)) {
      if (!isObject(target[key])) target[key] = {};
      deepMerge(target[key], value, { overwrite });
    } else if (overwrite || target[key] === undefined) {
      target[key] = value;
    }
  }
  return target;
}

function parseTopLevelMerge(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) return JSON.parse(text);
  const merged = {};
  let i = 1;
  while (i < trimmed.length - 1) {
    while (/[\s,]/.test(trimmed[i])) i += 1;
    if (trimmed[i] === "}") break;
    if (trimmed[i] !== "\"") throw new Error(`Expected key at ${i}`);
    let keyEnd = i + 1;
    while (trimmed[keyEnd] !== "\"" || trimmed[keyEnd - 1] === "\\") keyEnd += 1;
    const key = JSON.parse(trimmed.slice(i, keyEnd + 1));
    i = keyEnd + 1;
    while (/[\s:]/.test(trimmed[i])) i += 1;
    const valueStart = i;
    let depth = 0;
    let inString = false;
    let quote = "";
    while (i < trimmed.length) {
      const ch = trimmed[i];
      if (inString) {
        if (ch === quote && trimmed[i - 1] !== "\\") inString = false;
      } else if (ch === "\"" || ch === "'") {
        inString = true;
        quote = ch;
      } else if (ch === "{" || ch === "[") {
        depth += 1;
      } else if (ch === "}" || ch === "]") {
        if (depth === 0) break;
        depth -= 1;
      } else if (ch === "," && depth === 0) {
        break;
      }
      i += 1;
    }
    const value = JSON.parse(trimmed.slice(valueStart, i));
    if (isObject(value) && isObject(merged[key])) deepMerge(merged[key], value);
    else merged[key] = value;
    if (trimmed[i] === ",") i += 1;
  }
  return merged;
}

function get(object, keyPath) {
  return keyPath.split(".").reduce((cursor, key) => {
    if (!cursor || !Object.prototype.hasOwnProperty.call(cursor, key)) return undefined;
    return cursor[key];
  }, object);
}

function set(object, keyPath, value) {
  const parts = keyPath.split(".");
  let cursor = object;
  for (const part of parts.slice(0, -1)) {
    if (!isObject(cursor[part])) cursor[part] = {};
    cursor = cursor[part];
  }
  cursor[parts.at(-1)] = value;
}

function flatten(object, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(object || {})) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (isObject(value)) flatten(value, next, out);
    else out[next] = value;
  }
  return out;
}

function deriveStatus(locale) {
  const orders = locale.orders || {};
  return {
    order: {
      pending: orders.pending || "Pending",
      confirmed: orders.confirmed || "Confirmed",
      processing: orders.processing || "Processing",
      packed: orders.packed || "Packed",
      shipped: orders.shipped || "Shipped",
      outForDelivery: orders.outForDelivery || "Out for Delivery",
      delivered: orders.delivered || "Delivered",
      cancelled: orders.cancelled || "Cancelled",
      returned: orders.returned || "Returned",
      refunded: orders.refunded || "Refunded",
      partiallyRefunded: orders.partiallyRefunded || "Partially Refunded",
    },
    payment: {
      pending: orders.pending || "Pending",
      paid: orders.paid || "Paid",
      failed: orders.failed || "Failed",
      refunded: orders.refunded || "Refunded",
      refundPending: orders.refundPending || "Refund Pending",
    },
    product: {
      active: "Active",
      inactive: "Inactive",
      outOfStock: locale.product?.outOfStock || "Out of Stock",
      inStock: locale.product?.inStock || "In Stock",
      lowStock: locale.product?.lowStock || "Low Stock",
    },
    return: {
      pending: orders.pending || "Pending",
      approved: "Approved",
      rejected: "Rejected",
      processing: orders.processing || "Processing",
      completed: "Completed",
    },
    review: {
      pending: orders.pending || "Pending",
      approved: "Approved",
      rejected: "Rejected",
    },
    refund: {
      pending: orders.pending || "Pending",
      processed: orders.refunded || "Processed",
      failed: orders.failed || "Failed",
    },
    coupon: {
      active: "Active",
      disabled: "Disabled",
      expired: locale.dashboard?.expired || "Expired",
      used: locale.dashboard?.used || "Used",
    },
  };
}

function deriveNotificationTypes(locale) {
  return {
    orderPlaced: locale.orders?.orderPlaced || "Order Placed",
    orderConfirmed: locale.orders?.confirmed || "Order Confirmed",
    orderProcessing: locale.orders?.processing || "Order Processing",
    orderShipped: locale.orders?.shipped || "Order Shipped",
    orderOutForDelivery: locale.orders?.outForDelivery || "Out for Delivery",
    orderDelivered: locale.orders?.delivered || "Order Delivered",
    orderCancelled: locale.orders?.cancelled || "Order Cancelled",
    wishlist: locale.dashboard?.myWishlist || "Wishlist",
    offers: locale.dashboard?.offersAndCoupons || "Offers",
    priceDrops: "Price Drops",
    backInStock: "Back in Stock",
    system: "System",
    products: locale.common?.products || "Products",
    smartHome: locale.homeApplications?.smartHome?.title || "Smart Home",
    all: locale.dashboard?.all || "All",
    unread: locale.nav?.unread || "Unread",
  };
}

function main() {
  const files = fs.readdirSync(localesDir).filter((file) => file.endsWith(".json")).sort();

  const normalized = {};
  for (const file of files) {
    const code = path.basename(file, ".json");
    const fullPath = path.join(localesDir, file);
    const locale = parseTopLevelMerge(fs.readFileSync(fullPath, "utf8"));
    deepMerge(locale, additions);
    if (code === "hi") deepMerge(locale, hiAdditions, { overwrite: true });
    if (code === "mr") deepMerge(locale, mrAdditions, { overwrite: true });
    locale.status = deepMerge(locale.status || {}, deriveStatus(locale));
    locale.notificationTypes = deepMerge(locale.notificationTypes || {}, deriveNotificationTypes(locale));
    normalized[code] = locale;
  }

  const en = normalized.en;
  const enFlat = flatten(en);
  for (const [code, locale] of Object.entries(normalized)) {
    if (code !== "en") {
      for (const [key, value] of Object.entries(enFlat)) {
        if (get(locale, key) === undefined) set(locale, key, value);
      }
    }

    const filePath = path.join(localesDir, `${code}.json`);
    fs.writeFileSync(filePath, `${JSON.stringify(locale, null, 2)}\n`, "utf8");
    console.log(`${code}: normalized ${localeNames[code] || code}`);
  }
}

main();
