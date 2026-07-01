// ─── Types ──────────────────────────────────────────────────────────────────

export interface GeneratorInput {
  textPrompt: string;       // Post text instruction (optional → auto)
  imagePrompt: string;      // Image generation/edit instruction (optional → stock/upload)
  uploadedImage?: string;   // Base64 uploaded image (optional)
  platform: string;
  tone: string;
  projectName?: string;
  projectDescription?: string;
  projectLink?: string;
}

export interface GeneratedAd {
  text: string;
  hashtags: string[];
  cta: string;
  imageUrl?: string;
  headline?: string;
  /** How the image was determined */
  imageMode?: "uploaded" | "generated-from-prompt" | "edited-from-upload" | "stock";
  /** How the text was determined */
  textMode?: "from-text-prompt" | "from-image-context" | "auto";
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Pick a contextually matching stock image from Unsplash based on prompt keywords */
function pickStockImage(prompt: string): string {
  const p = prompt.toLowerCase();
  const rules: [string[], string][] = [
    [["ყავა", "coffee", "კაფე", "cafe", "espresso", "latte", "cappuccino"],
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80"],
    [["ტანსაცმელი", "მოდა", "fashion", "style", "clothes", "wear", "dress", "outfit"],
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80"],
    [["სპორტი", "ვარჯიში", "gym", "fitness", "sport", "workout", "running", "yoga"],
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80"],
    [["საჭმელი", "food", "რესტორანი", "restaurant", "meal", "dish", "pizza", "burger", "სუში"],
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80"],
    [["ტექნოლოგია", "tech", "software", "app", "digital", "computer", "phone", "ai", "startup"],
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80"],
    [["სილამაზე", "beauty", "cosmetic", "makeup", "skincare", "perfume", "cream", "spa"],
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80"],
    [["ბუნება", "nature", "travel", "მოგზაურობა", "outdoor", "forest", "mountain", "sea", "ocean"],
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop&q=80"],
    [["სახლი", "home", "interior", "furniture", "decor", "house", "apartment", "room"],
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80"],
    [["ჯანმრთელობა", "health", "medical", "wellness", "doctor", "clinic", "pharmacy"],
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&auto=format&fit=crop&q=80"],
    [["ბიზნესი", "business", "office", "team", "meeting", "corporate", "work", "professional"],
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=80"],
    [["სასტუმრო", "hotel", "resort", "vacation", "trip", "journey", "tourism"],
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80"],
    [["მუსიკა", "music", "concert", "party", "event", "festival", "show"],
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80"],
    [["განათლება", "education", "learning", "study", "school", "university", "course"],
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80"],
    [["ფინანსი", "finance", "money", "bank", "investment", "crypto", "trading"],
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80"],
    [["ავტომობილი", "car", "auto", "vehicle", "drive", "transport", "მანქანა"],
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format&fit=crop&q=80"],
    [["ფოტო", "photo", "camera", "photography", "portrait", "studio", "shoot"],
      "https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=800&auto=format&fit=crop&q=80"],
    [["ბავშვი", "child", "kids", "family", "toy", "baby", "parenting"],
      "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop&q=80"],
    [["ქუჩა", "city", "urban", "street", "building", "architecture", "modern"],
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&auto=format&fit=crop&q=80"],
  ];

  for (const [kws, url] of rules) {
    if (kws.some(k => p.includes(k))) return url;
  }
  // Default business/tech
  return "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80";
}

// ─── Main generator ──────────────────────────────────────────────────────────

export function generateMockAd(input: GeneratorInput): GeneratedAd {
  const {
    textPrompt,
    imagePrompt,
    uploadedImage,
    platform,
    tone,
    projectName = "",
    projectDescription = "",
  } = input;

  const hasText     = textPrompt.trim()   !== "";
  const hasImgPrmt  = imagePrompt.trim()  !== "";
  const hasUpload   = !!uploadedImage;

  // ══════════════════════════════════════════════════════
  // IMAGE LOGIC
  // ══════════════════════════════════════════════════════
  //  hasUpload + hasImgPrmt  → NEW image generated from (upload + prompt)
  //  hasUpload + !hasImgPrmt → use uploaded image as-is (analyze for text)
  //  !hasUpload + hasImgPrmt → generate image from prompt
  //  !hasUpload + !hasImgPrmt → stock image from text/project context

  let imageUrl: string;
  let imageMode: GeneratedAd["imageMode"];

  if (hasUpload && hasImgPrmt) {
    // Edit: combine uploaded image with image prompt → generate new mock image
    imageUrl = pickStockImage(imagePrompt);
    imageMode = "edited-from-upload";
  } else if (hasUpload) {
    imageUrl = uploadedImage!;
    imageMode = "uploaded";
  } else if (hasImgPrmt) {
    imageUrl = pickStockImage(imagePrompt);
    imageMode = "generated-from-prompt";
  } else {
    imageUrl = pickStockImage(textPrompt || projectDescription || projectName);
    imageMode = "stock";
  }

  // ══════════════════════════════════════════════════════
  // TEXT LOGIC
  // ══════════════════════════════════════════════════════
  //  hasText              → use text prompt as-is
  //  hasUpload + !hasImgPrmt → analyze uploaded image (text from image context)
  //  hasImgPrmt           → derive text from image prompt context
  //  none                 → full auto (use project context)

  let effectivePrompt: string;
  let textMode: GeneratedAd["textMode"];

  if (hasText) {
    effectivePrompt = textPrompt.trim();
    textMode = "from-text-prompt";
  } else if (hasUpload && !hasImgPrmt) {
    effectivePrompt = projectName || "ატვირთული პროდუქტი";
    textMode = "from-image-context";
  } else if (hasImgPrmt) {
    effectivePrompt = imagePrompt.trim();
    textMode = "from-image-context";
  } else {
    effectivePrompt = projectName || projectDescription || "ჩვენი სერვისი";
    textMode = "auto";
  }

  // Sanitise effectivePrompt
  effectivePrompt = effectivePrompt.replace(/^\[[^\]]+\]\s*/g, "").trim();
  if (!effectivePrompt) effectivePrompt = projectName || "ჩვენი პროდუქტი";

  // ══════════════════════════════════════════════════════
  // HEADLINE
  // ══════════════════════════════════════════════════════
  let headline = "";
  if (textMode === "from-image-context" && hasUpload && !hasImgPrmt) {
    headline = `📸 ფოტო-ანალიზი: ${projectName || effectivePrompt}`;
  } else if (imageMode === "edited-from-upload") {
    headline = `✨ სურათი გადამუშავდა: ${effectivePrompt || projectName}`;
  } else if (imageMode === "generated-from-prompt") {
    headline = `🎨 სურათი დაგენერირდა: ${effectivePrompt}`;
  } else {
    switch (tone) {
      case "professional": headline = `პროფესიონალური გადაწყვეტილება: ${effectivePrompt}`; break;
      case "funny":        headline = `😎 აი ის, რასაც ამდენ ხანს მალავდნენ! ${effectivePrompt}`; break;
      case "bold":         headline = `💥 დროა შეცვალო თამაშის წესები: ${effectivePrompt}!`; break;
      case "friendly":     headline = `👋 მოგესალმებით მეგობრებო! გაიცანით ${effectivePrompt}`; break;
      default:             headline = `აღმოაჩინე ${effectivePrompt}`;
    }
  }

  // ══════════════════════════════════════════════════════
  // TEXT CONTENT BY PLATFORM × TONE
  // ══════════════════════════════════════════════════════
  let text = "";
  let cta = "გაიგე მეტი";
  let hashtags: string[] = [];

  // Build optional context prefix based on mode
  const buildPrefix = (): string => {
    if (textMode === "from-image-context" && hasUpload && !hasImgPrmt)
      return `🎯 სურათის ანალიზის შედეგი:\n\nატვირთული ფოტოს საფუძველზე შექმნილია პოსტი!\n\n`;
    if (textMode === "from-image-context" && hasImgPrmt)
      return `🎨 სურათის კონტექსტიდან:\n\n`;
    if (textMode === "auto")
      return `✨ ავტო-გენერაცია:\n\n`;
    return "";
  };

  // ── FACEBOOK ──────────────────────────────────────────
  if (platform === "facebook") {
    hashtags = ["#ინოვაცია", "#წარმატება", "#GoniFlow", "#კონტენტი"];
    cta = "დააჭირე აქ და გაიგე მეტი";
    const px = buildPrefix();

    switch (tone) {
      case "professional":
        text = `${px}ეფექტურობა და ხარისხი ერთ სივრცეში! 🎯\n\nთუ ეძებთ სანდო გადაწყვეტილებას, გაეცანით: "${effectivePrompt}".\n\nჩვენ გთავაზობთ თანამედროვე სტანდარტებზე მორგებულ სერვისს, რომელიც დაგეხმარებათ მიზნების მიღწევაში.`;
        break;
      case "funny":
        text = `${px}სერიოზულად, კიდევ ფიქრობთ? 🤔\n\n"${effectivePrompt}" – ზუსტად ის, რაც თქვენს პროდუქტიულობას (ან ხასიათს) ახალ საფეხურზე აყვანს! 😄\n\nP.S. მარაგები იწურება (ჩვენი იუმორივით).`;
        break;
      case "bold":
        text = `${px}⚡️ გაბედე მეტი! არ დაკმაყოფილდე საშუალო შედეგებით.\n\n"${effectivePrompt}" შექმნილია მათთვის, ვისაც სურს იყოს პირველი.\n\n🚀 გადადგი ნაბიჯი წარმატებისკენ დღესვე!`;
        break;
      case "friendly":
        text = `${px}გამარჯობა მეგობრებო! 🌟\n\nგვინდა გაგიზიაროთ: "${effectivePrompt}". ჩვენ გულითა და მონდომებით ვიმუშავეთ ამაზე.\n\nმოგვწერეთ ნებისმიერ დროს! ❤️`;
        break;
      default:
        text = `${px}გაიცანით ახალი შესაძლებლობა: "${effectivePrompt}". საუკეთესო შეთავაზება სპეციალურად თქვენთვის.`;
    }
  }

  // ── INSTAGRAM ─────────────────────────────────────────
  else if (platform === "instagram") {
    hashtags = ["#instadaily", "#lifestyle", "#creative", "#loveit", "#trending"];
    cta = "იხილეთ ბმული პროფილში 🔗";
    const px = textMode === "from-image-context" && hasUpload ? "🎯 ფოტო-ანალიზი:\n\n" :
               textMode === "from-image-context" ? "🎨 " : "";

    switch (tone) {
      case "professional":
        text = `${px}სრულყოფილება დეტალებშია. ✨\n\nწარმოგიდგენთ "${effectivePrompt}"-ს. პროფესიონალებისთვის, თქვენი შედეგისთვის.\n\n💼 გაზარდეთ პროდუქტიულობა.`;
        break;
      case "funny":
        text = `${px}როცა გგონია, რომ ყველაფერი გაქვს, მაგრამ უცებ ამას აღმოაჩენ... 🤷‍♂️💥\n\n"${effectivePrompt}" – ყოველდღიური ცხოვრების ახალი გმირი.\n\n📸 მონიშნე მეგობარი, ვისაც ეს სჭირდება!`;
        break;
      case "bold":
        text = `${px}ეს მხოლოდ დასაწყისია! 🔥\n\n"${effectivePrompt}" ცვლის ყველაფერს. ნუ იქნები მაყურებელი.\n\n💥 იმოქმედე ახლა!`;
        break;
      case "friendly":
        text = `${px}თბილი და მყუდრო დღე ყველას! ☕️✨\n\nგვინდა გაჩვენოთ ჩვენი ფავორიტი – "${effectivePrompt}".\n\n💬 დაგვიტოვეთ კომენტარი!`;
        break;
      default:
        text = `${px}ახალი ესთეტიკა და ფუნქციონალი. გაიცანით "${effectivePrompt}" ✨`;
    }
  }

  // ── LINKEDIN ──────────────────────────────────────────
  else if (platform === "linkedin") {
    hashtags = ["#business", "#networking", "#innovation", "#leadership", "#b2b"];
    cta = "წაიკითხეთ სრული სტატია";
    const px = textMode === "from-image-context" && hasUpload ? "📸 ვიზუალური ანალიზი:\n\n" : "";

    switch (tone) {
      case "professional":
        text = `${px}მოხარული ვართ წარმოგიდგინოთ: "${effectivePrompt}".\n\nდღევანდელ ბაზარზე ეფექტური ინსტრუმენტების ქონა გადამწყვეტია. ეს გადაწყვეტილება ოპტიმიზაციას უკეთებს ბიზნეს პროცესებს.\n\nმოხარული ვიქნებით კომენტარებში.`;
        break;
      case "funny":
        text = `${px}ვინ თქვა, რომ LinkedIn-ზე იუმორი აკრძალულია? 😉\n\n"${effectivePrompt}" – ის მართლაც მუშაობს! შეხვედრებს ვერ ჩაანაცვლებს (სამწუხაროდ).`;
        break;
      case "bold":
        text = `${px}ლიდერობა ნიშნავს გარისკვას! 🚀\n\n"${effectivePrompt}" რევოლუციას მოახდენს თქვენს სფეროში. მიიღე სტრატეგიული გადაწყვეტილება დღესვე.`;
        break;
      case "friendly":
        text = `${px}მოგესალმებით, კოლეგებო! 👋\n\nდიდი სიხარულია გაგიზიაროთ: "${effectivePrompt}". ეს მრავალთვიანი მუშაობის შედეგია.\n\nგმადლობთ მხარდაჭერისთვის!`;
        break;
      default:
        text = `${px}ახალი გადაწყვეტილება ბიზნესის ზრდისთვის: "${effectivePrompt}".`;
    }
  }

  // ── X (Twitter) ───────────────────────────────────────
  else if (platform === "x") {
    hashtags = ["#GoniFlow", "#Tech", "#Future"];
    cta = "გადადი ბმულზე 🔗";
    const px = textMode === "from-image-context" && hasUpload ? "📸 " : "";

    switch (tone) {
      case "professional":
        text = `${px}წარმოგიდგენთ "${effectivePrompt}"-ს. ოპტიმიზებული, სწრაფი და სანდო. 🎯`;
        break;
      case "funny":
        text = `${px}იდეალური პროდუქტი არსებობს! გაიცანი: "${effectivePrompt}". სპოილერი: ის მართლა ასეა! 😎`;
        break;
      case "bold":
        text = `${px}ძველი წესები აღარ მუშაობს. ახალი ეტაპი: "${effectivePrompt}"! ⚡️🚀`;
        break;
      case "friendly":
        text = `${px}გამარჯობა ყველას! გაიცანი "${effectivePrompt}" – შექმნილია სიყვარულით. ❤️`;
        break;
      default:
        text = `${px}ახალი შესაძლებლობები: "${effectivePrompt}"-თან ერთად. 🌟`;
    }
  }

  return { text, hashtags, cta, imageUrl, headline, imageMode, textMode };
}
