"use client";

import { useMemo, useState } from "react";

type View = "home" | "onboarding" | "vocabulary" | "grammar";

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

const missions: Mission[] = [
  {
    title: "Tiny Steps",
    detail: "Play 5 questions",
    progress: 0,
    target: 5,
    rewardXp: 30,
  },
  {
    title: "Word Sprout",
    detail: "Answer 3 words",
    progress: 1,
    target: 3,
    rewardXp: 30,
  },
  {
    title: "Little Review",
    detail: "Review 1 mistake",
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
    type: "grammar",
    prompt: "わたし ___ がくせいです。",
    promptEn: "I am a student.",
    choices: ["は", "を", "に", "で"],
    correctAnswer: "は",
    explanation: "は marks the topic of the sentence.",
  },
];

const achievements = [
  { name: "First Sprout", detail: "Finish your first quiz", unlocked: true },
  { name: "Tiny Streak", detail: "Come back 3 days", unlocked: true },
  { name: "Word Collector", detail: "Answer 30 words", unlocked: false },
  { name: "Comeback Bloom", detail: "Review 10 mistakes", unlocked: false },
];

export default function Page() {
  const [view, setView] = useState<View>("home");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const activeQuestion = useMemo(() => {
    return view === "grammar" ? questions[2] : questions[0];
  }, [view]);

  const isQuiz = view === "vocabulary" || view === "grammar";

  function openQuiz(nextView: View) {
    setSelectedAnswer(null);
    setView(nextView);
  }

  return (
    <main className="app-shell">
      <section className="phone-frame" aria-label="Kotoba Garden app preview">
        <header className="top-bar">
          <button
            className="brand-button"
            type="button"
            onClick={() => setView("home")}
            aria-label="Go home"
          >
            <span className="brand-mark">こ</span>
            <span>
              <strong>Kotoba Garden</strong>
              <small>JLPT N5 mini game</small>
            </span>
          </button>
          <button
            className="ghost-icon"
            type="button"
            onClick={() => setView("onboarding")}
            aria-label="Open onboarding"
          >
            ?
          </button>
        </header>

        {view === "home" && (
          <HomeScreen
            onStart={() => openQuiz("vocabulary")}
            onGrammar={() => openQuiz("grammar")}
            onOnboarding={() => setView("onboarding")}
          />
        )}

        {view === "onboarding" && (
          <OnboardingScreen onComplete={() => setView("home")} />
        )}

        {isQuiz && (
          <QuizScreen
            question={activeQuestion}
            selectedAnswer={selectedAnswer}
            onSelect={setSelectedAnswer}
            onBack={() => setView("home")}
            onSwitch={() =>
              openQuiz(view === "vocabulary" ? "grammar" : "vocabulary")
            }
          />
        )}

        <nav className="bottom-nav" aria-label="Primary navigation">
          {[
            ["home", "Home"],
            ["vocabulary", "Words"],
            ["grammar", "Grammar"],
            ["onboarding", "Start"],
          ].map(([targetView, label]) => (
            <button
              key={targetView}
              className={view === targetView ? "active" : ""}
              type="button"
              onClick={() => openQuiz(targetView as View)}
            >
              {label}
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}

function HomeScreen({
  onStart,
  onGrammar,
  onOnboarding,
}: {
  onStart: () => void;
  onGrammar: () => void;
  onOnboarding: () => void;
}) {
  return (
    <div className="screen-content">
      <section className="hero-garden">
        <div className="home-copy">
          <p className="eyebrow">Good evening, Hana</p>
          <h1>Your garden is waiting.</h1>
          <p>Play five tiny questions and grow Japanese little by little.</p>
        </div>

        <div className="garden-stage" aria-label="Level 2 garden">
          <div className="sun" />
          <div className="cloud cloud-a" />
          <div className="cloud cloud-b" />
          <div className="character">
            <span className="ear left" />
            <span className="ear right" />
            <span className="face">•ᴗ•</span>
          </div>
          <div className="flower-row">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section className="level-card">
        <div>
          <span>Lv.2</span>
          <strong>120 / 250 XP</strong>
        </div>
        <div className="xp-track">
          <span />
        </div>
        <small>130 XP to a new flower</small>
      </section>

      <section className="quick-grid">
        <button className="primary-action" type="button" onClick={onStart}>
          <span>Play Today</span>
          <small>Words first</small>
        </button>
        <button className="secondary-action" type="button" onClick={onGrammar}>
          <span>Grammar</span>
          <small>2 min round</small>
        </button>
      </section>

      <section className="missions-panel">
        <div className="section-heading">
          <h2>Today's Missions</h2>
          <span>3 day streak</span>
        </div>
        <div className="mission-list">
          {missions.map((mission) => (
            <article className="mission-item" key={mission.title}>
              <div>
                <strong>{mission.title}</strong>
                <small>{mission.detail}</small>
              </div>
              <span>
                {mission.progress}/{mission.target}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="badge-strip">
        <div className="section-heading">
          <h2>Badges</h2>
          <button type="button" onClick={onOnboarding}>
            Edit friend
          </button>
        </div>
        <div className="badges">
          {achievements.map((achievement) => (
            <article
              className={achievement.unlocked ? "badge unlocked" : "badge"}
              key={achievement.name}
            >
              <span>{achievement.unlocked ? "Bloom" : "Locked"}</span>
              <strong>{achievement.name}</strong>
              <small>{achievement.detail}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="screen-content onboarding-screen">
      <section className="welcome-panel">
        <p className="eyebrow">Welcome</p>
        <h1>Grow Japanese little by little.</h1>
        <p>
          Choose a friend, set a tiny goal, and visit your garden every day.
        </p>
      </section>

      <section className="friend-picker">
        <h2>Choose your friend</h2>
        <div className="friend-grid">
          {["Rabbit", "Cat", "Bear", "Bird"].map((friend) => (
            <button
              className={friend === "Rabbit" ? "selected" : ""}
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
        <label htmlFor="name">What should we call you?</label>
        <input id="name" defaultValue="Hana" />

        <label>Daily goal</label>
        <div className="goal-picker">
          {["5 min", "10 min", "15 min"].map((goal) => (
            <button
              className={goal === "5 min" ? "selected" : ""}
              key={goal}
              type="button"
            >
              {goal}
            </button>
          ))}
        </div>
      </section>

      <button className="primary-action wide" type="button" onClick={onComplete}>
        Enter Garden
      </button>
    </div>
  );
}

function QuizScreen({
  question,
  selectedAnswer,
  onSelect,
  onBack,
  onSwitch,
}: {
  question: Question;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  onBack: () => void;
  onSwitch: () => void;
}) {
  const answered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="screen-content quiz-screen">
      <section className="quiz-top">
        <div>
          <p className="eyebrow">
            {question.type === "grammar" ? "Grammar Bud" : "Word Sprout"}
          </p>
          <h1>Question 1 / 5</h1>
        </div>
        <button type="button" onClick={onSwitch}>
          Switch
        </button>
      </section>

      <div className="quiz-progress">
        <span />
      </div>

      <section className="question-card">
        <p className="prompt">{question.prompt}</p>
        <p>{question.promptEn}</p>
      </section>

      <section className="choice-list" aria-label="Answer choices">
        {question.choices.map((choice) => {
          const className =
            answered && choice === question.correctAnswer
              ? "choice correct"
              : answered && choice === selectedAnswer
                ? "choice wrong"
                : "choice";

          return (
            <button
              className={className}
              disabled={answered}
              key={choice}
              type="button"
              onClick={() => onSelect(choice)}
            >
              {choice}
            </button>
          );
        })}
      </section>

      {answered && (
        <section className={isCorrect ? "feedback good" : "feedback soft"}>
          <strong>{isCorrect ? "Nice!" : "Almost!"}</strong>
          <p>{question.explanation}</p>
          <small>
            {isCorrect ? "+10 XP" : "We'll review this later."}
          </small>
        </section>
      )}

      <div className="quiz-actions">
        <button className="secondary-action" type="button" onClick={onBack}>
          Back Home
        </button>
        <button
          className="primary-action"
          disabled={!answered}
          type="button"
          onClick={onBack}
        >
          Finish Round
        </button>
      </div>
    </div>
  );
}
