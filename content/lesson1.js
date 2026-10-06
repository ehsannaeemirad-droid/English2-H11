window.__LESSONS__ = [{
id:"l1", title:"ارزش دانش", en:"The Value of Knowledge", icon:"📘",
sections:[

/* ============================================================
   1. GET READY
   ============================================================ */
{ id:"s1", title:"آماده‌سازی", icon:"🎯", steps:[

  { id:"s1a", type:"intro", title:"آماده‌سازی", cta:"شروع",
    body:"می‌خواهیم اشیا را با کاری که انجام می‌دهند مطابقت دهیم و با ترتیب صفت و اسم آشنا شویم." },

  /* FIX #4 #49 : image → pick sentence. Audio optional, not forced. */
  { id:"s1b", type:"pic_choice", title:"این شیء چه کاری انجام می‌دهد؟",
    tip:"به تصویر نگاه کن و جمله‌ای که با آن مطابقت دارد را انتخاب کن. می‌توانی روی 🔊 بزنی و جمله را بشنوی.",
    items:[
      { emoji:"✈️", audioId:"l1_s1_airplane",
        sentence:"This helps us travel very fast to far places.",
        distractors:[
          "People use this to talk with someone in another place.",
          "We use this to take and keep pictures very easily.",
          "This gives us an easier life when there is no light."
        ],
        fa:"این به ما کمک می‌کند خیلی سریع به جاهای دور سفر کنیم.",
        ex:"airplane = هواپیما؛ travel = سفر کردن." },
      { emoji:"💡", audioId:"l1_s1_bulb",
        sentence:"This gives us an easier life when there is no light.",
        distractors:[
          "This helps us travel very fast to far places.",
          "People use this to talk with someone in another place.",
          "We use this to take and keep pictures very easily."
        ],
        fa:"این وقتی نوری نیست، زندگی ما را راحت‌تر می‌کند.",
        ex:"light bulb = لامپ؛ no light = بدون نور." },
      { emoji:"☎️", audioId:"l1_s1_phone",
        sentence:"People use this to talk with someone in another place.",
        distractors:[
          "We use this to take and keep pictures very easily.",
          "This gives us an easier life when there is no light.",
          "This helps us travel very fast to far places."
        ],
        fa:"مردم از این برای صحبت با کسی در جای دیگر استفاده می‌کنند.",
        ex:"telephone = تلفن؛ talk with = صحبت کردن با." },
      { emoji:"📷", audioId:"l1_s1_camera",
        sentence:"We use this to take and keep pictures very easily.",
        distractors:[
          "This helps us travel very fast to far places.",
          "People use this to talk with someone in another place.",
          "This gives us an easier life when there is no light."
        ],
        fa:"ما از این برای گرفتن و نگه‌داشتن عکس استفاده می‌کنیم.",
        ex:"camera = دوربین؛ take pictures = عکس گرفتن." }
    ]},

  { id:"s1c", type:"flashcards", title:"مرور کارت‌های تصویری",
    words:[
      {w:"airplane", fa:"هواپیما", em:"✈️"},
      {w:"light bulb", fa:"لامپ", em:"💡"},
      {w:"telephone", fa:"تلفن", em:"☎️"},
      {w:"camera", fa:"دوربین", em:"📷"}
    ]},

  /* FIX #5 : no emoji in options, student must read the word */
  { id:"s1d", type:"mcq", title:"آزمون کوچک",
    q:"Which word means a thing that gives us light?",
    qFa:"کدام کلمه به شیئی اشاره دارد که به ما نور می‌دهد؟",
    opts:["camera","light bulb","airplane","telephone"],
    ans:1, ex:"light bulb = لامپ، وسیله‌ای که نور می‌دهد." },

  { id:"s1e", type:"teach", title:"ترتیب صفت و اسم",
    blocks:[
      {h:"قانون مهم انگلیسی"},
      {p:"در انگلیسی، صفت <b>قبل</b> از اسم می‌آید. این برعکس فارسی است!"},
      {cmp:{fa:"ساختمانِ مدرن", en:"a modern building"}},
      {p:"❌ اشتباه: <span class='ltr'>a building modern</span><br>✅ درست: <span class='ltr'>a modern building</span>"},
      {exs:[
        {en:"a modern building", audioId:"l1_s1_ex1", fa:"یک ساختمان مدرن"},
        {en:"an old laboratory", audioId:"l1_s1_ex2", fa:"یک آزمایشگاه قدیمی"},
        {en:"Iranian scientists", audioId:"l1_s1_ex3", fa:"دانشمندان ایرانی"}
      ]}
    ]},

  { id:"s1f", type:"reorder", title:"ترتیب صفت و اسم",
    items:[
      {words:["old","laboratory"], ans:"old laboratory", fa:"آزمایشگاه قدیمی"},
      {words:["building","modern"], ans:"modern building", fa:"ساختمان مدرن"},
      {words:["Iranian","scientists"], ans:"Iranian scientists", fa:"دانشمندان ایرانی"},
      {words:["famous","scientist"], ans:"famous scientist", fa:"دانشمند معروف"}
    ]},

  /* FIX #26 : not trivially self-matching — has to match image to phrase */
  { id:"s1g", type:"pic_match", title:"تصویر را با عبارت مطابقت بده",
    tip:"روی تصویر بزن، بعد عبارت درست را انتخاب کن.",
    items:[
      { emoji:"🏢", sentence:"modern building", fa:"ساختمان مدرن" },
      { emoji:"🔬", sentence:"old laboratory", fa:"آزمایشگاه قدیمی" },
      { emoji:"👨‍🔬", sentence:"Iranian scientists", fa:"دانشمندان ایرانی" }
    ]},

  /* FIX #6 : disambiguated — one correct per picture */
  { id:"s1h", type:"mcqset", title:"صفت مناسب را انتخاب کن",
    items:[
      { q:"This is a ______ building (built recently with glass).",
        opts:["modern","old","Iranian"], ans:0,
        ex:"building ساخته‌شدهٔ جدید با شیشه = modern building." },
      { q:"This is an ______ laboratory (from 1920).",
        opts:["modern","old","Iranian"], ans:1,
        ex:"آزمایشگاه از ۱۹۲۰ = old laboratory." },
      { q:"These are ______ scientists (from Iran).",
        opts:["Iranian","old","modern"], ans:0,
        ex:"دانشمندان اهل ایران = Iranian scientists." }
    ]}
]},

/* ============================================================
   2. CONVERSATION
   ============================================================ */
{ id:"s2", title:"مکالمه", icon:"💬", steps:[

  { id:"s2a", type:"intro", title:"مکالمه: کتابخانه", cta:"شروع",
    body:"رویا و مهسا در حال ترک کتابخانه هستند. مهسا کتابی دربارهٔ دانشمندان مشهور ایرانی خوانده است." },

  /* FIX #27 : reduced to 4 truly-new words */
  { id:"s2b", type:"flashcards", title:"کلمات دشوار مکالمه",
    words:[
      {w:"observatory", fa:"رصدخانه", em:"🔭", ex:"Maragheh Observatory"},
      {w:"scientist",  fa:"دانشمند", em:"🔬", ex:"famous Iranian scientists"},
      {w:"medicine",   fa:"پزشکی، دارو", em:"💊", ex:"taught medicine"},
      {w:"library",    fa:"کتابخانه", em:"📚", ex:"leaving the library"}
    ]},

  /* FIX #7 : options are real alternatives, not self-referential */
  { id:"s2c", type:"mcq", title:"تمرین کلمات",
    q:"Which place is used to study stars and planets?",
    qFa:"کدام مکان برای مطالعهٔ ستارگان و سیارات استفاده می‌شود؟",
    opts:["laboratory","observatory","library","hospital"], ans:1,
    ex:"observatory = رصدخانه، جایی برای مطالعهٔ ستارگان." },

  /* FIX #8 #9 #10 #41 : question + play button on same card, gist after listening */
  { id:"s2d", type:"listen_mcq", title:"گوش دادن اول — سؤال کلی",
    tip:"اول گوش بده، بعد جواب بده.",
    audioId:"l1_s2_part1",
    lines:[
      {s:"Roya",  t:"When I came in, you were reading a book. What was it?"},
      {s:"Mahsa", t:"I was reading a book about famous Iranian scientists."},
      {s:"Roya",  t:"But such books are not very interesting."},
      {s:"Mahsa", t:"At first I had the same idea, believe me!"}
    ],
    q:"What is the conversation about?",
    qFa:"مکالمه دربارهٔ چیست؟",
    opts:["A trip to the library",
          "A book about famous Iranian scientists",
          "A medical lesson",
          "Building an observatory"], ans:1,
    ex:"مهسا کتابی دربارهٔ دانشمندان مشهور ایرانی خوانده است." },

  { id:"s2e", type:"listen_mcq", title:"گوش دادن دوم — سؤال جزئی",
    tip:"دوباره گوش بده، بعد جواب بده.",
    audioId:"l1_s2_part2",
    lines:[
      {s:"Roya",  t:"Did you find it useful?"},
      {s:"Mahsa", t:"Oh yes. Actually I learned many interesting things about our scientists' lives."},
      {s:"Roya",  t:"Like what?"},
      {s:"Mahsa", t:"For example Razi taught medicine to many young people while he was working in Ray Hospital."},
      {s:"Mahsa", t:"Or Nasireddin Toosi built Maragheh Observatory when he was studying the planets."}
    ],
    q:"What did Razi teach?",
    qFa:"رازی چه چیزی درس می‌داد؟",
    opts:["Mathematics","Medicine","Astronomy","History"], ans:1,
    ex:"رازی در بیمارستان ری به جوانان پزشکی درس می‌داد." },

  /* FIX #20 #21 : line-by-line reveal, tap words, translation */
  { id:"s2f", type:"dialog_reveal", title:"مکالمهٔ کامل — خط به خط",
    tip:"به هر خط گوش بده. روی کلمه‌ها بزن تا معنی‌شان را ببینی. وقتی همه را دیدی، برو خط بعد.",
    lines:[
      {s:"Roya",  en:"When I came in, you were reading a book. What was it?", audioId:"l1_s2_l01", fa:"وقتی وارد شدم، داشتی کتاب می‌خواندی. چه کتابی بود؟"},
      {s:"Mahsa", en:"I was reading a book about famous Iranian scientists.", audioId:"l1_s2_l02", fa:"داشتم کتابی دربارهٔ دانشمندان مشهور ایرانی می‌خواندم."},
      {s:"Roya",  en:"But such books are not very interesting.", audioId:"l1_s2_l03", fa:"اما چنین کتاب‌هایی خیلی جالب نیستند."},
      {s:"Mahsa", en:"At first I had the same idea, believe me!", audioId:"l1_s2_l04", fa:"اولش من هم همین فکر را می‌کردم، باور کن!"},
      {s:"Roya",  en:"Did you find it useful?", audioId:"l1_s2_l05", fa:"آن را مفید یافتی؟"},
      {s:"Mahsa", en:"Oh yes. Actually I learned many interesting things about our scientists' lives.", audioId:"l1_s2_l06", fa:"آه بله. در واقع چیزهای جالب زیادی دربارهٔ زندگی دانشمندانمان یاد گرفتم."},
      {s:"Roya",  en:"Like what?", audioId:"l1_s2_l07", fa:"مثل چه چیزی؟"},
      {s:"Mahsa", en:"For example Razi taught medicine to many young people while he was working in Ray Hospital.", audioId:"l1_s2_l08", fa:"مثلاً رازی در حالی که در بیمارستان ری کار می‌کرد، به بسیاری از جوانان پزشکی درس می‌داد."},
      {s:"Mahsa", en:"Or Nasireddin Toosi built Maragheh Observatory when he was studying the planets.", audioId:"l1_s2_l09", fa:"یا خواجه نصیرالدین طوسی وقتی سیارات را مطالعه می‌کرد، رصدخانهٔ مراغه را ساخت."},
      {s:"Roya",  en:"Cool! What was the name of the book?", audioId:"l1_s2_l10", fa:"عالی! نام کتاب چه بود؟"},
      {s:"Mahsa", en:"Famous Iranian Scientists.", audioId:"l1_s2_l11", fa:"دانشمندان مشهور ایرانی."}
    ]},

  /* FIX #22 : questions are tappable */
  { id:"s2g", type:"mcqset", title:"درک مطلب",
    items:[
      { q:"Were Mahsa and Roya in a laboratory?",
        qFa:"آیا مهسا و رویا در آزمایشگاه بودند؟",
        opts:["Yes","No"], ans:1,
        ex:"آن‌ها در کتابخانه بودند، نه آزمایشگاه." },
      { q:"Who came to the library sooner?",
        qFa:"چه کسی زودتر به کتابخانه آمد؟",
        opts:["Mahsa","Roya"], ans:0,
        ex:"رویا می‌گوید «وقتی وارد شدم...» پس مهسا زودتر آنجا بود." },
      { q:"What did Nasireddin Toosi build?",
        qFa:"خواجه نصیرالدین طوسی چه چیزی ساخت؟",
        opts:["Ray Hospital","Maragheh Observatory","A library"], ans:1,
        ex:"او رصدخانهٔ مراغه را ساخت." },
      { q:"What was the name of the book?",
        qFa:"نام کتاب چه بود؟",
        opts:["Famous Iranian Scientists","Razi's Medicine","The Observatory"], ans:0,
        ex:"نام کتاب «Famous Iranian Scientists» بود." }
    ]},

  /* FIX #11 : all 3 options are plausible and different meanings */
  { id:"s2h", type:"roleplay", title:"نقش‌آفرینی",
    tip:"نقش مهسا را بازی کن. جمله‌ات را از بین گزینه‌ها انتخاب کن.",
    lines:[
      {s:"Roya",  en:"When I came in, you were reading a book. What was it?", audioId:"l1_s2_l01"},
      {s:"Mahsa", en:"I was reading a book about famous Iranian scientists.", audioId:"l1_s2_l02",
        opts:[
          "I was reading a book about famous Iranian scientists.",
          "I was writing a letter to my friend.",
          "I was watching TV in the hall."], ans:0,
        fa:"داشتم کتابی دربارهٔ دانشمندان مشهور ایرانی می‌خواندم."},
      {s:"Roya",  en:"But such books are not very interesting.", audioId:"l1_s2_l03"},
      {s:"Mahsa", en:"At first I had the same idea, believe me!", audioId:"l1_s2_l04",
        opts:[
          "At first I had the same idea, believe me!",
          "I always loved reading these books.",
          "No, they are interesting for everyone."], ans:0,
        fa:"اولش من هم همین فکر را می‌کردم، باور کن!"},
      {s:"Roya",  en:"Did you find it useful?", audioId:"l1_s2_l05"},
      {s:"Mahsa", en:"Oh yes. Actually I learned many interesting things about our scientists' lives.", audioId:"l1_s2_l06",
        opts:[
          "No, it was boring and short.",
          "Oh yes. Actually I learned many interesting things about our scientists' lives.",
          "I didn't read it carefully."], ans:1,
        fa:"آه بله. در واقع چیزهای جالب زیادی دربارهٔ زندگی دانشمندانمان یاد گرفتم."}
    ]}
]},

/* ============================================================
   3. VOCABULARY
   ============================================================ */
{ id:"s3", title:"واژگان", icon:"📚", steps:[

  { id:"s3a", type:"intro", title:"کلمات و عبارت‌های تازه", cta:"شروع",
    body:"در این بخش، جمله‌های کوتاه، تعریف‌ها و کاربرد واژه‌ها را یاد می‌گیریم." },

  { id:"s3b", type:"wordbuild", title:"جمله‌ها را کلمه‌به‌کلمه بساز",
    tip:"روی هر کلمه بزن تا معنی‌اش را ببینی. جمله را گوش بده و تکرار کن.",
    items:[
      { em:"📖", en:"Melika tries hard to learn English.", audioId:"l1_s3_s01", fa:"ملیکا سخت تلاش می‌کند تا انگلیسی یاد بگیرد." },
      { em:"⚽", en:"Babak is an energetic boy.", audioId:"l1_s3_s02", fa:"بابک پسری پرانرژی است." },
      { em:"🧪", en:"The students do experiments in the school laboratory.", audioId:"l1_s3_s03", fa:"دانش‌آموزان در آزمایشگاه مدرسه آزمایش انجام می‌دهند." },
      { em:"👶", en:"Children grow up rapidly.", audioId:"l1_s3_s04", fa:"کودکان به‌سرعت رشد می‌کنند." },
      { em:"🩸", en:"She is doing research on blood cells.", audioId:"l1_s3_s05", fa:"او در حال تحقیق روی سلول‌های خونی است." },
      { em:"🤒", en:"He has the flu and feels weak.", audioId:"l1_s3_s06", fa:"او آنفولانزا دارد و احساس ضعف می‌کند." },
      { em:"💪", en:"No success is possible without hard work.", audioId:"l1_s3_s07", fa:"هیچ موفقیتی بدون کار سخت ممکن نیست." },
      { em:"💡", en:"Edison invented the first light bulb.", audioId:"l1_s3_s08", fa:"ادیسون اولین لامپ را اختراع کرد." }
    ]},

  { id:"s3c", type:"flashcards", title:"کلمات کلیدی",
    words:[
      {w:"solve",       fa:"حل کردن (مشکل)", em:"🧩", ex:"We can help you solve your problems.", audioId:"l1_s3_c1"},
      {w:"develop",     fa:"توسعه دادن، رشد دادن", em:"📈", ex:"This book can develop your speaking skill.", audioId:"l1_s3_c2"},
      {w:"belief",      fa:"باور", em:"🕌", ex:"Her belief in Allah gave her hope.", audioId:"l1_s3_c3"},
      {w:"quit",        fa:"رها کردن، ترک کردن", em:"🚪", ex:"His father is going to quit smoking.", audioId:"l1_s3_c4"},
      {w:"give up",     fa:"تسلیم شدن، رها کردن", em:"🏳️", ex:"He gave up his work.", audioId:"l1_s3_c5"},
      {w:"thousands of",fa:"هزاران", em:"🔢", ex:"There are thousands of things I want to do.", audioId:"l1_s3_c6"}
    ]},

  /* FIX #10 : English ↔ Persian, not word-to-word */
  { id:"s3d", type:"match", title:"کلمه را با معنی مطابقت بده",
    tip:"روی یک کلمه در سمت راست بزن، بعد معنی‌اش را در سمت چپ انتخاب کن.",
    left:[
      {em:"🧩", txt:"solve",   fa:"حل کردن"},
      {em:"📈", txt:"develop", fa:"توسعه دادن"},
      {em:"🕌", txt:"belief",  fa:"باور"},
      {em:"🚪", txt:"quit",    fa:"رها کردن"}
    ],
    right:["باور","حل کردن","رها کردن","توسعه دادن"]},

  { id:"s3e", type:"mcqset", title:"جای خالی را پر کن",
    items:[
      {q:"He decided to ______ smoking.",
       opts:["quit","solve","develop"], ans:0,
       ex:"quit = ترک کردن. «او تصمیم گرفت سیگار را ترک کند.»"},
      {q:"We need to ______ this problem.",
       opts:["develop","solve","belief"], ans:1,
       ex:"solve = حل کردن."},
      {q:"She has a strong ______ in Allah.",
       opts:["belief","quit","thousands"], ans:0,
       ex:"belief = باور."},
      {q:"There are ______ stars in the sky.",
       opts:["solve","belief","thousands of"], ans:2,
       ex:"thousands of = هزاران."}
    ]},

  /* FIX #7 : no self-referential options */
  { id:"s3f", type:"mcqset", title:"معنی درست را انتخاب کن",
    items:[
      {q:"What does 'develop' mean?",
       qFa:"معنی develop چیست؟",
       opts:["to grow stronger","to stop","to destroy"], ans:0,
       ex:"develop = رشد دادن، توسعه دادن."},
      {q:"What does 'give up' mean?",
       qFa:"معنی give up چیست؟",
       opts:["to find an answer","to stop trying","to repair"], ans:1,
       ex:"give up = تسلیم شدن، رها کردن."},
      {q:"What does 'solve' mean?",
       qFa:"معنی solve چیست؟",
       opts:["to find an answer","to build","to buy"], ans:0,
       ex:"solve = حل کردن مسئله."}
    ]}
]},

/* ============================================================
   4. READING — full passage, per-paragraph chunks
   ============================================================ */
{ id:"s4", title:"خواندن", icon:"📖", steps:[

  { id:"s4a", type:"intro", title:"متن: No Pain No Gain", cta:"شروع",
    body:"«بدون درد، دستاوردی نیست.» هر پاراگراف یک تکهٔ یادگیری است: اول سریع می‌خوانیم، بعد دقیق، بعد جمله‌به‌جمله معنی می‌سازیم." },

  /* ---------- PARAGRAPH 1 ---------- */
  { id:"s4b", type:"skim_scan", title:"پاراگراف ۱ — خواندن سریع و اسکن",
    paras:[
      "Human knowledge develops with scientists' hard work.",
      "Many great men and women try hard to find facts, solve problems and invent things.",
      "Some of these scientists did not have easy lives."
    ],
    timer:30,
    scanQ:"According to the paragraph, what helps human knowledge develop?",
    scanQFa:"طبق پاراگراف، چه چیزی به توسعهٔ دانش انسانی کمک می‌کند؟",
    scanOpts:["Their easy lives","Scientists' hard work","Their money"], scanAns:1,
    scanEx:"متن می‌گوید: Human knowledge develops with scientists' hard work." },

  { id:"s4c", type:"wordbuild", title:"پاراگراف ۱ — کلمه‌به‌کلمه",
    tip:"اول به جمله گوش بده، بعد روی کلمه‌ها بزن تا معنی‌شان را ببینی.",
    items:[
      { en:"Human knowledge develops with scientists' hard work.", audioId:"l1_s4_p1_s1", fa:"دانش انسانی با کار سخت دانشمندان توسعه می‌یابد.",
        check:{ q:"What does 'knowledge' mean?",
                opts:["دانش","پول","آزمایش"], ans:0,
                ex:"knowledge = دانش، علم." } },
      { en:"Many great men and women try hard to find facts, solve problems and invent things.", audioId:"l1_s4_p1_s2", fa:"بسیاری از مردان و زنان بزرگ سخت تلاش می‌کنند تا واقعیت‌ها را پیدا کنند، مسائل را حل کنند و چیزها را اختراع کنند.",
        check:{ q:"What does 'invent' mean?",
                opts:["اختراع کردن","پیدا کردن","فروختن"], ans:0,
                ex:"invent = اختراع کردن." } },
      { en:"Some of these scientists did not have easy lives.", audioId:"l1_s4_p1_s3", fa:"بعضی از این دانشمندان زندگی آسانی نداشتند.",
        check:{ q:"What does 'easy lives' suggest?",
                opts:["زندگی راحت","زندگی سخت","زندگی کوتاه"], ans:0,
                ex:"easy lives = زندگی آسان." } }
    ]},

  { id:"s4d", type:"mcq", title:"پاراگراف ۱ — بررسی",
    q:"What helps human knowledge develop?",
    qFa:"چه چیزی به توسعهٔ دانش انسانی کمک می‌کند؟",
    opts:["Scientists' hard work","An easy life","Giving up"], ans:0,
    ex:"Human knowledge develops with scientists' hard work." },

  /* ---------- PARAGRAPH 2 ---------- */
  { id:"s4e", type:"skim_scan", title:"پاراگراف ۲ — خواندن سریع و اسکن",
    paras:[
      "But they tried hard when they were working on problems.",
      "They never felt weak when they were studying.",
      "They never gave up when they were doing research.",
      "There are great stories about scientists and their lives.",
      "One such a story is about Thomas Edison.",
      "As a young boy, Edison was very interested in science.",
      "He was very energetic and always asked questions.",
      "Sadly, young Edison lost his hearing at the age of 12.",
      "He did not attend school and learned science by reading books in the library himself.",
      "When he grew up he worked in different places, but he never lost his interest in making things.",
      "Edison was famous for doing thousands of experiments to find answers to problems.",
      "He said, \"I never quit until I get what I'm after\".",
      "Edison had more than 1,000 inventions and was very successful at the end of his life."
    ],
    timer:45,
    scanQ:"At what age did Edison lose his hearing?",
    scanQFa:"ادیسون در چه سنی شنوایی‌اش را از دست داد؟",
    scanOpts:["At 10","At 12","At 20"], scanAns:1,
    scanEx:"متن می‌گوید at the age of 12." },

  { id:"s4f", type:"wordbuild", title:"پاراگراف ۲ — کلمه‌به‌کلمه (قسمت ۱)",
    tip:"فعل‌های استمراری آبی‌اند (was/were + -ing).",
    items:[
      { en:"But they tried hard when they were working on problems.", audioId:"l1_s4_p2_s1", fa:"اما وقتی روی مسائل کار می‌کردند، سخت تلاش می‌کردند.",
        check:{ q:"What does 'try hard' mean?",
                opts:["سخت تلاش کردن","رها کردن","شکست خوردن"], ans:0,
                ex:"try hard = سخت تلاش کردن." } },
      { en:"They never felt weak when they were studying.", audioId:"l1_s4_p2_s2", fa:"وقتی درس می‌خواندند، هرگز احساس ضعف نمی‌کردند.",
        check:{ q:"What does 'weak' mean?",
                opts:["قوی","ضعیف","خسته"], ans:1,
                ex:"weak = ضعیف." } },
      { en:"They never gave up when they were doing research.", audioId:"l1_s4_p2_s3", fa:"وقتی تحقیق می‌کردند، هرگز تسلیم نمی‌شدند.",
        check:{ q:"What does 'give up' mean?",
                opts:["ادامه دادن","تسلیم شدن","شروع کردن"], ans:1,
                ex:"give up = تسلیم شدن، رها کردن." } }
    ]},

  { id:"s4g", type:"wordbuild", title:"پاراگراف ۲ — کلمه‌به‌کلمه (قسمت ۲)",
    tip:"روی کلمه‌ها بزن. هر جمله یک سؤال کوتاه دارد.",
    items:[
      { en:"One such a story is about Thomas Edison.", audioId:"l1_s4_p2_s4", fa:"یکی از این داستان‌ها دربارهٔ توماس ادیسون است.",
        check:{ q:"Who is the story about?",
                opts:["Thomas Edison","Isaac Newton","Albert Einstein"], ans:0,
                ex:"Thomas Edison = توماس ادیسون." } },
      { en:"As a young boy, Edison was very interested in science.", audioId:"l1_s4_p2_s5", fa:"ادیسون در کودکی به علم خیلی علاقه‌مند بود.",
        check:{ q:"What was Edison interested in?",
                opts:["Sports","Science","Music"], ans:1,
                ex:"interested in science = علاقه‌مند به علم." } },
      { en:"He was very energetic and always asked questions.", audioId:"l1_s4_p2_s6", fa:"او خیلی پرانرژی بود و همیشه سؤال می‌پرسید.",
        check:{ q:"What does 'energetic' mean?",
                opts:["پرانرژی","خسته","آرام"], ans:0,
                ex:"energetic = پرانرژی." } },
      { en:"Sadly, young Edison lost his hearing at the age of 12.", audioId:"l1_s4_p2_s7", fa:"متأسفانه ادیسون جوان در سن ۱۲ سالگی شنوایی‌اش را از دست داد.",
        check:{ q:"What did Edison lose?",
                opts:["His hearing","His books","His laboratory"], ans:0,
                ex:"hearing = شنوایی." } },
      { en:"He did not attend school and learned science by reading books in the library himself.", audioId:"l1_s4_p2_s8", fa:"او به مدرسه نرفت و خودش در کتابخانه با خواندن کتاب‌ها علم یاد گرفت.",
        check:{ q:"Did Edison attend school?",
                opts:["Yes","No"], ans:1,
                ex:"attend school = به مدرسه رفتن. پاسخ: No." } }
    ]},

  { id:"s4h", type:"wordbuild", title:"پاراگراف ۲ — کلمه‌به‌کلمه (قسمت ۳)",
    tip:"روی کلمه‌ها بزن. هر جمله یک سؤال کوتاه دارد.",
    items:[
      { en:"When he grew up he worked in different places, but he never lost his interest in making things.", audioId:"l1_s4_p2_s9", fa:"وقتی بزرگ شد در جاهای مختلف کار کرد، اما هرگز علاقه‌اش به ساختن چیزها را از دست نداد.",
        check:{ q:"What does 'interest' mean?",
                opts:["علاقه","پول","استراحت"], ans:0,
                ex:"interest = علاقه." } },
      { en:"Edison was famous for doing thousands of experiments to find answers to problems.", audioId:"l1_s4_p2_s10", fa:"ادیسون به خاطر انجام هزاران آزمایش برای یافتن پاسخ مسائل معروف بود.",
        check:{ q:"What is Edison famous for?",
                opts:["Writing books","Doing experiments","Building hospitals"], ans:1,
                ex:"famous for doing thousands of experiments." } },
      { en:"He said, \"I never quit until I get what I'm after\".", audioId:"l1_s4_p2_s11", fa:"او گفت: «من هرگز رها نمی‌کنم تا به آنچه دنبالش هستم برسم.»",
        check:{ q:"What does 'quit' mean?",
                opts:["ادامه دادن","رها کردن","شروع کردن"], ans:1,
                ex:"quit = رها کردن، متوقف کردن." } },
      { en:"Edison had more than 1,000 inventions and was very successful at the end of his life.", audioId:"l1_s4_p2_s12", fa:"ادیسون بیش از ۱۰۰۰ اختراع داشت و در پایان زندگی‌اش خیلی موفق بود.",
        check:{ q:"How many inventions did Edison have?",
                opts:["About 100","More than 1,000","Exactly 500"], ans:1,
                ex:"more than 1,000 inventions." } }
    ]},

  { id:"s4i", type:"mcqset", title:"پاراگراف ۲ — بررسی",
    items:[
      { q:"At what age did Edison lose his hearing?",
        qFa:"ادیسون در چه سنی شنوایی‌اش را از دست داد؟",
        opts:["At 10","At 12","At 20"], ans:1,
        ex:"at the age of 12." },
      { q:"Where did Edison learn science?",
        qFa:"ادیسون علم را کجا یاد گرفت؟",
        opts:["At school","In the library","In a laboratory"], ans:1,
        ex:"he learned science by reading books in the library himself." },
      { q:"How did Edison find answers to problems?",
        qFa:"ادیسون چگونه پاسخ مسائل را پیدا می‌کرد؟",
        opts:["By sleeping in the laboratory",
              "By doing many experiments",
              "By quitting what he was after"], ans:1,
        ex:"doing thousands of experiments." },
      { q:"Which is NOT true about scientists?",
        qFa:"کدام دربارهٔ دانشمندان درست نیست؟",
        opts:["They find facts","They invent things","They feel weak"], ans:2,
        ex:"متن می‌گوید آن‌ها never felt weak." }
    ]},

  /* ---------- PARAGRAPH 3 ---------- */
  { id:"s4j", type:"skim_scan", title:"پاراگراف ۳ — خواندن سریع و اسکن",
    paras:[
      "Many great names had stories like this.",
      "But the key to their success is their hard work and belief in themselves.",
      "If you want to get what you want, work hard and never give up."
    ],
    timer:20,
    scanQ:"What is the key to the scientists' success?",
    scanQFa:"کلید موفقیت دانشمندان چیست؟",
    scanOpts:["Their money","Their hard work and belief in themselves","Their luck"],
    scanAns:1,
    scanEx:"the key to their success is their hard work and belief in themselves." },

  { id:"s4k", type:"wordbuild", title:"پاراگراف ۳ — کلمه‌به‌کلمه",
    tip:"روی کلمه‌ها بزن. هر جمله یک سؤال کوتاه دارد.",
    items:[
      { en:"Many great names had stories like this.", audioId:"l1_s4_p3_s1", fa:"بسیاری از نام‌های بزرگ داستان‌هایی مثل این داشتند.",
        check:{ q:"What does 'great names' refer to?",
                opts:["Great people","Long names","Expensive books"], ans:0,
                ex:"great names = افراد بزرگ." } },
      { en:"But the key to their success is their hard work and belief in themselves.", audioId:"l1_s4_p3_s2", fa:"اما کلید موفقیت آن‌ها کار سخت و باور به خودشان است.",
        check:{ q:"What does 'key' mean here?",
                opts:["کلید (وسیله)","راه حل اصلی","درب"], ans:1,
                ex:"key = عامل اصلی، کلید موفقیت." } },
      { en:"If you want to get what you want, work hard and never give up.", audioId:"l1_s4_p3_s3", fa:"اگر می‌خواهی به آنچه می‌خواهی برسی، سخت کار کن و هرگز تسلیم نشو.",
        check:{ q:"What should you do to succeed?",
                opts:["Stop working","Work hard and never give up","Wait and hope"], ans:1,
                ex:"سخت کار کن و هرگز تسلیم نشو." } }
    ]},

  { id:"s4l", type:"mcq", title:"پاراگراف ۳ — بررسی",
    q:"What is the key to the scientists' success?",
    qFa:"کلید موفقیت دانشمندان چیست؟",
    opts:["Money and fame","Hard work and belief in themselves","Luck"], ans:1,
    ex:"the key to their success is their hard work and belief in themselves." },

  /* FIX #17 : full text with audio, tappable */
  { id:"s4m", type:"reading", title:"متن کامل با صدا",
    tip:"روی هر کلمه بزن. 🔊 را بزن تا کل متن را بشنوی.",
    paras:[
      { en:["Human knowledge develops with scientists' hard work.",
             "Many great men and women try hard to find facts, solve problems and invent things.",
             "Some of these scientists did not have easy lives.",
             "But they tried hard when they were working on problems.",
             "They never felt weak when they were studying.",
             "They never gave up when they were doing research."],
        fa:["دانش انسانی با کار سخت دانشمندان توسعه می‌یابد.",
            "بسیاری از مردان و زنان بزرگ سخت تلاش می‌کنند تا واقعیت‌ها را پیدا کنند، مسائل را حل کنند و چیزها را اختراع کنند.",
            "بعضی از این دانشمندان زندگی آسانی نداشتند.",
            "اما وقتی روی مسائل کار می‌کردند، سخت تلاش می‌کردند.",
            "وقتی درس می‌خواندند، هرگز احساس ضعف نمی‌کردند.",
            "وقتی تحقیق می‌کردند، هرگز تسلیم نمی‌شدند."]},
      { en:["There are great stories about scientists and their lives.",
             "One such a story is about Thomas Edison.",
             "As a young boy, Edison was very interested in science.",
             "He was very energetic and always asked questions.",
             "Sadly, young Edison lost his hearing at the age of 12.",
             "He did not attend school and learned science by reading books in the library himself.",
             "When he grew up he worked in different places, but he never lost his interest in making things.",
             "Edison was famous for doing thousands of experiments to find answers to problems.",
             "He said, \"I never quit until I get what I'm after\".",
             "Edison had more than 1,000 inventions and was very successful at the end of his life."],
        fa:["داستان‌های بزرگی دربارهٔ دانشمندان و زندگی‌شان وجود دارد.",
            "یکی از این داستان‌ها دربارهٔ توماس ادیسون است.",
            "ادیسون در کودکی به علم خیلی علاقه‌مند بود.",
            "او خیلی پرانرژی بود و همیشه سؤال می‌پرسید.",
            "متأسفانه ادیسون جوان در سن ۱۲ سالگی شنوایی‌اش را از دست داد.",
            "او به مدرسه نرفت و خودش در کتابخانه با خواندن کتاب‌ها علم یاد گرفت.",
            "وقتی بزرگ شد در جاهای مختلف کار کرد، اما هرگز علاقه‌اش به ساختن چیزها را از دست نداد.",
            "ادیسون به خاطر انجام هزاران آزمایش برای یافتن پاسخ مسائل معروف بود.",
            "او گفت: «من هرگز رها نمی‌کنم تا به آنچه دنبالش هستم برسم.»",
            "ادیسون بیش از ۱۰۰۰ اختراع داشت و در پایان زندگی‌اش خیلی موفق بود."]},
      { en:["Many great names had stories like this.",
             "But the key to their success is their hard work and belief in themselves.",
             "If you want to get what you want, work hard and never give up."],
        fa:["بسیاری از نام‌های بزرگ داستان‌هایی مثل این داشتند.",
            "اما کلید موفقیت آن‌ها کار سخت و باور به خودشان است.",
            "اگر می‌خواهی به آنچه می‌خواهی برسی، سخت کار کن و هرگز تسلیم نشو."]}
    ]},

  { id:"s4n", type:"mcqset", title:"درست یا غلط",
    items:[
      { q:"Edison finally lost his interest in inventing things.",
        qFa:"ادیسون در نهایت علاقه‌اش به اختراع را از دست داد.",
        opts:["True","False"], ans:1,
        ex:"او هرگز علاقه‌اش را از دست نداد." },
      { q:"Edison did not attend school at all.",
        qFa:"ادیسون اصلاً به مدرسه نرفت.",
        opts:["True","False"], ans:0,
        ex:"He did not attend school." },
      { q:"Hard work is the key to scientists' success.",
        qFa:"کار سخت کلید موفقیت دانشمندان است.",
        opts:["True","False"], ans:0,
        ex:"the key to their success is their hard work." }
    ]},

  { id:"s4o", type:"match", title:"نیمه‌ها را وصل کن",
    tip:"روی نیمهٔ راست بزن، بعد ادامه‌اش را در چپ انتخاب کن.",
    left:[
      {txt:"After Edison lost his hearing",   fa:"بعد از اینکه ادیسون شنوایی‌اش را از دست داد"},
      {txt:"When scientists were working on problems", fa:"وقتی دانشمندان روی مسائل کار می‌کردند"},
      {txt:"If you like to be successful",    fa:"اگر می‌خواهی موفق شوی"}
    ],
    right:[
      "he did not quit studying.",
      "they did not give up.",
      "you must not feel weak."
    ]}
]},

/* ============================================================
   5. GRAMMAR — starts with noticing
   ============================================================ */
{ id:"s5", title:"دستور", icon:"🧩", steps:[

  /* FIX #13 #14 #50 : noticing moved here from reading, taught in Persian */
  { id:"s5a", type:"teach", title:"کشف ساختار — گذشتهٔ استمراری در متن",
    blocks:[
      {h:"به این جمله‌ها نگاه کن"},
      {p:"در متن دو نوع فعل دیدیم. یک نوع پس‌زمینه را می‌گوید، نوع دیگر عمل اصلی را."},
      {exs:[
        {en:"She was working very hard.", audioId:"l1_s5_n1", hl:"was working", fa:"او خیلی سخت در حال کار کردن بود."},
        {en:"They were playing outside.", audioId:"l1_s5_n2", hl:"were playing", fa:"آن‌ها بیرون در حال بازی کردن بودند."},
        {en:"When other kids were playing, she learned reading.", audioId:"l1_s5_n3", hl:"were playing", fa:"وقتی بچه‌های دیگر بازی می‌کردند، او خواندن را یاد گرفت."}
      ]},
      {h:"ساختار"},
      {p:"<span class='ltr' style='font-size:20px;font-weight:800;color:var(--blue)'>was / were + verb-ing</span>"},
      {p:"<b>was</b> با I, he, she, it<br><b>were</b> با we, you, they"},
      {h:"کاربرد"},
      {p:"برای کاری که در گذشته <b>در حال انجام</b> بود و اغلب کاری دیگر آن را قطع می‌کرد."}
    ]},

  /* FIX #12 : CCQs all in Persian */
  { id:"s5b", type:"mcqset", title:"درک ساختار — پرسش‌های مفهوم‌سنجی",
    items:[
      { q:"In 'She was working very hard', was the action finished or in progress?",
        qFa:"در جملهٔ «She was working very hard»، آیا کار تمام شده بود یا در حال انجام بود؟",
        opts:["در حال انجام بود","تمام شده بود"], ans:0,
        ex:"was working یعنی کار در آن لحظه ادامه داشت، نه تمام‌شده." },
      { q:"Which part shows the action continued?",
        qFa:"کدام بخش نشان می‌دهد که عمل ادامه داشت؟",
        opts:["was","working","هر دو"], ans:2,
        ex:"هم was (فعل کمکی) و هم -ing نشان‌دهندهٔ استمرار هستند." },
      { q:"What is the structure of the past progressive?",
        qFa:"ساختار گذشتهٔ استمراری چیست؟",
        opts:["did + verb","was/were + verb-ing","have + verb"], ans:1,
        ex:"was/were + verb-ing" },
      { q:"In 'When other kids were playing, she learned...' which action was longer?",
        qFa:"در جملهٔ «When other kids were playing, she learned...» کدام عمل طولانی‌تر بود؟",
        opts:["were playing","learned"], ans:0,
        ex:"were playing عمل پس‌زمینه و طولانی است." },
      { q:"When do we use the past progressive?",
        qFa:"گذشتهٔ استمراری برای چه کاری استفاده می‌شود؟",
        opts:["برای عمل در حال انجام در گذشته","برای عمل تمام‌شده در گذشته","برای آینده"], ans:0,
        ex:"عمل در جریان در گذشته." }
    ]},

  /* --- Affirmative --- */
  { id:"s5c", type:"teach", title:"گذشتهٔ استمراری — مثبت",
    blocks:[
      {h:"ساختار"},
      {p:"<span class='ltr' style='font-size:20px;font-weight:800;color:var(--blue)'>was / were + verb-ing</span>"},
      {table:{head:["فاعل","فعل کمکی","مثال"], rows:[
        ["I / He / She / It","was","I <b>was working</b>."],
        ["We / You / They","were","They <b>were playing</b>."]
      ]}},
      {h:"مثال‌ها"},
      {exs:[
        {en:"I was working on a difficult problem at 4.", audioId:"l1_s5_a1", fa:"من ساعت ۴ روی یک مسئلهٔ سخت کار می‌کردم."},
        {en:"She was reading a novel.", audioId:"l1_s5_a2", fa:"او در حال خواندن یک رمان بود."},
        {en:"The computer was working when the power went out.", audioId:"l1_s5_a3", fa:"کامپیوتر داشت کار می‌کرد که برق رفت."},
        {en:"They were playing football.", audioId:"l1_s5_a4", fa:"آن‌ها داشتند فوتبال بازی می‌کردند."},
        {en:"We were sitting in the hall.", audioId:"l1_s5_a5", fa:"ما در سالن نشسته بودیم."}
      ]}
    ]},

  /* FIX #30 : varied verbs */
  { id:"s5d", type:"mcqset", title:"آزمون کوچک ۱ — مثبت",
    items:[
      {q:"She ______ a book when I came in.",
       opts:["was reading","were reading","read"], ans:0,
       ex:"برای she از was استفاده می‌کنیم، نه were."},
      {q:"They ______ football at 5 PM yesterday.",
       opts:["was playing","were playing","played"], ans:1,
       ex:"برای they از were استفاده می‌کنیم."},
      {q:"I ______ on my project.",
       opts:["was working","were working","work"], ans:0,
       ex:"برای I از was استفاده می‌کنیم."},
      {q:"Which sentence is correct?",
       opts:["He were studying.","He was studying.","He was study."], ans:1,
       ex:"was + verb-ing صحیح است."},
      {q:"The children ______ in the yard.",
       opts:["was playing","were playing","play"], ans:1,
       ex:"children جمع است → were + playing."},
      {q:"My sister ______ TV at 8 last night.",
       opts:["were watching","was watching","watched"], ans:1,
       ex:"my sister مفرد است → was + watching."}
    ]},

  /* --- Negative --- */
  { id:"s5e", type:"teach", title:"گذشتهٔ استمراری — منفی",
    blocks:[
      {h:"ساختار"},
      {p:"<span class='ltr' style='font-size:20px;font-weight:800;color:var(--red)'>was not / were not + verb-ing</span>"},
      {p:"شکل کوتاه: <span class='ltr'>wasn't / weren't</span>"},
      {exs:[
        {en:"I wasn't working at 4.", audioId:"l1_s5_n1ex", fa:"من ساعت ۴ کار نمی‌کردم."},
        {en:"He wasn't watching TV.", audioId:"l1_s5_n2ex", fa:"او تلویزیون تماشا نمی‌کرد."},
        {en:"They weren't talking when the teacher came in.", audioId:"l1_s5_n3ex", fa:"وقتی معلم وارد شد، آن‌ها صحبت نمی‌کردند."},
        {en:"We weren't sleeping.", audioId:"l1_s5_n4ex", fa:"ما خواب نبودیم."}
      ]}
    ]},

  /* FIX #15 #16 : error-correction prompt is Persian */
  { id:"s5f", type:"mcqset", title:"آزمون کوچک ۲ — منفی",
    items:[
      {q:"He ______ TV when I called.",
       opts:["wasn't watching","weren't watching","didn't watching"], ans:0,
       ex:"برای he از wasn't استفاده می‌کنیم."},
      {q:"We ______ when the phone rang.",
       opts:["wasn't sleeping","weren't sleeping","didn't slept"], ans:1,
       ex:"برای we از weren't استفاده می‌کنیم."},
      {q:"کدام جمله اشکال دارد؟",
       qFa:"جملهٔ «They was not playing» چه اشکالی دارد؟",
       opts:["was باید were باشد","not باید حذف شود","playing باید play باشد"], ans:0,
       ex:"فاعل they است، پس باید were not باشد."},
      {q:"The computer ______.",
       opts:["was not working","were not working","not was working"], ans:0,
       ex:"the computer مفرد است → was not working."}
    ]},

  /* --- Questions --- */
  { id:"s5g", type:"teach", title:"گذشتهٔ استمراری — سؤالی",
    blocks:[
      {h:"ساختار"},
      {p:"<span class='ltr' style='font-size:20px;font-weight:800;color:var(--purple)'>Was/Were + فاعل + verb-ing ?</span>"},
      {exs:[
        {en:"Was Mahsa doing her homework when her mother called?", audioId:"l1_s5_q1", fa:"آیا مهسا وقتی مادرش زنگ زد مشغول انجام تکالیفش بود؟"},
        {en:"Were they talking when the teacher came in?", audioId:"l1_s5_q2", fa:"آیا وقتی معلم وارد شد آن‌ها صحبت می‌کردند؟"},
        {en:"Was he doing research?", audioId:"l1_s5_q3", fa:"آیا او مشغول تحقیق بود؟"}
      ]},
      {h:"پاسخ کوتاه"},
      {p:"Yes, she was. / No, she wasn't.<br>Yes, they were. / No, they weren't."}
    ]},

  { id:"s5h", type:"mcqset", title:"آزمون کوچک ۳ — سؤالی",
    items:[
      {q:"______ you ______ TV when I called?",
       opts:["Was / watching","Were / watching","Did / watch"], ans:1,
       ex:"برای you از Were استفاده می‌کنیم."},
      {q:"______ she ______ when you saw her?",
       opts:["Was / studying","Were / studying","Did / study"], ans:0,
       ex:"برای she از Was استفاده می‌کنیم."},
      {q:"Which sentence is correct?",
       opts:["Was they talking?","Were they talking?","They were talking?"], ans:1,
       ex:"فاعل they است، پس Were در ابتدای جمله می‌آید."},
      {q:"What is the right answer to 'Was she reading?'",
       opts:["Yes, she was.","Yes, she did.","Yes, she were."], ans:0,
       ex:"پاسخ کوتاه با همان فعل کمکی سؤال: Yes, she was."},
      {q:"What is the right answer to 'Were they playing?'",
       opts:["No, they wasn't.","No, they weren't.","No, they didn't."], ans:1,
       ex:"فعل کمکی were است → No, they weren't."}
    ]},

  /* --- Self Pronouns --- */
  { id:"s5i", type:"teach", title:"ضمایر تأکیدی",
    blocks:[
      {table:{head:["فاعل","ضمیر تأکیدی"], rows:[
        ["I","myself"],["You","yourself"],["He","himself"],["She","herself"],
        ["It","itself"],["We","ourselves"],["You (جمع)","yourselves"],["They","themselves"]
      ]}},
      {p:"وقتی می‌خواهیم تأکید کنیم که <b>خود شخص</b> کار را انجام داده است."},
      {exs:[
        {en:"Alexander Graham Bell invented the telephone himself.", audioId:"l1_s5_p1", fa:"الکساندر گراهام بل خودش تلفن را اختراع کرد."},
        {en:"Marie Curie found uranium herself.", audioId:"l1_s5_p2", fa:"ماری کوری خودش اورانیوم را کشف کرد."},
        {en:"I did the experiment myself.", audioId:"l1_s5_p3", fa:"من خودم آزمایش را انجام دادم."},
        {en:"We painted the room ourselves.", audioId:"l1_s5_p4", fa:"ما خودمان اتاق را رنگ کردیم."}
      ]}
    ]},

  { id:"s5j", type:"mcqset", title:"آزمون کوچک ۴ — ضمایر تأکیدی",
    items:[
      {q:"She made the cake ______.",
       opts:["himself","herself","itself"], ans:1,
       ex:"برای she از herself استفاده می‌کنیم."},
      {q:"We painted the room ______.",
       opts:["ourselves","themselves","yourselves"], ans:0,
       ex:"برای we از ourselves."},
      {q:"He hurt ______ while playing.",
       opts:["himself","herself","myself"], ans:0,
       ex:"برای he از himself."},
      {q:"I did the experiment ______.",
       opts:["myself","himself","yourself"], ans:0,
       ex:"برای I از myself."},
      {q:"Which is correct?",
       opts:["They did it theirselves.","They did it themselves.","They did it themself."], ans:1,
       ex:"themselves درست است."}
    ]},

  /* FIX #31 : split full test into 2 sets */
  { id:"s5k", type:"mcqset", title:"آزمون کامل ۱",
    items:[
      {q:"She ______ (read) when I called.", opts:["was reading","were reading","read"], ans:0, ex:"was + verb-ing."},
      {q:"They ______ football at 5.", opts:["wasn't playing","weren't playing","didn't playing"], ans:1, ex:"weren't + verb-ing."},
      {q:"______ you ______ TV?", opts:["Were / watching","Was / watching","Did / watch"], ans:0, ex:"Were + فاعل + verb-ing."},
      {q:"He did the homework ______.", opts:["himself","herself","itself"], ans:0, ex:"himself."},
      {q:"We ______ when the phone rang.", opts:["weren't sleeping","wasn't sleeping","didn't sleeping"], ans:0, ex:"we → weren't."},
      {q:"The scientist ______ research.", opts:["was doing","were doing","did doing"], ans:0, ex:"مفرد → was doing."},
      {q:"______ they ______ when the teacher came in?", opts:["Were / talking","Was / talking","Did / talk"], ans:0, ex:"they → Were + verb-ing."},
      {q:"I ______ at 4.", opts:["wasn't working","weren't working","didn't working"], ans:0, ex:"I → wasn't."},
      {q:"We cleaned the house ______.", opts:["ourselves","themselves","yourselves"], ans:0, ex:"we → ourselves."},
      {q:"The cat ______ on the sofa.", opts:["was sleeping","were sleeping","sleep"], ans:0, ex:"مفرد → was sleeping."}
    ]},

  { id:"s5l", type:"mcqset", title:"آزمون کامل ۲",
    items:[
      {q:"They ______ TV at 8.", opts:["were watching","was watching","watch"], ans:0, ex:"they → were + verb-ing."},
      {q:"______ you ______ when I called?", opts:["Were / studying","Was / studying","Did / study"], ans:0, ex:"you → Were + verb-ing."},
      {q:"He ______ his name.", opts:["didn't remember","wasn't remembering","didn't remembered"], ans:0, ex:"remember فعل حالتی → گذشتهٔ ساده."},
      {q:"She ______ the book ______.", opts:["wrote / herself","wrote / himself","write / herself"], ans:0, ex:"she → herself."},
      {q:"______ the children ______ in the yard?", opts:["Were / playing","Was / playing","Did / play"], ans:0, ex:"children → Were + verb-ing."},
      {q:"I ______ to the cinema tonight.", opts:["want","am wanting","wanted"], ans:0, ex:"want فعل حالتی."},
      {q:"The computer ______ when the power went out.", opts:["was working","were working","worked"], ans:0, ex:"مفرد → was working."},
      {q:"They ______ the project ______.", opts:["finished / themselves","finished / himself","finish / themselves"], ans:0, ex:"they → themselves."},
      {q:"______ he ______ research?", opts:["Was / doing","Were / doing","Did / do"], ans:0, ex:"he → Was + verb-ing."},
      {q:"The sun ______ when we woke up.", opts:["was shining","were shining","shines"], ans:0, ex:"مفرد → was shining."}
    ]}
]},

/* ============================================================
   6. LISTENING & SPEAKING
   ============================================================ */
{ id:"s6", title:"شنیداری و گفتاری", icon:"🎧", steps:[

  { id:"s6a", type:"intro", title:"روایت یک داستان", cta:"شروع",
    body:"داستانی کوتاه می‌شنویم که گذشتهٔ ساده و گذشتهٔ استمراری را با هم به کار می‌برد." },

  { id:"s6b", type:"flashcards", title:"کلمات داستان",
    words:[
      {w:"hall",   fa:"سالن", em:"🏛️"},
      {w:"noise",  fa:"سر و صدا", em:"🔊"},
      {w:"yard",   fa:"حیاط", em:"🏡"},
      {w:"kitty",  fa:"بچه‌گربه", em:"🐱"},
      {w:"cookie", fa:"بیسکویت", em:"🍪"},
      {w:"hungry", fa:"گرسنه", em:"🍽️"}
    ]},

  { id:"s6c", type:"listen_mcq", title:"گوش دادن — سؤال کلی",
    tip:"اول گوش بده، بعد جواب بده.",
    audioId:"l1_s6_story",
    lines:[
      {s:"", t:"Last night at 8 o'clock we were sitting in the hall."},
      {s:"", t:"We were talking about our day."},
      {s:"", t:"Suddenly we heard a noise."},
      {s:"", t:"My father went out to see what was making the noise."},
      {s:"", t:"When my father was walking in the yard, we went to the kitchen."},
      {s:"", t:"We saw a kitty in the kitchen."},
      {s:"", t:"It was eating a cookie."},
      {s:"", t:"The poor kitty was hungry."}
    ],
    q:"What is the story about?",
    qFa:"داستان دربارهٔ چیست؟",
    opts:["A kitty in the kitchen","A thief in the yard","A party in the hall"], ans:0,
    ex:"داستان دربارهٔ یک بچه‌گربهٔ گرسنه است." },

  { id:"s6d", type:"teach", title:"پس‌زمینه و عمل اصلی",
    blocks:[
      {h:"دو نقش گذشتهٔ استمراری و گذشتهٔ ساده"},
      {exs:[
        {en:"We were sitting (پس‌زمینه) → we heard a noise (عمل اصلی)", fa:"ما نشسته بودیم → صدایی شنیدیم"},
        {en:"My father was walking (پس‌زمینه) → we went to the kitchen (عمل اصلی)", fa:"پدرم در حال قدم زدن بود → ما به آشپزخانه رفتیم"}
      ]},
      {h:"قاعده"},
      {p:"گذشتهٔ استمراری <b>موقعیت و پس‌زمینه</b> را توصیف می‌کند.<br>گذشتهٔ ساده <b>عمل‌های اصلی</b> را که داستان را جلو می‌برند بیان می‌کند."}
    ]},

  { id:"s6e", type:"mcqset", title:"درک ساختار",
    items:[
      { q:"Which verb shows the background?",
        qFa:"کدام فعل پس‌زمینه را نشان می‌دهد؟",
        opts:["were sitting","heard","went"], ans:0,
        ex:"were sitting عمل در جریان و پس‌زمینه است." },
      { q:"Which verb moves the story forward?",
        qFa:"کدام فعل عمل اصلی را جلو می‌برد؟",
        opts:["was talking","heard","were sitting"], ans:1,
        ex:"heard عمل کوتاه و کامل است." },
      { q:"Why is the past progressive used?",
        qFa:"چرا از گذشتهٔ استمراری استفاده شده؟",
        opts:["برای توصیف موقعیت در حال انجام","برای آینده","برای عادت"], ans:0,
        ex:"گذشتهٔ استمراری موقعیت در حال انجام را توصیف می‌کند." }
    ]},

  /* FIX #33 : shorter reorder items */
  { id:"s6f", type:"reorder", title:"داستان را مرتب کن",
    items:[
      {words:["We","were","sitting"], ans:"We were sitting", fa:"ما نشسته بودیم"},
      {words:["we","heard","a noise"], ans:"we heard a noise", fa:"صدایی شنیدیم"},
      {words:["My","father","went out"], ans:"My father went out", fa:"پدرم بیرون رفت"},
      {words:["A","kitty","was eating"], ans:"A kitty was eating", fa:"بچه‌گربه‌ای در حال خوردن بود"}
    ]},

  { id:"s6g", type:"mcqset", title:"تمرین مکالمه",
    items:[
      { q:"What were you doing last weekend in the afternoon?",
        qFa:"آخر هفته گذشته بعدازظهر چه کار می‌کردی؟",
        opts:["I was reading a book.","I read a book tomorrow.","I am reading a book."], ans:0,
        ex:"پاسخ هم با گذشتهٔ استمراری می‌آید." },
      { q:"What did you do when you were solving a problem?",
        qFa:"وقتی روی یک مسئله کار می‌کردی چه کار کردی؟",
        opts:["I didn't give up.","I don't give up.","I will not give up."], ans:0,
        ex:"زمان گذشته است → didn't give up." },
      { q:"What were you doing yesterday afternoon?",
        qFa:"دیروز بعدازظهر چه کار می‌کردی؟",
        opts:["I was playing in the yard.","I play in the yard.","I will play in the yard."], ans:0,
        ex:"گذشتهٔ استمراری برای عمل در جریان." }
    ]}
]},

/* ============================================================
   7. PRONUNCIATION
   ============================================================ */
{ id:"s7", title:"تلفظ", icon:"🗣️", steps:[

  { id:"s7a", type:"teach", title:"تأکید کلامی",
    blocks:[
      {h:"قاعده"},
      {p:"وقتی می‌خواهی روی چیزی <b>تأکید</b> کنی، آن را قوی‌تر تلفظ می‌کنی."},
      {exs:[
        {en:"Were <b>you</b> doing the research? No, <b>Ali</b> was.", audioId:"l1_s7_e1", fa:"آیا تو تحقیق می‌کردی؟ نه، علی این کار را می‌کرد."},
        {en:"Who broke the window? It wasn't <b>me</b>.", audioId:"l1_s7_e2", fa:"چه کسی پنجره را شکست؟ من نبودم."},
        {en:"The <b>workers</b> were making noises.", audioId:"l1_s7_e3", fa:"کارگران سر و صدا می‌کردند."}
      ]}
    ]},

  /* FIX #34 : audio first */
  { id:"s7b", type:"listen_mcq", title:"کدام کلمه تأکید شده؟",
    tip:"به صدا گوش بده، بعد کلمهٔ تأکیدشده را انتخاب کن.",
    audioId:"l1_s7_t1",
    lines:[{s:"", t:"Were YOU doing the research?"}],
    q:"Which word was emphasized?",
    qFa:"کدام کلمه تأکید شد؟",
    opts:["you","doing","research"], ans:0,
    ex:"you با تأکید تلفظ شد." },

  { id:"s7c", type:"speak", title:"تلفظ با تأکید",
    tip:"جمله را با تأکید روی کلمهٔ پررنگ بخوان.",
    items:[
      {en:"Were YOU doing the research?", hl:"YOU", audioId:"l1_s7_s1"},
      {en:"It wasn't ME.", hl:"ME", audioId:"l1_s7_s2"},
      {en:"The WORKERS were making noises.", hl:"WORKERS", audioId:"l1_s7_s3"}
    ]}
]},

/* ============================================================
   8. WRITING
   ============================================================ */
{ id:"s8", title:"نوشتار", icon:"✍️", steps:[

  { id:"s8a", type:"teach", title:"افعال کنشی",
    blocks:[
      {p:"افعال کنشی عملی را نشان می‌دهند که انجام می‌شود."},
      {exs:[
        {en:"The children went to school by bus yesterday.", audioId:"l1_s8_a1", fa:"بچه‌ها دیروز با اتوبوس به مدرسه رفتند."},
        {en:"My brother drinks milk every day.", audioId:"l1_s8_a2", fa:"برادرم هر روز شیر می‌نوشد."},
        {en:"She runs every morning.", audioId:"l1_s8_a3", fa:"او هر روز صبح می‌دود."}
      ]}
    ]},

  { id:"s8b", type:"teach", title:"افعال حالتی",
    blocks:[
      {p:"افعال حالتی احساسات، افکار و حواس را نشان می‌دهند. این افعال معمولاً در زمان <b>ساده</b> استفاده می‌شوند."},
      {exs:[
        {en:"We believe in Allah.", audioId:"l1_s8_b1", fa:"ما به خدا باور داریم."},
        {en:"We love our country.", audioId:"l1_s8_b2", fa:"ما کشورمان را دوست داریم."},
        {en:"She feels happy.", audioId:"l1_s8_b3", fa:"او احساس خوشحالی می‌کند."},
        {en:"I know the answer.", audioId:"l1_s8_b4", fa:"من پاسخ را می‌دانم."}
      ]}
    ]},

  /* FIX #36 : remove ambiguous "feel" */
  { id:"s8c", type:"sort", title:"کنشی یا حالتی؟",
    tip:"هر فعل را در دستهٔ درست قرار بده.",
    bins:["کنشی (Action)","حالتی (State)"],
    items:[
      {t:"run", b:0},{t:"believe", b:1},{t:"eat", b:0},{t:"love", b:1},
      {t:"write", b:0},{t:"know", b:1},{t:"play", b:0},{t:"want", b:1}
    ]},

  /* FIX #37 : softer explanation for state verbs */
  { id:"s8d", type:"mcqset", title:"شکل درست فعل را انتخاب کن",
    items:[
      {q:"I ______ reading newspapers.",
       opts:["don't like","am not liking"], ans:0,
       ex:"like فعل حالتی است. در انگلیسی معیار، این فعل در زمان ساده می‌آید."},
      {q:"At 3 o'clock yesterday, I ______ a taxi.",
       opts:["needed","was needing"], ans:0,
       ex:"need فعل حالتی است → گذشتهٔ ساده."},
      {q:"She ______ television at the moment.",
       opts:["watches","is watching"], ans:1,
       ex:"watch فعل کنشی است → می‌تواند استمراری باشد."},
      {q:"I ______ to go to the cinema tonight.",
       opts:["want","am wanting"], ans:0,
       ex:"want فعل حالتی است."},
      {q:"Unfortunately, he ______ my name.",
       opts:["didn't remember","wasn't remembering"], ans:0,
       ex:"remember فعل حالتی است."}
    ]},

  { id:"s8e", type:"mcqset", title:"تمرین اضافی نوشتار",
    items:[
      {q:"My sister ______ milk every day.", opts:["drinks","is drinking","drink"], ans:0, ex:"عادت روزمره → حال ساده."},
      {q:"I ______ the answer right now.", opts:["know","am knowing","knew"], ans:0, ex:"know فعل حالتی."},
      {q:"Look! The baby ______.", opts:["is sleeping","sleeps","slept"], ans:0, ex:"عمل در حال انجام → حال استمراری."},
      {q:"We ______ our country.", opts:["love","are loving","loved"], ans:0, ex:"love فعل حالتی."},
      {q:"He ______ football every Friday.", opts:["plays","is playing","play"], ans:0, ex:"عادت → حال ساده."}
    ]}
]},

/* ============================================================
   9. REVIEW
   ============================================================ */
{ id:"s9", title:"مرور نهایی", icon:"🏆", steps:[

  { id:"s9a", type:"teach", title:"خلاصهٔ درس ۱",
    blocks:[
      {h:"واژگان کلیدی"},
      {p:"scientist, research, invent, experiment, solve, develop, belief, quit, give up, thousands of, energetic, weak, success, famous"},
      {h:"دستور"},
      {p:"گذشتهٔ استمراری (مثبت، منفی، سؤالی) — ضمایر تأکیدی — گذشتهٔ ساده در برابر گذشتهٔ استمراری"},
      {h:"تلفظ"},
      {p:"تأکید کلامی (Emphatic Stress)"},
      {h:"نوشتار"},
      {p:"افعال کنشی در برابر افعال حالتی"}
    ]},

  { id:"s9b", type:"listen_mcq", title:"شنیداری پایانی",
    tip:"به داستان گوش بده، بعد جواب بده.",
    audioId:"l1_s9_story",
    lines:[
      {s:"", t:"Sajjad was taking pictures yesterday at 8."},
      {s:"", t:"When he was taking pictures, firefighters came to help."},
      {s:"", t:"The firefighters jumped out of their cars."},
      {s:"", t:"They were working quickly."},
      {s:"", t:"They were putting out the fire."},
      {s:"", t:"People were standing near the building."},
      {s:"", t:"They were watching the fire."},
      {s:"", t:"It was dangerous."},
      {s:"", t:"Sajjad put his camera aside and asked people to leave."},
      {s:"", t:"The firefighters put out the fire when he was talking with people."}
    ],
    q:"What was Sajjad doing in the park yesterday?",
    qFa:"سجاد دیروز در پارک چه کار می‌کرد؟",
    opts:["He was taking pictures","He was putting out the fire","He was reading a book"], ans:0,
    ex:"Sajjad was taking pictures." },

  { id:"s9c", type:"mcqset", title:"سؤال‌های شنیداری",
    items:[
      {q:"Did Sajjad put out the fire?",
       qFa:"آیا سجاد آتش را خاموش کرد؟",
       opts:["Yes","No, the firefighters did"], ans:1,
       ex:"آتش‌نشانان آتش را خاموش کردند."},
      {q:"Were the firefighters working slowly?",
       qFa:"آیا آتش‌نشانان آرام کار می‌کردند؟",
       opts:["Yes","No, they were working quickly"], ans:1,
       ex:"They were working quickly."}
    ]},

  /* FIX #40 : broken into 3 shorter tests */
  { id:"s9d", type:"mcqset", title:"آزمون جامع ۱",
    items:[
      {q:"What does 'give up' mean?",
       qFa:"معنی give up چیست؟",
       opts:["To stop trying","To solve","To build"], ans:0,
       ex:"give up = تسلیم شدن."},
      {q:"She ______ a book when I called.",
       opts:["was reading","were reading","reads"], ans:0, ex:"she → was + verb-ing."},
      {q:"They ______ football.",
       opts:["were playing","was playing","plays"], ans:0, ex:"they → were + verb-ing."},
      {q:"______ you ______ TV?",
       opts:["Were / watching","Was / watching","Did / watch"], ans:0, ex:"you → Were."},
      {q:"He hurt ______.",
       opts:["himself","herself","itself"], ans:0, ex:"he → himself."}
    ]},

  { id:"s9e", type:"mcqset", title:"آزمون جامع ۲",
    items:[
      {q:"Where did Edison learn science?",
       qFa:"ادیسون علم را کجا یاد گرفت؟",
       opts:["In the library","At school","In the laboratory"], ans:0,
       ex:"in the library."},
      {q:"I ______ reading newspapers.",
       opts:["don't like","am not liking","didn't liked"], ans:0, ex:"like فعل حالتی."},
      {q:"In English, adjectives come ______ nouns.",
       qFa:"در انگلیسی، صفت ______ اسم می‌آید.",
       opts:["before","after","between"], ans:0,
       ex:"صفت قبل از اسم می‌آید."},
      {q:"What is the key to the scientists' success?",
       qFa:"کلید موفقیت دانشمندان چیست؟",
       opts:["Hard work and self-belief","Money","Luck"], ans:0,
       ex:"hard work and belief in themselves."},
      {q:"We ______ when the phone rang.",
       opts:["weren't sleeping","wasn't sleeping","didn't sleeping"], ans:0, ex:"we → weren't."}
    ]},

  { id:"s9f", type:"mcqset", title:"آزمون جامع ۳",
    items:[
      {q:"She made the cake ______.",
       opts:["himself","herself","itself"], ans:1, ex:"she → herself."},
      {q:"What does 'observatory' mean?",
       qFa:"معنی observatory چیست؟",
       opts:["A place to study stars","A laboratory","A library"], ans:0,
       ex:"رصدخانه."},
      {q:"The cat ______ on the sofa.",
       opts:["was sleeping","were sleeping","sleep"], ans:0, ex:"مفرد → was sleeping."},
      {q:"I ______ to the cinema tonight.",
       opts:["want","am wanting","wanted"], ans:0, ex:"want فعل حالتی."},
      {q:"'No Pain No Gain' means ______.",
       qFa:"«No Pain No Gain» یعنی چه؟",
       opts:["No success without hard work","Pain without reason","Easy success"], ans:0,
       ex:"بدون تلاش، موفقیتی نیست."}
    ]}
]}
]}];