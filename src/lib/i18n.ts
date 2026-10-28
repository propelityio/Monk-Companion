// Interface text, greetings and fixed replies in each supported language.
// The conversation itself works in any language: answers follow the language
// the person writes in. These locales only cover the screen around it.

export const LOCALES = ["en", "es", "pt", "fr", "de", "it", "zh", "ja"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  zh: "中文",
  ja: "日本語",
};

/** BCP-47 tags for speech recognition and speech synthesis. */
export const SPEECH_LANG: Record<Locale, string> = {
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  zh: "zh-CN",
  ja: "ja-JP",
};

export function toLocale(tag: string | null | undefined): Locale {
  const base = (tag ?? "").toLowerCase().split(/[-_]/)[0];
  return (LOCALES as readonly string[]).includes(base) ? (base as Locale) : "en";
}

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

type Greeting = { hello: string; questions: [string, string, string] };

type UiText = {
  chatTitle: string;
  guest: string;
  curatedFor: (name: string) => string;
  speakReplies: string;
  curatedPath: string;
  path: string;
  profileIntro: string;
  name: string;
  email: string;
  intention: string;
  intentionPlaceholder: string;
  save: string;
  forget: string;
  you: string;
  companion: string;
  thinking: string;
  placeholder: string;
  speak: string;
  stop: string;
  send: string;
  language: string;
  invitation: string;
  voiceUnavailable: string;
  replyFailed: string;
  connectionDropped: string;
  greetings: Record<TimeOfDay, Greeting>;
};

export const UI: Record<Locale, UiText> = {
  en: {
    chatTitle: "Monk Chat",
    guest: "Guest conversation · no account required",
    curatedFor: (n) => `Curated for ${n}`,
    speakReplies: "Speak replies",
    curatedPath: "Curated path",
    path: "Path",
    profileIntro:
      "Optional. Name and email are enough for us to recognize you. Stored in this browser until a real identity service is added.",
    name: "Preferred name",
    email: "Email",
    intention: "Intention (optional)",
    intentionPlaceholder: "What are you hoping to tend?",
    save: "Save",
    forget: "Forget this browser",
    you: "You",
    companion: "Companion",
    thinking: "Listening inwardly…",
    placeholder: "Speak or type what is present…",
    speak: "Speak",
    stop: "Stop",
    send: "Send",
    language: "Language",
    invitation: "You may speak or write, in any language. No login is needed.",
    voiceUnavailable: "Voice input is not available in this browser. You can still type.",
    replyFailed: "I could not answer just then. Please try again in a moment.",
    connectionDropped: "The connection dropped. Please try again.",
    greetings: {
      morning: {
        hello: "Good morning.",
        questions: [
          "How are you feeling as this day begins?",
          "What would you like to bring into today?",
          "How did you wake up this morning, in body and mind?",
        ],
      },
      afternoon: {
        hello: "Good afternoon.",
        questions: [
          "How is your day unfolding?",
          "What is asking for your attention right now?",
          "Take one slow breath. How are you, really?",
        ],
      },
      evening: {
        hello: "Good evening.",
        questions: [
          "How was your day? What are you carrying with you?",
          "As the day winds down, what is on your mind?",
          "What moment from today would you like to look at gently?",
        ],
      },
      night: {
        hello: "Good night.",
        questions: [
          "What is keeping you awake?",
          "The world is quiet now. What is present for you?",
          "Before rest, is there something you would like to set down?",
        ],
      },
    },
  },
  es: {
    chatTitle: "Chat con el monje",
    guest: "Conversación de invitado · sin cuenta",
    curatedFor: (n) => `Camino de ${n}`,
    speakReplies: "Leer respuestas en voz alta",
    curatedPath: "Camino personal",
    path: "Camino",
    profileIntro:
      "Opcional. Con tu nombre y correo basta para reconocerte. Se guarda en este navegador hasta que exista un servicio de identidad.",
    name: "Nombre preferido",
    email: "Correo electrónico",
    intention: "Intención (opcional)",
    intentionPlaceholder: "¿Qué te gustaría cultivar?",
    save: "Guardar",
    forget: "Olvidar este navegador",
    you: "Tú",
    companion: "Compañero",
    thinking: "Escuchando hacia dentro…",
    placeholder: "Habla o escribe lo que está presente…",
    speak: "Hablar",
    stop: "Detener",
    send: "Enviar",
    language: "Idioma",
    invitation: "Puedes hablar o escribir, en cualquier idioma. No necesitas iniciar sesión.",
    voiceUnavailable: "La entrada de voz no está disponible en este navegador. Puedes escribir.",
    replyFailed: "No pude responder en este momento. Inténtalo de nuevo en un momento.",
    connectionDropped: "Se perdió la conexión. Inténtalo de nuevo.",
    greetings: {
      morning: {
        hello: "Buenos días.",
        questions: [
          "¿Cómo te sientes al comenzar este día?",
          "¿Qué te gustaría llevar contigo hoy?",
          "¿Cómo despertaste esta mañana, en el cuerpo y en la mente?",
        ],
      },
      afternoon: {
        hello: "Buenas tardes.",
        questions: [
          "¿Cómo va tu día?",
          "¿Qué está pidiendo tu atención ahora mismo?",
          "Haz una respiración lenta. ¿Cómo estás, de verdad?",
        ],
      },
      evening: {
        hello: "Buenas tardes.",
        questions: [
          "¿Cómo fue tu día? ¿Qué llevas contigo?",
          "Ahora que el día termina, ¿qué hay en tu mente?",
          "¿Qué momento de hoy te gustaría mirar con suavidad?",
        ],
      },
      night: {
        hello: "Buenas noches.",
        questions: [
          "¿Qué te mantiene despierto?",
          "El mundo está en silencio. ¿Qué está presente para ti?",
          "Antes de descansar, ¿hay algo que quieras soltar?",
        ],
      },
    },
  },
  pt: {
    chatTitle: "Conversa com o monge",
    guest: "Conversa de visitante · sem conta",
    curatedFor: (n) => `Caminho de ${n}`,
    speakReplies: "Ler respostas em voz alta",
    curatedPath: "Caminho pessoal",
    path: "Caminho",
    profileIntro:
      "Opcional. Nome e e-mail bastam para reconhecermos você. Fica salvo neste navegador até existir um serviço de identidade.",
    name: "Nome preferido",
    email: "E-mail",
    intention: "Intenção (opcional)",
    intentionPlaceholder: "O que você gostaria de cultivar?",
    save: "Salvar",
    forget: "Esquecer este navegador",
    you: "Você",
    companion: "Companheiro",
    thinking: "Escutando para dentro…",
    placeholder: "Fale ou escreva o que está presente…",
    speak: "Falar",
    stop: "Parar",
    send: "Enviar",
    language: "Idioma",
    invitation: "Você pode falar ou escrever, em qualquer idioma. Não é preciso fazer login.",
    voiceUnavailable: "A entrada de voz não está disponível neste navegador. Você pode digitar.",
    replyFailed: "Não consegui responder agora. Tente novamente em um momento.",
    connectionDropped: "A conexão caiu. Tente novamente.",
    greetings: {
      morning: {
        hello: "Bom dia.",
        questions: [
          "Como você está se sentindo neste começo de dia?",
          "O que você gostaria de levar para o dia de hoje?",
          "Como você acordou esta manhã, no corpo e na mente?",
        ],
      },
      afternoon: {
        hello: "Boa tarde.",
        questions: [
          "Como está sendo o seu dia?",
          "O que está pedindo a sua atenção agora?",
          "Respire devagar uma vez. Como você está, de verdade?",
        ],
      },
      evening: {
        hello: "Boa noite.",
        questions: [
          "Como foi o seu dia? O que você está carregando?",
          "Agora que o dia termina, o que está na sua mente?",
          "Que momento de hoje você gostaria de olhar com gentileza?",
        ],
      },
      night: {
        hello: "Boa noite.",
        questions: [
          "O que está mantendo você acordado?",
          "O mundo está em silêncio. O que está presente para você?",
          "Antes de descansar, há algo que você gostaria de deixar de lado?",
        ],
      },
    },
  },
  fr: {
    chatTitle: "Dialogue avec le moine",
    guest: "Conversation invitée · sans compte",
    curatedFor: (n) => `Chemin de ${n}`,
    speakReplies: "Lire les réponses à voix haute",
    curatedPath: "Chemin personnel",
    path: "Chemin",
    profileIntro:
      "Facultatif. Un prénom et un e-mail suffisent pour vous reconnaître. Enregistrés dans ce navigateur en attendant un vrai service d’identité.",
    name: "Prénom choisi",
    email: "E-mail",
    intention: "Intention (facultatif)",
    intentionPlaceholder: "Que souhaitez-vous cultiver ?",
    save: "Enregistrer",
    forget: "Oublier ce navigateur",
    you: "Vous",
    companion: "Compagnon",
    thinking: "À l’écoute intérieure…",
    placeholder: "Dites ou écrivez ce qui est présent…",
    speak: "Parler",
    stop: "Arrêter",
    send: "Envoyer",
    language: "Langue",
    invitation: "Vous pouvez parler ou écrire, dans n’importe quelle langue. Aucune connexion n’est nécessaire.",
    voiceUnavailable: "La saisie vocale n’est pas disponible dans ce navigateur. Vous pouvez écrire.",
    replyFailed: "Je n’ai pas pu répondre pour l’instant. Réessayez dans un moment.",
    connectionDropped: "La connexion a été interrompue. Réessayez.",
    greetings: {
      morning: {
        hello: "Bonjour.",
        questions: [
          "Comment vous sentez-vous en ce début de journée ?",
          "Qu’aimeriez-vous apporter à cette journée ?",
          "Comment vous êtes-vous réveillé ce matin, dans le corps et l’esprit ?",
        ],
      },
      afternoon: {
        hello: "Bon après-midi.",
        questions: [
          "Comment se déroule votre journée ?",
          "Qu’est-ce qui demande votre attention en ce moment ?",
          "Prenez une respiration lente. Comment allez-vous, vraiment ?",
        ],
      },
      evening: {
        hello: "Bonsoir.",
        questions: [
          "Comment s’est passée votre journée ? Que portez-vous avec vous ?",
          "Alors que la journée s’achève, qu’avez-vous à l’esprit ?",
          "Quel moment d’aujourd’hui aimeriez-vous regarder avec douceur ?",
        ],
      },
      night: {
        hello: "Bonsoir.",
        questions: [
          "Qu’est-ce qui vous tient éveillé ?",
          "Le monde est calme maintenant. Qu’est-ce qui est présent pour vous ?",
          "Avant de vous reposer, y a-t-il quelque chose que vous aimeriez déposer ?",
        ],
      },
    },
  },
  de: {
    chatTitle: "Gespräch mit dem Mönch",
    guest: "Gastgespräch · kein Konto nötig",
    curatedFor: (n) => `Weg für ${n}`,
    speakReplies: "Antworten vorlesen",
    curatedPath: "Persönlicher Weg",
    path: "Weg",
    profileIntro:
      "Freiwillig. Name und E-Mail genügen, damit wir Sie wiedererkennen. Bis es einen echten Anmeldedienst gibt, bleibt beides in diesem Browser.",
    name: "Bevorzugter Name",
    email: "E-Mail",
    intention: "Absicht (optional)",
    intentionPlaceholder: "Was möchten Sie pflegen?",
    save: "Speichern",
    forget: "Diesen Browser vergessen",
    you: "Sie",
    companion: "Begleiter",
    thinking: "Nach innen lauschend…",
    placeholder: "Sprechen oder schreiben Sie, was gerade da ist…",
    speak: "Sprechen",
    stop: "Stopp",
    send: "Senden",
    language: "Sprache",
    invitation: "Sie können sprechen oder schreiben, in jeder Sprache. Eine Anmeldung ist nicht nötig.",
    voiceUnavailable: "Spracheingabe ist in diesem Browser nicht verfügbar. Sie können tippen.",
    replyFailed: "Ich konnte gerade nicht antworten. Bitte versuchen Sie es gleich noch einmal.",
    connectionDropped: "Die Verbindung wurde unterbrochen. Bitte versuchen Sie es erneut.",
    greetings: {
      morning: {
        hello: "Guten Morgen.",
        questions: [
          "Wie fühlen Sie sich zu Beginn dieses Tages?",
          "Was möchten Sie in den heutigen Tag mitnehmen?",
          "Wie sind Sie heute aufgewacht, in Körper und Geist?",
        ],
      },
      afternoon: {
        hello: "Guten Tag.",
        questions: [
          "Wie verläuft Ihr Tag?",
          "Was verlangt gerade Ihre Aufmerksamkeit?",
          "Nehmen Sie einen langsamen Atemzug. Wie geht es Ihnen wirklich?",
        ],
      },
      evening: {
        hello: "Guten Abend.",
        questions: [
          "Wie war Ihr Tag? Was tragen Sie mit sich?",
          "Der Tag geht zu Ende. Was beschäftigt Sie?",
          "Welchen Moment von heute möchten Sie behutsam betrachten?",
        ],
      },
      night: {
        hello: "Gute Nacht.",
        questions: [
          "Was hält Sie wach?",
          "Die Welt ist jetzt still. Was ist für Sie gerade da?",
          "Gibt es vor dem Ruhen etwas, das Sie ablegen möchten?",
        ],
      },
    },
  },
  it: {
    chatTitle: "Dialogo con il monaco",
    guest: "Conversazione ospite · nessun account",
    curatedFor: (n) => `Percorso di ${n}`,
    speakReplies: "Leggi le risposte ad alta voce",
    curatedPath: "Percorso personale",
    path: "Percorso",
    profileIntro:
      "Facoltativo. Nome ed e-mail bastano per riconoscerti. Salvati in questo browser finché non ci sarà un vero servizio di identità.",
    name: "Nome preferito",
    email: "E-mail",
    intention: "Intenzione (facoltativa)",
    intentionPlaceholder: "Che cosa vorresti coltivare?",
    save: "Salva",
    forget: "Dimentica questo browser",
    you: "Tu",
    companion: "Compagno",
    thinking: "In ascolto interiore…",
    placeholder: "Di’ o scrivi ciò che è presente…",
    speak: "Parla",
    stop: "Ferma",
    send: "Invia",
    language: "Lingua",
    invitation: "Puoi parlare o scrivere, in qualsiasi lingua. Non serve accedere.",
    voiceUnavailable: "L’input vocale non è disponibile in questo browser. Puoi scrivere.",
    replyFailed: "Non sono riuscito a rispondere in questo momento. Riprova tra poco.",
    connectionDropped: "La connessione si è interrotta. Riprova.",
    greetings: {
      morning: {
        hello: "Buongiorno.",
        questions: [
          "Come ti senti all’inizio di questa giornata?",
          "Che cosa vorresti portare con te oggi?",
          "Come ti sei svegliato stamattina, nel corpo e nella mente?",
        ],
      },
      afternoon: {
        hello: "Buon pomeriggio.",
        questions: [
          "Come sta andando la tua giornata?",
          "Che cosa chiede la tua attenzione in questo momento?",
          "Fai un respiro lento. Come stai, davvero?",
        ],
      },
      evening: {
        hello: "Buonasera.",
        questions: [
          "Com’è stata la tua giornata? Che cosa porti con te?",
          "Ora che la giornata finisce, che cosa hai in mente?",
          "Quale momento di oggi vorresti guardare con gentilezza?",
        ],
      },
      night: {
        hello: "Buonanotte.",
        questions: [
          "Che cosa ti tiene sveglio?",
          "Il mondo ora è silenzioso. Che cosa è presente per te?",
          "Prima di riposare, c’è qualcosa che vorresti lasciare andare?",
        ],
      },
    },
  },
  zh: {
    chatTitle: "与僧人对话",
    guest: "访客对话 · 无需账户",
    curatedFor: (n) => `${n} 的修行之路`,
    speakReplies: "朗读回复",
    curatedPath: "个人修行之路",
    path: "修行之路",
    profileIntro: "可选。留下称呼和电子邮箱即可让我们认出你。在正式的身份服务上线前，信息仅保存在此浏览器中。",
    name: "称呼",
    email: "电子邮箱",
    intention: "发心（可选）",
    intentionPlaceholder: "你希望培养什么？",
    save: "保存",
    forget: "清除此浏览器中的信息",
    you: "你",
    companion: "同伴",
    thinking: "向内倾听中…",
    placeholder: "说出或写下此刻的感受…",
    speak: "说话",
    stop: "停止",
    send: "发送",
    language: "语言",
    invitation: "你可以用任何语言说话或书写，无需登录。",
    voiceUnavailable: "此浏览器不支持语音输入，你仍然可以打字。",
    replyFailed: "刚才无法回答，请稍后再试。",
    connectionDropped: "连接中断，请再试一次。",
    greetings: {
      morning: {
        hello: "早上好。",
        questions: ["新的一天开始了，你感觉如何？", "今天你想带着什么心意出发？", "今早醒来，你的身心状态怎样？"],
      },
      afternoon: {
        hello: "下午好。",
        questions: ["你今天过得怎么样？", "此刻有什么在召唤你的注意？", "慢慢吸一口气。你真正的状态如何？"],
      },
      evening: {
        hello: "晚上好。",
        questions: ["今天过得如何？你心里还装着什么？", "一天将尽，你在想些什么？", "今天有哪个时刻，你想温柔地回看？"],
      },
      night: {
        hello: "夜深了。",
        questions: ["是什么让你还醒着？", "世界已安静下来。此刻你心中有什么？", "休息之前，有什么想放下的吗？"],
      },
    },
  },
  ja: {
    chatTitle: "僧侶との対話",
    guest: "ゲストとして対話 · アカウント不要",
    curatedFor: (n) => `${n} さんの道`,
    speakReplies: "返答を読み上げる",
    curatedPath: "あなたの道",
    path: "道",
    profileIntro: "任意です。お名前とメールアドレスがあれば、あなたを覚えておけます。本格的な認証サービスができるまでは、このブラウザに保存されます。",
    name: "呼び名",
    email: "メールアドレス",
    intention: "願い（任意）",
    intentionPlaceholder: "何を育てていきたいですか？",
    save: "保存",
    forget: "このブラウザの情報を消去",
    you: "あなた",
    companion: "同伴者",
    thinking: "内に耳を澄ませています…",
    placeholder: "今ここにあることを話すか、書いてください…",
    speak: "話す",
    stop: "止める",
    send: "送信",
    language: "言語",
    invitation: "どの言語でも、話しても書いても構いません。ログインは不要です。",
    voiceUnavailable: "このブラウザでは音声入力が使えません。文字で入力できます。",
    replyFailed: "今はお答えできませんでした。少ししてからもう一度お試しください。",
    connectionDropped: "接続が切れました。もう一度お試しください。",
    greetings: {
      morning: {
        hello: "おはようございます。",
        questions: ["一日の始まりに、どんな気持ちですか？", "今日はどんな心で過ごしたいですか？", "今朝は、からだと心の具合はいかがですか？"],
      },
      afternoon: {
        hello: "こんにちは。",
        questions: ["今日はどんな一日になっていますか？", "今、何があなたの注意を求めていますか？", "ゆっくり一呼吸してみましょう。本当のところ、いかがですか？"],
      },
      evening: {
        hello: "こんばんは。",
        questions: ["今日はどんな一日でしたか？何を抱えていますか？", "一日が終わろうとしています。心に何がありますか？", "今日のどの瞬間を、やさしく振り返ってみたいですか？"],
      },
      night: {
        hello: "夜も更けましたね。",
        questions: ["何があなたを眠らせずにいるのでしょう？", "世界は静かになりました。今、あなたの中に何がありますか？", "休む前に、手放したいことはありますか？"],
      },
    },
  },
};

// ---------- fixed server replies ----------

type ServerText = { empty: string; noTeaching: string; error: string };

export const SERVER_TEXT: Record<Locale, ServerText> = {
  en: {
    empty: "Sit for a moment and say what is here. You may type or speak. No account is needed.",
    noTeaching:
      "I do not yet have a recorded teaching from Kalden that answers this. As more talks and transcripts are added, I will cite them instead of inventing a reply.",
    error: "I could not reach the teachings just now. Please try again in a moment.",
  },
  es: {
    empty: "Siéntate un momento y di lo que está aquí. Puedes escribir o hablar. No necesitas una cuenta.",
    noTeaching:
      "Todavía no tengo una enseñanza grabada de Kalden que responda a esto. A medida que se añadan más charlas y transcripciones, las citaré en lugar de inventar una respuesta.",
    error: "No pude acceder a las enseñanzas en este momento. Inténtalo de nuevo en un momento.",
  },
  pt: {
    empty: "Sente-se por um momento e diga o que está aqui. Você pode escrever ou falar. Não é preciso ter conta.",
    noTeaching:
      "Ainda não tenho um ensinamento gravado de Kalden que responda a isso. À medida que mais palestras e transcrições forem adicionadas, vou citá-las em vez de inventar uma resposta.",
    error: "Não consegui acessar os ensinamentos agora. Tente novamente em um momento.",
  },
  fr: {
    empty: "Asseyez-vous un instant et dites ce qui est là. Vous pouvez écrire ou parler. Aucun compte n’est nécessaire.",
    noTeaching:
      "Je n’ai pas encore d’enseignement enregistré de Kalden qui réponde à cela. Lorsque d’autres enseignements et transcriptions seront ajoutés, je les citerai au lieu d’inventer une réponse.",
    error: "Je n’ai pas pu accéder aux enseignements pour l’instant. Réessayez dans un moment.",
  },
  de: {
    empty: "Halten Sie einen Moment inne und sagen Sie, was gerade da ist. Sie können schreiben oder sprechen. Ein Konto ist nicht nötig.",
    noTeaching:
      "Ich habe noch keine aufgezeichnete Unterweisung von Kalden, die darauf antwortet. Sobald weitere Vorträge und Abschriften hinzukommen, werde ich sie zitieren, statt eine Antwort zu erfinden.",
    error: "Ich konnte die Unterweisungen gerade nicht erreichen. Bitte versuchen Sie es gleich noch einmal.",
  },
  it: {
    empty: "Siediti un momento e di’ ciò che è qui. Puoi scrivere o parlare. Non serve un account.",
    noTeaching:
      "Non ho ancora un insegnamento registrato di Kalden che risponda a questo. Man mano che verranno aggiunti altri discorsi e trascrizioni, li citerò invece di inventare una risposta.",
    error: "Non sono riuscito a raggiungere gli insegnamenti in questo momento. Riprova tra poco.",
  },
  zh: {
    empty: "静坐片刻，说出此刻心中所有。你可以打字或说话，无需账户。",
    noTeaching: "目前还没有 Kalden 录制的教法能回答这个问题。随着更多开示和文字稿加入，我会引用它们，而不会编造回答。",
    error: "刚才无法读取教法，请稍后再试。",
  },
  ja: {
    empty: "少しのあいだ座って、今ここにあることを言葉にしてみてください。文字でも声でも構いません。アカウントは不要です。",
    noTeaching:
      "これに答えるカルデンの録音された教えは、まだありません。法話や書き起こしが増えれば、答えを作り出すのではなく、それを引用してお伝えします。",
    error: "今は教えにアクセスできませんでした。少ししてからもう一度お試しください。",
  },
};

// ---------- crisis support ----------

/** Country code from the browser's time zone, for crisis lines only. */
export function regionFromTimeZone(tz: string | null | undefined): string | null {
  if (!tz) return null;
  if (/^America\/(Sao_Paulo|Bahia|Fortaleza|Recife|Maceio|Belem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Araguaina|Noronha|Santarem)$/.test(tz))
    return "BR";
  if (/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Moncton|Whitehorse|Yellowknife|Iqaluit)$/.test(tz)) return "CA";
  if (/^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Juneau|Adak|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+)|Pacific\/Honolulu)$/.test(tz))
    return "US";
  const map: Record<string, string> = {
    "Europe/London": "GB",
    "Europe/Dublin": "IE",
    "Europe/Paris": "FR",
    "Europe/Madrid": "ES",
    "Atlantic/Canary": "ES",
    "Europe/Berlin": "DE",
  };
  return map[tz] ?? null;
}

export const CRISIS_COUNTRY: Record<string, string> = {
  US: "the United States",
  CA: "Canada",
  GB: "the United Kingdom",
  IE: "Ireland",
  FR: "France",
  ES: "Spain",
  BR: "Brazil",
  DE: "Germany",
};

export function crisisLine(region: string | null | undefined): string | null {
  return region ? (CRISIS_LINES[region.toUpperCase()] ?? null) : null;
}

const CRISIS_LINES: Record<string, string> = {
  US: "988",
  CA: "988",
  GB: "116 123",
  IE: "116 123",
  FR: "3114",
  ES: "024",
  BR: "188",
  DE: "116 123",
};

export function crisisReply(locale: Locale, region: string | null | undefined): string {
  const line = region ? CRISIS_LINES[region.toUpperCase()] : undefined;
  const msg: Record<Locale, (line?: string) => string> = {
    en: (l) =>
      `Please reach a person who can help right now. ${l ? `Call ${l}${l === "988" ? " (call or text)" : ""}, ` : ""}contact your local emergency number, or find a free helpline in your country at findahelpline.com. I am a companion for teachings, not a crisis counselor.`,
    es: (l) =>
      `Por favor, busca ahora mismo a una persona que pueda ayudarte. ${l ? `Llama al ${l}, ` : ""}contacta con el número de emergencias de tu país o encuentra una línea de ayuda gratuita en findahelpline.com. Soy un compañero para las enseñanzas, no un consejero de crisis.`,
    pt: (l) =>
      `Por favor, procure agora uma pessoa que possa ajudar. ${l ? `Ligue ${l}${l === "188" ? " (CVV)" : ""}, ` : ""}contate o número de emergência do seu país ou encontre uma linha de apoio gratuita em findahelpline.com. Sou um companheiro para os ensinamentos, não um conselheiro de crise.`,
    fr: (l) =>
      `Je vous en prie, contactez dès maintenant une personne qui peut vous aider. ${l ? `Appelez le ${l}, ` : ""}joignez le numéro d’urgence de votre pays ou trouvez une ligne d’écoute gratuite sur findahelpline.com. Je suis un compagnon pour les enseignements, pas un conseiller de crise.`,
    de: (l) =>
      `Bitte wenden Sie sich jetzt an einen Menschen, der helfen kann. ${l ? `Rufen Sie ${l} an, ` : ""}wählen Sie die Notrufnummer Ihres Landes oder finden Sie eine kostenlose Hilfeleitung unter findahelpline.com. Ich bin ein Begleiter für Unterweisungen, kein Krisenberater.`,
    it: (l) =>
      `Per favore, contatta subito una persona che possa aiutarti. ${l ? `Chiama il ${l}, ` : ""}chiama il numero di emergenza del tuo paese o trova una linea di ascolto gratuita su findahelpline.com. Sono un compagno per gli insegnamenti, non un consulente per le crisi.`,
    zh: (l) =>
      `请现在就联系能帮助你的人。${l ? `拨打 ${l}，` : ""}或拨打你所在国家的紧急电话，也可以在 findahelpline.com 找到免费的求助热线。我是陪伴学习教法的同伴，不是危机辅导员。`,
    ja: (l) =>
      `今すぐ、助けてくれる人に連絡してください。${l ? `${l} に電話するか、` : ""}お住まいの国の緊急番号に連絡するか、findahelpline.com で無料の相談窓口を探してください。私は教えを共に学ぶ同伴者であり、危機のカウンセラーではありません。`,
  };
  return msg[locale](line);
}
