"use client";

import { useEffect, useMemo, useState } from "react";

type View =
  | "home"
  | "onboarding"
  | "vocabulary"
  | "grammar"
  | "review"
  | "editor";

type AppMode = "learner" | "admin";

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
// 正式公開時は認証と管理用の別ルート化が必要です。
const appMode: AppMode = "learner";

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

function buildGardenMessage(type: "vocabulary" | "grammar" | "review") {
  if (type === "grammar") {
    return "文の土台が少し育ちました";
  }

  if (type === "review") {
    return "復習の水で芽が元気になりました";
  }

  return "若葉が少し育ちました";
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
export default function Page() {
  const [view, setView] = useState<View>("home");
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

  useEffect(() => {
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

  const canUseAdmin = appMode === "admin";
  const visibleView = !canUseAdmin && view === "editor" ? "home" : view;
  const isQuiz =
    visibleView === "vocabulary" ||
    visibleView === "grammar" ||
    visibleView === "review";
  const sessionQuestions = useMemo(() => {
    const source =
      visibleView === "review"
        ? editableQuestions
        : editableQuestions.filter((question) => question.type === visibleView);

    return source.slice(0, growthSteps.length);
  }, [editableQuestions, visibleView]);
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
  }

  function openQuiz(nextView: View) {
    resetSession();
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

  return (
    <main className="app-shell">
      <section className="phone-frame" aria-label="ことばガーデンの画面">
        {!isQuiz && (
          <header className="top-bar">
            <button
              className="brand-button"
              type="button"
              onClick={() => setView("home")}
              aria-label="ホームへ戻る"
            >
              <span className="brand-mark">こ</span>
              <span>
                <strong>ことばガーデン</strong>
                <small>N5の小さな庭</small>
              </span>
            </button>
            <div className="top-actions">
              {canUseAdmin && (
                <button
                  className="admin-link"
                  type="button"
                  onClick={() => setView("editor")}
                  aria-label="教材管理を開く"
                >
                  管理
                </button>
              )}
              <button
                className="ghost-icon"
                type="button"
                onClick={() => setView("onboarding")}
                aria-label="ヘルプを開く"
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
            onOnboarding={() => setView("onboarding")}
            lastSessionResult={lastSessionResult}
            savedXp={savedXp}
          />
        )}

        {visibleView === "onboarding" && (
          <OnboardingScreen onComplete={() => setView("home")} />
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
            onSwitch={() =>
              openQuiz(visibleView === "grammar" ? "vocabulary" : "grammar")
            }
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
              ["home", "ホーム"],
              ["vocabulary", "単語"],
              ["grammar", "文法"],
              ["review", "復習"],
            ].map(([targetView, label]) => (
              <button
                key={targetView}
                className={visibleView === targetView ? "active" : ""}
                type="button"
                onClick={() =>
                  targetView === "vocabulary" || targetView === "grammar"
                    ? openQuiz(targetView as View)
                    : targetView === "review"
                      ? openQuiz("review")
                      : setView(targetView as View)
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
  onOnboarding,
  lastSessionResult,
  savedXp,
}: {
  onStart: () => void;
  onGrammar: () => void;
  onReview: () => void;
  onOnboarding: () => void;
  lastSessionResult: SessionResult | null;
  savedXp: number;
}) {
  const displayXp = savedXp;
  const xpPercent = Math.min(100, (displayXp / nextLevelXp) * 100);
  const gardenStatus = lastSessionResult
    ? `今の学習で、${lastSessionResult.gardenMessage}`
    : "若葉が2枚、花が1つ増えました";
  const gardenNote = lastSessionResult
    ? `経験値 +${lastSessionResult.earnedXp} が庭に届きました`
    : "あと1問で、明日の庭が少し変わります";
  const remainingXp = Math.max(0, nextLevelXp - displayXp);

  return (
    <div className="screen-content">
      <section className="hero-garden">
        <div className="home-copy">
          <p className="eyebrow">今日の庭</p>
          <h1>朝つゆで、若葉がひらきました。</h1>
          <p>あと1問だけ遊ぶと、明日の花壇に小さな色が増えます。</p>
        </div>

        <div className="garden-stage" aria-label="レベル2の庭">
          <div className="sun" />
          <div className="cloud cloud-a" />
          <div className="cloud cloud-b" />
          <div className="growth-ribbon">春の朝</div>
          <div className="tomorrow-seed">明日、花壇に変化</div>
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
          <span>今日の庭</span>
          <strong>{gardenStatus}</strong>
        </div>
        <small>{gardenNote}</small>
      </section>

      <section className="quick-grid">
        <button className="primary-action" type="button" onClick={onStart}>
          <span>庭をもう少し育てる</span>
          <small>あと少しで若葉が育ちます</small>
        </button>
        <button className="secondary-action" type="button" onClick={onGrammar}>
          <span>文法</span>
          <small>芽を育てる</small>
        </button>
        <button className="review-action" type="button" onClick={onReview}>
          <span>復習</span>
          <small>水やりだけして戻る</small>
        </button>
      </section>

      <section className="missions-panel">
        <div className="section-heading">
          <h2>今日のミッション</h2>
          <span>3日連続</span>
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
                  ? "達成"
                  : `${mission.progress}/${mission.target}`}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="growth-panel">
        <div className="section-heading">
          <h2>庭の成長</h2>
          <span>次は花壇</span>
        </div>
        <div className="growth-steps" aria-label="庭の成長段階">
          <span className="done">芽</span>
          <span className="done">若葉</span>
          <span>花壇</span>
          <span>小道</span>
        </div>
      </section>

      <section className="badge-strip">
        <div className="section-heading">
          <h2>実績</h2>
          <button type="button" onClick={onOnboarding}>
            ともだち設定
          </button>
        </div>
        <div className="badges">
          {achievements.map((achievement) => (
            <article
              className={achievement.unlocked ? "badge unlocked" : "badge"}
              key={achievement.name}
            >
              <span>{achievement.unlocked ? "開花" : "これから"}</span>
              <strong>{achievement.name}</strong>
              <small>{achievement.detail}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="level-card">
        <div>
          <span>レベル2</span>
          <strong>
            経験値 {displayXp} / {nextLevelXp}
          </strong>
        </div>
        <div className="xp-track">
          <span style={{ width: `${xpPercent}%` }} />
        </div>
        <small>あと{remainingXp}経験値で、新しい花が咲きます</small>
      </section>
    </div>
  );
}

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="screen-content onboarding-screen">
      <section className="welcome-panel">
        <p className="eyebrow">はじめに</p>
        <h1>毎日少しずつ、ことばの庭を育てよう。</h1>
        <p>ともだちを選んで、無理のない学習時間から始めます。</p>
      </section>

      <section className="friend-picker">
        <h2>ともだちを選ぶ</h2>
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
        <label htmlFor="name">表示名</label>
        <input id="name" defaultValue="はな" />

        <label>1日の目標</label>
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
        庭をはじめる
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
  onSwitch,
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
  onSwitch: () => void;
}) {
  const isCorrect = hasSubmitted && selectedAnswer === question.correctAnswer;
  const quizLabel =
    quizView === "grammar"
      ? "文法の芽"
      : quizView === "review"
        ? "復習の水やり"
        : "ことばの芽";
  const primaryActionLabel = !hasSubmitted
    ? "回答する"
    : isFinalQuestion
      ? "学習を完了する"
      : "次へ";
  const feedbackGrowthMessage =
    quizView === "grammar"
      ? "文法の芽が少し伸びました"
      : quizView === "review"
        ? "しおれた芽に水をあげました"
        : "ことばの芽に光が入りました";
  const completeGardenMessage = buildGardenMessage(quizView);
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
          <p className="eyebrow">学習完了</p>
          <h1>今日の学習が終わりました</h1>
          <p>
            {totalQuestions}問中{correctCount}問正解しました
          </p>
          <div className="complete-garden" aria-hidden="true">
            <span className="growth-icon flower" />
          </div>
          <strong>{completeGardenMessage}</strong>
          <small>経験値 +{earnedXp}</small>
          <button className="next-action" type="button" onClick={finishSession}>
            ホームへ戻る
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="screen-content quiz-screen">
      <section className="learning-header">
        <button type="button" onClick={onBack}>
          ホームへ戻る
        </button>
        <div>
          <p>{quizLabel}</p>
          <strong>
            {currentQuestionIndex + 1} / {totalQuestions}
          </strong>
        </div>
        <button type="button" onClick={onSwitch}>
          切り替え
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
        {rewardPulse && <span className="xp-pop">経験値 +10</span>}
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
          <strong>{isCorrect ? "正解" : "おしい"}</strong>
          <p>{question.explanation}</p>
          {isCorrect && <p className="growth-message">{feedbackGrowthMessage}</p>}
          <small>
            {isCorrect ? "経験値 +10" : "あとで復習に入ります"}
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
