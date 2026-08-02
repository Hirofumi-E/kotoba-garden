"use client";

import { useEffect, useState } from "react";

type View =
  | "home"
  | "missions"
  | "garden"
  | "achievements"
  | "onboarding"
  | "vocabulary"
  | "grammar"
  | "review"
  | "editor";

type AppMode = "learner" | "admin";
type Locale = "ja" | "en";

type Mission = {
  title: string;
  detail: string;
  progress: number;
  target: number;
  rewardXp: number;
};

type Question = {
  type: "vocabulary" | "grammar";
  prompt: string;
  promptEn: string;
  choices: string[];
  correctAnswer: string;
  explanation: string;
};

type GardenItem = {
  type: "sprout" | "leaf" | "flower";
  label: string;
  className: string;
};

type GrowthStep = {
  label: string;
  icon: "sprout" | "leaf" | "bud" | "flower";
};

type SessionResult = {
  type: "vocabulary" | "grammar" | "review";
  correctCount: number;
  totalQuestions: number;
  earnedXp: number;
  gardenMessage: string;
  completedAt: string;
};

type SavedProgress = {
  xp: number;
  lastSessionResult?: SessionResult;
  gardenMessage?: string;
  lastStudiedAt?: string;
  streakDays?: number;
};

const baseXp = 120;
const nextLevelXp = 250;
const progressStorageKey = "kotoba-garden-progress";
const localeStorageKey = "kotoba-garden-locale";
// 正式公開時は認証と管理用の別ルート化が必要です。
const appMode: AppMode = "learner";

const uiText = {
  ja: {
    brandSubtitle: "N5の小さな庭",
    admin: "管理",
    help: "ヘルプ",
    home: "ホーム",
    vocabulary: "単語",
    grammar: "文法",
    review: "復習",
    todayGarden: "今日の庭",
    heroTitle: "若葉がひらきました。",
    heroDescription: "",
    season: "春の朝",
    tomorrowChange: "明日、花壇に変化",
    defaultGardenStatus: "若葉と花が育っています",
    studiedGardenStatus: (message: string) => message,
    defaultGardenNote: "今日も少し育てよう",
    studiedGardenNote: (earnedXp: number) => `+${earnedXp} XP`,
    growGarden: "もう少し育てる",
    growGardenHint: "",
    grammarHint: "",
    reviewHint: "",
    todayMissions: "今日のミッション",
    missions: "ミッション",
    streak: "3日連続",
    achieved: "達成",
    gardenGrowth: "庭の成長",
    garden: "庭",
    nextFlowerBed: "次は花壇",
    flowerBed: "花壇",
    path: "小道",
    achievements: "実績",
    friendSettings: "ともだち設定",
    unlocked: "開花",
    locked: "これから",
    level: "レベル2",
    xp: "経験値",
    remainingXp: (xp: number) => `あと${xp}経験値で、新しい花が咲きます`,
    intro: "はじめに",
    onboardingTitle: "毎日少しずつ、ことばの庭を育てよう。",
    onboardingDescription: "ともだちを選んで、無理のない学習時間から始めます。",
    chooseFriend: "ともだちを選ぶ",
    displayName: "表示名",
    dailyGoal: "1日の目標",
    startGarden: "庭をはじめる",
    backHome: "ホームへ戻る",
    switchLesson: "切り替え",
    vocabularySession: "ことばの芽",
    grammarSession: "文法の芽",
    reviewSession: "復習の水やり",
    question: "問題",
    checkAnswer: "回答する",
    next: "次へ",
    finishLesson: "学習を完了する",
    correct: "正解",
    almost: "おしい",
    addedToReview: "あとで復習に入ります",
    lessonCompleteEyebrow: "学習完了",
    lessonCompleteTitle: "今日の学習が終わりました",
    correctSummary: (correct: number, total: number) =>
      `${total}問中${correct}問正解しました`,
    xpGained: (xp: number) => `経験値 +${xp}`,
    oneAnswerXp: "経験値 +10",
    growthByType: {
      vocabulary: "若葉が育ちました！",
      grammar: "文法の芽が育ちました！",
      review: "芽が元気になりました！",
    },
    feedbackGrowthByType: {
      vocabulary: "ことばの芽に光が入りました",
      grammar: "文法の芽が少し伸びました",
      review: "しおれた芽に水をあげました",
    },
  },
  en: {
    brandSubtitle: "A small N5 garden",
    admin: "Admin",
    help: "Help",
    home: "Home",
    vocabulary: "Vocabulary",
    grammar: "Grammar",
    review: "Review",
    todayGarden: "Today's Garden",
    heroTitle: "New leaves opened.",
    heroDescription: "",
    season: "Spring Morning",
    tomorrowChange: "Tomorrow's garden may change",
    defaultGardenStatus: "Leaves and flowers are growing",
    studiedGardenStatus: (message: string) => message,
    defaultGardenNote: "Grow a little today",
    studiedGardenNote: (earnedXp: number) => `+${earnedXp} XP`,
    growGarden: "Keep growing",
    growGardenHint: "",
    grammarHint: "",
    reviewHint: "",
    todayMissions: "Today's Missions",
    missions: "Missions",
    streak: "3-day streak",
    achieved: "Done",
    gardenGrowth: "Garden Growth",
    garden: "Garden",
    nextFlowerBed: "Next: Flower Bed",
    flowerBed: "Flower Bed",
    path: "Path",
    achievements: "Achievements",
    friendSettings: "Friend Settings",
    unlocked: "Bloomed",
    locked: "Later",
    level: "Level 2",
    xp: "XP",
    remainingXp: (xp: number) => `${xp} XP until a new flower blooms`,
    intro: "Welcome",
    onboardingTitle: "Grow your Japanese garden a little every day.",
    onboardingDescription: "Choose a friend and start with a gentle daily goal.",
    chooseFriend: "Choose a friend",
    displayName: "Display name",
    dailyGoal: "Daily goal",
    startGarden: "Start Garden",
    backHome: "Back Home",
    switchLesson: "Switch",
    vocabularySession: "Word Sprout",
    grammarSession: "Grammar Sprout",
    reviewSession: "Review Watering",
    question: "Question",
    checkAnswer: "Check Answer",
    next: "Next",
    finishLesson: "Finish Lesson",
    correct: "Correct",
    almost: "Almost",
    addedToReview: "Added to Review",
    lessonCompleteEyebrow: "Lesson Complete",
    lessonCompleteTitle: "Lesson Complete",
    correctSummary: (correct: number, total: number) =>
      `You answered ${correct} out of ${total} correctly`,
    xpGained: (xp: number) => `XP +${xp}`,
    oneAnswerXp: "XP +10",
    growthByType: {
      vocabulary: "New leaves grew!",
      grammar: "Grammar sprouted!",
      review: "Sprouts feel fresh!",
    },
    feedbackGrowthByType: {
      vocabulary: "Light reached your word sprout",
      grammar: "Your grammar sprout grew a little",
      review: "You watered a wilted sprout",
    },
  },
};

type UiText = (typeof uiText)[Locale];

const gardenItems: GardenItem[] = [
  { type: "sprout", label: "芽", className: "sprout-a" },
  { type: "sprout", label: "芽", className: "sprout-b" },
  { type: "leaf", label: "若葉", className: "leaf-sprig-a" },
  { type: "leaf", label: "若葉", className: "leaf-sprig-b" },
  { type: "flower", label: "花", className: "flower-a" },
  { type: "flower", label: "花", className: "flower-b" },
  { type: "flower", label: "花", className: "flower-c" },
];

const growthSteps: GrowthStep[] = [
  { label: "芽", icon: "sprout" },
  { label: "若葉", icon: "leaf" },
  { label: "若葉", icon: "leaf" },
  { label: "つぼみ", icon: "bud" },
  { label: "花", icon: "flower" },
];

const missions: Mission[] = [
  {
    title: "小さな一歩",
    detail: "5問あそぶ",
    progress: 5,
    target: 5,
    rewardXp: 30,
  },
  {
    title: "ことばの芽",
    detail: "単語を3問正解",
    progress: 1,
    target: 3,
    rewardXp: 30,
  },
  {
    title: "復習の水やり",
    detail: "まちがいを1問復習",
    progress: 0,
    target: 1,
    rewardXp: 30,
  },
];

const questions: Question[] = [
  {
    type: "vocabulary",
    prompt: "たべる",
    promptEn: "What does this mean?",
    choices: ["to eat", "to sleep", "to read", "to buy"],
    correctAnswer: "to eat",
    explanation: "たべる means to eat.",
  },
  {
    type: "vocabulary",
    prompt: "みず",
    promptEn: "What does this mean?",
    choices: ["water", "fire", "book", "school"],
    correctAnswer: "water",
    explanation: "みず means water.",
  },
  {
    type: "vocabulary",
    prompt: "ほん",
    promptEn: "What does this mean?",
    choices: ["book", "tree", "rain", "friend"],
    correctAnswer: "book",
    explanation: "ほん means book.",
  },
  {
    type: "vocabulary",
    prompt: "いく",
    promptEn: "What does this mean?",
    choices: ["to go", "to eat", "to write", "to listen"],
    correctAnswer: "to go",
    explanation: "いく means to go.",
  },
  {
    type: "vocabulary",
    prompt: "やさしい",
    promptEn: "What does this mean?",
    choices: ["kind", "small", "cold", "busy"],
    correctAnswer: "kind",
    explanation: "やさしい means kind.",
  },
  {
    type: "grammar",
    prompt: "わたし ___ がくせいです。",
    promptEn: "I am a student.",
    choices: ["は", "を", "に", "で"],
    correctAnswer: "は",
    explanation: "は marks the topic of the sentence.",
  },
  {
    type: "grammar",
    prompt: "みず ___ のみます。",
    promptEn: "I drink water.",
    choices: ["を", "は", "に", "で"],
    correctAnswer: "を",
    explanation: "を marks the object of an action.",
  },
  {
    type: "grammar",
    prompt: "がっこう ___ いきます。",
    promptEn: "I go to school.",
    choices: ["に", "を", "は", "で"],
    correctAnswer: "に",
    explanation: "に can mark a destination.",
  },
  {
    type: "grammar",
    prompt: "えき ___ あいます。",
    promptEn: "I meet at the station.",
    choices: ["で", "を", "は", "に"],
    correctAnswer: "で",
    explanation: "で can mark where an action happens.",
  },
  {
    type: "grammar",
    prompt: "これは ___ です。",
    promptEn: "This is a book.",
    choices: ["ほん", "みず", "ねこ", "やま"],
    correctAnswer: "ほん",
    explanation: "これは means this. ほん means book.",
  },
];

const achievements = [
  { name: "はじめての芽", detail: "最初のクイズを完了", unlocked: true },
  { name: "3日目の朝露", detail: "3日つづけて開く", unlocked: true },
  { name: "ことば集め", detail: "単語を30問正解", unlocked: false },
  { name: "復習の花", detail: "復習で10問正解", unlocked: false },
];

function buildGardenMessage(
  type: "vocabulary" | "grammar" | "review",
  locale: Locale,
) {
  return uiText[locale].growthByType[type];
}

function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function buildSessionQuestions(
  nextView: View,
  sourceQuestions: Question[],
): Question[] {
  const source =
    nextView === "review"
      ? sourceQuestions
      : sourceQuestions.filter((question) => question.type === nextView);

  return shuffleArray(source)
    .slice(0, growthSteps.length)
    .map((question) => ({
      ...question,
      choices: shuffleArray(question.choices),
    }));
}

function isSessionType(value: unknown): value is SessionResult["type"] {
  return value === "vocabulary" || value === "grammar" || value === "review";
}

function isSessionResult(value: unknown): value is SessionResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as Record<string, unknown>;

  return (
    isSessionType(result.type) &&
    typeof result.correctCount === "number" &&
    typeof result.totalQuestions === "number" &&
    typeof result.earnedXp === "number" &&
    typeof result.gardenMessage === "string" &&
    typeof result.completedAt === "string"
  );
}

function parseSavedProgress(value: string | null): SavedProgress | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;

    if (!parsed || typeof parsed.xp !== "number") {
      return null;
    }

    return {
      xp: Math.max(baseXp, parsed.xp),
      lastSessionResult: isSessionResult(parsed.lastSessionResult)
        ? parsed.lastSessionResult
        : undefined,
      gardenMessage:
        typeof parsed.gardenMessage === "string"
          ? parsed.gardenMessage
          : undefined,
      lastStudiedAt:
        typeof parsed.lastStudiedAt === "string"
          ? parsed.lastStudiedAt
          : undefined,
      streakDays:
        typeof parsed.streakDays === "number" ? parsed.streakDays : undefined,
    };
  } catch {
    return null;
  }
}

function parseSavedLocale(value: string | null): Locale | null {
  return value === "ja" || value === "en" ? value : null;
}

function getBrowserLocale(): Locale {
  return navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en";
}

function LanguageSwitch({
  locale,
  onChangeLocale,
}: {
  locale: Locale;
  onChangeLocale: (locale: Locale) => void;
}) {
  return (
    <div
      className="admin-filters"
      style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
      aria-label="Language"
    >
      {(["ja", "en"] as Locale[]).map((nextLocale) => (
        <button
          className={locale === nextLocale ? "selected" : ""}
          key={nextLocale}
          type="button"
          style={
            locale === nextLocale
              ? {
                  background: "#e8f8e8",
                  borderColor: "#a6d19d",
                  color: "#2f5938",
                }
              : undefined
          }
          onClick={() => onChangeLocale(nextLocale)}
          aria-pressed={locale === nextLocale}
        >
          {nextLocale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function Page() {
  const [view, setView] = useState<View>("home");
  const [locale, setLocale] = useState<Locale>("ja");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [rewardPulse, setRewardPulse] = useState(false);
  const [savedXp, setSavedXp] = useState(baseXp);
  const [lastSessionResult, setLastSessionResult] =
    useState<SessionResult | null>(null);
  const [editableQuestions, setEditableQuestions] =
    useState<Question[]>(questions);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const savedLocale = parseSavedLocale(
      window.localStorage.getItem(localeStorageKey),
    );
    setLocale(savedLocale ?? getBrowserLocale());

    const savedProgress = parseSavedProgress(
      window.localStorage.getItem(progressStorageKey),
    );

    if (!savedProgress) {
      return;
    }

    setSavedXp(savedProgress.xp);

    if (savedProgress.lastSessionResult) {
      setLastSessionResult(savedProgress.lastSessionResult);
    }
  }, []);

  const t = uiText[locale];

  const canUseAdmin = appMode === "admin";
  const visibleView = !canUseAdmin && view === "editor" ? "home" : view;
  const isQuiz =
    visibleView === "vocabulary" ||
    visibleView === "grammar" ||
    visibleView === "review";
  const activeQuestion =
    sessionQuestions[currentQuestionIndex] ??
    sessionQuestions[0] ??
    editableQuestions[0];
  const totalQuestions = sessionQuestions.length || growthSteps.length;
  const isFinalQuestion = currentQuestionIndex >= totalQuestions - 1;

  function resetSession() {
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setAnsweredCount(0);
    setSessionComplete(false);
    setRewardPulse(false);
    setSessionQuestions([]);
  }

  function openQuiz(nextView: View) {
    resetSession();
    setSessionQuestions(buildSessionQuestions(nextView, editableQuestions));
    setView(nextView);
  }

  function handleSelectAnswer(answer: string) {
    if (hasSubmitted) {
      return;
    }

    setSelectedAnswer(answer);
  }

  function handleSubmitAnswer() {
    if (!selectedAnswer || hasSubmitted) {
      return;
    }

    setHasSubmitted(true);
    setAnsweredCount((count) => count + 1);

    if (selectedAnswer === activeQuestion.correctAnswer) {
      setCorrectCount((count) => count + 1);
      setRewardPulse(false);
      window.setTimeout(() => setRewardPulse(true), 20);
    }
  }

  function handlePrimaryQuizAction() {
    if (!hasSubmitted) {
      handleSubmitAnswer();
      return;
    }

    if (isFinalQuestion) {
      setSessionComplete(true);
      return;
    }

    setCurrentQuestionIndex((index) => index + 1);
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setRewardPulse(false);
  }

  function backToHome() {
    resetSession();
    setView("home");
  }

  function completeSessionAndReturnHome(result: SessionResult) {
    const nextXp = savedXp + result.earnedXp;
    const nextProgress: SavedProgress = {
      xp: nextXp,
      lastSessionResult: result,
      gardenMessage: result.gardenMessage,
      lastStudiedAt: result.completedAt,
      streakDays: 1,
    };

    window.localStorage.setItem(
      progressStorageKey,
      JSON.stringify(nextProgress),
    );
    setSavedXp(nextXp);
    setLastSessionResult(result);
    resetSession();
    setView("home");
  }

  function resetSavedProgress() {
    window.localStorage.removeItem(progressStorageKey);
    setSavedXp(baseXp);
    setLastSessionResult(null);
  }

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    window.localStorage.setItem(localeStorageKey, nextLocale);
  }

  return (
    <main className="app-shell">
      <section className="phone-frame" aria-label="ことばガーデンの画面">
        {!isQuiz && (
          <header className="top-bar">
            <button
              className="brand-button"
              type="button"
              onClick={() => setView("home")}
              aria-label={t.backHome}
            >
              <span className="brand-mark">こ</span>
              <span>
                <strong>ことばガーデン</strong>
                <small>{t.brandSubtitle}</small>
              </span>
            </button>
            <div className="top-actions">
              <LanguageSwitch
                locale={locale}
                onChangeLocale={changeLocale}
              />
              {canUseAdmin && (
                <button
                  className="admin-link"
                  type="button"
                  onClick={() => setView("editor")}
                  aria-label="教材管理を開く"
                >
                  {t.admin}
                </button>
              )}
              <button
                className="ghost-icon"
                type="button"
                onClick={() => setView("onboarding")}
                aria-label={t.help}
              >
                ?
              </button>
            </div>
          </header>
        )}

        {visibleView === "home" && (
          <HomeScreen
            onStart={() => openQuiz("vocabulary")}
            onGrammar={() => openQuiz("grammar")}
            onReview={() => openQuiz("review")}
            lastSessionResult={lastSessionResult}
            locale={locale}
            savedXp={savedXp}
            t={t}
          />
        )}

        {visibleView === "missions" && <MissionScreen t={t} />}

        {visibleView === "garden" && (
          <GardenScreen
            lastSessionResult={lastSessionResult}
            locale={locale}
            t={t}
          />
        )}

        {visibleView === "achievements" && (
          <AchievementScreen onOnboarding={() => setView("onboarding")} t={t} />
        )}

        {visibleView === "onboarding" && (
          <OnboardingScreen onComplete={() => setView("home")} t={t} />
        )}

        {isQuiz && (
          <QuizScreen
            quizView={visibleView}
            question={activeQuestion}
            selectedAnswer={selectedAnswer}
            hasSubmitted={hasSubmitted}
            rewardPulse={rewardPulse}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={totalQuestions}
            correctCount={correctCount}
            answeredCount={answeredCount}
            sessionComplete={sessionComplete}
            isFinalQuestion={isFinalQuestion}
            onSelect={handleSelectAnswer}
            onPrimaryAction={handlePrimaryQuizAction}
            onBack={backToHome}
            onCompleteSession={completeSessionAndReturnHome}
            locale={locale}
            onChangeLocale={changeLocale}
            onSwitch={() =>
              openQuiz(visibleView === "grammar" ? "vocabulary" : "grammar")
            }
            t={t}
          />
        )}

        {canUseAdmin && visibleView === "editor" && (
          <EditorScreen
            questions={editableQuestions}
            onChangeQuestions={setEditableQuestions}
            onResetProgress={resetSavedProgress}
          />
        )}

        {!isQuiz && (
          <nav className="bottom-nav" aria-label="メインナビゲーション">
            {[
              ["home", t.home],
              ["missions", t.missions],
              ["garden", t.garden],
              ["achievements", t.achievements],
            ].map(([targetView, label]) => (
              <button
                key={targetView}
                className={visibleView === targetView ? "active" : ""}
                type="button"
                onClick={() =>
                  setView(targetView as View)
                }
              >
                {label}
              </button>
            ))}
          </nav>
        )}
      </section>
    </main>
  );
}

function EditorScreen({
  questions,
  onChangeQuestions,
  onResetProgress,
}: {
  questions: Question[];
  onChangeQuestions: (questions: Question[]) => void;
  onResetProgress: () => void;
}) {
  function updateQuestion(index: number, nextQuestion: Question) {
    onChangeQuestions(
      questions.map((question, questionIndex) =>
        questionIndex === index ? nextQuestion : question,
      ),
    );
  }

  return (
    <div className="screen-content editor-screen">
      <section className="editor-hero">
        <p className="eyebrow">Hiro専用</p>
        <h1>教材管理</h1>
        <p>問題数が増えても探しやすく、直しやすい編集場所にします。</p>
        <div className="admin-summary">
          <span>全{questions.length}件</span>
          <span>単語{questions.filter((question) => question.type === "vocabulary").length}件</span>
          <span>文法{questions.filter((question) => question.type === "grammar").length}件</span>
        </div>
      </section>

      <section className="editor-panel">
        <div className="admin-toolbar">
          <input aria-label="教材検索" placeholder="問題文・正解・解説を検索" />
          <div className="admin-filters">
            <button type="button">すべて</button>
            <button type="button">単語</button>
            <button type="button">文法</button>
          </div>
        </div>

        <div className="section-heading compact-heading">
          <h2>教材一覧</h2>
          <span>最初の3件を表示中</span>
        </div>

        <div className="editor-list">
          {questions.map((question, index) => (
            <article className="editor-card" key={`${question.type}-${index}`}>
              <div className="editor-card-top">
                <strong>
                  {index + 1}.{" "}
                  {question.type === "grammar" ? "文法" : "単語"}
                </strong>
                <span>{question.type === "grammar" ? "文法" : "単語"}</span>
              </div>

              <label>
                問題文
                <input
                  value={question.prompt}
                  onChange={(event) =>
                    updateQuestion(index, {
                      ...question,
                      prompt: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                英語の補足
                <input
                  value={question.promptEn}
                  onChange={(event) =>
                    updateQuestion(index, {
                      ...question,
                      promptEn: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                選択肢
                <textarea
                  rows={3}
                  value={question.choices.join("\n")}
                  onChange={(event) =>
                    updateQuestion(index, {
                      ...question,
                      choices: event.target.value
                        .split("\n")
                        .map((choice) => choice.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>

              <label>
                正解
                <input
                  value={question.correctAnswer}
                  onChange={(event) =>
                    updateQuestion(index, {
                      ...question,
                      correctAnswer: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                解説
                <textarea
                  rows={2}
                  value={question.explanation}
                  onChange={(event) =>
                    updateQuestion(index, {
                      ...question,
                      explanation: event.target.value,
                    })
                  }
                />
              </label>
            </article>
          ))}
        </div>
      </section>

      <section className="editor-note">
        <strong>管理メモ</strong>
        <p>今は画面内の一時編集です。次は検索、下書き保存、一括追加を実装します。</p>
        <button type="button" onClick={onResetProgress}>
          進捗リセット
        </button>
      </section>
    </div>
  );
}

function HomeScreen({
  onStart,
  onGrammar,
  onReview,
  lastSessionResult,
  locale,
  savedXp,
  t,
}: {
  onStart: () => void;
  onGrammar: () => void;
  onReview: () => void;
  lastSessionResult: SessionResult | null;
  locale: Locale;
  savedXp: number;
  t: UiText;
}) {
  const displayXp = savedXp;
  const xpPercent = Math.min(100, (displayXp / nextLevelXp) * 100);
  const gardenStatus = lastSessionResult
    ? t.studiedGardenStatus(
        buildGardenMessage(lastSessionResult.type, locale),
      )
    : t.defaultGardenStatus;
  const gardenNote = lastSessionResult
    ? t.studiedGardenNote(lastSessionResult.earnedXp)
    : t.defaultGardenNote;
  const remainingXp = Math.max(0, nextLevelXp - displayXp);

  return (
    <div className="screen-content">
      <CompactLevelStatus
        displayXp={displayXp}
        remainingXp={remainingXp}
        t={t}
        xpPercent={xpPercent}
      />

      <section className="hero-garden">
        <div className="home-copy">
          <p className="eyebrow">{t.todayGarden}</p>
          <h1>{t.heroTitle}</h1>
          {t.heroDescription ? <p>{t.heroDescription}</p> : null}
        </div>

        <div className="garden-stage" aria-label="レベル2の庭">
          <div className="sun" />
          <div className="cloud cloud-a" />
          <div className="cloud cloud-b" />
          <div className="growth-ribbon">{t.season}</div>
          <div className="tomorrow-seed">{t.tomorrowChange}</div>
          <div className="garden-path" />
          <div className="character">
            <span className="ear left" />
            <span className="ear right" />
            <span className="face">•ᴗ•</span>
          </div>
          <div className="tree-growth">
            <span className="trunk" />
            <span className="leaf left" />
            <span className="leaf right" />
            <span className="leaf top" />
          </div>
          {gardenItems.map((item) => (
            <span
              aria-label={item.label}
              className={`${item.type}-item ${item.className}`}
              key={`${item.type}-${item.className}`}
              role="img"
            />
          ))}
          <div className="flower-row">
            <span className="soil-dot soil-dot-a" />
            <span className="soil-dot soil-dot-b" />
            <span className="soil-dot soil-dot-c" />
          </div>
        </div>
      </section>

      <section
        className={
          lastSessionResult ? "garden-diary just-grown" : "garden-diary"
        }
      >
        <div>
          <span>{t.todayGarden}</span>
          <strong>{gardenStatus}</strong>
        </div>
        <small>{gardenNote}</small>
      </section>

      <section className="quick-grid">
        <button className="primary-action" type="button" onClick={onStart}>
          <span>{t.growGarden}</span>
          {t.growGardenHint ? <small>{t.growGardenHint}</small> : null}
        </button>
        <button className="secondary-action" type="button" onClick={onGrammar}>
          <span>{t.grammar}</span>
          {t.grammarHint ? <small>{t.grammarHint}</small> : null}
        </button>
        <button className="review-action" type="button" onClick={onReview}>
          <span>{t.review}</span>
          {t.reviewHint ? <small>{t.reviewHint}</small> : null}
        </button>
      </section>
    </div>
  );
}

function CompactLevelStatus({
  displayXp,
  remainingXp,
  t,
  xpPercent,
}: {
  displayXp: number;
  remainingXp: number;
  t: UiText;
  xpPercent: number;
}) {
  return (
    <section className="compact-level-status">
      <div>
        <strong>{t.level}</strong>
        <span>{t.remainingXp(remainingXp)}</span>
      </div>
      <div>
        <small>
          {t.xp} {displayXp} / {nextLevelXp}
        </small>
        <div className="xp-track">
          <span style={{ width: `${xpPercent}%` }} />
        </div>
      </div>
    </section>
  );
}

function MissionScreen({ t }: { t: UiText }) {
  return (
    <div className="screen-content">
      <section className="missions-panel">
        <div className="section-heading">
          <h2>{t.todayMissions}</h2>
          <span>{t.streak}</span>
        </div>
        <div className="mission-list">
          {missions.map((mission) => (
            <article
              className={
                mission.progress >= mission.target
                  ? "mission-item complete"
                  : "mission-item"
              }
              key={mission.title}
            >
              <div>
                <strong>{mission.title}</strong>
                <small>{mission.detail}</small>
              </div>
              <span>
                {mission.progress >= mission.target
                  ? t.achieved
                  : `${mission.progress}/${mission.target}`}
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function GardenScreen({
  lastSessionResult,
  locale,
  t,
}: {
  lastSessionResult: SessionResult | null;
  locale: Locale;
  t: UiText;
}) {
  const gardenStatus = lastSessionResult
    ? t.studiedGardenStatus(
        buildGardenMessage(lastSessionResult.type, locale),
      )
    : t.defaultGardenStatus;
  const gardenNote = lastSessionResult
    ? t.studiedGardenNote(lastSessionResult.earnedXp)
    : t.defaultGardenNote;

  return (
    <div className="screen-content">
      <section
        className={
          lastSessionResult ? "garden-diary just-grown" : "garden-diary"
        }
      >
        <div>
          <span>{t.todayGarden}</span>
          <strong>{gardenStatus}</strong>
        </div>
        <small>{gardenNote}</small>
      </section>

      <section className="growth-panel">
        <div className="section-heading">
          <h2>{t.gardenGrowth}</h2>
          <span>{t.nextFlowerBed}</span>
        </div>
        <div className="growth-steps" aria-label="庭の成長段階">
          <span className="done">芽</span>
          <span className="done">若葉</span>
          <span>{t.flowerBed}</span>
          <span>{t.path}</span>
        </div>
      </section>
    </div>
  );
}

function AchievementScreen({
  onOnboarding,
  t,
}: {
  onOnboarding: () => void;
  t: UiText;
}) {
  return (
    <div className="screen-content">
      <section className="badge-strip">
        <div className="section-heading">
          <h2>{t.achievements}</h2>
          <button type="button" onClick={onOnboarding}>
            {t.friendSettings}
          </button>
        </div>
        <div className="badges">
          {achievements.map((achievement) => (
            <article
              className={achievement.unlocked ? "badge unlocked" : "badge"}
              key={achievement.name}
            >
              <span>{achievement.unlocked ? t.unlocked : t.locked}</span>
              <strong>{achievement.name}</strong>
              <small>{achievement.detail}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function OnboardingScreen({
  onComplete,
  t,
}: {
  onComplete: () => void;
  t: UiText;
}) {
  return (
    <div className="screen-content onboarding-screen">
      <section className="welcome-panel">
        <p className="eyebrow">{t.intro}</p>
        <h1>{t.onboardingTitle}</h1>
        <p>{t.onboardingDescription}</p>
      </section>

      <section className="friend-picker">
        <h2>{t.chooseFriend}</h2>
        <div className="friend-grid">
          {["うさぎ", "ねこ", "くま", "ことり"].map((friend) => (
            <button
              className={friend === "うさぎ" ? "selected" : ""}
              key={friend}
              type="button"
            >
              <span>{friend.slice(0, 1)}</span>
              {friend}
            </button>
          ))}
        </div>
      </section>

      <section className="setup-card">
        <label htmlFor="name">{t.displayName}</label>
        <input id="name" defaultValue="はな" />

        <label>{t.dailyGoal}</label>
        <div className="goal-picker">
          {["5分", "10分", "15分"].map((goal) => (
            <button
              className={goal === "5分" ? "selected" : ""}
              key={goal}
              type="button"
            >
              {goal}
            </button>
          ))}
        </div>
      </section>

      <button className="primary-action wide" type="button" onClick={onComplete}>
        {t.startGarden}
      </button>
    </div>
  );
}

function QuizScreen({
  quizView,
  question,
  selectedAnswer,
  hasSubmitted,
  rewardPulse,
  currentQuestionIndex,
  totalQuestions,
  correctCount,
  answeredCount,
  sessionComplete,
  isFinalQuestion,
  onSelect,
  onPrimaryAction,
  onBack,
  onCompleteSession,
  locale,
  onChangeLocale,
  onSwitch,
  t,
}: {
  quizView: "vocabulary" | "grammar" | "review";
  question: Question;
  selectedAnswer: string | null;
  hasSubmitted: boolean;
  rewardPulse: boolean;
  currentQuestionIndex: number;
  totalQuestions: number;
  correctCount: number;
  answeredCount: number;
  sessionComplete: boolean;
  isFinalQuestion: boolean;
  onSelect: (answer: string) => void;
  onPrimaryAction: () => void;
  onBack: () => void;
  onCompleteSession: (result: SessionResult) => void;
  locale: Locale;
  onChangeLocale: (locale: Locale) => void;
  onSwitch: () => void;
  t: UiText;
}) {
  const isCorrect = hasSubmitted && selectedAnswer === question.correctAnswer;
  const quizLabel =
    quizView === "grammar"
      ? t.grammarSession
      : quizView === "review"
        ? t.reviewSession
        : t.vocabularySession;
  const primaryActionLabel = !hasSubmitted
    ? t.checkAnswer
    : isFinalQuestion
      ? t.finishLesson
      : t.next;
  const feedbackGrowthMessage = t.feedbackGrowthByType[quizView];
  const completeGardenMessage = buildGardenMessage(quizView, locale);
  const earnedXp = correctCount * 10;

  function finishSession() {
    onCompleteSession({
      type: quizView,
      correctCount,
      totalQuestions,
      earnedXp,
      gardenMessage: completeGardenMessage,
      completedAt: new Date().toISOString(),
    });
  }

  if (sessionComplete) {
    return (
      <div className="screen-content quiz-screen complete-screen">
        <section className="session-complete-card">
          <p className="eyebrow">{t.lessonCompleteEyebrow}</p>
          <h1>{t.lessonCompleteTitle}</h1>
          <p>
            {t.correctSummary(correctCount, totalQuestions)}
          </p>
          <div className="complete-garden" aria-hidden="true">
            <span className="growth-icon flower" />
          </div>
          <strong>{completeGardenMessage}</strong>
          <small>{t.xpGained(earnedXp)}</small>
          <button className="next-action" type="button" onClick={finishSession}>
            {t.backHome}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="screen-content quiz-screen">
      <section className="learning-header">
        <button type="button" onClick={onBack}>
          {t.backHome}
        </button>
        <div>
          <p>{quizLabel}</p>
          <strong>
            {t.question} {currentQuestionIndex + 1} / {totalQuestions}
          </strong>
        </div>
        <LanguageSwitch locale={locale} onChangeLocale={onChangeLocale} />
        <button type="button" onClick={onSwitch}>
          {t.switchLesson}
        </button>
      </section>

      <div className="quiz-progress">
        <span style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }} />
      </div>

      <section className="learning-growth" aria-label="植物の成長進捗">
        {growthSteps.map((step, index) => {
          const status =
            index < currentQuestionIndex
              ? "done"
              : index === currentQuestionIndex
                ? "current"
                : "upcoming";

          return (
            <span className={`growth-step ${status}`} key={`${step.icon}-${index}`}>
              <i className={`growth-icon ${step.icon}`} aria-hidden="true" />
              <small>{step.label}</small>
            </span>
          );
        })}
      </section>

      <section className="question-card">
        {rewardPulse && <span className="xp-pop">{t.oneAnswerXp}</span>}
        <p className="prompt">{question.prompt}</p>
        <p>{question.promptEn}</p>
      </section>

      <section className="choice-list" aria-label="答えの選択肢">
        {question.choices.map((choice) => {
          const className =
            hasSubmitted && choice === question.correctAnswer
              ? "choice correct"
              : hasSubmitted && choice === selectedAnswer
                ? "choice wrong"
                : selectedAnswer === choice
                  ? "choice selected"
                  : hasSubmitted
                    ? "choice muted"
                    : "choice";

          return (
            <button
              className={className}
              disabled={hasSubmitted}
              key={choice}
              type="button"
              onClick={() => onSelect(choice)}
            >
              {choice}
            </button>
          );
        })}
      </section>

      {hasSubmitted && (
        <section className={isCorrect ? "feedback good" : "feedback soft"}>
          <strong>{isCorrect ? t.correct : t.almost}</strong>
          <p>{question.explanation}</p>
          {isCorrect && <p className="growth-message">{feedbackGrowthMessage}</p>}
          <small>
            {isCorrect ? t.oneAnswerXp : t.addedToReview}
          </small>
        </section>
      )}

      <div className="quiz-actions">
        <button
          className={hasSubmitted ? "next-action" : "answer-action"}
          disabled={!selectedAnswer}
          type="button"
          onClick={onPrimaryAction}
        >
          {primaryActionLabel}
        </button>
      </div>
    </div>
  );
}
