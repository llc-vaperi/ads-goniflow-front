export interface GeneratedAd {
  text: string;
  hashtags: string[];
  cta: string;
  imageUrl?: string;
  headline?: string;
}

export function generateMockAd(prompt: string, platform: string, tone: string, uploadedImage?: string): GeneratedAd {
  const cleanPrompt = prompt.trim() || (uploadedImage ? "ატვირთული სურათიდან გაანალიზებული პროდუქტი" : "ჩვენი ახალი ინოვაციური პროდუქტი");
  
  // Generic fallback visual image related to prompt keywords
  let imageUrl = uploadedImage || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80"; // business/tech default
  if (!uploadedImage) {
    if (cleanPrompt.toLowerCase().includes("ყავა") || cleanPrompt.toLowerCase().includes("კაფე")) {
      imageUrl = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80";
    } else if (cleanPrompt.toLowerCase().includes("ტანსაცმელი") || cleanPrompt.toLowerCase().includes("მოდა")) {
      imageUrl = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80";
    } else if (cleanPrompt.toLowerCase().includes("სპორტი") || cleanPrompt.toLowerCase().includes("ვარჯიში")) {
      imageUrl = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80";
    } else if (cleanPrompt.toLowerCase().includes("საჭმელი") || cleanPrompt.toLowerCase().includes("რესტორანი")) {
      imageUrl = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80";
    }
  }


  // Define headline templates based on tone
  let headline = "";
  switch (tone) {
    case "professional":
      headline = `პროფესიონალური გადაწყვეტილება: ${cleanPrompt}`;
      break;
    case "funny":
      headline = `😎 აი ის, რასაც ამდენ ხანს მალავდნენ! ${cleanPrompt}`;
      break;
    case "bold":
      headline = `💥 დროა შეცვალო თამაშის წესები: ${cleanPrompt}!`;
      break;
    case "friendly":
      headline = `👋 მოგესალმებით მეგობრებო! გაიცანით ${cleanPrompt}`;
      break;
    default:
      headline = `აღმოაჩინე ${cleanPrompt}`;
  }

  // Create content structures based on platform & tone
  let text = "";
  let cta = "გაიგე მეტი";
  let hashtags: string[] = [];

  if (platform === "facebook") {
    hashtags = ["#ინოვაცია", "#წარმატება", "#GoniFlow", "#კონტენტი"];
    cta = "დააჭირე აქ და გაიგე მეტი";

    switch (tone) {
      case "professional":
        text = `ეფექტურობა და ხარისხი ერთ სივრცეში! 🎯\n\nთუ ეძებთ სანდო და გრძელვადიან გადაწყვეტილებას თქვენი ბიზნესისთვის, გაეცანით: "${cleanPrompt}".\n\nჩვენ გთავაზობთ თანამედროვე სტანდარტებზე მორგებულ სერვისს, რომელიც დაგეხმარებათ დასახული მიზნების სწრაფად მიღწევაში.`;
        break;
      case "funny":
        text = `სერიოზულად, კიდევ ფიქრობთ? 🤔\n\n"${cleanPrompt}" – აი ეს არის ზუსტად ის, რაც თქვენს პროდუქტიულობას (ან უბრალოდ ხასიათს) ახალ საფეხურზე აყვანს! დაზოგეთ დრო და ნერვები ჩვენთან ერთად. 😄\n\nP.S. მარაგები იწურება (ჩვენი იუმორივით).`;
        break;
      case "bold":
        text = `⚡️ გაბედე მეტი! არ დაკმაყოფილდე საშუალო შედეგებით.\n\nმიიღე მაქსიმალური სარგებელი: "${cleanPrompt}" შექმნილია მათთვის, ვისაც სურს იყოს პირველი და არ ეშინია სიახლეების.\n\n🚀 გადადგი ნაბიჯი წარმატებისკენ დღესვე!`;
        break;
      case "friendly":
        text = `გამარჯობა მეგობრებო! 🌟\n\nგვინდა გაგიზიაროთ რაღაც განსაკუთრებული, რაც ძალიან დაგეხმარებათ ყოველდღიურობაში: "${cleanPrompt}". ჩვენ გულითა და დიდი მონდომებით ვიმუშავეთ ამაზე და დარწმუნებულები ვართ, რომ მოგეწონებათ.\n\nმოგვწერეთ ნებისმიერ დროს, სიამოვნებით გიპასუხებთ! ❤️`;
        break;
      default:
        text = `გაიცანით ახალი შესაძლებლობა: "${cleanPrompt}". საუკეთესო შეთავაზება სპეციალურად თქვენთვის. დაზოგეთ დრო და ენერგია ჩვენთან ერთად.`;
    }
  } 
  
  else if (platform === "instagram") {
    hashtags = ["#instadaily", "#lifestyle", "#beauty", "#creative", "#loveit"];
    cta = "იხილეთ ბმული პროფილში 🔗";

    switch (tone) {
      case "professional":
        text = `სრულყოფილება დეტალებშია. ✨\n\nწარმოგიდგენთ "${cleanPrompt}"-ს. შექმნილია პროფესიონალების მიერ, თქვენი იდეალური შედეგისთვის. \n\n💼 გაზარდეთ პროდუქტიულობა და დაზოგეთ დრო.`;
        break;
      case "funny":
        text = `როცა გგონია, რომ ყველაფერი გაქვს, მაგრამ უცებ აღმოაჩენ ამას... 🤷‍♂️💥\n\n"${cleanPrompt}" – თქვენი ყოველდღიური ცხოვრების ახალი გმირი. იდეალურია მათთვის, ვისაც უყვარს ცხოვრების გამარტივება (და ცოტა გართობაც). \n\n📸 მონიშნე მეგობარი, ვისაც ეს სჭირდება!`;
        break;
      case "bold":
        text = `ეს მხოლოდ დასაწყისია! 🔥\n\n"${cleanPrompt}" ცვლის ყველაფერს, რაც აქამდე იცოდით. ნუ იქნები მაყურებელი, შექმენი საკუთარი ტრენდი. \n\n💥 იმოქმედე ახლა!`;
        break;
      case "friendly":
        text = `თბილი და მყუდრო დღე ყველას! ☕️✨\n\nგვინდა გაჩვენოთ ჩვენი უახლესი ფავორიტი – "${cleanPrompt}". იდეალურია მეგობრული შეხვედრებისთვის ან უბრალოდ საკუთარი თავის გასანებივრებლად. \n\n💬 დაგვიტოვეთ კომენტარი, რას ფიქრობთ?`;
        break;
      default:
        text = `ახალი ესთეტიკა და ფუნქციონალი. გაიცანით "${cleanPrompt}" და გახადეთ თქვენი დღე განსაკუთრებული. ✨`;
    }
  } 
  
  else if (platform === "linkedin") {
    hashtags = ["#business", "#networking", "#innovation", "#leadership", "#b2b"];
    cta = "წაიკითხეთ სრული სტატია";

    switch (tone) {
      case "professional":
        text = `მოხარული ვართ წარმოგიდგინოთ ჩვენი უახლესი ინოვაციური პროექტი: "${cleanPrompt}".\n\nდღევანდელ სწრაფად მზარდ ბაზარზე, ეფექტური ინსტრუმენტების ქონა გადამწყვეტია. ეს გადაწყვეტილება ოპტიმიზაციას უკეთებს ბიზნეს პროცესებს და ზრდის გუნდის ეფექტურობას.\n\nმოხარული ვიქნებით, თუ გაგვიზიარებთ თქვენს გამოცდილებას კომენტარებში.`;
        break;
      case "funny":
        text = `ვინ თქვა, რომ LinkedIn-ზე იუმორი აკრძალულია? 😉\n\nწარმოგიდგენთ "${cleanPrompt}"-ს. დიახ, ის მართლაც მუშაობს და არა, ის არ დაესწრება თქვენს ნაცვლად ორშაბათის შეხვედრებს (სამწუხაროდ). თუმცა, სხვა დანარჩენ საქმეს საოცრად მარტივად გაართმევს თავს!\n\nგახადეთ სამუშაო დღე უფრო მხიარული.`;
        break;
      case "bold":
        text = `ლიდერობა ნიშნავს გარისკვას და წინსვლას! 🚀\n\nწარმოგიდგენთ პროდუქტს, რომელიც რევოლუციას მოახდენს თქვენს სფეროში: "${cleanPrompt}". თუ გსურთ იყოთ ინდუსტრიის სათავეში, ძველი მეთოდები აღარ არის საკმარისი.\n\nმიიღე სტრატეგიული გადაწყვეტილება დღესვე.`;
        break;
      case "friendly":
        text = `მოგესალმებით, კოლეგებო და მეგობრებო! 👋\n\nჩვენი გუნდისთვის დიდი პატივია გაგიზიაროთ ახალი პროექტი – "${cleanPrompt}". ეს არის მრავალთვიანი მუშაობისა და პარტნიორების უკუკავშირის შედეგი. ჩვენ გვჯერა, რომ ის მნიშვნელოვან ღირებულებას მოუტანს თითოეულ თქვენგანს.\n\nგმადლობთ მხარდაჭერისთვის!`;
        break;
      default:
        text = `წარმოგიდგენთ ახალ გადაწყვეტილებას ბიზნესის ზრდისთვის: "${cleanPrompt}". გაზარდეთ ეფექტურობა და მიაღწიეთ მეტს ჩვენთან ერთად.`;
    }
  } 
  
  else if (platform === "x") {
    hashtags = ["#GoniFlow", "#Tech", "#Future"];
    cta = "გადადი ბმულზე 🔗";

    switch (tone) {
      case "professional":
        text = `წარმოგიდგენთ "${cleanPrompt}"-ს. ოპტიმიზებული, სწრაფი და სანდო გადაწყვეტილება პროფესიონალებისთვის. 🎯`;
        break;
      case "funny":
        text = `თუ ფიქრობდით, რომ იდეალური პროდუქტი არ არსებობდა, გაეცანით: "${cleanPrompt}". სპოილერი: ის არსებობს! 😎`;
        break;
      case "bold":
        text = `ძველი წესები აღარ მუშაობს. დროა გადახვიდე ახალ ეტაპზე: "${cleanPrompt}"! ⚡️🚀`;
        break;
      case "friendly":
        text = `გამარჯობა ტვიტერის სამყაროვ! გაიცანით "${cleanPrompt}" – შექმნილია სიყვარულით თქვენთვის. ❤️`;
        break;
      default:
        text = `აღმოაჩინე ახალი შესაძლებლობები: "${cleanPrompt}"-თან ერთად. 🌟`;
    }
  }

  return {
    text,
    hashtags,
    cta,
    imageUrl,
    headline
  };
}
