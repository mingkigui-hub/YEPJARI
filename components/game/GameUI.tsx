"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Coffee,
  Compass,
  Flag,
  Heart,
  HelpCircle,
  Leaf,
  Map,
  Maximize2,
  MessageCircle,
  Mouse,
  RotateCcw,
  Settings2,
  Sparkles,
  Sun,
  UserRound,
  VolumeX,
  X,
} from "lucide-react";
import {
  ZONE_NAMES,
  type Interaction,
  type PlayerSnapshot,
  type Zone,
} from "@/lib/world";

type Props = {
  nickname: string;
  zone: Zone;
  position: PlayerSnapshot;
  nearby: Interaction | null;
  seated: boolean;
  visited: string[];
  onInteract: () => void;
  onReset: () => void;
  onNickname: (name: string) => void;
  onPause: (paused: boolean) => void;
  onCloseBoard: () => void;
  boardOpen: boolean;
};
type Panel = "map" | "help" | "settings" | "profile" | null;
type Note = { id: string; author: string; text: string; tag: string };
const NOTE_KEY = "yepjari.notes.v1";
const SEED_NOTES: Note[] = [
  {
    id: "welcome",
    author: "마을 안내소",
    text: "옆자리에 오신 걸 환영해요. 서두르지 말고, 마음이 가는 곳으로 걸어보세요.",
    tag: "마을 소식",
  },
  {
    id: "coffee",
    author: "카페, 오후",
    text: "오늘의 추천은 따뜻한 라떼. 분수 왼쪽의 줄무늬 차양 아래에서 만나요.",
    tag: "작은 발견",
  },
  {
    id: "garden",
    author: "산책 기록",
    text: "광장 뒤 아치문을 지나면 바람의 정원이 있어요. 벤치에서 잠깐 쉬어가요.",
    tag: "산책 메모",
  },
];

function VillageMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M6 24v-9l9-7 9 7v9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18 30V20l9-7 8 7v10H18Z" fill="currentColor" />
      <path d="M24 30v-7h5v7" stroke="#fffdf5" strokeWidth="2" />
      <path
        d="M5 30h7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MiniMap({
  position,
  zone,
  large = false,
}: {
  position: PlayerSnapshot;
  zone: Zone;
  large?: boolean;
}) {
  const x = 50 + position.x * (zone === "plaza" ? 2.1 : 4);
  const z = 50 + position.z * (zone === "plaza" ? 2.1 : 4);
  return (
    <div
      className={`mini-map ${large ? "mini-map-large" : ""}`}
      aria-label={`현재 위치: ${ZONE_NAMES[zone]}`}
    >
      <svg viewBox="0 0 100 100" role="img" aria-label="마을 약도">
        <defs>
          <pattern
            id={large ? "map-dots-large" : "map-dots"}
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r=".3" fill="#abb59c" />
          </pattern>
        </defs>
        <rect width="100" height="100" rx="14" fill="#e9eddb" />
        <rect
          width="100"
          height="100"
          fill={`url(#${large ? "map-dots-large" : "map-dots"})`}
        />
        {zone === "plaza" ? (
          <>
            <path d="M50 5v90M5 52h90" stroke="#f8f4df" strokeWidth="13" />
            <circle cx="50" cy="50" r="22" fill="#f8f4df" />
            <rect x="22" y="29" width="17" height="14" rx="2" fill="#8d9c7c" />
            <path d="m20 30 11-9 11 9" fill="#667d61" />
            <rect x="61" y="23" width="15" height="13" rx="2" fill="#d4b399" />
            <path d="m59 24 9-7 10 7" fill="#b7866d" />
            <circle
              cx="50"
              cy="50"
              r="7"
              fill="#a2c1bf"
              stroke="#d0c6ad"
              strokeWidth="2"
            />
            <rect x="34" y="54" width="7" height="3" rx="1" fill="#9a8062" />
            <rect x="63" y="54" width="7" height="4" rx="1" fill="#9a8062" />
            <path
              d="M46 16v-5h8v5"
              stroke="#9a8062"
              strokeWidth="2"
              fill="none"
            />
            {[
              [17, 21],
              [17, 60],
              [14, 80],
              [82, 18],
              [85, 46],
              [81, 77],
              [36, 11],
              [68, 87],
            ].map(([cx, cy], i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r="5"
                fill={i % 2 ? "#97ad83" : "#b2c299"}
              />
            ))}
          </>
        ) : zone === "cafe" ? (
          <>
            <rect
              x="19"
              y="17"
              width="62"
              height="65"
              rx="3"
              fill="#e0c9a9"
              stroke="#a48565"
              strokeWidth="2"
            />
            <rect x="23" y="23" width="54" height="8" fill="#987d62" />
            <circle cx="34" cy="49" r="8" fill="#f5ebd8" />
            <circle cx="67" cy="49" r="8" fill="#f5ebd8" />
            <path d="M44 82h12" stroke="#f7f3e5" strokeWidth="4" />
          </>
        ) : (
          <>
            <path
              d="M50 95V65Q15 50 45 30T50 5"
              stroke="#f8f4df"
              strokeWidth="12"
              fill="none"
            />
            <ellipse cx="50" cy="46" rx="15" ry="11" fill="#a2c1bf" />
            <circle cx="22" cy="24" r="10" fill="#9eb28c" />
            <circle cx="78" cy="34" r="8" fill="#a9bb96" />
            <circle cx="79" cy="73" r="9" fill="#93aa82" />
          </>
        )}
        <g
          transform={`translate(${Math.max(8, Math.min(92, x))} ${Math.max(8, Math.min(92, z))}) rotate(${(position.rotation * 180) / Math.PI})`}
        >
          <circle r="6.2" fill="#fffdf5" />
          <circle r="3.7" fill="#ce7957" />
          <path d="m0 8-2.5-3h5Z" fill="#ce7957" />
        </g>
      </svg>
      <span className="map-north">
        N <span>↑</span>
      </span>
    </div>
  );
}

function Modal({
  title,
  eyebrow,
  onClose,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const modal = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = modal.current;
    element
      ?.querySelector<HTMLElement>('button, input, textarea, [tabindex="0"]')
      ?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !element) return;
      const nodes = element.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, textarea, [tabindex="0"]',
      );
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modal}
        className={`village-modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal-header">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          <button
            className="icon-button close-button"
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export default function GameUI({
  nickname,
  zone,
  position,
  nearby,
  seated,
  visited,
  onInteract,
  onReset,
  onNickname,
  onPause,
  onCloseBoard,
  boardOpen,
}: Props) {
  const [panel, setPanel] = useState<Panel>(null);
  const [draftName, setDraftName] = useState(nickname);
  const [notes, setNotes] = useState<Note[]>(SEED_NOTES);
  const [draftNote, setDraftNote] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const [clock, setClock] = useState("14:30");
  const [compactHelp, setCompactHelp] = useState(true);
  const isPaused = !!panel || boardOpen;
  useEffect(() => {
    onPause(isPaused);
  }, [isPaused, onPause]);
  useEffect(() => {
    const update = () =>
      setClock(
        new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(NOTE_KEY) || "[]");
      if (Array.isArray(saved)) {
        const valid = saved
          .filter(
            (n): n is Note =>
              n &&
              typeof n === "object" &&
              typeof n.id === "string" &&
              typeof n.author === "string" &&
              typeof n.text === "string" &&
              typeof n.tag === "string",
          )
          .slice(0, 30);
        setNotes([...SEED_NOTES, ...valid]);
      }
    } catch {
      setNoteMessage("이 기기에서 이전 메모를 불러오지 못했어요.");
    }
  }, []);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanel(null);
        if (boardOpen) onCloseBoard();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [boardOpen, onCloseBoard]);
  const closePanel = () => setPanel(null);
  const openPanel = (next: Panel) => {
    if (boardOpen) onCloseBoard();
    setPanel(next);
    if (next === "profile") setDraftName(nickname);
  };
  const postNote = (event: FormEvent) => {
    event.preventDefault();
    const text = draftNote.trim();
    if (!text) return;
    const note: Note = {
      id: `note-${Date.now()}`,
      author: nickname,
      text: text.slice(0, 160),
      tag: "나의 메모",
    };
    const mine = [
      ...notes.filter((n) => !SEED_NOTES.some((s) => s.id === n.id)),
      note,
    ].slice(-30);
    try {
      localStorage.setItem(NOTE_KEY, JSON.stringify(mine));
      setNotes([...SEED_NOTES, ...mine]);
      setDraftNote("");
      setNoteMessage("이 기기에 메모를 남겼어요.");
    } catch {
      setNoteMessage(
        "저장 공간을 사용할 수 없어요. 메모를 복사해서 보관해주세요.",
      );
    }
  };
  const completed = [
    visited.includes("bench"),
    visited.includes("board"),
    visited.includes("cafe") || visited.includes("gate"),
  ];
  return (
    <div className="game-hud">
      <header className="hud-header">
        <div className="brand">
          <span className="brand-mark">
            <VillageMark />
          </span>
          <div>
            <span className="brand-name">
              옆자리<span className="brand-dot">.</span>
            </span>
            <span className="brand-caption">YEPJARI · A LITTLE CLOSER</span>
          </div>
        </div>
        <div className="location-pill">
          <span className="location-dot" />
          <span>{ZONE_NAMES[zone]}</span>
          <span className="location-divider" />
          <span className="location-en">
            {zone === "plaza"
              ? "TOWN SQUARE"
              : zone === "cafe"
                ? "CAFÉ, AFTERNOON"
                : "WIND GARDEN"}
          </span>
        </div>
        <div className="header-right">
          <div className="weather-badge">
            <Sun size={19} />
            <span>맑은 오후</span>
            <span className="weather-time">{clock}</span>
          </div>
          <button
            className="profile-button"
            onClick={() => openPanel("profile")}
            aria-label="가명 바꾸기"
          >
            <span className="profile-avatar">
              <UserRound size={19} />
            </span>
            <span>{nickname}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </header>
      <div className="welcome-note">
        <span className="tiny-eyebrow">
          <Leaf size={12} /> 오늘도, 반가워요
        </span>
        <h1>
          조금 느리게,
          <br />
          조금 더 가까이.
        </h1>
        <p>발길이 닿는 곳에서 이야기가 시작돼요.</p>
      </div>
      <nav className="hud-tools" aria-label="마을 도구">
        <button
          className="tool-button"
          onClick={() => openPanel("map")}
          aria-label="마을 지도"
        >
          <Map size={21} />
          <span>지도</span>
        </button>
        <button
          className="tool-button"
          onClick={() => openPanel("help")}
          aria-label="조작 방법"
        >
          <HelpCircle size={21} />
          <span>도움말</span>
        </button>
        <span className="tool-divider" />
        <button
          className="tool-button"
          onClick={() => openPanel("settings")}
          aria-label="설정"
        >
          <Settings2 size={21} />
          <span>설정</span>
        </button>
      </nav>
      <aside className="map-card">
        <div className="map-card-title">
          <span>
            <Compass size={14} /> 작은 마을 지도
          </span>
          <button onClick={() => openPanel("map")} aria-label="지도 크게 보기">
            <Maximize2 size={13} />
          </button>
        </div>
        <MiniMap position={position} zone={zone} />
        <div className="map-card-caption">
          <span className="your-dot" />
          지금, 내가 있는 곳<span>산책 중</span>
        </div>
      </aside>
      <div className="singleplayer-tag">
        <span />
        혼자 즐기는 첫 번째 산책<span className="alpha-badge">PREVIEW</span>
      </div>
      <aside className="discovery-card">
        <div className="discovery-heading">
          <span className="discovery-icon">
            <Flag size={17} />
          </span>
          <div>
            <span className="tiny-eyebrow">MY LITTLE WALK</span>
            <h2>우리 마을과 친해지기</h2>
          </div>
          <span className="discovery-count">
            {completed.filter(Boolean).length}
            <span>/ 3</span>
          </span>
        </div>
        <div className="discovery-tasks">
          {["벤치에서 쉬어가기", "게시판 들여다보기", "새로운 공간 만나기"].map(
            (text, i) => (
              <div key={text} className={completed[i] ? "task-done" : ""}>
                <span className="task-check">
                  {completed[i] && <Check size={10} />}
                </span>
                {text}
              </div>
            ),
          )}
        </div>
      </aside>
      {(nearby || seated) && !isPaused ? (
        <div className="interaction-prompt" data-testid="interaction-prompt">
          <span className="interaction-hint">
            {seated ? "바람을 느끼며 쉬고 있어요." : nearby?.hint}
          </span>
          <button
            data-testid="interaction-button"
            className="interact-button"
            onClick={onInteract}
          >
            <kbd>E</kbd>
            <span>{seated ? "자리에서 일어나기" : nearby?.label}</span>
            <ArrowUpRight size={18} />
          </button>
        </div>
      ) : (
        !isPaused && (
          <div className="walk-caption">
            <span className="caption-line" />
            느리게 걸어도 괜찮아
            <span className="caption-line" />
          </div>
        )
      )}
      <footer className="hud-footer">
        <div className="footer-note">
          <span className="status-dot" />
          <span>당신의 속도로, 당신의 옆자리</span>
        </div>
        {compactHelp && (
          <div className="keyboard-guide">
            <span className="key-group">
              <kbd>W</kbd>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd>
            </span>
            <span>이동</span>
            <span className="guide-separator" />
            <Mouse size={15} />
            <span>드래그로 둘러보기</span>
            <span className="guide-separator" />
            <kbd>E</kbd>
            <span>상호작용</span>
          </div>
        )}
        <button className="help-small" onClick={() => openPanel("help")}>
          <HelpCircle size={14} />
          <span>산책 가이드</span>
        </button>
      </footer>
      {panel === "map" && (
        <Modal
          title="우리 마을 지도"
          eyebrow="TAKE A LITTLE WALK"
          onClose={closePanel}
          className="map-modal"
        >
          <p className="modal-intro">오늘은 어디에 머물러 볼까요?</p>
          <MiniMap position={position} zone={zone} large />
          <div className="map-legend">
            <span>
              <Coffee size={16} />
              카페, 오후
            </span>
            <span>
              <MessageCircle size={16} />
              마을 게시판
            </span>
            <span>
              <Leaf size={16} />
              바람의 정원
            </span>
          </div>
          <p className="soft-note">
            지도는 현재 위치를 보여줘요. 직접 걸어서 장소를 발견해보세요.
          </p>
        </Modal>
      )}
      {panel === "help" && (
        <Modal
          title="첫 번째 산책 안내서"
          eyebrow="MAKE YOURSELF AT HOME"
          onClose={closePanel}
        >
          <p className="modal-intro">
            잘해야 하는 일은 없어요. 마음 가는 대로 걸어보세요.
          </p>
          <div className="guide-list">
            <div>
              <span className="guide-symbol">
                <ArrowUp size={18} />
              </span>
              <div>
                <h3>천천히 걸어보기</h3>
                <p>
                  WASD 또는 방향키로 이동해요.
                  <br />
                  모바일에서는 왼쪽 아래 조이스틱을 밀어주세요.
                </p>
              </div>
            </div>
            <div>
              <span className="guide-symbol">
                <Mouse size={18} />
              </span>
              <div>
                <h3>다른 방향으로 바라보기</h3>
                <p>
                  화면을 드래그하면 시점이 돌아가요.
                  <br />
                  마우스 휠로 가까이, 멀리 볼 수도 있어요.
                </p>
              </div>
            </div>
            <div>
              <span className="guide-symbol">
                <Sparkles size={18} />
              </span>
              <div>
                <h3>마을과 이야기하기</h3>
                <p>
                  벤치, 카페, 게시판, 아치문에 다가가세요.
                  <br />E 키 또는 나타나는 버튼으로 상호작용해요.
                </p>
              </div>
            </div>
          </div>
          <div className="modal-callout">
            <Heart size={16} />
            <span>
              지금은 혼자 탐험하는 마을이에요. 이웃과 만나는 날도 준비하고
              있어요.
            </span>
          </div>
        </Modal>
      )}
      {panel === "settings" && (
        <Modal
          title="편안한 산책을 위해"
          eyebrow="YOUR LITTLE PREFERENCES"
          onClose={closePanel}
        >
          <div className="setting-row">
            <div>
              <h3>키보드 안내 표시</h3>
              <p>화면 아래 조작 안내를 표시해요.</p>
            </div>
            <button
              role="switch"
              aria-checked={compactHelp}
              aria-label="키보드 안내 표시"
              className={`toggle-switch ${compactHelp ? "is-on" : ""}`}
              onClick={() => setCompactHelp(!compactHelp)}
            >
              <span />
            </button>
          </div>
          <div className="setting-row">
            <div>
              <h3>산책 다시 시작하기</h3>
              <p>광장 입구로 돌아가요. 남긴 메모는 유지돼요.</p>
            </div>
            <button
              className="secondary-button"
              onClick={() => {
                onReset();
                closePanel();
              }}
            >
              <RotateCcw size={15} />
              돌아가기
            </button>
          </div>
          <div className="modal-callout">
            <VolumeX size={17} />
            <span>이번 버전은 배경음 없이 조용히 즐기는 산책이에요.</span>
          </div>
        </Modal>
      )}
      {panel === "profile" && (
        <Modal
          title="어떤 이름으로 만날까요?"
          eyebrow="HELLO, NEIGHBOR"
          onClose={closePanel}
        >
          <p className="modal-intro">여기서는 잠시 다른 이름이어도 괜찮아요.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = draftName.trim();
              if (name) {
                onNickname(name.slice(0, 12));
                closePanel();
              }
            }}
          >
            <label className="form-label" htmlFor="nickname">
              나의 가명 <span>최대 12자</span>
            </label>
            <input
              id="nickname"
              className="name-input"
              maxLength={12}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              autoComplete="off"
              required
            />
            <button
              className="primary-button"
              type="submit"
              disabled={!draftName.trim()}
            >
              이 이름으로 산책하기
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="soft-note">가명은 이 기기에만 저장돼요.</p>
        </Modal>
      )}
      {boardOpen && (
        <Modal
          title="마을 게시판"
          eyebrow="LITTLE STORIES, SHARED HERE"
          onClose={onCloseBoard}
          className="board-modal"
        >
          <p className="modal-intro">
            작은 소식 하나가 마을을 더 다정하게 만들어요.
          </p>
          <div className="board-notes">
            {notes.map((note, i) => (
              <article key={note.id} className={`board-note note-${i % 3}`}>
                <span className="note-pin" />
                <span className="note-tag">{note.tag}</span>
                <p>{note.text}</p>
                <span className="note-author">— {note.author}</span>
              </article>
            ))}
          </div>
          <form className="note-form" onSubmit={postNote}>
            <label className="form-label" htmlFor="new-note">
              나도 한마디 남기기 <span>{draftNote.length}/160</span>
            </label>
            <textarea
              id="new-note"
              rows={2}
              maxLength={160}
              placeholder="오늘 산책에서 발견한 것을 남겨볼까요?"
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
            />
            <div className="note-form-footer">
              <span>
                <BookOpen size={13} />이 기기에만 보관되는 나의 메모
              </span>
              <button
                className="primary-button"
                disabled={!draftNote.trim()}
                type="submit"
              >
                메모 붙이기
                <ArrowUpRight size={16} />
              </button>
            </div>
            {noteMessage && (
              <p className="note-message" role="status">
                {noteMessage}
              </p>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
